import React, { useState } from "react";
import { Helmet } from "react-helmet";

import SearchBar from "@/components/SearchBar";
import ConversionCategories from "@/components/ConversionCategories";
import AdCard from "@/components/AdCard";

interface HomeProps {
  initialSearchTerm?: string;
}

const Home: React.FC<HomeProps> = ({ initialSearchTerm = "" }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleSearch = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };

  const defaultCategories = [
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
  ];

  const filteredCategories = defaultCategories.filter((category) =>
    category.title.toLowerCase().includes(searchTerm),
  );

  return (
    <>
      <Helmet>
        <title>Unit Converter - Free Online Measurement Conversion Tool</title>
        <meta
          name="description"
          content="Free online unit converter for length, weight, temperature, volume, and area. Quick and accurate conversions with an easy-to-use interface."
        />
        <meta
          name="keywords"
          content="unit converter, measurement converter, length converter, weight converter, temperature converter, volume converter, area converter, meters to feet, kilograms to pounds, celsius to fahrenheit"
        />
        <meta
          property="og:title"
          content="Unit Converter - Free Online Measurement Conversion Tool"
        />
        <meta
          property="og:description"
          content="Free online unit converter for length, weight, temperature, volume, and area measurements. Quick and accurate conversions."
        />
        <meta name="robots" content="index, follow" />
        <link
          rel="canonical"
          href="https://wizardly-haibt6-7k9er.dev.tempolabs.ai"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
      </Helmet>
      <div className="min-h-screen bg-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr,300px] gap-8">
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <h1 className="text-3xl font-bold text-gray-900">
                Measurement Converter
              </h1>
              <p className="text-gray-600">
                Convert between different units of measurement quickly and
                easily
              </p>
            </div>
            <SearchBar onSearch={handleSearch} />
            <ConversionCategories categories={filteredCategories} />
          </div>
          <aside className="hidden lg:block">
            <AdCard />
          </aside>
        </div>
      </div>
    </>
  );
};

export default Home;
