import React, { useState, useEffect, useMemo } from "react";
import { ArrowUpDown, RotateCcw, Copy } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { convert } from "@/lib/conversions";

interface ConversionSectionProps {
  title?: string;
  categoryId?: string;
  units?: Array<{ value: string; label: string }>;
}

const defaultUnits: { [key: string]: { from: string; to: string } } = {
  energy: { from: "joules", to: "kilowatt_hours" },
  speed: { from: "kph", to: "mph" },
  length: { from: "meters", to: "feet" },
  weight: { from: "kilograms", to: "pounds" },
  temperature: { from: "celsius", to: "fahrenheit" },
  volume: { from: "liters", to: "gallons" },
  area: { from: "square_meters", to: "square_feet" },
  power: { from: "watts", to: "kilowatts" },
};

const ConversionSection: React.FC<ConversionSectionProps> = ({
  title = "Length",
  categoryId = "length",
  units = [
    { value: "meters", label: "Meters" },
    { value: "feet", label: "Feet" },
  ],
}) => {
  const defaults = defaultUnits[categoryId] || {
    from: units[0]?.value || "",
    to: units[1]?.value || "",
  };

  const [fromValue, setFromValue] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>(defaults.from);
  const [toUnit, setToUnit] = useState<string>(defaults.to);
  const [copied, setCopied] = useState(false);

  const numericValue = useMemo(() => parseFloat(fromValue), [fromValue]);
  const result = useMemo(() => {
    if (isNaN(numericValue)) return "0";
    const convertedValue = convert(numericValue, fromUnit, toUnit, categoryId);
    return convertedValue.toString();
  }, [numericValue, fromUnit, toUnit, categoryId]);

  const presetPairs = useMemo(() => {
    const pairSet = new Set<string>();
    const pairs: { from: string; to: string; label: string }[] = [];
    for (const unit of units) {
      if (unit.value === fromUnit) continue;
      const key = `${fromUnit}->${unit.value}`;
      if (!pairSet.has(key)) {
        pairSet.add(key);
        pairs.push({ from: fromUnit, to: unit.value, label: unit.label });
      }
    }
    return pairs.slice(0, 4);
  }, [units, fromUnit]);

  const resetToDefaults = () => {
    setFromValue("1");
    setFromUnit(defaults.from);
    setToUnit(defaults.to);
  };

  const swapUnits = () => {
    const tempUnit = fromUnit;
    setFromUnit(toUnit);
    setToUnit(tempUnit);
    setFromValue(result);
  };

  const copyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="w-full">
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="h-14 text-2xl font-semibold tracking-tight sm:w-44"
              placeholder="0"
            />
            <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className="h-12 w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={swapUnits}
                  className="h-10 w-10 rounded-full"
                >
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </div>

              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="h-12 w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.value} value={unit.value}>
                      {unit.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Result
              </span>
              <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                {result}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="h-10 px-4 text-sm"
                onClick={copyResult}
              >
                <Copy className="mr-2 h-4 w-4" />
                {copied ? "Copied" : "Copy result"}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetToDefaults}
                className="h-10 w-10"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {presetPairs.map((pair) => {
          const presetResult = convert(
            numericValue || 0,
            pair.from,
            pair.to,
            categoryId
          ).toString();
          return (
            <div
              key={`${pair.from}-${pair.to}`}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white/70 px-4 py-3 text-sm dark:border-slate-800 dark:bg-slate-900/60"
            >
              <span className="text-slate-600 dark:text-slate-300">
                {pair.label}
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {presetResult}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConversionSection;
