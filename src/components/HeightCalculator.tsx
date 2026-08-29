import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Copy, Link as LinkIcon } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import {
  centimetersToFeetInches,
  feetInchesToCentimeters,
  formatFeetInches,
  parseHeightInput,
} from "@/lib/height";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

type HeightDirection = "cm-to-feet-inches" | "feet-inches-to-cm";

const isDirection = (value: string | null): value is HeightDirection =>
  value === "cm-to-feet-inches" || value === "feet-inches-to-cm";

const readPrecision = (value: string | null): number => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 6 ? parsed : 2;
};

const serialize = (value: number): string => String(value);

export default function HeightCalculator() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [direction, setDirection] = useState<HeightDirection>("cm-to-feet-inches");
  const [centimeters, setCentimeters] = useState("180");
  const [feet, setFeet] = useState("5");
  const [inches, setInches] = useState("10.866141732283467");
  const [precision, setPrecision] = useState(2);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const nextDirection = searchParams.get("direction");
    // URL state is applied after hydration so the prerendered default remains stable.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDirection(isDirection(nextDirection) ? nextDirection : "cm-to-feet-inches");
    setCentimeters((searchParams.get("cm") ?? "180").slice(0, 32));
    setFeet((searchParams.get("feet") ?? "5").slice(0, 16));
    setInches((searchParams.get("inches") ?? "10.866141732283467").slice(0, 32));
    setPrecision(readPrecision(searchParams.get("precision")));
  }, [searchParams]);

  const calculation = useMemo(() => {
    if (direction === "cm-to-feet-inches") {
      const parsed = parseHeightInput(centimeters);
      if (parsed.status !== "ready") return parsed;
      return {
        status: "ready" as const,
        centimeters: parsed.value,
        display: formatFeetInches(parsed.value, precision),
      };
    }

    const parsedFeet = parseHeightInput(feet);
    const parsedInches = parseHeightInput(inches);
    if (parsedFeet.status === "empty" || parsedInches.status === "empty") return { status: "empty" as const };
    if (parsedFeet.status === "error") return parsedFeet;
    if (parsedInches.status === "error") return parsedInches;
    if (!Number.isInteger(parsedFeet.value)) {
      return { status: "error" as const, message: "Enter feet as a whole number." };
    }
    if (parsedInches.value >= 12) {
      return { status: "error" as const, message: "Enter inches from 0 to less than 12." };
    }
    const value = feetInchesToCentimeters(parsedFeet.value, parsedInches.value);
    return {
      status: "ready" as const,
      centimeters: value,
      display: `${new Intl.NumberFormat("en-US", { maximumFractionDigits: precision }).format(value)} cm`,
    };
  }, [centimeters, direction, feet, inches, precision]);

  const updateUrl = (next: {
    direction: HeightDirection;
    centimeters?: string;
    feet?: string;
    inches?: string;
    precision?: number;
  }) => {
    const params = new URLSearchParams();
    params.set("direction", next.direction);
    if (next.direction === "cm-to-feet-inches") params.set("cm", next.centimeters ?? centimeters);
    else {
      params.set("feet", next.feet ?? feet);
      params.set("inches", next.inches ?? inches);
    }
    params.set("precision", String(next.precision ?? precision));
    setSearchParams(params, { replace: true });
  };

  const changeCentimeters = (value: string) => {
    const next = value.slice(0, 32);
    setCentimeters(next);
    setStatus("");
    updateUrl({ direction, centimeters: next });
  };

  const changeFeet = (value: string) => {
    const next = value.slice(0, 16);
    setFeet(next);
    setStatus("");
    updateUrl({ direction, feet: next });
  };

  const changeInches = (value: string) => {
    const next = value.slice(0, 32);
    setInches(next);
    setStatus("");
    updateUrl({ direction, inches: next });
  };

  const swapDirection = () => {
    if (calculation.status !== "ready") return;
    if (direction === "cm-to-feet-inches") {
      const compound = centimetersToFeetInches(calculation.centimeters);
      const nextFeet = serialize(compound.feet);
      const nextInches = serialize(compound.inches);
      setFeet(nextFeet);
      setInches(nextInches);
      setDirection("feet-inches-to-cm");
      updateUrl({ direction: "feet-inches-to-cm", feet: nextFeet, inches: nextInches });
    } else {
      const nextCentimeters = serialize(calculation.centimeters);
      setCentimeters(nextCentimeters);
      setDirection("cm-to-feet-inches");
      updateUrl({ direction: "cm-to-feet-inches", centimeters: nextCentimeters });
    }
    setStatus("");
  };

  const changePrecision = (value: string) => {
    const next = readPrecision(value);
    setPrecision(next);
    updateUrl({ direction, precision: next });
  };

  const copyResult = async () => {
    if (calculation.status !== "ready") return;
    try {
      await navigator.clipboard.writeText(calculation.display);
      setStatus("Height result copied.");
    } catch {
      setStatus("Unable to copy the height result in this browser.");
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setStatus("Height link copied.");
    } catch {
      setStatus("Unable to copy the height link in this browser.");
    }
  };

  const error = calculation.status === "error" ? calculation.message : "";

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
          {direction === "cm-to-feet-inches" ? (
            <>
              <label htmlFor="height-centimeters" className="mb-2 block text-sm font-semibold text-slate-800">Centimeters</label>
              <div className="flex min-h-14 items-center rounded-xl border border-slate-300 bg-white px-3 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20">
                <Input id="height-centimeters" aria-label="Centimeters" inputMode="decimal" value={centimeters} onChange={(event) => changeCentimeters(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? "height-error" : "height-guidance"} className="min-h-12 min-w-0 flex-1 border-0 bg-transparent px-0 text-2xl font-bold shadow-none focus-visible:ring-0" />
                <span className="ml-2 font-semibold text-slate-500">cm</span>
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-sm font-semibold text-slate-800">Feet
                <Input aria-label="Feet" inputMode="numeric" value={feet} onChange={(event) => changeFeet(event.target.value)} aria-invalid={Boolean(error)} className="mt-2 min-h-14 text-xl font-bold" />
              </label>
              <label className="block text-sm font-semibold text-slate-800">Inches
                <Input aria-label="Inches" inputMode="decimal" value={inches} onChange={(event) => changeInches(event.target.value)} aria-invalid={Boolean(error)} className="mt-2 min-h-14 text-xl font-bold" />
              </label>
            </div>
          )}
        </div>

        <Button type="button" variant="outline" onClick={swapDirection} disabled={calculation.status !== "ready"} className="min-h-11 min-w-11 self-center rounded-full border-slate-300 bg-white p-0" aria-label="Swap height direction">
          <ArrowRightLeft aria-hidden="true" className="h-5 w-5" />
        </Button>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-indigo-900">{direction === "cm-to-feet-inches" ? "Feet + inches" : "Centimeters"}</p>
            <label className="text-xs font-medium text-indigo-900">Decimals
              <select aria-label="Height result decimals" value={precision} onChange={(event) => changePrecision(event.target.value)} className="ml-2 min-h-9 rounded-lg border border-indigo-200 bg-white px-2 text-sm text-slate-900">
                {[0, 1, 2, 3, 4, 5, 6].map((value) => <option key={value} value={value}>{value}</option>)}
              </select>
            </label>
          </div>
          <strong id="height-result" className="mt-3 block break-words text-3xl font-bold tracking-tight text-slate-950" aria-live="polite" aria-atomic="true">
            {calculation.status === "ready" ? calculation.display : "—"}
          </strong>
          <p id="height-guidance" className="mt-2 text-xs leading-5 text-indigo-900">Uses the exact international inch: 1 in = 2.54 cm.</p>
        </div>
      </div>

      {error ? <p id="height-error" className="text-sm font-medium text-red-700" role="alert">{error}</p> : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" className="min-h-11" onClick={copyResult} disabled={calculation.status !== "ready"} aria-label="Copy height result">
          <Copy aria-hidden="true" className="mr-2 h-4 w-4" /> Copy result
        </Button>
        <Button type="button" variant="outline" className="min-h-11" onClick={copyLink}>
          <LinkIcon aria-hidden="true" className="mr-2 h-4 w-4" /> Copy link
        </Button>
        <p className="text-sm text-slate-600" role="status" aria-live="polite">{status}</p>
      </div>
    </div>
  );
}
