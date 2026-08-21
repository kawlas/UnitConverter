import React from "react";
import { categories as catalog } from "@/lib/conversion-data";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";
import ConversionSection from "./ConversionSection";

interface ConversionCategoriesProps {
  categories?: typeof catalog;
}

const ConversionCategories: React.FC<ConversionCategoriesProps> = ({ categories = catalog }) => (
  <div className="w-full max-w-3xl mx-auto p-4 space-y-4 bg-white rounded-xl shadow-sm border border-gray-100">
    <Accordion type="single" collapsible className="w-full">
      {categories.filter((category) => category.converter !== "calculator").map((category) => (
        <AccordionItem key={category.id} value={category.id}>
          <AccordionTrigger className="text-lg font-semibold">{category.title}</AccordionTrigger>
          <AccordionContent>
            <ConversionSection title={category.title} units={category.units} categoryId={category.id} />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

export default ConversionCategories;
