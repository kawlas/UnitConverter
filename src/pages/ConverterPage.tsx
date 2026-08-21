import { Helmet } from "react-helmet-async";
import { useLocation, useParams } from "react-router-dom";
import { categories, getCategory } from "@/lib/conversion-data";
import { convertExact } from "@/lib/conversions";
import ConversionSection from "@/components/ConversionSection";
import BMICalculator from "@/components/BMICalculator";
import AdCard from "@/components/AdCard";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";

export default function ConverterPage() {
  const { categoryId } = useParams();
  const location = useLocation();
  const category = getCategory(categoryId);

  if (!category) {
    return <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-3xl px-4 py-16"><h1 className="text-3xl font-bold">Category not found</h1><p className="mt-3 text-gray-600">Choose a supported conversion category from the navigation.</p></main><Footer /></div>;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: `${category.title} Converter`,
    applicationCategory: "UtilitiesApplication",
    description: category.description,
    url: `${window.location.origin}${location.pathname}`,
  };
  const breadcrumb = { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: window.location.origin }, { "@type": "ListItem", position: 2, name: `${category.title} Converter` }] };
  const faqSchema = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: category.faq.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };

  return (
    <>
      <Helmet>
        <title>{category.title} Converter — Free Online Q Converter</title>
        <meta name="description" content={`${category.description} Use this free ${category.title.toLowerCase()} converter with precision and shareable URLs.`} />
        <link rel="canonical" href={`${window.location.origin}${location.pathname}`} />
        <meta property="og:title" content={`${category.title} Converter`} /><meta property="og:description" content={category.description} /><meta property="og:url" content={`${window.location.origin}${location.pathname}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script><script type="application/ld+json">{JSON.stringify(breadcrumb)}</script><script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      </Helmet>
      <div className="min-h-screen bg-background"><Navbar /><main className="py-8 px-4"><div className="max-w-3xl mx-auto space-y-6">
        <header className="text-center space-y-4"><p className="text-sm text-gray-500">Home / {category.title}</p><h1 className="text-4xl font-bold">{category.title} Converter</h1><p className="text-lg text-gray-600">{category.description}</p></header>
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" aria-labelledby="converter-heading"><h2 id="converter-heading" className="sr-only">Interactive {category.title} converter</h2>{category.id === "bmi" ? <BMICalculator title={category.title} /> : <ConversionSection title={category.title} units={category.units} categoryId={category.id} />}</section>
        <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-3" aria-labelledby="formula-heading"><h2 id="formula-heading" className="text-xl font-semibold">Formula</h2><p className="font-mono text-sm bg-gray-50 rounded p-3">{category.formula}</p><p className="text-gray-600">Calculations use the central unit catalog and preserve precision until the result is formatted.</p></section>
        {category.converter !== "calculator" && <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6" aria-labelledby="examples-heading"><h2 id="examples-heading" className="mb-3 text-xl font-semibold">Common conversions</h2><div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="sr-only">Example {category.title} conversions</caption><thead><tr className="border-b"><th scope="col" className="p-2">Input</th><th scope="col" className="p-2">From</th><th scope="col" className="p-2">To</th><th scope="col" className="p-2">Result</th></tr></thead><tbody>{category.examples.map((example) => { const from = category.units.find((unit) => unit.value === example.from); const to = category.units.find((unit) => unit.value === example.to); const result = convertExact(example.input, example.from, example.to, category.id); return <tr key={`${example.from}-${example.to}`} className="border-b"><td className="p-2">{example.input}</td><td className="p-2">{from?.label}</td><td className="p-2">{to?.label}</td><td className="p-2 font-medium">{result.toLocaleString()}</td></tr>; })}</tbody></table></div></section>}
        <section className="space-y-3" aria-labelledby="faq-heading"><h2 id="faq-heading" className="text-xl font-semibold">Frequently asked questions</h2>{category.faq.map((item) => <details key={item.question} className="rounded-lg border bg-white p-4"><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-2 text-gray-600">{item.answer}</p></details>)}</section>
      </div><div className="max-w-3xl mx-auto mt-8"><AdCard /></div></main><Footer /></div>
    </>
  );
}

export { categories };
