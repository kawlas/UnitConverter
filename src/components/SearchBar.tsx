import React, { useState } from "react";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

interface SearchBarProps {
  onSearch?: (searchTerm: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  onSearch = () => {},
  placeholder = "Search for conversion types...",
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  return (
    <div className="relative w-full max-w-[600px] mx-auto">
      <div className="relative bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 text-sm text-gray-900 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
