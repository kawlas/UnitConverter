export const categories = [
  {
    id: "bmi",
    title: "BMI",
    units: [
      { value: "metric", label: "Metric (cm/kg)" },
      { value: "imperial", label: "Imperial (in/lbs)" },
    ],
  },
  {
    id: "power",
    title: "Power",
    units: [
      { value: "watts", label: "Watts" },
      { value: "kilowatts", label: "Kilowatts" },
      { value: "horsepower", label: "Horsepower" },
      { value: "btu_per_hour", label: "BTU/hour" },
    ],
  },
  {
    id: "energy",
    title: "Energy",
    units: [
      { value: "joules", label: "Joules" },
      { value: "kilowatt_hours", label: "Kilowatt Hours" },
      { value: "calories", label: "Calories" },
      { value: "btu", label: "BTU" },
    ],
  },
  {
    id: "speed",
    title: "Speed",
    units: [
      { value: "mph", label: "Miles per Hour" },
      { value: "kph", label: "Kilometers per Hour" },
      { value: "mps", label: "Meters per Second" },
      { value: "knots", label: "Knots" },
    ],
  },
  {
    id: "length",
    title: "Length",
    units: [
      { value: "meters", label: "Meters" },
      { value: "feet", label: "Feet" },
      { value: "inches", label: "Inches" },
      { value: "kilometers", label: "Kilometers" },
    ],
  },
  {
    id: "weight",
    title: "Weight",
    units: [
      { value: "kilograms", label: "Kilograms" },
      { value: "pounds", label: "Pounds" },
      { value: "ounces", label: "Ounces" },
      { value: "grams", label: "Grams" },
    ],
  },
  {
    id: "temperature",
    title: "Temperature",
    units: [
      { value: "celsius", label: "Celsius" },
      { value: "fahrenheit", label: "Fahrenheit" },
      { value: "kelvin", label: "Kelvin" },
    ],
  },
  {
    id: "volume",
    title: "Volume",
    units: [
      { value: "liters", label: "Liters" },
      { value: "gallons", label: "Gallons" },
      { value: "milliliters", label: "Milliliters" },
      { value: "cubic_meters", label: "Cubic Meters" },
    ],
  },
  {
    id: "area",
    title: "Area",
    units: [
      { value: "square_meters", label: "Square Meters" },
      { value: "square_feet", label: "Square Feet" },
      { value: "square_kilometers", label: "Square Kilometers" },
      { value: "acres", label: "Acres" },
    ],
  },
];

export const footerCategories = categories.map((category) => ({
  title: category.title,
  items: category.units.map((unit) => `${unit.label} Converter`),
}));
