import React, { useEffect, useMemo, useState } from "react";
import { ArrowUpDown, Copy, RotateCcw, Share2, Star } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { CategoryDefinition, defaultUnits, getCategory, UnitDefinition } from "@/lib/conversion-data";
import { ConversionError, convertExact } from "@/lib/conversions";

interface ConversionSectionProps {
  title?: string;
  categoryId?: string;
  units?: readonly UnitDefinition[];
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
const LOCALES = ["en-US", "pl-PL", "de-DE", "fr-FR"];

const EN_US_NUMBER = /^-?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d+)?|\.\d+)$/;
const COMMA_DECIMAL_NUMBER = /^-?(?:(?:\d{1,3}(?:\.\d{3})+|\d+)(?:,\d+)?|,\d+)$/;

const parseStrict = (raw: string, locale: string): number | undefined => {
  const value = raw.trim();
  const pattern = locale === "en-US" ? EN_US_NUMBER : COMMA_DECIMAL_NUMBER;
  if (!value || !pattern.test(value)) return undefined;
  const normalized = locale === "en-US"
    ? value.replace(/,/g, "")
    : value.replace(/\./g, "").replace(",", ".");
  const result = Number(normalized);
  return Number.isFinite(result) ? result : undefined;
};

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
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
};

const buildPlaybackUrl = (categoryId: string, params: Record<string, string>): string =>
  `/convert/${encodeURIComponent(categoryId)}?${new URLSearchParams(params).toString()}`;

const ConversionSection: React.FC<ConversionSectionProps> = ({
  title = "Length",
  categoryId = "length",
  units = getCategory(categoryId)?.units ?? [],
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
  const defaults = defaultUnits(definition);
  const precisionParam = searchParams.get("precision");
  const localeParam = searchParams.get("locale");
  const queryLocale = LOCALES.includes(localeParam ?? "") ? localeParam! : "en-US";
  const queryPrecision = Math.min(12, Math.max(0, Number(precisionParam ?? 2)));
  const queryHasInvalidPreferences = (precisionParam !== null && (!/^\d+$/.test(precisionParam) || Number(precisionParam) > 12)) || (localeParam !== null && !LOCALES.includes(localeParam));
  const [fromValue, setFromValue] = useState(searchParams.get("value") ?? "0");
  const [fromUnit, setFromUnit] = useState(searchParams.get("from") ?? defaults.from);
  const [toUnit, setToUnit] = useState(searchParams.get("to") ?? defaults.to);
  const [precision, setPrecision] = useState(Number.isFinite(queryPrecision) ? queryPrecision : 2);
  const [locale, setLocale] = useState(queryLocale);
  const [status, setStatus] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => {
    try { return JSON.parse(safeStorage(HISTORY_KEY, "[]")) as HistoryEntry[]; } catch { return []; }
  });
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try { return JSON.parse(safeStorage(FAVORITES_KEY, "[]")) as string[]; } catch { return []; }
  });

  const validUnit = (value: string) => units.some((unit) => unit.value === value);
  const queryHasInvalidUnit = (searchParams.has("from") && !validUnit(searchParams.get("from") ?? "")) ||
    (searchParams.has("to") && !validUnit(searchParams.get("to") ?? ""));

  useEffect(() => {
    const nextDefaults = defaultUnits(definition);
    const nextFrom = searchParams.get("from");
    const nextTo = searchParams.get("to");
    // URL navigation (including browser back/forward) intentionally hydrates local controls.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFromUnit(nextFrom && validUnit(nextFrom) ? nextFrom : nextDefaults.from);
    setToUnit(nextTo && validUnit(nextTo) ? nextTo : nextDefaults.to);
    setFromValue(searchParams.get("value") ?? "0");
    const nextPrecision = Number(searchParams.get("precision") ?? 2);
    setPrecision(Number.isFinite(nextPrecision) ? Math.min(12, Math.max(0, nextPrecision)) : 2);
    setLocale(LOCALES.includes(searchParams.get("locale") ?? "") ? searchParams.get("locale")! : "en-US");
    // URL changes (including back/forward) are the source of truth.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, categoryId]);

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

  const parsedValue = parseStrict(fromValue, locale);
  const resultState = useMemo(() => {
    if (queryHasInvalidUnit) return { result: "", error: "The URL contains an unknown unit. Choose a supported unit." };
    if (queryHasInvalidPreferences) return { result: "", error: "The URL contains an unsupported precision or locale." };
    if (fromValue.trim() === "") return { result: "", error: "Enter a value to convert." };
    if (parsedValue === undefined) return { result: "", error: "Enter a valid finite number (for example, 12.5)." };
    try {
      const converted = convertExact(parsedValue, fromUnit, toUnit, categoryId);
      return { result: new Intl.NumberFormat(locale, { maximumFractionDigits: precision }).format(converted), numeric: converted, error: "" };
    } catch (error) {
      return { result: "", error: error instanceof ConversionError ? error.message : "Conversion failed." };
    }
  }, [categoryId, fromValue, fromUnit, locale, parsedValue, precision, queryHasInvalidPreferences, queryHasInvalidUnit, toUnit]);

  useEffect(() => {
    if (!resultState.result || parsedValue === undefined) return;
    const timer = window.setTimeout(() => {
      const entry: HistoryEntry = { categoryId, fromUnit, toUnit, input: fromValue, result: resultState.result, precision, locale, timestamp: Date.now() };
      try {
        const current = JSON.parse(safeStorage(HISTORY_KEY, "[]")) as HistoryEntry[];
        const deduped = current.filter((item) => !(item.categoryId === categoryId && item.fromUnit === fromUnit && item.toUnit === toUnit && item.input === fromValue));
        const nextHistory = [entry, ...deduped].slice(0, 50);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(nextHistory));
        setHistory(nextHistory);
      } catch { /* Storage is optional. */ }
    }, 500);
    return () => window.clearTimeout(timer);
  }, [categoryId, fromUnit, fromValue, locale, parsedValue, precision, resultState.result, toUnit]);

  const favoriteId = `${categoryId}:${fromUnit}:${toUnit}`;
  const isFavorite = favoriteIds.includes(favoriteId);
  const setValue = (value: string) => { setFromValue(value); updateUrl({ value }, true); };
  const setFrom = (value: string) => { setFromUnit(value); updateUrl({ from: value }, true); };
  const setTo = (value: string) => { setToUnit(value); updateUrl({ to: value }, true); };
  const resetToDefaults = () => {
    setFromValue("0"); setFromUnit(defaults.from); setToUnit(defaults.to);
    updateUrl({ value: "0", from: defaults.from, to: defaults.to, precision: String(precision), locale }, false);
    setStatus("Category conversion reset.");
  };
  const swap = () => {
    const nextValue = resultState.numeric === undefined ? "" : String(resultState.numeric);
    setFromUnit(toUnit); setToUnit(fromUnit);
    if (resultState.result) setFromValue(nextValue);
    updateUrl({ from: toUnit, to: fromUnit, value: nextValue }, false);
  };
  const toggleFavorite = () => {
    try {
      const current = JSON.parse(safeStorage(FAVORITES_KEY, "[]")) as string[];
      const next = current.includes(favoriteId) ? current.filter((id) => id !== favoriteId) : [favoriteId, ...current].slice(0, 30);
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      setFavoriteIds(next);
      setStatus(next.includes(favoriteId) ? "Added to favorites." : "Removed from favorites.");
    } catch { setStatus("Favorites are unavailable in this browser."); }
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

  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg">{title}</h2>
      <div className="grid grid-cols-[minmax(70px,120px)_1fr] gap-4 items-center">
        <label htmlFor={`${categoryId}-from-value`} className="text-sm font-medium">From</label>
        <div className="flex items-center gap-2">
          <Input id={`${categoryId}-from-value`} type="text" inputMode="decimal" value={fromValue} onChange={(e) => setValue(e.target.value)} className="w-[120px]" placeholder="0" aria-invalid={Boolean(resultState.error)} aria-describedby={`${categoryId}-conversion-error`} />
          <Select value={fromUnit} onValueChange={setFrom}>
            <SelectTrigger aria-label="Source unit" className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>{units.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label} ({unit.symbol ?? unit.value})</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <label htmlFor={`${categoryId}-result`} className="text-sm font-medium">To</label>
        <div className="flex items-center gap-2">
          <Input id={`${categoryId}-result`} type="text" value={resultState.result} readOnly className="w-[120px]" aria-live="polite" aria-describedby={`${categoryId}-conversion-error`} />
          <Select value={toUnit} onValueChange={setTo}>
            <SelectTrigger aria-label="Target unit" className="w-[170px]"><SelectValue /></SelectTrigger>
            <SelectContent>{units.map((unit) => <SelectItem key={unit.value} value={unit.value}>{unit.label} ({unit.symbol ?? unit.value})</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      {resultState.error && <p id={`${categoryId}-conversion-error`} className="text-sm text-red-700" role="alert">{resultState.error}</p>}
      <div className="flex flex-wrap justify-end gap-2">
        <label className="text-sm flex items-center gap-1">Precision<select aria-label="Decimal precision" value={precision} onChange={(e) => { const next = Number(e.target.value); setPrecision(next); updateUrl({ precision: String(next) }); }} className="border rounded px-1 py-1">{Array.from({ length: 13 }, (_, index) => <option key={index} value={index}>{index}</option>)}</select></label>
        <label className="text-sm flex items-center gap-1">Locale<select aria-label="Number locale" value={locale} onChange={(e) => { setLocale(e.target.value); updateUrl({ locale: e.target.value }); }} className="border rounded px-1 py-1">{LOCALES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <Button variant="ghost" size="icon" onClick={swap} aria-label="Swap units"><ArrowUpDown className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={resetToDefaults} aria-label="Reset category"><RotateCcw className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={() => { copyText(window.location.href).then((ok) => setStatus(ok ? "Share URL copied." : "Unable to copy URL.")); }} aria-label="Copy share URL"><Copy className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={share} aria-label="Share conversion" disabled={isSharing} aria-busy={isSharing}><Share2 className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={toggleFavorite} aria-label="Toggle favorite" aria-pressed={isFavorite}><Star className={`h-4 w-4 ${isFavorite ? "fill-current" : ""}`} /></Button>
      </div>
      {(history.length > 0 || favoriteIds.length > 0) && <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
        {history.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">Recent conversions</summary><ul className="mt-2 space-y-1 text-sm">{history.slice(0, 5).map((entry) => <li key={`${entry.timestamp}-${entry.input}`}><button type="button" className="text-left text-blue-700 hover:underline" onClick={() => playSavedConversion(entry.categoryId, { from: entry.fromUnit, to: entry.toUnit, value: entry.input, precision: String(entry.precision), locale: entry.locale })}>{entry.input} {entry.fromUnit} → {entry.result} {entry.toUnit}</button></li>)}</ul></details>}
        {favoriteIds.length > 0 && <details><summary className="cursor-pointer text-sm font-medium">Favorites ({favoriteIds.length})</summary><ul className="mt-2 space-y-1 text-sm">{favoriteIds.slice(0, 5).map((id) => <li key={id}><button type="button" className="text-left text-blue-700 hover:underline" onClick={() => { const [favoriteCategoryId, favoriteFrom, favoriteTo] = id.split(":"); playSavedConversion(favoriteCategoryId, { from: favoriteFrom, to: favoriteTo }); }}>{id}</button></li>)}</ul></details>}
      </div>}
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
};

export { buildPlaybackUrl, parseStrict };
export default ConversionSection;