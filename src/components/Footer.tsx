import { Link } from "react-router-dom";
import { categories } from "@/lib/conversion-data";

const Footer = () => (
  <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
    <div className="max-w-7xl mx-auto py-12 px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
        {categories.map((category) => (
          <div key={category.id}>
            <Link to={`/${category.id}`} className="font-semibold mb-4 block hover:underline">{category.title} Conversions</Link>
            <ul className="space-y-2">
              {category.units.slice(0, 4).map((unit) => (
                <li key={unit.value} className="text-sm text-gray-600">{unit.label}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 pt-8 border-t">
        <p className="text-xs text-gray-500 text-center">Free unit converter with precise, shareable conversions.</p>
      </div>
    </div>
  </footer>
);

export default Footer;
