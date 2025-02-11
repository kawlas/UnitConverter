import React, { useState, useEffect } from "react";
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

const BMICalculator: React.FC<BMICalculatorProps> = ({ title = "BMI" }) => {
  const [height, setHeight] = useState<string>("170");
  const [weight, setWeight] = useState<string>("70");
  const [heightUnit, setHeightUnit] = useState<string>("cm");
  const [weightUnit, setWeightUnit] = useState<string>("kg");
  const [gender, setGender] = useState<string>("male");
  const [bmi, setBMI] = useState<number>(0);
  const [category, setCategory] = useState<string>("");

  const calculateBMI = () => {
    let heightInMeters = parseFloat(height);
    let weightInKg = parseFloat(weight);

    if (isNaN(heightInMeters) || isNaN(weightInKg)) {
      setBMI(0);
      setCategory("");
      return;
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
    setBMI(Math.round(bmiValue * 10) / 10);

    // Determine BMI category
    if (bmiValue < 18.5) {
      setCategory("Underweight");
    } else if (bmiValue >= 18.5 && bmiValue < 25) {
      setCategory("Normal weight");
    } else if (bmiValue >= 25 && bmiValue < 30) {
      setCategory("Overweight");
    } else {
      setCategory("Obese");
    }
  };

  useEffect(() => {
    calculateBMI();
  }, [height, weight, heightUnit, weightUnit]);

  const getCurrentRange = () => bmiRanges.find((r) => r.category === category);

  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg">{title}</h2>

      <div className="grid md:grid-cols-[.75fr_1fr] gap-6">
        <div className="space-y-4">
          {/* Height Section */}
          <div>
            <div className="text-sm mb-2">Height</div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                className="flex-1"
              />
              <Select value={heightUnit} onValueChange={setHeightUnit}>
                <SelectTrigger className="w-[140px]">
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
            <div className="text-sm mb-2">Weight</div>
            <div className="flex gap-2">
              <Input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1"
              />
              <Select value={weightUnit} onValueChange={setWeightUnit}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kg">Kilograms</SelectItem>
                  <SelectItem value="lbs">Pounds</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Gender Section */}
          <div>
            <div className="text-sm mb-2">Gender</div>
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          <Card className="p-6 bg-gray-50">
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900">
                {bmi || "-"}
              </div>
              <div className="text-sm text-gray-500 mt-1">Your BMI</div>
              {category && (
                <div
                  className={`mt-2 text-lg font-medium ${getCurrentRange()?.color}`}
                >
                  {category}
                </div>
              )}
              {getCurrentRange()?.description && (
                <div className="mt-2 text-sm text-gray-600">
                  {getCurrentRange()?.description}
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
                  className={`p-2 rounded ${category === range.category ? "bg-gray-100" : ""}`}
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
