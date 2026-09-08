import React from 'react';
import { Helmet } from 'react-helmet-async';
import Calculator from '@/components/Calculator';
import Footer from '@/components/Footer';
import MethodologySection from '@/components/MethodologySection';
import Navbar from '@/components/Navbar';
import { methodologySources } from '@/lib/methodology';

const title = 'Q Calculator Pro — Fast Online Calculator with Unit Conversion';

export default function CalculatorPage() {
  // Use methodology sources relevant to calculation
  const methodology = [
    methodologySources.bipm,
    methodologySources.nist,
  ];

  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="A fast, keyboard-friendly online calculator with calculation history and instant unit conversion. Works offline and saves your recent entries locally." />
        <link rel="canonical" href="https://qconverter.netlify.app/calculator" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebApplication",
            "name": "Q Calculator Pro",
            "applicationCategory": "UtilitiesApplication",
            "description": "A fast, keyboard-friendly online calculator with calculation history and instant unit conversion.",
            "url": "https://qconverter.netlify.app/calculator",
          })}
        </script>
      </Helmet>
      <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          <header className="mb-2 sm:mb-4">
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Q Calculator Pro</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
              Fast, keyboard-friendly calculations with history and instant unit conversion.
            </p>
          </header>
          <div className="mt-6">
            <Calculator />
          </div>
          <div className="mt-8 sm:mt-10">
            <MethodologySection categoryId="calculator" sources={methodology} />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}