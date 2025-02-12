import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { categories } from "@/lib/conversion-data";
import ConversionSection from "@/components/ConversionSection";
import BMICalculator from "@/components/BMICalculator";
import AdCard from "@/components/AdCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

const unitDescriptions = {
  bmi: "Body Mass Index (BMI) is a simple measure that uses your height and weight to work out if your weight is healthy. The BMI calculation divides an adult's weight in kilograms by their height in metres squared.",
  power:
    "Power is the rate of energy transfer, commonly measured in watts (W), kilowatts (kW), or horsepower (hp). Essential for electrical systems, engines, and energy consumption calculations.",
  energy:
    "Energy quantifies the capacity to perform work, measured in joules (J), kilowatt-hours (kWh), or calories (cal). Critical for understanding fuel consumption, electricity usage, and heat transfer.",
  speed:
    "Speed measures the rate of change in position, typically in miles per hour (mph), kilometers per hour (km/h), or meters per second (m/s). Fundamental in transportation and physics calculations.",
  length:
    "Length measures distance or dimension in units like meters (m), feet (ft), or inches (in). Basic for construction, engineering, and everyday measurements.",
  weight:
    "Weight measures the force of gravity on an object, using units like kilograms (kg), pounds (lb), or ounces (oz). Essential for commerce, health, and engineering applications.",
  temperature:
    "Temperature quantifies heat energy, measured in Celsius (°C), Fahrenheit (°F), or Kelvin (K). Vital for weather, cooking, and scientific processes.",
  volume:
    "Volume measures three-dimensional space in units like liters (L), gallons (gal), or cubic meters (m³). Important for liquid measurements, shipping, and construction.",
  area: "Area measures two-dimensional space in square meters (m²), square feet (ft²), or acres. Critical for real estate, construction, and land management.",
};

export default function ConverterPage() {
  const { categoryId = "power" } = useParams();
  const category = categories.find((c) => c.id === categoryId);

  if (!category) {
    return <Navigate to="/power" replace />;
  }

  const { title, units, id } = category;
  const commonUnits = units.slice(0, 2);
  const commonConversion = `${commonUnits[0].label} to ${commonUnits[1].label}`;

  return (
    <>
      <Helmet>
        <title>{title} Converter - Free Online Q Conversion</title>
        <meta
          name="description"
          content={`Convert ${title.toLowerCase()} measurements online. Free ${title.toLowerCase()} converter with common conversions like ${commonConversion}. Quick and accurate results.`}
        />
        <meta
          name="keywords"
          content={`${title.toLowerCase()} converter, ${commonConversion.toLowerCase()}, ${title.toLowerCase()} unit converter, ${units.map((u) => u.label.toLowerCase()).join(", ")}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="py-8 px-4">
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                {title} Converter
              </h1>
              <p className="text-lg text-gray-600">
                Convert between different {title.toLowerCase()} units quickly
                and accurately
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {id === "bmi" ? (
                <BMICalculator title={title} />
              ) : (
                <ConversionSection
                  title={title}
                  units={units}
                  categoryId={id}
                />
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold mb-3">
                About {title} Units
              </h2>
              <p className="text-gray-600 leading-relaxed">
                {unitDescriptions[id as keyof typeof unitDescriptions]}
              </p>
            </div>

            <div className="space-y-4">
              <h2 className="text-xl font-semibold">
                Common {title} Conversions
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {units.slice(0, 2).map((fromUnit) =>
                  units.slice(0, 2).map((toUnit) => {
                    if (fromUnit.value === toUnit.value) return null;
                    return (
                      <div
                        key={`${fromUnit.value}-${toUnit.value}`}
                        className="p-4 bg-white rounded-lg border border-gray-100"
                      >
                        <h3 className="font-medium">
                          {fromUnit.label} to {toUnit.label}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Quick {fromUnit.label.toLowerCase()} to{" "}
                          {toUnit.label.toLowerCase()} conversion
                        </p>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-8">
            <AdCard />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
