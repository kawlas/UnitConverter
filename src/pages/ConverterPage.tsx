import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useParams } from "react-router-dom";
import { categories, getCategory } from "@/lib/conversion-data";
import { convertExact } from "@/lib/conversions";
import ConversionSection from "@/components/ConversionSection";
import BMICalculator from "@/components/BMICalculator";
import AdCard from "@/components/AdCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import MethodologySection from "@/components/MethodologySection";
import { getMethodology } from "@/lib/methodology";

const HOME_TITLE = "Q Converter — Free Online Unit Converter";
const SITE_ORIGIN = "https://qconverter.netlify.app";
const SOCIAL_IMAGE_URL = `${SITE_ORIGIN}/og-q-converter.png`;

const metaDescription = (description: string): string => {
  const suffix = " Free converter with precise, shareable results.";
  const combined = `${description}${suffix}`;
  if (combined.length <= 155) return combined;
  const shortened = combined.slice(0, 152);
  return `${shortened.slice(0, shortened.lastIndexOf(" "))}…`;
};

export default function ConverterPage() {
  const { categoryId } = useParams();
  const category = getCategory(categoryId);
  const pageTitle = category
    ? `${category.title} Converter — Free Online Q Converter`
    : HOME_TITLE;

  useEffect(() => {
    // Keep the browser title populated even when Helmet is applied after hydration.
    document.title = pageTitle;
  }, [pageTitle]);

  if (!category) {
    return (
      <div className="min-h-screen bg-[var(--canvas)]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-800"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back to all
            conversions
          </Link>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">
            Category not found
          </h1>
          <p className="mt-3 text-slate-600">
            Choose a supported conversion category from the navigation.
          </p>
        </main>
        <Footer />
      </div>
    );
  }

  // Canonical path always uses the short form /:categoryId regardless of which alias route was used
  const canonicalPath = `/${category.id}`;
  const canonicalUrl = `${SITE_ORIGIN}${canonicalPath}`;
  const pageDescription = metaDescription(category.description);
  const methodology = getMethodology(category.id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${category.title} Converter`,
    applicationCategory: "UtilitiesApplication",
    description: category.description,
    url: canonicalUrl,
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_ORIGIN,
      },
      { "@type": "ListItem", position: 2, name: `${category.title} Converter` },
    ],
  };
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: category.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
        <meta
          name="description"
          content={pageDescription}
        />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={`${category.title} Converter`} />
        <meta property="og:description" content={category.description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={SOCIAL_IMAGE_URL} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Q Converter — Every measurement, made clear." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={`${category.title} Converter`} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={SOCIAL_IMAGE_URL} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumb)}</script>
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>

      <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
          <div className="mx-auto max-w-5xl">
            <header className="mb-7 sm:mb-10">
              <Link
                to="/"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 transition-colors hover:text-indigo-700"
              >
                <ArrowLeft aria-hidden="true" className="h-4 w-4" /> All
                conversions
              </Link>
              <div className="mt-6 flex flex-col gap-5 sm:mt-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-700" />{" "}
                    Measurement tool
                  </div>
                  <h1 className="text-4xl font-bold leading-tight tracking-[-0.035em] text-slate-950 sm:text-5xl">
                    {category.title} Converter
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    {category.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <CheckCircle2
                    aria-hidden="true"
                    className="h-4 w-4 text-teal-700"
                  />{" "}
                  Precise by design
                </div>
              </div>
            </header>

            <section
              className="overflow-hidden rounded-[1.5rem] border border-indigo-100 bg-white shadow-[0_16px_42px_rgba(15,23,42,0.08)]"
              aria-labelledby="converter-heading"
            >
              <div className="flex items-center justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/80 to-white px-5 py-4 sm:px-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white">
                    <Calculator aria-hidden="true" className="h-4 w-4" />
                  </span>
                  <div>
                    <h2
                      id="converter-heading"
                      className="text-sm font-semibold text-slate-950"
                    >
                      Convert {category.title.toLowerCase()}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Choose units and enter a value
                    </p>
                  </div>
                </div>
                <span className="hidden text-xs font-medium text-slate-600 sm:block">
                  Updates instantly
                </span>
              </div>
              <div className="p-5 sm:p-8">
                {category.id === "bmi" ? (
                  <BMICalculator title={category.title} />
                ) : (
                  <ConversionSection
                    title={category.title}
                    units={category.units}
                    categoryId={category.id}
                  />
                )}
              </div>
            </section>

            <div className="mt-5 grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <section
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-6"
                aria-labelledby="formula-heading"
              >
                <div className="flex items-center gap-2">
                  <Info
                    aria-hidden="true"
                    className="h-4 w-4 text-indigo-600"
                  />
                  <h2
                    id="formula-heading"
                    className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700"
                  >
                    Formula
                  </h2>
                </div>
                <p className="mt-4 rounded-xl bg-slate-50 p-4 font-mono text-xs leading-6 text-slate-700 sm:text-sm">
                  {category.formula}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500">
                  Calculations use the central unit catalog and preserve
                  precision until the result is formatted.
                </p>
              </section>
              {category.converter !== "calculator" && (
                <section
                  className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] sm:p-6"
                  aria-labelledby="examples-heading"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2
                      id="examples-heading"
                      className="text-sm font-semibold uppercase tracking-[0.12em] text-slate-700"
                    >
                      Common conversions
                    </h2>
                    <ArrowUpRight
                      aria-hidden="true"
                      className="h-4 w-4 text-slate-600"
                    />
                  </div>
                  <div className="mt-4 min-w-0 max-w-full overflow-x-auto">
                    <table className="w-full table-fixed text-left text-sm sm:min-w-[420px]">
                      <caption className="sr-only">
                        Example {category.title} conversions
                      </caption>
                      <thead>
                        <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-600">
                          <th scope="col" className="pb-3 pr-3 font-medium">
                            Input
                          </th>
                          <th scope="col" className="pb-3 pr-3 font-medium">
                            From
                          </th>
                          <th scope="col" className="pb-3 pr-3 font-medium">
                            To
                          </th>
                          <th scope="col" className="pb-3 font-medium">
                            Result
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {category.examples.map((example) => {
                          const from = category.units.find(
                            (unit) => unit.value === example.from,
                          );
                          const to = category.units.find(
                            (unit) => unit.value === example.to,
                          );
                          const result = convertExact(
                            example.input,
                            example.from,
                            example.to,
                            category.id,
                          );
                          return (
                            <tr
                              key={`${example.from}-${example.to}`}
                              className="border-b border-slate-100 last:border-0"
                            >
                              <td className="break-words py-3 pr-3 text-slate-700">
                                {example.input}
                              </td>
                              <td className="break-words py-3 pr-3 text-slate-500">
                                {from?.label}
                              </td>
                              <td className="break-words py-3 pr-3 text-slate-500">
                                {to?.label}
                              </td>
                              <td className="break-words py-3 font-semibold text-slate-950">
                                {result.toLocaleString()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </section>
              )}
            </div>

            <section
              className="mt-10 border-t border-slate-200 pt-8 sm:mt-14 sm:pt-10"
              aria-labelledby="faq-heading"
            >
              <h2
                id="faq-heading"
                className="text-2xl font-semibold tracking-tight text-slate-950"
              >
                Frequently asked questions
              </h2>
              <div className="mt-4 grid gap-3">
                {category.faq.map((item) => (
                  <details
                    key={item.question}
                    className="rounded-2xl border border-slate-200 bg-white px-5 py-4"
                  >
                    <summary className="cursor-pointer pr-5 font-medium text-slate-900">
                      {item.question}
                    </summary>
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {item.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>
            <MethodologySection categoryId={category.id} sources={methodology} />
            <div className="mt-8 sm:mt-10">
              <AdCard />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}

export { categories };
