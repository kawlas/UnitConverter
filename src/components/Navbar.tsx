import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/conversion-data";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-semibold text-xl text-gray-900">
            Unit Converter
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/${category.id}`}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap",
                  location.pathname === `/${category.id}`
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                {category.title}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden transition-all duration-200 ease-in-out overflow-hidden",
            isMenuOpen ? "max-h-96" : "max-h-0",
          )}
        >
          <div className="py-2 space-y-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/${category.id}`}
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium transition-colors",
                  location.pathname === `/${category.id}`
                    ? "bg-gray-100 text-gray-900"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
                )}
              >
                {category.title}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
