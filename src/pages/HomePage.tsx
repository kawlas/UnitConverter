import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import { categories } from "@/lib/conversion-data";

const faqItems = [
  { question: "Which conversions are supported?", answer: "Fourteen unit categories: length, weight, temperature, volume, area, pressure, power, energy, speed, digital data, time, angle, fuel economy and pace, plus a BMI calculator." },
  { question: "How do I share a conversion?", answer: "Every conversion is encoded in the URL. Use the Share button to open the share dialog or copy the link - anyone who opens it sees exactly the same conversion." },
  { question: "How accurate are the results?", answer: "Conversions use exact standard factors (for example 1 are = 100 m² and 1 hectare = 10,000 m²) with an adjustable precision of up to 12 decimal places." },
];

export default function HomePage() {
  return (
    <>
      <Helmet><title>Q Converter — Free Online Unit Converter</title><meta name="description" content="Convert length, area, pressure, digital data, time and more with a precise, shareable online unit converter." /><link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} /><meta property="og:type" content="website" /><meta property="og:title" content="Q Converter — Free Online Unit Converter" /><meta property="og:description" content="Convert length, area, pressure, digital data, time and more with a precise, shareable online unit converter." /><meta property="og:url" content={`${window.location.origin}${window.location.pathname}`} /><meta name="twitter:card" content="summary" /><script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) })}</script></Helmet>
      <div className="min-h-screen bg-background"><Navbar /><main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
        <header className="space-y-4 text-center"><h1 className="text-4xl font-bold">Free Online Unit Converter</h1><p className="text-lg text-gray-600">Convert measurements accurately, save favorites and share a conversion URL.</p><SearchBar /></header>
        <section aria-labelledby="categories-heading"><h2 id="categories-heading" className="mb-4 text-2xl font-semibold">Choose a conversion</h2><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{categories.map((category) => <Link key={category.id} to={`/${category.id}`} className="rounded-xl border bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><h3 className="font-semibold">{category.title}</h3><p className="mt-2 text-sm text-gray-600">{category.description}</p></Link>)}</div></section>
        <section aria-labelledby="faq-heading"><h2 id="faq-heading" className="mb-4 text-2xl font-semibold">Frequently asked questions</h2><div className="space-y-3">{faqItems.map((item) => <details key={item.question} className="rounded-xl border bg-white p-4 shadow-sm"><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-2 text-sm text-gray-600">{item.answer}</p></details>)}</div></section>
      </main><Footer /></div>
    </>
  );
}
