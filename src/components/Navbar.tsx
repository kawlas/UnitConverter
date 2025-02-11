import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { categories } from "@/lib/conversion-data";

export default function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="font-semibold text-xl text-gray-900">
            Unit Converter
          </Link>

          <div className="hidden md:flex space-x-4 overflow-x-auto">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/${category.id}`}
                className={cn(
                  "px-3 py-2 rounded-md text-sm font-medium transition-colors",
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
