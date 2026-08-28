import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpDown, ClipboardCopy, Link2, RotateCcw, Share2, Star } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import AllUnitsComparison from "./AllUnitsComparison";
import BatchConversion from "./BatchConversion";
import { CategoryDefinition, defaultUnits, getCategory, UnitDefinition } from "@/lib/conversion-data";
import { ConversionError, convertAllExact, convertExact } from "@/lib/conversions";
import { isFractionLike, parseLocaleQuantity, SUPPORTED_NUMBER_LOCALES } from "@/lib/number-input";

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
    } catch { setStatus("Favorites are unavailable in this browser."); }
  };
  const clearSavedData = () => {
    historyPersistenceVersion.current += 1;
    consumeHistoryIntent();
    try {
      clearStoredData();
      setStatus("Saved data cleared.");
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
        try { await navigator.share({ title: `${title} converter`, url }); setStatus("Share dialog opened."); return; } catch { /* user cancelled or API unavailable */ }
      }
      setStatus(await copyText(url) ? "Share URL copied." : "Unable to copy the share URL.");
    } finally {
      setIsSharing(false);
    }
  };
  const copyResult = async () => {
    if (!resultState.result) return;
    setStatus(await copyText(resultState.result) ? "Result copied." : "Unable to copy the result.");
  };

  return (
    <div className="min-w-0 space-y-6">
      <h2 className="font-medium text-lg">{title}</h2>
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(70px,120px)_minmax(0,1fr)]">
        <label htmlFor={`${categoryId}-from-value`} className="text-sm font-medium">From</label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input id={`${categoryId}-from-value`} type="text" inputMode="text" value={fromValue} onChange={(e) => setValue(e.target.value)} className="min-h-11 w-full sm:w-[120px]" placeholder="0" autoCapitalize="off" spellCheck={false} maxLength={120} aria-invalid={Boolean(resultState.error)} aria-describedby={`${categoryId}-fraction-hint${resultState.error ? ` ${categoryId}-conversion-error` : ""}`} />
          <Select value={fromUnit} onValueChange={setFrom}>
            <SelectTrigger aria-label="Source unit" className="min-h-11 w-full sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>{units.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label} ({unit.symbol ?? unit.value})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label htmlFor={`${categoryId}-result`} className="text-sm font-medium">To</label>
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
          <Input id={`${categoryId}-result`} type="text" value={resultState.result} readOnly className="min-h-11 w-full sm:w-[120px]" aria-live="polite" aria-describedby={resultState.error ? `${categoryId}-conversion-error` : undefined} />
          <Select value={toUnit} onValueChange={setTo}>
            <SelectTrigger aria-label="Target unit" className="min-h-11 w-full sm:w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>{units.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label} ({unit.symbol ?? unit.value})</SelectItem>)}</SelectContent>
          </Select>
          <Button type="button" variant="outline" className="min-h-11 w-full shrink-0 sm:w-auto" onClick={() => void copyResult()} disabled={!resultState.result}>
            <ClipboardCopy aria-hidden="true" className="mr-2 h-4 w-4" /> Copy result
          </Button>
        </div>
      </div>
      <p id={`${categoryId}-fraction-hint`} className="text-xs leading-5 text-slate-500">Decimals and fractions supported: {locale === "en-US" ? "12.5" : "12,5"}, 3/8, 1 1/2 or ½. Simple arithmetic like {locale === "en-US" ? "(12*4)+6.5" : "(1,5+2,5)"} also works.</p>
      {resultState.error && <p id={`${categoryId}-conversion-error`} className="text-sm text-red-700" role="alert">{resultState.error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <label className="text-sm flex items-center gap-1">Precision<select aria-label="Decimal precision" value={precision} onChange={(e) => { const next = Number(e.target.value); setPrecision(next); updateUrl({ precision: String(next) }); }} className="min-h-11 border rounded px-2 py-1">{Array.from({ length: 13 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
        <label className="text-sm flex items-center gap-1">Locale<select aria-label="Number locale" value={locale} onChange={(e) => { setLocale(e.target.value); updateUrl({ locale: e.target.value }); }} className="min-h-11 border rounded px-2 py-1">{LOCALES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={swap} aria-label="Swap units"><ArrowUpDown className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={resetToDefaults} aria-label="Reset category"><RotateCcw className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={() => { copyText(window.location.href).then((ok) => setStatus(ok ? "Share URL copied." : "Unable to copy URL.")); }} aria-label="Copy share URL"><Link2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={share} aria-label="Share conversion" disabled={isSharing} aria-busy={isSharing}><Share2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" className="min-h-11 min-w-11" onClick={toggleFavorite} aria-label="Toggle favorite" aria-pressed={isFavorite}><Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} /></Button>
      </div>
      <BatchConversion
        categoryId={categoryId}
        fromUnit={fromUnit}
        toUnit={toUnit}
        locale={locale}
        precision={precision}
        fromLabel={units.find(({ value }) => value === fromUnit)?.label ?? fromUnit}
        toLabel={units.find(({ value }) => value === toUnit)?.label ?? toUnit}
      />
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
      {(history.length > 0 || favoriteIds.length > 0) && <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
        {history.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">Recent conversions</summary><ul className="mt-2 space-y-1 text-sm">{history.slice(0, 5).map((entry) => <li key={`${entry.timestamp}-${entry.input}`}><button type="button" className="text-left text-blue-700 hover:underline" onClick={() => playSavedConversion(entry.categoryId, { from: entry.fromUnit, to: entry.toUnit, value: entry.input, precision: String(entry.precision), locale: entry.locale })}>{entry.input} {entry.fromUnit} → {entry.result} {entry.toUnit}</button></li>)}</ul></details>}
        {favoriteIds.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">Favorites ({favoriteIds.length})</summary><ul className="mt-2 space-y-1 text-sm">{favoriteIds.slice(0, 5).map((id) => <li key={id}><button type="button" className="text-left text-blue-700 hover:underline" onClick={() => { const [favoriteCategoryId, favoriteFrom, favoriteTo] = id.split(":"); playSavedConversion(favoriteCategoryId, { from: favoriteFrom, to: favoriteTo }); }}>{id}</button></li>)}</ul></details>}
        <Button type="button" variant="outline" size="sm" onClick={clearSavedData}>Clear saved data</Button>
      </div>}
      {status && <p className="mt-2 text-sm text-slate-500" role="status" aria-live="polite">{status}</p>}
    </div>
  );
};

export { SAVED_DATA_TTL_MS, buildPlaybackUrl, clearStoredData, parseStoredHistory, parseStoredFavorites, shouldPersistHistory };
export default ConversionSection;
