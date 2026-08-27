import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "./ui/input";
import { Search, X } from "lucide-react";
import { categories } from "@/lib/conversion-data";

interface SearchBarProps {
  onSearch?: (searchTerm: string) => void;
  placeholder?: string;
}

const normalize = (value: string) => value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, placeholder = "Search categories or units..." }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const results = useMemo(() => {
    const query = normalize(searchTerm);
    if (!query) return [];
    return categories.filter((category) => normalize([category.title, category.id, ...category.units.flatMap((unit) => [unit.label, unit.symbol, ...unit.aliases])].join(" ")).includes(query));
  }, [searchTerm]);

  const updateSearch = (value: string) => {
    setSearchTerm(value);
    onSearch?.(value);
  };

  return (
    <div className="relative mx-auto w-full max-w-2xl" role="search">
      <div className="flex min-h-12 items-center rounded-xl border border-slate-200 bg-white shadow-[0_4px_16px_rgba(15,23,42,0.06)] transition-[border-color,box-shadow] hover:border-slate-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/40">
        <Search aria-hidden="true" className="ml-4 h-5 w-5 shrink-0 text-slate-600" />
        <Input
          type="search"
          value={searchTerm}
          onChange={(event) => updateSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape" && searchTerm) updateSearch("");
          }}
          placeholder={placeholder}
          autoComplete="off"
          aria-label="Search conversion categories and units"
          aria-controls={results.length > 0 ? "conversion-search-results" : undefined}
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

      {results.length > 0 && (
        <ul id="conversion-search-results" className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white p-2 shadow-xl" aria-label="Search results">
          {results.map((category) => (
            <li key={category.id}>
              <Link
                to={`/${category.id}`}
                onClick={() => updateSearch("")}
                className="flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-600"
              >
                <span className="font-medium text-slate-900">{category.title}</span>
                <span className="text-right text-xs text-slate-500">{category.units.map((unit) => unit.symbol).join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
