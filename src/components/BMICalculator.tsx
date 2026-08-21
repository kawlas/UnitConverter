import React, { useState } from "react";
import { Input } from "./ui/input";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface BMICalculatorProps {
  title?: string;
}

interface BMIRange {
  category: string;
  range: string;
  color: string;
  description: string;
}

const bmiRanges: BMIRange[] = [
  {
    category: "Underweight",
    range: "< 18.5",
    color: "text-blue-600",
    description: "May indicate nutritional deficiency or other health issues",
  },
  {
    category: "Normal weight",
    range: "18.5 - 24.9",
    color: "text-green-600",
    description: "Healthy range associated with optimal health outcomes",
  },
  {
    category: "Overweight",
    range: "25 - 29.9",
    color: "text-yellow-600",
    description: "May increase risk of health issues",
  },
  {
    category: "Obese",
    range: "≥ 30",
    color: "text-red-600",
    description: "Higher risk of various health conditions",
  },
];

const parseNumeric = (raw: string): number | undefined => {
  if (!/^-?(?:(?:\d+(?:[.,]\d*)?)|(?:[.,]\d+))$/.test(raw.trim())) return undefined;
  const value = Number(raw.trim().replace(",", "."));
  return Number.isFinite(value) ? value : undefined;
};

const BMICalculator: React.FC<BMICalculatorProps> = ({ title = "BMI" }) => {
  const [height, setHeight] = useState<string>("170");
  const [weight, setWeight] = useState<string>("70");
  const [heightUnit, setHeightUnit] = useState<string>("cm");
  const [weightUnit, setWeightUnit] = useState<string>("kg");
  const { bmi: computedBMI, category: computedCategory, idealRange, error } = React.useMemo(() => {
    let heightInMeters = parseNumeric(height);
    let weightInKg = parseNumeric(weight);

    if (heightInMeters === undefined || weightInKg === undefined) {
      return { bmi: 0, category: "", idealRange: { min: 0, max: 0 }, error: "Enter valid finite numbers for height and weight." };
    }
    if (heightInMeters <= 0 || weightInKg <= 0) {
      return { bmi: 0, category: "", idealRange: { min: 0, max: 0 }, error: "Height and weight must be greater than zero." };
    }

    // Convert height to meters
    if (heightUnit === "cm") {
      heightInMeters = heightInMeters / 100;
    } else if (heightUnit === "inches") {
      heightInMeters = heightInMeters * 0.0254;
    } else if (heightUnit === "feet") {
      heightInMeters = heightInMeters * 0.3048;
    }

    // Convert weight to kg
    if (weightUnit === "lbs") {
      weightInKg = weightInKg * 0.453592;
    }

    // Calculate BMI
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);
    const rounded = Math.round(bmiValue * 10) / 10;

    // Calculate ideal weight range
    const minWeight = 18.5 * (heightInMeters * heightInMeters);
    const maxWeight = 24.9 * (heightInMeters * heightInMeters);

    // Determine BMI category
    let categoryLabel = "";
    if (bmiValue < 18.5) {
      categoryLabel = "Underweight";
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      categoryLabel = "Normal weight";
    } else if (bmiValue >= 25 && bmiValue < 30) {
      categoryLabel = "Overweight";
    } else {
      categoryLabel = "Obese";
    }

    return {
      bmi: rounded,
      category: categoryLabel,
      idealRange: {
        min: Math.round(minWeight * 10) / 10,
        max: Math.round(maxWeight * 10) / 10,
      },
      error: "",
    };
  }, [height, weight, heightUnit, weightUnit]);

  const getCurrentRange = () => bmiRanges.find((r) => r.category === computedCategory);

  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg">{title}</h2>
      {error && <p id="bmi-error" className="text-sm text-red-700" role="alert">{error}</p>}

      <div className="grid md:grid-cols-[.75fr_1fr] gap-6">
        <div className="space-y-4">
          {/* Height Section */}
          <div>
            <label htmlFor="bmi-height" className="text-sm mb-2 block">Height</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="bmi-height"
                type="text"
                inputMode="decimal"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="flex-1 min-h-11"
                placeholder="170"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "bmi-error" : undefined}
              />
              <Select value={heightUnit} onValueChange={setHeightUnit}>
                <SelectTrigger aria-label="Height unit" className="min-h-11 w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cm">Centimeters</SelectItem>
                  <SelectItem value="inches">Inches</SelectItem>
                  <SelectItem value="feet">Feet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Weight Section */}
          <div>
            <label htmlFor="bmi-weight" className="text-sm mb-2 block">Weight</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                id="bmi-weight"
                type="text"
                inputMode="decimal"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1 min-h-11"
                placeholder="70"
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "bmi-error" : undefined}
              />
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger aria-label="Weight unit" className="min-h-11 w-full sm:w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="lbs">Pounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <Card className="p-6 bg-gray-50">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900" aria-live="polite" aria-atomic="true">
                {computedBMI || "-"}
              </div>
              <div className="text-sm text-gray-500 mt-1">Your BMI</div>
              {computedCategory && (
                <div
                  className={`mt-2 text-lg font-medium ${getCurrentRange()?.color}`}
                >
                  {computedCategory}
                </div>
              )}
              {getCurrentRange()?.description && (
                <div className="mt-2 text-sm text-gray-600">
                  {getCurrentRange()?.description}
                </div>
              )}
              {idealRange.min > 0 && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium">Healthy Weight Range</p>
                  <p className="mt-1">
                    For your height, a healthy weight range would be:
                    <br />
                    {weightUnit === "kg" ? (
                      <span className="font-medium">
                        {idealRange.min} - {idealRange.max} kg
                      </span>
                    ) : (
                      <span className="font-medium">
                        {Math.round(idealRange.min * 2.20462)} - {" "}
                        {Math.round(idealRange.max * 2.20462)} lbs
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </Card>

          {/* BMI Scale */}
          <div className="space-y-3">
            <div className="text-sm font-medium">BMI Categories:</div>
            <div className="space-y-2">
              {bmiRanges.map((range) => (
                <div
                  key={range.category}
                  className={`p-2 rounded ${computedCategory === range.category ? "bg-gray-100" : ""}`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-medium ${range.color}`}>
                      {range.category}
                    </span>
                    <span className="text-sm text-gray-500">{range.range}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BMICalculator;
