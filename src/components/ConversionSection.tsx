import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ClipboardCopy, Link2, RotateCcw, Share2, Star } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import AllUnitsComparison from "./AllUnitsComparison";
import BatchConversion from "./BatchConversion";
import { CategoryDefinition, defaultUnits, getCategory, UnitDefinition } from "@/lib/conversion-data";
import { ConversionError, convertAllExact, convertExact } from "@/lib/conversions";
import { isFractionLike, parseLocaleQuantity, SUPPORTED_NUMBER_LOCALES } from "@/lib/number-input";
import { trackProductEvent } from "@/lib/analytics";

interface ConversionSectionProps {
  title?: string;
  categoryId?: string;
  units?: readonly UnitDefinition[];
  initialFromUnit?: string;
  initialToUnit?: string;
}

interface HistoryEntry {
  categoryId: string;
  fromUnit: string;
  toUnit: string;
  input: string;
  result: string;
  precision: number;
  locale: string;
  timestamp: number;
}

const HISTORY_KEY = "q-converter:history:v1";
const FAVORITES_KEY = "q-converter:favorites:v1";
const MAX_HISTORY = 50;
const MAX_FAVORITES = 30;
// Keep locally saved conversions for 30 days, limiting the lifetime of private input data.
const SAVED_DATA_TTL_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredFavorite {
  id: string;
  timestamp: number;
}

type StorageLike = Pick<Storage, "removeItem">;

const clearStoredData = (storage: StorageLike = localStorage): void => {
  storage.removeItem(HISTORY_KEY);
  storage.removeItem(FAVORITES_KEY);
};
const LOCALES: readonly string[] = SUPPORTED_NUMBER_LOCALES;

const copyText = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Try the DOM fallback below.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
};

const safeStorage = (key: string, fallback: string): string => {
  if (typeof window === "undefined") return fallback;
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};

const isNonEmptyString = (value: unknown): value is string => typeof value === "string" && value.length > 0;

const isRetained = (timestamp: number, now: number): boolean =>
  timestamp <= now && now - timestamp <= SAVED_DATA_TTL_MS;

const isHistoryEntry = (value: unknown): value is HistoryEntry => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entry = value as Partial<HistoryEntry>;
  return isNonEmptyString(entry.categoryId) &&
    isNonEmptyString(entry.fromUnit) &&
    isNonEmptyString(entry.toUnit) &&
    isNonEmptyString(entry.input) &&
    isNonEmptyString(entry.result) &&
    Number.isInteger(entry.precision) && entry.precision >= 0 && entry.precision <= 12 &&
    LOCALES.includes(entry.locale ?? "") &&
    typeof entry.timestamp === "number" && Number.isFinite(entry.timestamp) && entry.timestamp >= 0;
};

const isFavoriteId = (value: unknown): value is string => {
  if (!isNonEmptyString(value)) return false;
  const parts = value.split(":");
  return parts.length === 3 && parts.every(isNonEmptyString);
};

const isStoredFavorite = (value: unknown): value is StoredFavorite => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const favorite = value as Partial<StoredFavorite>;
  return isFavoriteId(favorite.id) &&
    typeof favorite.timestamp === "number" && Number.isFinite(favorite.timestamp) && favorite.timestamp >= 0;
};

const parseStoredHistory = (raw: string, now = Date.now()): HistoryEntry[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((entry): entry is HistoryEntry => isHistoryEntry(entry) && isRetained(entry.timestamp, now)).slice(0, MAX_HISTORY)
      : [];
  } catch {
    return [];
  }
};

const parseStoredFavoriteEntries = (raw: string, now = Date.now()): StoredFavorite[] => {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .flatMap((value): StoredFavorite[] => {
        // Legacy favorites were plain IDs. Keep them once and timestamp them during migration.
        if (isFavoriteId(value)) return [{ id: value, timestamp: now }];
        return isStoredFavorite(value) && isRetained(value.timestamp, now) ? [value] : [];
      })
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
};

const parseStoredFavorites = (raw: string, now = Date.now()): string[] =>
  parseStoredFavoriteEntries(raw, now).map(({ id }) => id);

const normalizeStoredValue = <T,>(key: string, raw: string, value: T[]): T[] => {
  if (raw === JSON.stringify(value)) return value;
  if (typeof window === "undefined") return value;
  try {
    if (value.length === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch { /* Storage is optional. */ }
  return value;
};

const readStoredHistory = (): HistoryEntry[] => {
  const raw = safeStorage(HISTORY_KEY, "[]");
  return normalizeStoredValue(HISTORY_KEY, raw, parseStoredHistory(raw));
};

const readStoredFavoriteEntries = (): StoredFavorite[] => {
  const raw = safeStorage(FAVORITES_KEY, "[]");
  return normalizeStoredValue(FAVORITES_KEY, raw, parseStoredFavoriteEntries(raw));
};

const readStoredFavorites = (): string[] => readStoredFavoriteEntries().map(({ id }) => id);

const buildPlaybackUrl = (categoryId: string, params: Record<string, string>): string =>
  `/${encodeURIComponent(categoryId)}?${new URLSearchParams(params).toString()}`;

interface SavedConversionPresentation {
  categoryTitle: string;
  conversion: string;
  accessibleLabel: string;
}

const humanizeIdentifier = (value: string): string =>
  value
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const describeSavedUnit = (categoryId: string, unitId: string): { label: string; symbol: string } => {
  const category = getCategory(categoryId);
  const unit = category ? category.units.find(({ value }) => value === unitId) : undefined;
  const fallback = humanizeIdentifier(unitId);
  return { label: unit?.label ?? fallback, symbol: unit?.symbol ?? fallback };
};

const formatHistoryEntry = (entry: Pick<HistoryEntry, "categoryId" | "fromUnit" | "toUnit" | "input" | "result">): SavedConversionPresentation => {
  const categoryTitle = getCategory(entry.categoryId)?.title ?? humanizeIdentifier(entry.categoryId);
  const from = describeSavedUnit(entry.categoryId, entry.fromUnit);
  const to = describeSavedUnit(entry.categoryId, entry.toUnit);
  return {
    categoryTitle,
    conversion: `${entry.input} ${from.symbol} → ${entry.result} ${to.symbol}`,
    accessibleLabel: `Open recent ${categoryTitle} conversion: ${entry.input} ${from.label} to ${entry.result} ${to.label}`,
  };
};

const formatFavoriteId = (id: string): SavedConversionPresentation => {
  const [categoryId = id, fromUnit = "", toUnit = ""] = id.split(":");
  const categoryTitle = getCategory(categoryId)?.title ?? humanizeIdentifier(categoryId);
  const from = describeSavedUnit(categoryId, fromUnit);
  const to = describeSavedUnit(categoryId, toUnit);
  return {
    categoryTitle,
    conversion: `${from.label} → ${to.label}`,
    accessibleLabel: `Open favorite ${categoryTitle} conversion: ${from.label} to ${to.label}`,
  };
};

interface HistoryPersistenceState {
  input: string;
  result: string;
  parsedValue: number | undefined;
  intentVersion: number;
  persistedIntentVersion: number;
}

const shouldPersistHistory = ({
  input,
  result,
  parsedValue,
  intentVersion,
  persistedIntentVersion,
}: HistoryPersistenceState): boolean =>
  intentVersion > 0 &&
  intentVersion !== persistedIntentVersion &&
  input.trim().length > 0 &&
  result.length > 0 &&
  parsedValue !== undefined;

const ConversionSection: React.FC<ConversionSectionProps> = ({
  title = "Length",
  categoryId = "length",
  units = getCategory(categoryId)?.units ?? [],
  initialFromUnit,
  initialToUnit,
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const definition = useMemo<CategoryDefinition | undefined>(() => ({
    id: categoryId,
    title,
    converter: "linear",
    units,
    description: "",
    formula: "",
    faq: [],
    examples: [],
  }), [categoryId, title, units]);
  const catalogDefaults = defaultUnits(definition);
  const defaults = {
    from: units.some(({ value }) => value === initialFromUnit) ? initialFromUnit! : catalogDefaults.from,
    to: units.some(({ value }) => value === initialToUnit) ? initialToUnit! : catalogDefaults.to,
  };
  const defaultInput = String(getCategory(categoryId)?.examples[0]?.input ?? 1);
  const precisionParam = searchParams.get("precision");
  const localeParam = searchParams.get("locale");
  const queryHasInvalidPreferences = (precisionParam !== null && (!/^\d+$/.test(precisionParam) || Number(precisionParam) > 12)) || (localeParam !== null && !LOCALES.includes(localeParam));
  const [fromValue, setFromValue] = useState(defaultInput);
  const [fromUnit, setFromUnit] = useState(defaults.from);
  const [toUnit, setToUnit] = useState(defaults.to);
  const [precision, setPrecision] = useState(2);
  const [locale, setLocale] = useState("en-US");
  const [hasHydratedUrl, setHasHydratedUrl] = useState(false);
  const [status, setStatus] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const historyPersistenceVersion = useRef(0);
  const historyIntentVersionRef = useRef(0);
  const persistedHistoryIntentVersion = useRef(0);
  const activeHistoryCategoryRef = useRef(categoryId);
  const [historyIntentVersion, setHistoryIntentVersion] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const validUnit = (value: string) => units.some((unit) => unit.value === value);
  const queryHasInvalidUnit = hasHydratedUrl && ((searchParams.has("from") && !validUnit(searchParams.get("from") ?? "")) ||
    (searchParams.has("to") && !validUnit(searchParams.get("to") ?? "")));

  useEffect(() => {
    // Load private browser state after hydration so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHistory(readStoredHistory());
    setFavoriteIds(readStoredFavorites());
  }, []);

  useEffect(() => {
    if (activeHistoryCategoryRef.current === categoryId) return;
    activeHistoryCategoryRef.current = categoryId;
    historyPersistenceVersion.current += 1;
    persistedHistoryIntentVersion.current = historyIntentVersionRef.current;
  }, [categoryId]);

  useEffect(() => {
    const nextDefaults = defaults;
    const nextFrom = searchParams.get("from");
    const nextTo = searchParams.get("to");
    // URL navigation (including browser back/forward) intentionally hydrates local controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromUnit(nextFrom && validUnit(nextFrom) ? nextFrom : nextDefaults.from);
    setToUnit(nextTo && validUnit(nextTo) ? nextTo : nextDefaults.to);
    setFromValue(searchParams.get("value") ?? defaultInput);
    const nextPrecision = Number(searchParams.get("precision") ?? 2);
    setPrecision(Number.isFinite(nextPrecision) ? Math.min(12, Math.max(0, nextPrecision)) : 2);
    setLocale(LOCALES.includes(searchParams.get("locale") ?? "") ? searchParams.get("locale")! : "en-US");
    setHasHydratedUrl(true);
    // URL changes (including back/forward) are the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categoryId, defaultInput, initialFromUnit, initialToUnit]);

  const updateUrl = (updates: Record<string, string>, replace = true) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => next.set(key, value));
    setSearchParams(next, { replace });
  };
  const playSavedConversion = (savedCategoryId: string, params: Record<string, string>) => {
    trackProductEvent("saved_conversion_opened", savedCategoryId);
    if (savedCategoryId === categoryId) {
      updateUrl(params, false);
      return;
    }
    navigate(buildPlaybackUrl(savedCategoryId, params), { replace: false });
  };

  const parsedValue = parseLocaleQuantity(fromValue, locale);
  const resultState = useMemo(() => {
    if (queryHasInvalidUnit) return { result: "", error: "The URL contains an unknown unit. Choose a supported unit." };
    if (hasHydratedUrl && queryHasInvalidPreferences) return { result: "", error: "The URL contains an unsupported precision or locale." };
    if (fromValue.trim() === "") return { result: "", error: "Enter a value to convert." };
    if (parsedValue === undefined) {
      const error = isFractionLike(fromValue)
        ? "Enter a valid fraction with a non-zero denominator (for example, 3/8 or 1 1/2)."
        : `Enter a valid finite number (for example, ${locale === "en-US" ? "12.5" : "12,5"}).`;
      return { result: "", error };
    }
    try {
      const converted = convertExact(parsedValue, fromUnit, toUnit, categoryId);
      return { result: new Intl.NumberFormat(locale, { maximumFractionDigits: precision }).format(converted), numeric: converted, error: "" };
    } catch (error) {
      return { result: "", error: error instanceof ConversionError ? error.message : "Conversion failed." };
    }
  }, [categoryId, fromValue, fromUnit, hasHydratedUrl, locale, parsedValue, precision, queryHasInvalidPreferences, queryHasInvalidUnit, toUnit]);

  const comparisonResults = useMemo(() => {
    if (queryHasInvalidUnit || (hasHydratedUrl && queryHasInvalidPreferences) || parsedValue === undefined) return [];
    try {
      return convertAllExact(parsedValue, fromUnit, categoryId);
    } catch {
      return [];
    }
  }, [categoryId, fromUnit, hasHydratedUrl, parsedValue, queryHasInvalidPreferences, queryHasInvalidUnit]);

  useEffect(() => {
    if (!shouldPersistHistory({
      input: fromValue,
      result: resultState.result,
      parsedValue,
      intentVersion: historyIntentVersion,
      persistedIntentVersion: persistedHistoryIntentVersion.current,
    })) return;
    const persistenceVersion = historyPersistenceVersion.current;
    const intentVersion = historyIntentVersion;
    const timer = window.setTimeout(() => {
      if (persistenceVersion !== historyPersistenceVersion.current || intentVersion !== historyIntentVersionRef.current) return;
      persistedHistoryIntentVersion.current = intentVersion;
      const entry: HistoryEntry = { categoryId, fromUnit, toUnit, input: fromValue, result: resultState.result, precision, locale, timestamp: Date.now() };
      try {
        const current = readStoredHistory();
        const deduped = current.filter((item) => !(item.categoryId === categoryId && item.fromUnit === fromUnit && item.toUnit === toUnit && item.input === fromValue));
        const nextHistory = [entry, ...deduped].slice(0, MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        setHistory(nextHistory);
      } catch { /* Storage is optional. */ }
      trackProductEvent("conversion_completed", categoryId);
    }, 500);
    return () => window.clearTimeout(timer);
  }, [categoryId, fromUnit, fromValue, historyIntentVersion, locale, parsedValue, precision, resultState.result, toUnit]);

  const favoriteId = `${categoryId}:${fromUnit}:${toUnit}`;
  const isFavorite = favoriteIds.includes(favoriteId);
  const markHistoryIntent = () => {
    const nextVersion = historyIntentVersionRef.current + 1;
    historyIntentVersionRef.current = nextVersion;
    setHistoryIntentVersion(nextVersion);
  };
  const consumeHistoryIntent = () => {
    persistedHistoryIntentVersion.current = historyIntentVersionRef.current;
  };
  const setValue = (value: string) => { markHistoryIntent(); setFromValue(value); updateUrl({ value }, true); };
  const setFrom = (value: string) => { markHistoryIntent(); setFromUnit(value); updateUrl({ from: value }, true); };
  const setTo = (value: string) => { markHistoryIntent(); setToUnit(value); updateUrl({ to: value }, true); };
  const resetToDefaults = () => {
    consumeHistoryIntent();
    setFromValue(defaultInput); setFromUnit(defaults.from); setToUnit(defaults.to);
    updateUrl({ value: defaultInput, from: defaults.from, to: defaults.to, precision: String(precision), locale }, false);
    setStatus("Category conversion reset.");
  };
  const swap = () => {
    markHistoryIntent();
    const nextValue = resultState.numeric === undefined ? "" : String(resultState.numeric);
    setFromUnit(toUnit); setToUnit(fromUnit);
    if (resultState.result) setFromValue(nextValue);
    updateUrl({ from: toUnit, to: fromUnit, value: nextValue }, false);
  };
  const toggleFavorite = () => {
    try {
      const current = readStoredFavoriteEntries();
      const next = current.some(({ id }) => id === favoriteId)
        ? current.filter(({ id }) => id !== favoriteId)
        : [{ id: favoriteId, timestamp: Date.now() }, ...current].slice(0, MAX_FAVORITES);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      const nextIds = next.map(({ id }) => id);
      setFavoriteIds(nextIds);
      setStatus(nextIds.includes(favoriteId) ? "Added to favorites." : "Removed from favorites.");
      trackProductEvent("favorite_toggled", categoryId);
    } catch { setStatus("Favorites are unavailable in this browser."); }
  };
  const clearSavedData = () => {
    historyPersistenceVersion.current += 1;
    consumeHistoryIntent();
    try {
      clearStoredData();
      setStatus("Saved data cleared.");
      trackProductEvent("saved_data_cleared", categoryId);
    } catch {
      setStatus("Saved data could not be cleared from this browser.");
    }
    setHistory([]);
    setFavoriteIds([]);
  };
  const share = async () => {
    setIsSharing(true);
    try {
      const url = window.location.href;
      if (navigator.share) {
        try {
          await navigator.share({ title: `${title} converter`, url });
          setStatus("Share dialog opened.");
          trackProductEvent("conversion_shared", categoryId);
          return;
        } catch { /* user cancelled or API unavailable */ }
      }
      const copied = await copyText(url);
      if (copied) trackProductEvent("share_link_copied", categoryId);
      setStatus(copied ? "Share URL copied." : "Unable to copy the share URL.");
    } finally {
      setIsSharing(false);
    }
  };
  const copyResult = async () => {
    if (!resultState.result) return;
    const copied = await copyText(resultState.result);
    if (copied) trackProductEvent("result_copied", categoryId);
    setStatus(copied ? "Result copied." : "Unable to copy the result.");
  };
  const copyShareUrl = async () => {
    const copied = await copyText(window.location.href);
    if (copied) trackProductEvent("share_link_copied", categoryId);
    setStatus(copied ? "Share URL copied." : "Unable to copy URL.");
  };

  return (
    <div className="min-w-0 space-y-6">
      <section aria-labelledby={`${categoryId}-conversion-workspace-heading`} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-3 shadow-[0_18px_50px_rgba(11,16,32,0.08)] sm:p-6 lg:p-8">
        <h2 id={`${categoryId}-conversion-workspace-heading`} className="sr-only">{title} conversion workspace</h2>

        <div className="grid min-w-0 items-center gap-1 md:grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] md:gap-5">
          <div className="min-w-0">
            <label htmlFor={`${categoryId}-from-value`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">From</label>
            <Input
              id={`${categoryId}-from-value`}
              type="text"
              inputMode="text"
              value={fromValue}
              onChange={(event) => setValue(event.target.value)}
              onFocus={(event) => event.currentTarget.select()}
              className="h-[72px] min-h-[72px] w-full rounded-2xl border-2 border-indigo-500 bg-indigo-50 px-4 text-[clamp(2.75rem,6vw,4.5rem)] font-bold tracking-[-0.045em] text-indigo-950 shadow-inner outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/25 sm:px-5"
              placeholder="0"
              autoCapitalize="off"
              spellCheck={false}
              maxLength={120}
              aria-invalid={Boolean(resultState.error)}
              aria-describedby={`${categoryId}-fraction-hint${resultState.error ? ` ${categoryId}-conversion-error` : ""}`}
            />
            <div className="relative mt-3">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-indigo-600">▾</span>
              <select
                aria-label="Source unit"
                value={fromUnit}
                onChange={(event) => setFrom(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-xl border border-indigo-200 bg-white px-4 py-3 pr-10 text-base font-semibold text-indigo-950 shadow-sm outline-none transition-colors hover:border-indigo-400 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
              >
                {units.map((unit) => <option key={unit.value} value={unit.value}>{unit.label} ({unit.symbol ?? unit.value})</option>)}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-center md:pt-7">
            <Button
              type="button"
              onClick={swap}
              aria-label="Swap units"
              className="h-14 min-h-14 w-14 min-w-14 rounded-full bg-indigo-600 p-0 text-white shadow-lg shadow-indigo-600/25 transition-colors hover:bg-indigo-700 focus-visible:ring-4 focus-visible:ring-indigo-500/30 md:h-16 md:min-h-16 md:w-16 md:min-w-16"
            >
              <ArrowUpDown aria-hidden="true" className="h-6 w-6 md:rotate-90" />
            </Button>
          </div>

          <div className="min-w-0">
            <label htmlFor={`${categoryId}-result`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">To</label>
            <div className="relative min-w-0">
              <Input
                id={`${categoryId}-result`}
                type="text"
                value={resultState.result}
                readOnly
                className="h-[72px] min-h-[72px] w-full rounded-2xl border-2 border-teal-600 bg-teal-50/80 px-4 pr-16 text-[clamp(2.75rem,6vw,4.5rem)] font-bold tracking-[-0.045em] text-teal-950 shadow-inner sm:px-5 sm:pr-28"
                aria-live="polite"
                aria-atomic="true"
                aria-describedby={resultState.error ? `${categoryId}-conversion-error` : undefined}
              />
              <Button
                type="button"
                variant="outline"
                className="absolute right-2 top-1/2 h-12 min-h-12 min-w-12 -translate-y-1/2 rounded-xl border-teal-200 bg-white px-3 font-semibold text-teal-800 shadow-sm transition-colors hover:bg-teal-700 hover:text-white focus-visible:ring-2 focus-visible:ring-teal-700 sm:px-4"
                onClick={() => void copyResult()}
                disabled={!resultState.result}
                aria-label="Copy result"
              >
                <ClipboardCopy aria-hidden="true" className="h-5 w-5 sm:mr-2" />
                <span className="hidden sm:inline">Copy</span>
              </Button>
            </div>
            <div className="relative mt-3">
              <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-teal-700">▾</span>
              <select
                aria-label="Target unit"
                value={toUnit}
                onChange={(event) => setTo(event.target.value)}
                className="min-h-12 w-full appearance-none rounded-xl border border-teal-200 bg-white px-4 py-3 pr-10 text-base font-semibold text-teal-950 shadow-sm outline-none transition-colors hover:border-teal-500 hover:bg-teal-50 focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2"
              >
                {units.map((unit) => <option key={unit.value} value={unit.value}>{unit.label} ({unit.symbol ?? unit.value})</option>)}
              </select>
            </div>
          </div>
        </div>

        <p id={`${categoryId}-fraction-hint`} className="mt-4 text-xs leading-5 text-slate-500">Enter a decimal, fraction or quick calculation — for example {locale === "en-US" ? "12.5, 3/8 or (12*4)+6.5" : "12,5, 3/8 or (1,5+2,5)"}.</p>
        {resultState.error && <p id={`${categoryId}-conversion-error`} className="mt-2 text-sm font-medium text-red-700" role="alert">{resultState.error}</p>}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-end">
            <label className="text-xs font-semibold text-slate-600">
              <span className="mb-1 block">Precision</span>
              <select aria-label="Decimal precision" value={precision} onChange={(event) => { const next = Number(event.target.value); setPrecision(next); updateUrl({ precision: String(next) }); }} className="min-h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none hover:border-indigo-300 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600 sm:w-auto">{Array.from({ length: 13 }, (_, index) => <option key={index} value={index}>{index} decimals</option>)}</select>
            </label>
            <label className="text-xs font-semibold text-slate-600">
              <span className="mb-1 block">Locale</span>
              <select aria-label="Number locale" value={locale} onChange={(event) => { setLocale(event.target.value); updateUrl({ locale: event.target.value }); }} className="min-h-12 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none hover:border-indigo-300 hover:bg-indigo-50 focus-visible:ring-2 focus-visible:ring-indigo-600 sm:w-auto">{LOCALES.map((item) => <option key={item} value={item}>{item}</option>)}</select>
            </label>
            <Button type="button" variant="outline" className="min-h-12 border-slate-200 bg-slate-50 px-3 text-slate-700 hover:bg-white" onClick={resetToDefaults}>
              <RotateCcw aria-hidden="true" className="mr-2 h-4 w-4" /> Reset
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <Button type="button" variant="outline" className="min-h-12 border-indigo-100 bg-indigo-50 px-3 text-indigo-700 hover:bg-indigo-600 hover:text-white" onClick={() => void copyShareUrl()} aria-label="Copy share URL">
              <Link2 aria-hidden="true" className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Link</span>
            </Button>
            <Button type="button" variant="outline" className="min-h-12 border-indigo-100 bg-indigo-50 px-3 text-indigo-700 hover:bg-indigo-600 hover:text-white" onClick={share} aria-label="Share conversion" disabled={isSharing} aria-busy={isSharing}>
              <Share2 aria-hidden="true" className="h-4 w-4 sm:mr-2" /><span className="hidden sm:inline">Share</span>
            </Button>
            <Button type="button" variant="outline" className="min-h-12 border-teal-100 bg-teal-50 px-3 text-teal-800 hover:bg-teal-700 hover:text-white" onClick={toggleFavorite} aria-label="Toggle favorite" aria-pressed={isFavorite}>
              <Star aria-hidden="true" className={`h-4 w-4 sm:mr-2 ${isFavorite ? "fill-current" : ""}`} /><span className="hidden sm:inline">{isFavorite ? "Saved" : "Save"}</span>
            </Button>
          </div>
        </div>
        <p className="mt-3 min-h-5 text-sm text-slate-500" role="status" aria-live="polite" aria-atomic="true">{status}</p>
      </section>

      <BatchConversion
        categoryId={categoryId}
        fromUnit={fromUnit}
        toUnit={toUnit}
        locale={locale}
        precision={precision}
        fromLabel={units.find(({ value }) => value === fromUnit)?.label ?? fromUnit}
        toLabel={units.find(({ value }) => value === toUnit)?.label ?? toUnit}
      />
      {(history.length > 0 || favoriteIds.length > 0) && (
        <details className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-5">
          <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-lg font-semibold text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
            <span>Saved conversions</span>
            <span className="flex items-center gap-2 text-xs font-medium text-slate-500">
              {history.length + favoriteIds.length} saved
              <span aria-hidden="true" className="transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>
          <div className="mt-3 grid min-w-0 gap-5 border-t border-slate-200 pt-4 sm:grid-cols-2">
            {history.length > 0 && (
              <section aria-labelledby={`${categoryId}-recent-conversions-heading`}>
                <h3 id={`${categoryId}-recent-conversions-heading`} className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Recent</h3>
                <ul className="mt-2 space-y-2">
                  {history.slice(0, 5).map((entry) => {
                    const presentation = formatHistoryEntry(entry);
                    return (
                      <li key={`${entry.timestamp}-${entry.input}`}>
                        <button type="button" aria-label={presentation.accessibleLabel} className="flex min-h-12 w-full min-w-0 flex-col items-start justify-center rounded-xl border border-slate-200 px-3 py-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" onClick={() => playSavedConversion(entry.categoryId, { from: entry.fromUnit, to: entry.toUnit, value: entry.input, precision: String(entry.precision), locale: entry.locale })}>
                          <span className="text-xs font-medium text-slate-500">{presentation.categoryTitle}</span>
                          <span className="max-w-full break-words text-sm font-semibold text-slate-950">{presentation.conversion}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            {favoriteIds.length > 0 && (
              <section aria-labelledby={`${categoryId}-favorite-conversions-heading`}>
                <h3 id={`${categoryId}-favorite-conversions-heading`} className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Favorites</h3>
                <ul className="mt-2 space-y-2">
                  {favoriteIds.slice(0, 5).map((id) => {
                    const [favoriteCategoryId, favoriteFrom, favoriteTo] = id.split(":");
                    const presentation = formatFavoriteId(id);
                    return (
                      <li key={id}>
                        <button type="button" aria-label={presentation.accessibleLabel} className="flex min-h-12 w-full min-w-0 flex-col items-start justify-center rounded-xl border border-slate-200 px-3 py-2 text-left transition-colors hover:border-indigo-200 hover:bg-indigo-50/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" onClick={() => playSavedConversion(favoriteCategoryId, { from: favoriteFrom, to: favoriteTo })}>
                          <span className="text-xs font-medium text-slate-500">{presentation.categoryTitle}</span>
                          <span className="max-w-full break-words text-sm font-semibold text-slate-950">{presentation.conversion}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
            <div className="sm:col-span-2">
              <p id={`${categoryId}-saved-data-note`} className="mb-2 text-xs leading-5 text-slate-500">Saved only in this browser for up to 30 days.</p>
              <Button type="button" variant="outline" size="sm" className="min-h-12" aria-describedby={`${categoryId}-saved-data-note`} onClick={clearSavedData}>Clear saved data</Button>
            </div>
          </div>
        </details>
      )}
      <AllUnitsComparison
        categoryId={categoryId}
        title={title}
        results={comparisonResults}
        sourceUnit={fromUnit}
        targetUnit={toUnit}
        precision={precision}
        locale={locale}
        onSelectTarget={setTo}
      />
    </div>
  );
};

export { SAVED_DATA_TTL_MS, buildPlaybackUrl, clearStoredData, formatFavoriteId, formatHistoryEntry, parseStoredHistory, parseStoredFavorites, shouldPersistHistory };
export default ConversionSection;
