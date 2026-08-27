import { useEffect } from "react";
import { ArrowRight, Check, Compass, Search, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SearchBar from "@/components/SearchBar";
import { categories } from "@/lib/conversion-data";

const HOME_TITLE = "Q Converter — Free Online Unit Converter";
const HOME_DESCRIPTION = "Convert length, area, pressure, digital data, time and more with a precise, shareable online unit converter.";

const faqItems = [
  { question: "Which conversions are supported?", answer: "Fourteen unit categories: length, weight, temperature, volume, area, pressure, power, energy, speed, digital data, time, angle, fuel economy and pace, plus a BMI calculator." },
  { question: "How do I share a conversion?", answer: "Every conversion is encoded in the URL. Use the Share button to open the share dialog or copy the link - anyone who opens it sees exactly the same conversion." },
  { question: "How accurate are the results?", answer: "Conversions use exact standard factors (for example 1 are = 100 m² and 1 hectare = 10,000 m²) with an adjustable precision of up to 12 decimal places." },
];

export default function HomePage() {
  useEffect(() => {
    // Helmet owns the metadata; this synchronous client fallback prevents an empty title
    // during the first hydrated route render.
    document.title = HOME_TITLE;
  }, []);

  return (
    <>
      <Helmet>
        <title>{HOME_TITLE}</title>
        <meta name="description" content={HOME_DESCRIPTION} />
        <link rel="canonical" href={`${window.location.origin}${window.location.pathname}`} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={HOME_TITLE} />
        <meta property="og:description" content={HOME_DESCRIPTION} />
        <meta property="og:url" content={`${window.location.origin}${window.location.pathname}`} />
        <meta name="twitter:card" content="summary" />
        <script type="application/ld+json">{JSON.stringify({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqItems.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) })}</script>
      </Helmet>

      <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
        <Navbar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-14">
          <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-slate-950 px-5 py-8 text-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] sm:px-10 sm:py-12 lg:px-14 lg:py-16" aria-labelledby="hero-heading">
            <div className="pointer-events-none absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 left-1/3 -z-10 h-72 w-72 rounded-full bg-teal-400/15 blur-3xl" />
            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.72fr)] lg:gap-16">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-100">
                  <Sparkles aria-hidden="true" className="h-3.5 w-3.5 text-teal-300" />
                  Measurement studio
                </div>
                <h1 id="hero-heading" className="max-w-3xl text-4xl font-semibold leading-[1.05] tracking-[-0.04em] sm:text-6xl lg:text-7xl">Make every measurement make sense.</h1>
                <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">Fast, precise conversions for the units you use every day. Save your favorites, share a result, and move on with confidence.</p>
                <div className="mt-8 max-w-2xl rounded-2xl bg-white p-1.5 text-slate-950 shadow-2xl shadow-black/20 sm:mt-10">
                  <SearchBar placeholder="Search a category or unit" />
                </div>
                <p className="mt-3 flex items-center gap-2 text-xs text-slate-400"><Search aria-hidden="true" className="h-3.5 w-3.5" /> Try “miles”, “kg”, or “temperature”</p>
              </div>
              <div className="hidden lg:block">
                <div className="border-l border-white/40 pl-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Built for clarity</p>
                  <ul className="mt-5 space-y-4 text-sm text-slate-200">
                    {["Exact standard conversion factors", "Shareable URLs that remember your inputs", "A calm interface on every screen"].map((item) => (
                      <li key={item} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal-400/15 text-teal-300"><Check aria-hidden="true" className="h-3 w-3" /></span>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-14 sm:mt-20" aria-labelledby="categories-heading">
            <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Start here</p>
                <h2 id="categories-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Pick a conversion</h2>
                <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">A focused toolkit for real-world measurements, from body metrics to digital data.</p>
              </div>
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-500"><Compass aria-hidden="true" className="h-3.5 w-3.5 text-indigo-600" /> {categories.length} tools available</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {categories.map((category, index) => (
                <Link key={category.id} to={`/${category.id}`} className="group flex min-h-36 flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition duration-200 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_14px_30px_rgba(15,23,42,0.09)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  <div className="flex items-start justify-between gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-600 transition-colors group-hover:bg-indigo-50 group-hover:text-indigo-600">{String(index + 1).padStart(2, "0")}</span><ArrowRight aria-hidden="true" className="h-4 w-4 text-slate-500 transition group-hover:translate-x-1 group-hover:text-indigo-600" /></div>
                  <div className="mt-6"><h3 className="font-semibold tracking-tight text-slate-950">{category.title}</h3><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">{category.description}</p><p className="mt-3 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-600">{category.units.slice(0, 4).map((unit) => unit.symbol).join(" · ")}</p></div>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-14 grid gap-8 border-t border-slate-200 pt-10 sm:mt-20 sm:pt-14 lg:grid-cols-[0.7fr_1.3fr]" aria-labelledby="faq-heading">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Good to know</p><h2 id="faq-heading" className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Frequently asked questions</h2><p className="mt-3 max-w-sm text-sm leading-6 text-slate-600">Everything you need to get a reliable answer quickly.</p></div>
            <div className="space-y-3">{faqItems.map((item) => <details key={item.question} className="group rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)]"><summary className="cursor-pointer list-none pr-6 font-medium text-slate-900 marker:hidden group-open:text-indigo-700">{item.question}</summary><p className="mt-3 text-sm leading-6 text-slate-500">{item.answer}</p></details>)}</div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
}
