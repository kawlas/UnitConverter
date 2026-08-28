import { useEffect, useMemo, useState } from "react";
import { Copy, ExternalLink, Info } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { calculateAdultBmi, type BmiHeightUnit, type BmiWeightUnit } from "@/lib/bmi";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";

interface BMICalculatorProps {
  title?: string;
}

const HEIGHT_UNITS: readonly BmiHeightUnit[] = ["cm", "meters", "inches", "feet"];
const WEIGHT_UNITS: readonly BmiWeightUnit[] = ["kg", "lbs"];

const isHeightUnit = (value: string | null): value is BmiHeightUnit =>
  HEIGHT_UNITS.includes(value as BmiHeightUnit);
const isWeightUnit = (value: string | null): value is BmiWeightUnit =>
  WEIGHT_UNITS.includes(value as BmiWeightUnit);

const categoryDetails = [
  { category: "Underweight", range: "Below 18.5", color: "text-blue-700" },
  { category: "Healthy Weight", range: "18.5–24.9", color: "text-emerald-700" },
  { category: "Overweight", range: "25.0–29.9", color: "text-amber-700" },
  { category: "Obesity", range: "30.0 or greater", color: "text-red-700" },
] as const;

const BMICalculator = ({ title = "BMI" }: BMICalculatorProps) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [heightUnit, setHeightUnit] = useState<BmiHeightUnit>("cm");
  const [weightUnit, setWeightUnit] = useState<BmiWeightUnit>("kg");
  const [status, setStatus] = useState("");

  useEffect(() => {
    // Apply URL state after hydration so prerendered and first client markup match.
    const nextHeightUnit = searchParams.get("heightUnit");
    const nextWeightUnit = searchParams.get("weightUnit");
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHeight((searchParams.get("height") ?? "").slice(0, 32));
    setWeight((searchParams.get("weight") ?? "").slice(0, 32));
    setHeightUnit(isHeightUnit(nextHeightUnit) ? nextHeightUnit : "cm");
    setWeightUnit(isWeightUnit(nextWeightUnit) ? nextWeightUnit : "kg");
  }, [searchParams]);

  const result = useMemo(
    () => calculateAdultBmi(height, weight, heightUnit, weightUnit),
    [height, heightUnit, weight, weightUnit],
  );

  const updateUrlState = (next: { height: string; weight: string; heightUnit: BmiHeightUnit; weightUnit: BmiWeightUnit }) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value === "") params.delete(key);
      else params.set(key, value);
    }
    setSearchParams(params, { replace: true });
  };

  const changeHeight = (value: string) => {
    const next = value.slice(0, 32);
    setHeight(next);
    updateUrlState({ height: next, weight, heightUnit, weightUnit });
  };
  const changeWeight = (value: string) => {
    const next = value.slice(0, 32);
    setWeight(next);
    updateUrlState({ height, weight: next, heightUnit, weightUnit });
  };
  const changeHeightUnit = (value: BmiHeightUnit) => {
    setHeightUnit(value);
    updateUrlState({ height, weight, heightUnit: value, weightUnit });
  };
  const changeWeightUnit = (value: BmiWeightUnit) => {
    setWeightUnit(value);
    updateUrlState({ height, weight, heightUnit, weightUnit: value });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("BMI link copied.");
    } catch {
      setStatus("Unable to copy the BMI link in this browser.");
    }
  };

  const activeCategory = result.status === "ready"
    ? categoryDetails.find(({ category }) => category === result.category)
    : undefined;
  const error = result.status === "error" ? result.message : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-950">Adult {title} screening estimate</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">For adults age 20 or older. Enter your own measurements to calculate a result.</p>
        </div>
        <Button type="button" variant="outline" className="min-h-11 shrink-0" onClick={copyLink}>
          <Copy aria-hidden="true" className="mr-2 h-4 w-4" /> Copy BMI link
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-4">
          <div>
            <label htmlFor="bmi-height" className="mb-2 block text-sm font-medium text-slate-800">Height</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="bmi-height" type="text" inputMode="decimal" value={height} onChange={(event) => changeHeight(event.target.value)} className="min-h-11 flex-1" placeholder="e.g. 170" aria-invalid={Boolean(error)} aria-describedby={error ? "bmi-error" : "bmi-guidance"} />
              <select
                aria-label="Height unit"
                value={heightUnit}
                onChange={(event) => changeHeightUnit(event.target.value as BmiHeightUnit)}
                className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 sm:w-[150px]"
              >
                <option value="cm">Centimeters</option>
                <option value="meters">Meters</option>
                <option value="inches">Inches</option>
                <option value="feet">Feet</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="bmi-weight" className="mb-2 block text-sm font-medium text-slate-800">Weight</label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input id="bmi-weight" type="text" inputMode="decimal" value={weight} onChange={(event) => changeWeight(event.target.value)} className="min-h-11 flex-1" placeholder="e.g. 70" aria-invalid={Boolean(error)} aria-describedby={error ? "bmi-error" : "bmi-guidance"} />
              <select
                aria-label="Weight unit"
                value={weightUnit}
                onChange={(event) => changeWeightUnit(event.target.value as BmiWeightUnit)}
                className="min-h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 focus-visible:ring-offset-1 sm:w-[150px]"
              >
                <option value="kg">Kilograms</option>
                <option value="lbs">Pounds</option>
              </select>
            </div>
          </div>
          <p id="bmi-guidance" className="text-xs leading-5 text-slate-500">Values stay in the URL so this calculation can be bookmarked or shared.</p>
          {error && <p id="bmi-error" className="text-sm text-red-700" role="alert">{error}</p>}
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 bg-slate-50 p-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-slate-950" aria-live="polite" aria-atomic="true">
                {result.status === "ready" ? result.bmi : "—"}
              </div>
              <div className="mt-1 text-sm text-slate-500">Adult BMI estimate</div>
              {result.status === "ready" && (
                <>
                  <div className={`mt-2 text-lg font-semibold ${activeCategory?.color}`}>{result.category}</div>
                  <div className="mt-4 rounded-xl bg-indigo-50 p-4 text-sm text-indigo-900">
                    <p className="font-semibold">BMI 18.5–24.9 reference</p>
                    <p className="mt-1 leading-6">
                      At this height, that screening range corresponds to {weightUnit === "kg"
                        ? `${result.referenceWeightKg.min}–${result.referenceWeightKg.max} kg`
                        : `${Math.round(result.referenceWeightKg.min * 2.2046226218)}–${Math.round(result.referenceWeightKg.max * 2.2046226218)} lb`}.
                      This is not a personal target or diagnosis.
                    </p>
                  </div>
                </>
              )}
            </div>
          </Card>

          <div>
            <h4 className="text-sm font-semibold text-slate-800">CDC adult screening categories</h4>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {categoryDetails.map((item) => (
                <li key={item.category} className={`rounded-xl border px-3 py-2 ${result.status === "ready" && result.category === item.category ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
                  <span className={`block text-sm font-semibold ${item.color}`}>{item.category}</span>
                  <span className="text-xs text-slate-600">{item.range}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <aside className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950" role="note" aria-label="BMI limitations">
        <div className="flex items-start gap-3">
          <Info aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="font-semibold">BMI is a screening measure, not a diagnosis</p>
            <p className="mt-2 leading-6">BMI does not directly measure body fat or distinguish fat, muscle and bone. Individual health should be considered with other factors. This adult calculator is not for children or teens and is not a substitute for professional medical advice.</p>
            <a className="mt-3 inline-flex min-h-11 items-center gap-2 font-semibold text-amber-950 underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-800" href="https://www.cdc.gov/bmi/adult-calculator/index.html" target="_blank" rel="noopener noreferrer">
              CDC Adult BMI Calculator <ExternalLink aria-hidden="true" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </aside>
      <p className="sr-only" role="status" aria-live="polite">{status}</p>
    </div>
  );
};

export default BMICalculator;
