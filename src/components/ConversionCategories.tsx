import React from "react";
import { convert } from "@/lib/conversions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion";
const ConversionSection = React.lazy(() => import("./ConversionSection"));

interface ConversionCategoriesProps {
  categories?: Array<{
    id: string;
    title: string;
    units: Array<{ value: string; label: string }>;
  }>;
}

const ConversionCategories: React.FC<ConversionCategoriesProps> = ({
  categories = [
    {
      id: "length",
      title: "Length",
      units: [
        { value: "meters", label: "Meters" },
        { value: "feet", label: "Feet" },
        { value: "inches", label: "Inches" },
        { value: "kilometers", label: "Kilometers" },
      ],
    },
    {
      id: "weight",
      title: "Weight",
      units: [
        { value: "kilograms", label: "Kilograms" },
        { value: "pounds", label: "Pounds" },
        { value: "ounces", label: "Ounces" },
        { value: "grams", label: "Grams" },
      ],
    },
    {
      id: "temperature",
      title: "Temperature",
      units: [
        { value: "celsius", label: "Celsius" },
        { value: "fahrenheit", label: "Fahrenheit" },
        { value: "kelvin", label: "Kelvin" },
      ],
    },
    {
      id: "volume",
      title: "Volume",
      units: [
        { value: "liters", label: "Liters" },
        { value: "gallons", label: "Gallons" },
        { value: "milliliters", label: "Milliliters" },
        { value: "cubic_meters", label: "Cubic Meters" },
      ],
    },
    {
      id: "area",
      title: "Area",
      units: [
        { value: "square_meters", label: "Square Meters" },
        { value: "square_feet", label: "Square Feet" },
        { value: "square_kilometers", label: "Square Kilometers" },
        { value: "acres", label: "Acres" },
      ],
    },
  ],
}) => {
  return (
    <div className="w-full max-w-3xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow-sm border border-gray-100">
      <Accordion type="single" collapsible className="w-full">
        {categories.map((category) => (
          <AccordionItem key={category.id} value={category.id}>
            <AccordionTrigger className="text-lg font-semibold">
              {category.title}
            </AccordionTrigger>
            <AccordionContent>
              <ConversionSection
                title={category.title}
                units={category.units}
                categoryId={category.id}
                onValueChange={(value, fromUnit, toUnit) => {
                  return convert(value, fromUnit, toUnit, category.id);
                }}
              />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default ConversionCategories;
