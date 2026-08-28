import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "./ui/input";
import { Search, X } from "lucide-react";
import { categories } from "@/lib/conversion-data";

interface SearchBarProps {
  onSearch?: (searchTerm: string) => void;
  placeholder?: string;
}

const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const SEARCH_RESULTS_ID = "conversion-search-results";

const searchOptionId = (categoryId: string): string => `conversion-search-option-${categoryId}`;

const getNextSearchResultIndex = (currentIndex: number, direction: 1 | -1, resultCount: number): number => {
  if (resultCount === 0) return -1;
  if (currentIndex < 0) return direction === 1 ? 0 : resultCount - 1;
  return (currentIndex + direction + resultCount) % resultCount;
};

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search categories or units..." }) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const results = useMemo(() => {
    const query = normalize(searchTerm);
    if (!query) return [];
    return categories.filter((category) => normalize([category.title, category.id, ...category.units.flatMap((unit) => [unit.label, unit.symbol, ...unit.aliases])].join(" ")).includes(query));
  }, [searchTerm]);

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    setIsOpen(normalize(value).length > 0);
    setActiveIndex(-1);
    onSearch?.(value);
  };

  const closeResults = () => {
    setIsOpen(false);
    setActiveIndex(-1);
  };

  const chooseResult = (categoryId: string) => {
    updateSearch("");
    navigate(`/${categoryId}`);
  };

  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);

  const resultsOpen = isOpen && results.length > 0;
  const activeResult = resultsOpen && activeIndex >= 0 ? results[activeIndex] : undefined;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto w-full max-w-2xl"
      role="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) closeResults();
      }}
    >
      <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/40">
        <Search aria-hidden="true" className="ml-4 h-5 w-5 shrink-0 text-slate-600" />
        <Input
          type="search"
          value={searchTerm}
          onChange={(event) => updateSearch(event.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={(event) => {
            if ((event.key === "ArrowDown" || event.key === "ArrowUp") && results.length > 0) {
              event.preventDefault();
              setIsOpen(true);
              setActiveIndex((current) => getNextSearchResultIndex(current, event.key === "ArrowDown" ? 1 : -1, results.length));
              return;
            }
            if (event.key === "Enter" && activeResult) {
              event.preventDefault();
              chooseResult(activeResult.id);
              return;
            }
            if (event.key === "Escape") {
              if (resultsOpen) closeResults();
              else if (searchTerm) updateSearch("");
            }
          }}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Search conversion categories and units"
          role="combobox"
          aria-expanded={resultsOpen}
          aria-controls={resultsOpen ? SEARCH_RESULTS_ID : undefined}
          aria-activedescendant={activeResult ? searchOptionId(activeResult.id) : undefined}
          aria-autocomplete="list"
          className="min-h-12 flex-1 border-0 bg-transparent px-3 py-3 text-sm text-slate-950 shadow-none outline-none ring-0 placeholder:text-slate-600 focus-visible:outline-none focus-visible:ring-0"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => updateSearch("")}
            className="mr-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600"
            aria-label="Clear search"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
        )}
      </div>

      {resultsOpen && (
        <div id={SEARCH_RESULTS_ID} role="listbox" className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl" aria-label="Search results">
          {results.map((category, index) => (
            <Link
              id={searchOptionId(category.id)}
              key={category.id}
              to={`/${category.id}`}
              role="option"
              tabIndex={-1}
              aria-selected={activeIndex === index}
              onClick={closeResults}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50 ${activeIndex === index ? "bg-indigo-50 text-indigo-700" : ""}`}
            >
              <span className="font-medium text-slate-900">{category.title}</span>
              <span className="text-right text-xs text-slate-500">{category.units.map((unit) => unit.symbol).join(", ")}</span>
            </Link>
          ))}
        </div>
      )}
      {isOpen && searchTerm.trim() && results.length === 0 && (
        <p className="sr-only" role="status">No conversion categories found.</p>
      )}
    </div>
  );
};

export default SearchBar;
export { getNextSearchResultIndex, searchOptionId };
