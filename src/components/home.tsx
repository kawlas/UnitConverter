import React, { useState } from "react";
const Helmet = React.lazy(() => import("react-helmet"));

import SearchBar from "@/components/SearchBar";
import ConversionCategories from "@/components/ConversionCategories";
import AdCard from "@/components/AdCard";
const Footer = React.lazy(() => import("@/components/Footer"));

interface HomeProps {
  initialSearchTerm?: string;
}

const Home: React.FC<HomeProps> = ({ initialSearchTerm = "" }) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const handleSearch = (term: string) => {
    setSearchTerm(term.toLowerCase());
  };

  return (
    <>
      <Helmet>
        <title>Q Converter - Free Online Measurement Conversion Tool</title>
        <meta
          name="description"
          content="Free online Q converter for length, weight, temperature, volume, and area. Quick and accurate conversions with an easy-to-use interface."
        />
        <meta
          name="keywords"
          content="Q converter, measurement converter, length converter, weight converter, temperature converter, volume converter, area converter, meters to feet, kilograms to pounds, celsius to fahrenheit"
        />
        <meta
          property="og:title"
          content="Q Converter - Free Online Measurement Conversion Tool"
        />
        <meta
          property="og:description"
          content="Free online Q converter for length, weight, temperature, volume, and area measurements. Quick and accurate conversions."
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
                  Q Converter
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
            <ConversionCategories />
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
