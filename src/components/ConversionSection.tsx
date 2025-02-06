import React, { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { Button } from "./ui/button";
import { convert } from "@/lib/conversions";
import { Card } from "./ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

interface ConversionSectionProps {
  title?: string;
  categoryId?: string;
  units?: Array<{ value: string; label: string }>;
  onValueChange?: (value: number, fromUnit: string, toUnit: string) => number;
}

const ConversionSection: React.FC<ConversionSectionProps> = ({
  title = "Length",
  units = [
    { value: "meters", label: "Meters" },
    { value: "feet", label: "Feet" },
    { value: "inches", label: "Inches" },
    { value: "kilometers", label: "Kilometers" },
  ],
  onValueChange = () => 0,
}) => {
  const [fromValue, setFromValue] = useState<string>("0");
  const [fromUnit, setFromUnit] = useState<string>(units[0].value);
  const [toUnit, setToUnit] = useState<string>(units[1].value);
  const [result, setResult] = useState<string>("0");

  const handleValueChange = (value: string) => {
    setFromValue(value);
    const numericValue = parseFloat(value) || 0;
    const convertedValue = onValueChange(numericValue, fromUnit, toUnit);
    setResult(convertedValue.toString());
  };

  return (
    <Card className="p-6 bg-white shadow-sm">
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* From Section */}
          <div className="space-y-2">
            <Label htmlFor="fromValue">From</Label>
            <div className="flex gap-2">
              <Input
                id="fromValue"
                type="number"
                value={fromValue}
                onChange={(e) => handleValueChange(e.target.value)}
                className="flex-1"
              />
              <Select value={fromUnit} onValueChange={setFromUnit}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select unit" />
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

          {/* Buttons */}
          <div className="flex gap-2 justify-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const tempUnit = fromUnit;
                const tempValue = fromValue;
                setFromUnit(toUnit);
                setToUnit(tempUnit);
                setFromValue(result);
                setResult(tempValue);
              }}
            >
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                setFromValue("0");
                setResult("0");
              }}
            >
              <span className="font-bold">↺</span>
            </Button>
          </div>

          {/* To Section */}
          <div className="space-y-2">
            <Label htmlFor="toValue">To</Label>
            <div className="flex gap-2">
              <Input
                id="toValue"
                type="number"
                value={result}
                readOnly
                className="flex-1"
              />
              <Select value={toUnit} onValueChange={setToUnit}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select unit" />
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
      </div>
    </Card>
  );
};

export default ConversionSection;
