import React, { useState, useEffect } from "react";
import { ArrowUpDown, RotateCcw } from "lucide-react";
import { Button } from "./ui/button";
import { convert } from "@/lib/conversions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";

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

  const [fromValue, setFromValue] = useState<string>("0");
  const [fromUnit, setFromUnit] = useState<string>(defaults.from);
  const [toUnit, setToUnit] = useState<string>(defaults.to);
  const [result, setResult] = useState<string>("0");

  // Function to perform conversion
  const updateConversion = (value: string, from: string, to: string) => {
    const numericValue = parseFloat(value);
    if (isNaN(numericValue)) {
      setResult("0");
      return;
    }
    const convertedValue = convert(numericValue, from, to, categoryId);
    setResult(convertedValue.toString());
  };

  // Update conversion whenever inputs change
  useEffect(() => {
    updateConversion(fromValue, fromUnit, toUnit);
  }, [fromValue, fromUnit, toUnit]);

  const resetToDefaults = () => {
    setFromValue("0");
    setFromUnit(defaults.from);
    setToUnit(defaults.to);
  };

  return (
    <div className="space-y-6">
      <h2 className="font-medium text-lg">{title}</h2>

      <div className="space-y-4">
        <div className="grid grid-cols-[120px_1fr] gap-4 items-center">
          {/* From Section */}
          <div className="text-sm font-medium">From</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              className="w-[120px]"
              placeholder="0"
            />
            <Select value={fromUnit} onValueChange={setFromUnit}>
              <SelectTrigger className="w-[140px]">
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

          {/* To Section */}
          <div className="text-sm font-medium">To</div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={result}
              readOnly
              className="w-[120px]"
              placeholder="0"
            />
            <Select value={toUnit} onValueChange={setToUnit}>
              <SelectTrigger className="w-[140px]">
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
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const tempUnit = fromUnit;
            setFromUnit(toUnit);
            setToUnit(tempUnit);
            setFromValue(result);
          }}
          className="h-8 w-8"
        >
          <ArrowUpDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={resetToDefaults}
          className="h-8 w-8"
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ConversionSection;
