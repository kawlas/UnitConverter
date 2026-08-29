import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/conversion-data";
import { ChevronDown, Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const primaryCategoryIds = ["length", "weight", "temperature", "volume", "grams-to-cups"] as const;
const primaryCategories = primaryCategoryIds.flatMap((id) => {
  const category = categories.find((candidate) => candidate.id === id);
  return category ? [category] : [];
});

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setIsMenuOpen(false);
      menuButtonRef.current?.focus();
    };

    if (isMenuOpen) {
      document.addEventListener("keydown", closeOnEscape);
    }
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isMenuOpen]);

  const isActive = (categoryId: string) =>
    location.pathname === `/${categoryId}` || location.pathname.startsWith(`/${categoryId}/`);

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-[0_1px_0_rgba(15,23,42,0.02)] backdrop-blur"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex min-h-14 items-center justify-between gap-3 sm:min-h-16">
          <Link
            to="/"
            onClick={() => setIsMenuOpen(false)}
            className="group flex min-h-12 shrink-0 items-center gap-2 rounded-lg pr-1 text-slate-950 transition-colors duration-150 hover:text-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            aria-label="Q Converter home"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-xs font-bold tracking-tight text-white transition-colors duration-150 group-hover:bg-indigo-600">
              Q
            </span>
            <span className="text-[15px] font-bold tracking-[-0.02em] sm:text-base">Q Converter</span>
          </Link>

          <div className="hidden min-w-0 flex-1 justify-end lg:flex">
            <div className="flex items-center gap-0.5">
              {primaryCategories.map((category) => {
                const active = isActive(category.id);
                return (
                  <Link
                    key={category.id}
                    to={`/${category.id}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-12 shrink-0 items-center rounded-lg px-2.5 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 lg:px-3",
                      active
                        ? "bg-indigo-50 text-indigo-700"
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
            ref={menuButtonRef}
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            className="flex min-h-12 min-w-12 items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 md:min-w-0 md:px-3"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close all categories" : "Open all categories"}
          >
            {isMenuOpen ? <X aria-hidden="true" className="h-5 w-5 md:h-4 md:w-4" /> : <Menu aria-hidden="true" className="h-5 w-5 md:hidden" />}
            <span className="hidden md:inline">All categories</span>
            {!isMenuOpen && <ChevronDown aria-hidden="true" className="hidden h-4 w-4 md:block" />}
          </button>
        </div>

        <div
          id="mobile-navigation"
          aria-hidden={!isMenuOpen}
          className={cn(
            "overflow-hidden border-t border-slate-200 transition-[max-height,opacity] duration-150 ease-out",
            isMenuOpen ? "max-h-[calc(100vh-4rem)] opacity-100" : "max-h-0 border-transparent opacity-0",
          )}
        >
          <div className="max-h-[calc(100vh-4rem)] overflow-y-auto py-3 sm:py-4">
            <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              <span>All categories</span>
              <span>{categories.length} available</span>
            </div>
            <div className="grid gap-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
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
                      "flex min-h-12 items-center rounded-lg px-3 text-sm font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600",
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
