import { Helmet } from 'react-helmet-async';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Calculator from '@/components/Calculator';

const title = 'Q Calculator — Fast Online Calculator with History';

export default function CalculatorPage() {
  return (
    <>
      <Helmet>
        <title>{title}</title>
        <meta name="description" content="A fast, keyboard-friendly online calculator with calculation history and instant results." />
        <link rel="canonical" href="https://qconverter.netlify.app/calculator" />
      </Helmet>
      <div className="min-h-screen bg-[var(--canvas)] text-[var(--ink)]">
        <Navbar />
        <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Calculator</h1>
          <p className="mt-2 max-w-xl text-sm text-slate-600 sm:text-base">
            Fast, keyboard-friendly calculations with history. Works offline and saves your recent entries locally.
          </p>
          <div className="mt-6">
            <Calculator />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
