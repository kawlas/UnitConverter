import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import ConversionSection from "@/components/ConversionSection";
import SearchBar from "@/components/SearchBar";
import { categories } from "@/lib/conversion-data";
import Footer from "@/components/Footer";

export default function HomePage() {
  const navigate = useNavigate();
  const featured = categories.slice(0, 6);

  return (
    <>
      <Helmet>
        <title>Uni Converter — Fast, Free Online Measurement Converter</title>
        <meta
          name="description"
          content="Free online measurement converter with instant results. Convert length, weight, temperature, volume, area, speed, energy, power and more."
        />
        <meta
          name="keywords"
          content="unit converter, measurement converter, length to weight, temperature converter, volume converter, free online converter"
        />
      </Helmet>
      <div className="min-h-screen bg-background">
        <main className="px-4 pb-20 pt-6">
          <div className="mx-auto max-w-3xl space-y-8">
            <header className="space-y-2 text-center">
              <h1 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                Uni Converter
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Start with the converter below, then pick a category when you need it.
              </p>
            </header>

            <ConversionSection
              title="Quick Convert"
              categoryId="length"
              units={categories[0]?.units}
            />

            <section className="space-y-3">
              <h2 className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Categories
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {featured.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => navigate(`/convert/${category.id}`)}
                    className="w-full rounded-xl border border-slate-200 bg-white/80 px-4 py-3 text-left text-sm font-medium text-slate-800 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-100"
                  >
                    {category.title}
                  </button>
                ))}
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
