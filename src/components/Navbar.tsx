import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/conversion-data";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", closeOnEscape);
    }
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const isActive = (categoryId: string) => location.pathname === `/${categoryId}`;

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex min-h-16 items-center justify-between gap-4">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="group flex min-h-11 shrink-0 items-center gap-2 rounded-lg pr-2 text-slate-950 transition-colors hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Q Converter home"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold tracking-tight text-white transition-colors group-hover:bg-indigo-600">
              Q
            </span>
            <span className="text-base font-semibold tracking-tight sm:text-lg">Q Converter</span>
          </Link>

          {/* Keep every category available while reducing visual noise on wide screens. */}
          <div className="hidden min-w-0 flex-1 justify-end md:flex">
            <div className="flex max-w-full items-center gap-0.5 overflow-x-auto scrollbar-hide py-1">
              {categories.map((category) => {
                const active = isActive(category.id);
                return (
                  <Link
                    key={category.id}
                    to={`/${category.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 shrink-0 items-center rounded-lg px-2.5 text-[13px] font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 sm:px-3",
                      active
                        ? "bg-indigo-50 text-indigo-700 shadow-sm"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    {category.title}
                  </Link>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-slate-200 text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:hidden"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile menu remains scrollable so all categories are reachable on short screens. */}
        <div
          id="mobile-navigation"
          aria-hidden={!isMenuOpen}
          className={cn(
            "overflow-hidden border-t border-slate-200/80 transition-[max-height,opacity] duration-200 ease-out md:hidden",
            isMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto py-3">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              <span>Categories</span>
              <span>{categories.length} available</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2">
              {categories.map((category) => {
                const active = isActive(category.id);
                return (
                  <Link
                    key={category.id}
                    to={`/${category.id}`}
                    onClick={() => setIsMenuOpen(false)}
                    aria-current={active ? "page" : undefined}
                    tabIndex={isMenuOpen ? 0 : -1}
                    className={cn(
                      "flex min-h-11 items-center rounded-lg px-3 text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
                      active
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-950",
                    )}
                  >
                    {category.title}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
