import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/conversion-data";
import { Menu, X } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav aria-label="Primary" className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-semibold text-xl text-gray-900">
            Q Converter
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-4 overflow-x-auto scrollbar-hide">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/${category.id}`}
                aria-current={location.pathname === `/${category.id}` ? "page" : undefined}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
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
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden min-h-11 min-w-11 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
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
          id="mobile-navigation"
          aria-hidden={!isMenuOpen}
          className={cn(
            "md:hidden transition-all duration-200 ease-in-out overflow-x-hidden",
            isMenuOpen ? "max-h-[calc(100vh-4rem)] overflow-y-auto" : "max-h-0 overflow-y-hidden",
          )}
        >
          <div className="py-2 space-y-1">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/${category.id}`}
                onClick={() => setIsMenuOpen(false)}
                aria-current={location.pathname === `/${category.id}` ? "page" : undefined}
                tabIndex={isMenuOpen ? 0 : -1}
                className={cn(
                  "flex min-h-11 items-center px-3 py-2 rounded-md text-base font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
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
