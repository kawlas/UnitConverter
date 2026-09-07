import { useParams, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { categories } from "@/lib/conversion-data";
import ConversionSection from "@/components/ConversionSection";
import BMICalculator from "@/components/BMICalculator";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { SavedConversions } from "@/components/SavedConversions";

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

  return (
    <>
      <Helmet>
        <title>{title} Converter - Free Online Q Conversion</title>
        <meta
          name="description"
          content={`Convert ${title.toLowerCase()} measurements online. Free ${title.toLowerCase()} converter with common conversions. Quick and accurate results.`}
        />
        <meta
          name="keywords"
          content={`${title.toLowerCase()} converter, ${title.toLowerCase()} unit converter, ${units.map((u) => u.label.toLowerCase()).join(", ")}`}
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="px-4 pb-20 pt-6">
          <div className="mx-auto max-w-3xl space-y-8">
            <header className="space-y-3 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                {title} Converter
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Enter a value once, then change units to see instant results.
              </p>
            </header>

            <ConversionSection
              title={title}
              units={units}
              categoryId={id}
            />

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Saved for later
              </h2>
              <SavedConversions categoryId={id} units={units} />
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
