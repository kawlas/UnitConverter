import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "./ui/input";
import { Search } from "lucide-react";
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

  return (
    <div className="relative w-full max-w-[600px] mx-auto" role="search">
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <Search aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
        <Input
          type="search"
          value={searchTerm}
          onChange={(event) => { setSearchTerm(event.target.value); onSearch?.(event.target.value); }}
          placeholder={placeholder}
          aria-label="Search conversion categories and units"
          aria-controls="conversion-search-results"
          className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>
      {results.length > 0 && (
        <ul id="conversion-search-results" className="absolute z-20 mt-1 w-full rounded-lg border bg-white p-2 shadow-lg" aria-label="Search results">
          {results.map((category) => (
            <li key={category.id}>
              <Link to={`/${category.id}`} onClick={() => setSearchTerm("")} className="block rounded px-3 py-2 hover:bg-gray-50">
                <span className="font-medium">{category.title}</span>
                <span className="ml-2 text-sm text-gray-500">{category.units.map((unit) => unit.symbol).join(", ")}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
