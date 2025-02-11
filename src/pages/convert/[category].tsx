import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import { categories } from "@/lib/conversion-data";
import ConversionSection from "@/components/ConversionSection";
import AdCard from "@/components/AdCard";
import Footer from "@/components/Footer";

export default function ConverterPage() {
  const { category } = useParams();
  const categoryData = categories.find((c) => c.id === category);

  if (!categoryData) {
    return <div>Category not found</div>;
  }

  const { title, units, id } = categoryData;
  const commonUnits = units.slice(0, 2);
  const commonConversion = `${commonUnits[0].label} to ${commonUnits[1].label}`;

  return (
    <>
      <Helmet>
        <title>
          {title} Converter - Free Online {title} Unit Conversion
        </title>
        <meta
          name="description"
          content={`Convert ${title.toLowerCase()} units online. Free ${title.toLowerCase()} converter with common conversions like ${commonConversion}. Quick and accurate results.`}
        />
        <meta
          name="keywords"
          content={`${title.toLowerCase()} converter, ${commonConversion.toLowerCase()}, ${title.toLowerCase()} unit converter, ${units.map((u) => u.label.toLowerCase()).join(", ")}`}
        />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {title} Converter
            </h1>
            <p className="text-lg text-gray-600">
              Convert between different {title.toLowerCase()} units quickly and
              accurately
            </p>
          </div>

          <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <ConversionSection title={title} units={units} categoryId={id} />
          </div>

          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-semibold mb-4">
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

        <div className="max-w-7xl mx-auto mt-8">
          <AdCard />
        </div>
      </div>
      <Footer />
    </>
  );
}
