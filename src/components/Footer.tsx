import { cn } from "@/lib/utils";

const categories = [
  {
    title: "Power",
    items: [
      "Watts to Horsepower",
      "Kilowatts to Horsepower",
      "Watts to Kilowatts",
      "BTU per Hour to Watts",
    ],
  },
  {
    title: "Energy",
    items: [
      "Joules to Kilowatt Hours",
      "Calories to Joules",
      "BTU to Joules",
      "Kilowatt Hours to BTU",
    ],
  },
  {
    title: "Speed",
    items: [
      "Miles per Hour to Kilometers per Hour",
      "Meters per Second to Miles per Hour",
      "Knots to Miles per Hour",
      "Kilometers per Hour to Meters per Second",
    ],
  },
  {
    title: "Length",
    items: [
      "Meters to Feet",
      "Inches to Centimeters",
      "Kilometers to Miles",
      "Yards to Meters",
    ],
  },
  {
    title: "Weight",
    items: [
      "Kilograms to Pounds",
      "Ounces to Grams",
      "Pounds to Kilograms",
      "Grams to Ounces",
    ],
  },
  {
    title: "Temperature",
    items: [
      "Celsius to Fahrenheit",
      "Fahrenheit to Celsius",
      "Kelvin to Celsius",
      "Celsius to Kelvin",
    ],
  },
  {
    title: "Volume",
    items: [
      "Liters to Gallons",
      "Milliliters to Ounces",
      "Cubic Meters to Cubic Feet",
      "Gallons to Liters",
    ],
  },
  {
    title: "Area",
    items: [
      "Square Meters to Square Feet",
      "Acres to Hectares",
      "Square Kilometers to Square Miles",
      "Square Feet to Square Meters",
    ],
  },
];

const Footer = () => {
  return (
    <footer className="bg-gradient-to-b from-white to-gray-50 border-t border-gray-100">
      <div className="max-w-7xl mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {categories.map((category) => (
            <div key={category.title}>
              <h3 className="font-semibold mb-4">
                {category.title} Conversions
              </h3>
              <ul className="space-y-2">
                {category.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t">
          <p className="text-xs text-gray-300 text-center">
            Keywords: unit converter, measurement converter, metric to imperial,
            imperial to metric,
            {categories
              .map((cat) => cat.items)
              .flat()
              .join(", ")}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
