import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  type AnalyticsConsent,
  canonicalizeAnalyticsPath,
  disableAnalytics,
  enableAnalytics,
  readAnalyticsConsent,
  trackPageView,
  writeAnalyticsConsent,
} from "@/lib/analytics";

interface AnalyticsConsentContextValue {
  analyticsAvailable: boolean;
  openPreferences: () => void;
}

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue>({
  analyticsAvailable: false,
  openPreferences: () => undefined,
});

const analyticsAvailable = import.meta.env.VITE_GA4_MANUAL_PAGEVIEWS_READY === "true";

export const useAnalyticsConsent = () => useContext(AnalyticsConsentContext);

export const AnalyticsConsentProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [consent, setConsent] = useState<AnalyticsConsent>("unset");
  const [ready, setReady] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const lastTrackedPath = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (!analyticsAvailable) return;
    const frame = window.requestAnimationFrame(() => {
      setConsent(readAnalyticsConsent());
      setReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!analyticsAvailable || !ready || consent !== "accepted") return;
    enableAnalytics();
    const canonicalPath = canonicalizeAnalyticsPath(location.pathname);
    if (lastTrackedPath.current === canonicalPath) return;
    const frame = window.requestAnimationFrame(() => {
      lastTrackedPath.current = canonicalPath;
      trackPageView(canonicalPath, document.title);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [consent, location.pathname, ready]);

  const choose = useCallback((nextConsent: Exclude<AnalyticsConsent, "unset">) => {
    writeAnalyticsConsent(nextConsent);
    setConsent(nextConsent);
    setPreferencesOpen(false);
    if (nextConsent === "declined") {
      lastTrackedPath.current = undefined;
      disableAnalytics();
    }
  }, []);

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const bannerVisible = analyticsAvailable && ready && (consent === "unset" || preferencesOpen);

  return (
    <AnalyticsConsentContext.Provider value={{ analyticsAvailable, openPreferences }}>
      {children}
      {bannerVisible && (
        <section
          aria-label="Analytics privacy choices"
          className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl sm:inset-x-6 sm:flex sm:items-center sm:gap-6 sm:p-5"
        >
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-slate-950">Your privacy, your choice</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Optional analytics helps us improve Q Converter. It stays off unless you allow it, and conversion values are never included in analytics URLs.
            </p>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:mt-0 sm:shrink-0">
            <button
              type="button"
              onClick={() => choose("accepted")}
              className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Allow optional analytics
            </button>
            <button
              type="button"
              onClick={() => choose("declined")}
              className="min-h-11 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Use without analytics
            </button>
          </div>
        </section>
      )}
    </AnalyticsConsentContext.Provider>
  );
};
