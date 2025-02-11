import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import SearchBar from "@/components/SearchBar";
import { categories } from "@/lib/conversion-data";
import AdCard from "@/components/AdCard";
import Footer from "@/components/Footer";

export default function HomePage() {
  const navigate = useNavigate();

  const handleSearch = (term: string) => {
    const category = categories.find((c) =>
      c.title.toLowerCase().includes(term.toLowerCase()),
    );
    if (category) {
      navigate(`/convert/${category.id}`);
    }
  };

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
          content="unit converter, measurement converter, length converter, weight converter, temperature converter, volume converter, area converter"
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center space-y-6 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              Unit Converter
            </h1>
            <p className="text-lg text-gray-600">
              Quick and accurate conversions for all your measurement needs
            </p>
          </div>

          <SearchBar onSearch={handleSearch} />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map((category) => (
              <a
                key={category.id}
                href={`/convert/${category.id}`}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <h2 className="text-xl font-semibold mb-2">
                  {category.title} Converter
                </h2>
                <p className="text-gray-600 text-sm">
                  Convert between different {category.title.toLowerCase()} units
                </p>
              </a>
            ))}
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
