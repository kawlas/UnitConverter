import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Copy, Link as LinkIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  convertCookingMeasurement,
  cookingIngredients,
  getCookingIngredient,
  parseCookingValue,
  type CookingDirection,
} from "@/lib/cooking-conversions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

const DEFAULT_INGREDIENT_ID = "all-purpose-flour";
const DEFAULT_DIRECTION: CookingDirection = "grams-to-cups";
const DEFAULT_VALUE = "120";
const directions: readonly CookingDirection[] = ["grams-to-cups", "cups-to-grams"];

const isDirection = (value: string | null): value is CookingDirection =>
  directions.includes(value as CookingDirection);

const formatResult = (value: number): string =>
  new Intl.NumberFormat("en-US", { maximumSignificantDigits: 8 }).format(value);

export default function CookingCalculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [value, setValue] = useState(DEFAULT_VALUE);
  const [ingredientId, setIngredientId] = useState(DEFAULT_INGREDIENT_ID);
  const [direction, setDirection] = useState<CookingDirection>(DEFAULT_DIRECTION);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const nextIngredient = searchParams.get("ingredient");
    const nextDirection = searchParams.get("direction");
    // Apply query state after hydration so prerendered and first client markup agree.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setValue((searchParams.get("value") ?? DEFAULT_VALUE).slice(0, 32));
    setIngredientId(getCookingIngredient(nextIngredient ?? "")?.id ?? DEFAULT_INGREDIENT_ID);
    setDirection(isDirection(nextDirection) ? nextDirection : DEFAULT_DIRECTION);
  }, [searchParams]);

  const ingredient = getCookingIngredient(ingredientId) ?? cookingIngredients[0];
  const parsed = useMemo(() => parseCookingValue(value), [value]);
  const result = parsed.status === "ready"
    ? convertCookingMeasurement(parsed.value, direction, ingredient.id)
    : undefined;
  const formattedResult = result === undefined ? "—" : formatResult(result);
  const fromLabel = direction === "grams-to-cups" ? "Grams" : "US cups";
  const fromSymbol = direction === "grams-to-cups" ? "g" : "US cups";
  const toLabel = direction === "grams-to-cups" ? "US cups" : "Grams";
  const toSymbol = direction === "grams-to-cups" ? "US cups" : "g";
  const inputUnit = direction === "cups-to-grams" && parsed.status === "ready" && parsed.value === 1
    ? "US cup"
    : fromSymbol;
  const resultUnit = direction === "grams-to-cups" && result === 1 ? "US cup" : toSymbol;

  const updateUrlState = (next: {
    value: string;
    ingredientId: string;
    direction: CookingDirection;
  }) => {
    const params = new URLSearchParams(searchParams);
    params.set("value", next.value);
    params.set("ingredient", next.ingredientId);
    params.set("direction", next.direction);
    setSearchParams(params, { replace: true });
  };

  const changeValue = (nextValue: string) => {
    const boundedValue = nextValue.slice(0, 32);
    setValue(boundedValue);
    updateUrlState({ value: boundedValue, ingredientId, direction });
    setStatus("");
  };

  const changeIngredient = (nextIngredientId: string) => {
    if (!getCookingIngredient(nextIngredientId)) return;
    setIngredientId(nextIngredientId);
    updateUrlState({ value, ingredientId: nextIngredientId, direction });
    setStatus("");
  };

  const swapDirection = () => {
    const nextDirection: CookingDirection = direction === "grams-to-cups"
      ? "cups-to-grams"
      : "grams-to-cups";
    const nextValue = result === undefined ? value : String(Number(result.toPrecision(12)));
    setDirection(nextDirection);
    setValue(nextValue);
    updateUrlState({ value: nextValue, ingredientId, direction: nextDirection });
    setStatus("");
  };

  const copyResult = async () => {
    if (result === undefined) return;
    try {
      await navigator.clipboard.writeText(`${formattedResult} ${resultUnit}`);
      setStatus("Result copied.");
    } catch {
      setStatus("Unable to copy the result in this browser.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("Conversion link copied.");
    } catch {
      setStatus("Unable to copy the link in this browser.");
    }
  };

  const error = parsed.status === "error" ? parsed.message : "";

  return (
    <div className="space-y-5">
      <div>
        <label htmlFor="cooking-ingredient" className="mb-2 block text-sm font-semibold text-slate-900">
          What are you measuring?
        </label>
        <select
          id="cooking-ingredient"
          value={ingredient.id}
          onChange={(event) => changeIngredient(event.target.value)}
          className="min-h-12 w-full rounded-xl border border-slate-300 bg-white px-4 py-2 text-base font-medium text-slate-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-2"
        >
          {cookingIngredients.map((item) => (
            <option key={item.id} value={item.id}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_2.75rem_minmax(0,1fr)] items-stretch gap-1 sm:grid-cols-[1fr_auto_1fr] sm:gap-3">
        <div className="min-w-0 rounded-2xl border border-slate-200 bg-slate-50 p-3 sm:p-5">
          <label htmlFor="cooking-value" className="mb-2 block text-sm font-semibold text-slate-800">
            {fromLabel}
          </label>
          <div className="flex min-h-16 min-w-0 items-center rounded-xl border border-slate-300 bg-white px-2 shadow-sm focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 sm:px-3">
            <Input
              id="cooking-value"
              type="text"
              inputMode="decimal"
              value={value}
              onChange={(event) => changeValue(event.target.value)}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "cooking-error" : "cooking-assumption"}
              className="min-h-14 min-w-0 flex-1 border-0 bg-transparent px-1 text-xl font-bold text-slate-950 shadow-none focus-visible:ring-0 sm:text-2xl"
            />
            <span className="ml-2 shrink-0 text-sm font-semibold text-slate-500">{fromSymbol}</span>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <Button
            type="button"
            variant="outline"
            onClick={swapDirection}
            className="min-h-11 min-w-11 rounded-full border-slate-300 bg-white p-0"
            aria-label={`Swap direction to ${toLabel.toLowerCase()} to ${fromLabel.toLowerCase()}`}
          >
            <ArrowRightLeft aria-hidden="true" className="h-5 w-5" />
          </Button>
        </div>

        <div className="min-w-0 rounded-2xl border border-indigo-200 bg-indigo-50 p-3 sm:p-5">
          <p className="text-sm font-semibold text-indigo-900">{toLabel}</p>
          <div className="mt-2 flex min-h-16 items-center gap-2" aria-live="polite" aria-atomic="true">
            <strong id="cooking-result" className="min-w-0 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              {formattedResult}
            </strong>
            {result !== undefined ? <span className="shrink-0 text-sm font-semibold text-indigo-700">{resultUnit}</span> : null}
          </div>
          {result !== undefined ? (
            <p className="mt-2 text-xs leading-5 text-indigo-900">
              {value} {inputUnit} of {ingredient.shortLabel} ≈ {formattedResult} {resultUnit}
            </p>
          ) : null}
        </div>
      </div>

      {error ? <p id="cooking-error" className="text-sm font-medium text-red-700" role="alert">{error}</p> : null}

      <div id="cooking-assumption" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950">
        <span className="font-semibold">Reference used: {ingredient.gramsPerUsCup} g per US cup.</span>{" "}
        {ingredient.assumption} Actual results can vary by brand and measuring technique.
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" className="min-h-11" onClick={copyResult} disabled={result === undefined}>
            <Copy aria-hidden="true" className="mr-2 h-4 w-4" /> Copy result
          </Button>
          <Button type="button" variant="outline" className="min-h-11" onClick={copyLink}>
            <LinkIcon aria-hidden="true" className="mr-2 h-4 w-4" /> Copy link
          </Button>
        </div>
        <p className="text-sm text-slate-600" role="status" aria-live="polite">{status}</p>
      </div>
    </div>
  );
}
