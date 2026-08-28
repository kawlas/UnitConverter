export interface PairPageDefinition {
  readonly id: string;
  readonly categoryId: string;
  readonly fromUnit: string;
  readonly toUnit: string;
  readonly title: string;
  readonly description: string;
  readonly intro: string;
  readonly formula: string;
  readonly examples: readonly number[];
}

export const pairPages: readonly PairPageDefinition[] = [
  {
    id: "millimeters-to-inches",
    categoryId: "length",
    fromUnit: "millimeters",
    toUnit: "inches",
    title: "Millimeters to Inches Converter",
    description: "Convert millimeters to inches instantly using the exact inch definition, with a live calculator and practical reference values.",
    intro: "Use this millimeter-to-inch converter for fastener sizes, manufacturing tolerances, tools, product dimensions and technical drawings.",
    formula: "inches = millimeters ÷ 25.4",
    examples: [1, 2, 5, 10, 25.4, 100],
  },
  {
    id: "inches-to-centimeters",
    categoryId: "length",
    fromUnit: "inches",
    toUnit: "centimeters",
    title: "Inches to Centimeters Converter",
    description: "Convert inches to centimeters instantly with the exact 2.54 cm per inch definition, worked examples and a live calculator.",
    intro: "Use this inch-to-centimeter converter for screen sizes, furniture, clothing measurements, product dimensions and everyday length checks.",
    formula: "centimeters = inches × 2.54",
    examples: [1, 2, 5, 10, 12, 20],
  },
  {
    id: "inches-to-feet",
    categoryId: "length",
    fromUnit: "inches",
    toUnit: "feet",
    title: "Inches to Feet Converter",
    description: "Convert inches to feet instantly using the exact 12 inches per foot relationship, with practical examples and a live calculator.",
    intro: "Use this inch-to-foot converter for height, room dimensions, construction measurements and specifications written in US customary units.",
    formula: "feet = inches ÷ 12",
    examples: [1, 6, 12, 24, 36, 72],
  },
  {
    id: "milliliters-to-us-fluid-ounces",
    categoryId: "volume",
    fromUnit: "milliliters",
    toUnit: "us_fluid_ounces",
    title: "Milliliters to US Fluid Ounces Converter",
    description: "Convert milliliters to US fluid ounces instantly with the US liquid measure clearly identified and a live calculator.",
    intro: "Use this milliliter-to-fluid-ounce converter for drinks, recipes, toiletries and product labels. The result uses US fluid ounces, not Imperial fluid ounces.",
    formula: "US fluid ounces = milliliters ÷ 29.5735295625",
    examples: [1, 30, 50, 100, 250, 500],
  },
  {
    id: "meters-to-feet",
    categoryId: "length",
    fromUnit: "meters",
    toUnit: "feet",
    title: "Meters to Feet Converter",
    description: "Convert meters to feet with a live calculator, worked examples, all-unit comparisons and sourced measurement methodology.",
    intro: "Use this meter-to-foot reference for room dimensions, personal height, elevation and specifications that cross between metric and imperial units.",
    formula: "feet = meters ÷ 0.3048",
    examples: [1, 2, 3, 5, 10, 100],
  },
  {
    id: "kilometers-to-miles",
    categoryId: "length",
    fromUnit: "kilometers",
    toUnit: "miles",
    title: "Kilometers to Miles Converter",
    description: "Convert kilometers to miles with precise results, travel-distance examples, all-unit comparisons and transparent sources.",
    intro: "Use this kilometer-to-mile reference when comparing road distances, route lengths and race distances reported in different measurement systems.",
    formula: "miles = kilometers ÷ 1.609344",
    examples: [1, 5, 10, 42.195, 50, 100],
  },
  {
    id: "centimeters-to-inches",
    categoryId: "length",
    fromUnit: "centimeters",
    toUnit: "inches",
    title: "Centimeters to Inches Converter",
    description: "Convert centimeters to inches with exact unit definitions, practical examples and a complete length-unit comparison.",
    intro: "Use this centimeter-to-inch reference for furniture, product dimensions, craft measurements and other small-scale metric-to-imperial checks.",
    formula: "inches = centimeters ÷ 2.54",
    examples: [1, 2.54, 5, 10, 30, 100],
  },
  {
    id: "kilograms-to-pounds",
    categoryId: "weight",
    fromUnit: "kilograms",
    toUnit: "pounds",
    title: "Kilograms to Pounds Converter",
    description: "Convert kilograms to pounds using the exact international pound definition, with examples and all supported mass units.",
    intro: "Use this kilogram-to-pound reference for luggage limits, body weight, equipment and product specifications expressed in different systems.",
    formula: "pounds = kilograms ÷ 0.45359237",
    examples: [1, 5, 10, 25, 50, 100],
  },
  {
    id: "pounds-to-kilograms",
    categoryId: "weight",
    fromUnit: "pounds",
    toUnit: "kilograms",
    title: "Pounds to Kilograms Converter",
    description: "Convert pounds to kilograms using the exact international pound definition, with worked examples and transparent sources.",
    intro: "Use this pound-to-kilogram reference when translating body weight, luggage, gym equipment or packaged goods into metric mass units.",
    formula: "kilograms = pounds × 0.45359237",
    examples: [1, 5, 10, 25, 100, 200],
  },
  {
    id: "celsius-to-fahrenheit",
    categoryId: "temperature",
    fromUnit: "celsius",
    toUnit: "fahrenheit",
    title: "Celsius to Fahrenheit Converter",
    description: "Convert Celsius to Fahrenheit with the affine temperature formula, common reference points and sourced scale definitions.",
    intro: "Use this Celsius-to-Fahrenheit reference to compare weather, cooking and everyday temperatures across the two widely encountered scales.",
    formula: "°F = (°C × 9/5) + 32",
    examples: [-40, 0, 20, 37, 100],
  },
  {
    id: "fahrenheit-to-celsius",
    categoryId: "temperature",
    fromUnit: "fahrenheit",
    toUnit: "celsius",
    title: "Fahrenheit to Celsius Converter",
    description: "Convert Fahrenheit to Celsius with the affine temperature formula, common reference points and sourced scale definitions.",
    intro: "Use this Fahrenheit-to-Celsius reference when interpreting weather, cooking and everyday temperatures reported on the other scale.",
    formula: "°C = (°F − 32) × 5/9",
    examples: [-40, 32, 68, 98.6, 212],
  },
  {
    id: "liters-to-gallons",
    categoryId: "volume",
    fromUnit: "liters",
    toUnit: "gallons",
    title: "Liters to US Gallons Converter",
    description: "Convert liters to US liquid gallons with the gallon variant clearly identified, practical examples and sourced factors.",
    intro: "Use this liter-to-US-gallon reference for liquid capacity and volume checks where the gallon variant must be explicit to avoid ambiguity.",
    formula: "US gallons = liters ÷ 3.785411784",
    examples: [1, 3.785411784, 5, 10, 50, 100],
  },
] as const;

export const pairPagePath = ({ categoryId, id }: Pick<PairPageDefinition, "categoryId" | "id">): string =>
  `/${categoryId}/${id}`;

export const getPairPage = (
  categoryId: string | undefined,
  pairId: string | undefined,
): PairPageDefinition | undefined =>
  pairPages.find((pair) => pair.categoryId === categoryId && pair.id === pairId);

export const getCategoryPairPages = (categoryId: string): readonly PairPageDefinition[] =>
  pairPages.filter((pair) => pair.categoryId === categoryId);
