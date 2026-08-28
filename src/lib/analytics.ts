export const ANALYTICS_CONSENT_KEY = "q-converter:analytics-consent:v1";
export const GOOGLE_ANALYTICS_ID = "G-DW273J3JPK";
export const ANALYTICS_CONSENT_TTL_MS = 30 * 24 * 60 * 60 * 1_000;

export type AnalyticsConsent = "accepted" | "declined" | "unset";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

type DataLayerEntry = IArguments | unknown[];
type Gtag = (...args: unknown[]) => void;
let analyticsInitialized = false;

export type ProductEventName =
  | "batch_results_copied"
  | "conversion_completed"
  | "conversion_shared"
  | "favorite_toggled"
  | "result_copied"
  | "saved_conversion_opened"
  | "saved_data_cleared"
  | "share_link_copied";

declare global {
  interface Window {
    dataLayer?: DataLayerEntry[];
    gtag?: Gtag;
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export const readAnalyticsConsent = (
  storage: StorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  now = Date.now(),
): AnalyticsConsent => {
  if (!storage) return "unset";
  try {
    const value = storage.getItem(ANALYTICS_CONSENT_KEY);
    if (!value) return "unset";
    const parsed = JSON.parse(value) as { choice?: unknown; updatedAt?: unknown };
    if (parsed.choice !== "accepted" && parsed.choice !== "declined") return "unset";
    if (typeof parsed.updatedAt !== "number" || now - parsed.updatedAt > ANALYTICS_CONSENT_TTL_MS) return "unset";
    return parsed.choice;
  } catch {
    return "unset";
  }
};

export const writeAnalyticsConsent = (
  consent: Exclude<AnalyticsConsent, "unset">,
  storage: StorageLike | undefined = typeof window === "undefined" ? undefined : window.localStorage,
  now = Date.now(),
): void => {
  try {
    storage?.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify({ choice: consent, updatedAt: now }));
  } catch {
    // Privacy remains opt-in even when storage is blocked.
  }
};

export const sanitizePageLocation = (value: string): string => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? `${url.origin}${url.pathname}` : "";
  } catch {
    return "";
  }
};

export const canonicalizeAnalyticsPath = (pathname: string): string => {
  const alias = pathname.match(/^\/convert\/([^/]+)$/);
  return alias ? `/${alias[1]}` : pathname;
};

export const sanitizeAnalyticsDimension = (value: string): string =>
  /^[a-z][a-z0-9_]{0,31}$/.test(value) ? value : "";

const consentState = (analytics: "granted" | "denied") => ({
  ad_storage: "denied",
  ad_user_data: "denied",
  ad_personalization: "denied",
  analytics_storage: analytics,
});

const ensureGtag = (): Gtag => {
  window.dataLayer = window.dataLayer ?? [];
  window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
    window.dataLayer?.push(args);
  };
  return window.gtag;
};

export const enableAnalytics = (): void => {
  if (typeof window === "undefined") return;

  const wasDisabled = window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] === true;
  window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = false;
  const gtag = ensureGtag();
  if (analyticsInitialized) {
    if (wasDisabled) gtag("consent", "update", consentState("granted"));
    return;
  }

  const pageLocation = sanitizePageLocation(window.location.href);
  gtag("consent", "default", consentState("denied"));
  gtag("consent", "update", consentState("granted"));
  gtag("js", new Date());
  gtag("config", GOOGLE_ANALYTICS_ID, {
    allow_ad_personalization_signals: false,
    allow_google_signals: false,
    page_location: pageLocation,
    page_path: pageLocation ? new URL(pageLocation).pathname : "/",
    page_referrer: sanitizePageLocation(document.referrer),
    send_page_view: false,
  });
  analyticsInitialized = true;

  if (document.querySelector(`script[data-q-analytics="${GOOGLE_ANALYTICS_ID}"]`)) return;
  const script = document.createElement("script");
  script.async = true;
  script.dataset.qAnalytics = GOOGLE_ANALYTICS_ID;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ANALYTICS_ID}`;
  document.head.append(script);
};

export const disableAnalytics = (): void => {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", consentState("denied"));
  window[`ga-disable-${GOOGLE_ANALYTICS_ID}`] = true;
};

export const trackPageView = (pathname: string, title: string): void => {
  if (typeof window === "undefined" || window[`ga-disable-${GOOGLE_ANALYTICS_ID}`]) return;
  const pageLocation = sanitizePageLocation(`${window.location.origin}${pathname}`);
  if (!pageLocation) return;

  ensureGtag()("event", "page_view", {
    page_location: pageLocation,
    page_path: new URL(pageLocation).pathname,
    page_referrer: sanitizePageLocation(document.referrer),
    page_title: title,
  });
};

export const trackProductEvent = (event: ProductEventName, category: string): void => {
  if (
    typeof window === "undefined" ||
    !analyticsInitialized ||
    window[`ga-disable-${GOOGLE_ANALYTICS_ID}`]
  ) return;
  const toolCategory = sanitizeAnalyticsDimension(category);
  if (!toolCategory) return;
  ensureGtag()("event", event, { tool_category: toolCategory });
};
