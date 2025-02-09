import React, { useState } from "react";
import { Helmet } from "react-helmet";

import SearchBar from "@/components/SearchBar";
import ConversionCategories from "@/components/ConversionCategories";
import AdCard from "@/components/AdCard";
import Footer from "@/components/Footer";

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
      id: "power",
      title: "Power",
      units: [
        { value: "watts", label: "Watts" },
        { value: "kilowatts", label: "Kilowatts" },
        { value: "horsepower", label: "Horsepower" },
        { value: "btu_per_hour", label: "BTU/hour" },
      ],
    },
    {
      id: "energy",
      title: "Energy",
      units: [
        { value: "joules", label: "Joules" },
        { value: "kilowatt_hours", label: "Kilowatt Hours" },
        { value: "calories", label: "Calories" },
        { value: "btu", label: "BTU" },
      ],
    },
    {
      id: "speed",
      title: "Speed",
      units: [
        { value: "mph", label: "Miles per Hour" },
        { value: "kph", label: "Kilometers per Hour" },
        { value: "mps", label: "Meters per Second" },
        { value: "knots", label: "Knots" },
      ],
    },
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
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="space-y-8">
            <div className="text-center space-y-6 max-w-3xl mx-auto">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Unit Converter
                </h1>
                <h2 className="text-2xl md:text-3xl font-semibold text-gray-700">
                  Free Online Measurement Conversion Tool
                </h2>
                <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                  Quick and accurate conversions for power, energy, speed,
                  length, weight, temperature, volume, and area measurements
                </p>
              </div>
              <div className="flex justify-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Instant Results
                </span>
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  High Precision
                </span>
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Real-time Updates
                </span>
              </div>
            </div>
            <SearchBar onSearch={handleSearch} />
            <ConversionCategories categories={filteredCategories} />
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-8">
          <div className="flex justify-center gap-4">
            <AdCard />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Home;
