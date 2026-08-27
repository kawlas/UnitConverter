import { Link } from "react-router-dom";
import { categories } from "@/lib/conversion-data";

const Footer = () => (
  <footer className="border-t border-slate-200 bg-white" aria-label="Footer">
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Q Converter</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">Explore conversions</h2>
        </div>
        <p className="max-w-sm text-sm text-slate-500 sm:text-right">
          Free, precise conversions for everyday measurements.
        </p>
      </div>

      <nav aria-label="Conversion categories" className="grid grid-cols-2 gap-x-4 gap-y-7 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-x-6">
        {categories.map((category) => (
          <div key={category.id}>
            <Link
              to={`/${category.id}`}
              className="inline-flex min-h-11 items-center rounded-md text-sm font-semibold text-slate-950 transition-colors hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {category.title} <span className="sr-only"> conversions</span>
            </Link>
            <ul className="mt-1 space-y-1" aria-label={`${category.title} units`}>
              {category.units.slice(0, 4).map((unit) => (
                <li key={unit.value} className="text-xs leading-5 text-slate-500">
                  {unit.label}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-9 flex flex-col gap-2 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p>Free unit converter with precise, shareable conversions.</p>
        <p>© {new Date().getFullYear()} Q Converter</p>
      </div>
    </div>
  </footer>
);

export default Footer;
