export type ConverterKind = "linear" | "affine" | "custom" | "calculator";

export interface UnitDefinition {
  readonly value: string;
  readonly label: string;
  readonly symbol: string;
  readonly aliases: readonly string[];
  readonly kind: "linear" | "affine";
  readonly toBaseFactor?: number;
  readonly toBase?: (value: number) => number;
  readonly fromBase?: (value: number) => number;
}

export interface CategoryDefinition {
  readonly id: string;
  readonly title: string;
  readonly converter: ConverterKind;
  readonly units: readonly UnitDefinition[];
  readonly description: string;
  readonly formula: string;
  readonly faq: readonly { question: string; answer: string }[];
  readonly examples: readonly { input: number; from: string; to: string }[];
  readonly convert?: (value: number, from: string, to: string) => number;
  readonly validateInput?: (value: number, from: string, to: string) => string | undefined;
}

const linear = (
  value: string,
  label: string,
  symbol: string,
  toBaseFactor: number,
  aliases: readonly string[] = [],
): UnitDefinition => ({
  value,
  label,
  symbol,
  aliases,
  kind: "linear",
  toBaseFactor,
});

const affine = (
  value: string,
  label: string,
  symbol: string,
  toBase: (value: number) => number,
  fromBase: (value: number) => number,
  aliases: readonly string[] = [],
): UnitDefinition => ({
  value,
  label,
  symbol,
  aliases,
  kind: "affine",
  toBase,
  fromBase,
});

// NIST SP 811 Appendix B.9 derives US liquid measures from the exact
// international inch and the US gallon (231 cubic inches).
const US_LIQUID_GALLON_LITERS = 3.785411784;
const INTERNATIONAL_POUND_KILOGRAMS = 0.45359237;

const metadata = (
  description: string,
  formula: string,
  examples: CategoryDefinition["examples"],
  faq: CategoryDefinition["faq"] = [
    {
      question: "How accurate is this converter?",
      answer: "Results use the referenced conversion factors shown on this page and are rounded only for display.",
    },
    {
      question: "Can I share a conversion?",
      answer: "Yes. The current category, units, value, precision and locale are stored in the URL.",
    },
  ],
) => ({ description, formula, examples, faq });

const factFaq = (question: string, answer: string): CategoryDefinition["faq"] => [
  {
    question,
    answer,
  },
  {
    question: "Are the results rounded?",
    answer: "The calculation retains full JavaScript number precision; the precision control only formats the displayed result.",
  },
];

const definitions: CategoryDefinition[] = [
  {
    id: "bmi", title: "BMI", converter: "calculator",
    units: [linear("metric", "Metric (cm/kg)", "metric", 1), linear("imperial", "Imperial (in/lbs)", "imperial", 1)],
    ...metadata(
      "Adult Body Mass Index screening calculator using height and weight.",
      "BMI = weight (kg) / height (m)²",
      [{ input: 70, from: "metric", to: "metric" }],
      [
        {
          question: "What does adult BMI measure?",
          answer: "BMI is a calculated screening measure that relates an adult's weight to their height. It is one health indicator and does not directly measure body fat.",
        },
        {
          question: "Who is this BMI calculator for?",
          answer: "This calculator uses adult categories for people age 20 or older. Children and teens require age- and sex-specific BMI percentiles.",
        },
        {
          question: "Is a BMI result a medical diagnosis?",
          answer: "No. BMI is a screening measure, not a diagnosis, and should be considered alongside other individual health factors with a qualified professional.",
        },
      ],
    ),
  },
  {
    id: "power", title: "Power", converter: "linear",
    units: [linear("watts", "Watts", "W", 1, ["w"]), linear("kilowatts", "Kilowatts", "kW", 1000, ["kw"]), linear("horsepower", "Horsepower (mechanical)", "hp", 745.6998715822702, ["horse power", "mechanical horsepower"]), linear("metric_horsepower", "Horsepower (metric)", "PS", 735.49875, ["metric hp"]), linear("btu_per_hour", "BTU/hour (International Table)", "BTU/h", 1055.05585262 / 3600, ["btu/h"])],
    ...metadata("Power is the rate at which energy is transferred.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilowatts", to: "watts" }], factFaq(
      "Are mechanical and metric horsepower the same?",
      "No. One mechanical horsepower is 745.6998715822702 watts, while one metric horsepower (PS) is 735.49875 watts, so the variant must be named.",
    )),
  },
  {
    id: "energy", title: "Energy", converter: "linear",
    units: [linear("joules", "Joules", "J", 1), linear("kilowatt_hours", "Kilowatt Hours", "kWh", 3_600_000, ["kwh"]), linear("kilojoules", "Kilojoules", "kJ", 1000, ["kj"]), linear("calories", "Calorie (thermochemical)", "cal", 4.184, ["small calorie"]), linear("kilocalories", "Kilocalorie (food Calorie)", "kcal", 4184, ["food calorie", "calorie"]), linear("btu", "BTU (International Table)", "BTU", 1055.05585262, ["btu it"])],
    ...metadata("Energy measures the capacity to perform work.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilowatt_hours", to: "joules" }], factFaq(
      "What is the difference between a calorie and a food Calorie?",
      "One thermochemical calorie equals 4.184 joules. One food Calorie is a kilocalorie: 1,000 thermochemical calories, or 4,184 joules.",
    )),
  },
  {
    id: "speed", title: "Speed", converter: "linear",
    units: [linear("mph", "Miles per Hour", "mph", 0.44704, ["mi/h"]), linear("kph", "Kilometers per Hour", "km/h", 1000 / 3600, ["kmh", "km/h"]), linear("mps", "Meters per Second", "m/s", 1, ["m/s"]), linear("knots", "Knots", "kn", 1852 / 3600, ["kt"])],
    ...metadata("Speed measures distance travelled per unit of time.", "value in target = value × source factor / target factor", [{ input: 100, from: "kph", to: "mph" }], factFaq(
      "What does one knot mean?",
      "One knot is one nautical mile per hour. Because one international nautical mile is exactly 1,852 meters, one knot equals exactly 1.852 km/h.",
    )),
  },
  {
    id: "length", title: "Length", converter: "linear",
    units: [linear("meters", "Meters", "m", 1, ["metres"]), linear("feet", "Feet", "ft", 0.3048), linear("centimeters", "Centimeters", "cm", 0.01, ["centimetres"]), linear("millimeters", "Millimeters", "mm", 0.001, ["millimetres"]), linear("inches", "Inches", "in", 0.0254), linear("yards", "Yards", "yd", 0.9144), linear("kilometers", "Kilometers", "km", 1000, ["kilometres"]), linear("miles", "Miles", "mi", 1609.344), linear("nautical_miles", "Nautical Miles", "nmi", 1852, ["nautical mile"])],
    ...metadata("Length measures distance or dimension.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilometers", to: "miles" }], factFaq(
      "How long are an inch and a foot exactly?",
      "The international inch is exactly 25.4 millimeters. One foot is exactly 12 inches, so it equals exactly 0.3048 meters.",
    )),
  },
  {
    id: "weight", title: "Weight", converter: "linear",
    units: [linear("kilograms", "Kilograms", "kg", 1, ["kilogram", "kilogramy", "kilogramów"]), linear("pounds", "Pounds", "lb", INTERNATIONAL_POUND_KILOGRAMS, ["lbs", "funt", "funty", "funtów"]), linear("grams", "Grams", "g", 0.001, ["gram", "gramy", "gramów"]), linear("metric_tonnes", "Metric Tonnes", "t", 1000, ["tonnes", "metric ton", "tona", "tony", "ton"]), linear("ounces", "Ounces", "oz", 0.028349523125), linear("stone", "Stone (14 lb)", "st", 14 * INTERNATIONAL_POUND_KILOGRAMS, ["stones"])],
    ...metadata("Weight is commonly expressed with mass units in everyday conversions, including the 14-pound British stone.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilograms", to: "pounds" }], [
      { question: "How many pounds are in one stone?", answer: "One British stone equals 14 avoirdupois pounds exactly." },
      { question: "Are the results rounded?", answer: "The calculation retains full JavaScript number precision; the precision control only formats the displayed result." },
    ]),
  },
  {
    id: "temperature", title: "Temperature", converter: "affine",
    units: [affine("celsius", "Celsius", "°C", (v) => v + 273.15, (v) => v - 273.15), affine("fahrenheit", "Fahrenheit", "°F", (v) => (v - 32) * 5 / 9 + 273.15, (v) => (v - 273.15) * 9 / 5 + 32), affine("kelvin", "Kelvin", "K", (v) => v, (v) => v), affine("rankine", "Rankine", "°R", (v) => v * 5 / 9, (v) => v * 9 / 5)],
    validateInput: (value, from) => {
      const minimumByUnit: Record<string, number> = { celsius: -273.15, fahrenheit: -459.67, kelvin: 0, rankine: 0 };
      return value < minimumByUnit[from] ? "Temperature cannot be below absolute zero." : undefined;
    },
    ...metadata("Temperature scales describe how hot or cold something is.", "C → K: C + 273.15; F → K: (F − 32) × 5/9 + 273.15; R → K: R × 5/9", [{ input: 0, from: "celsius", to: "fahrenheit" }], factFaq(
      "What is absolute zero on each supported scale?",
      "Absolute zero is 0 K, 0 °R, −273.15 °C or −459.67 °F. The converter rejects any input below the corresponding limit.",
    )),
  },
  {
    id: "volume", title: "Volume", converter: "linear",
    units: [
      linear("liters", "Liters", "L", 1, ["litres"]),
      linear("gallons", "US Gallons", "gal", US_LIQUID_GALLON_LITERS, ["us gallon", "us gallons"]),
      linear("milliliters", "Milliliters", "mL", 0.001, ["ml"]),
      linear("us_cups", "US Cups", "cup", US_LIQUID_GALLON_LITERS / 16, ["cup", "cups", "us cup", "us cups"]),
      linear("us_fluid_ounces", "US Fluid Ounces", "fl oz", US_LIQUID_GALLON_LITERS / 128, ["fluid ounce", "fluid ounces", "us fluid ounce", "us fluid ounces", "floz"]),
      linear("us_tablespoons", "US Tablespoons", "tbsp", US_LIQUID_GALLON_LITERS / 256, ["tablespoon", "tablespoons", "us tablespoon", "us tablespoons"]),
      linear("us_teaspoons", "US Teaspoons", "tsp", US_LIQUID_GALLON_LITERS / 768, ["teaspoon", "teaspoons", "us teaspoon", "us teaspoons"]),
      linear("us_liquid_pints", "US Liquid Pints", "pt", US_LIQUID_GALLON_LITERS / 8, ["pint", "pints", "us pint", "us pints", "liquid pint", "liquid pints"]),
      linear("us_liquid_quarts", "US Liquid Quarts", "qt", US_LIQUID_GALLON_LITERS / 4, ["quart", "quarts", "us quart", "us quarts", "liquid quart", "liquid quarts"]),
      linear("cubic_meters", "Cubic Meters", "m³", 1000, ["m3"]),
    ],
    ...metadata("Convert volume across metric units and explicitly labelled US liquid cups, fluid ounces, tablespoons, teaspoons, pints, quarts and gallons.", "value in target = value × source factor / target factor", [{ input: 1, from: "gallons", to: "liters" }, { input: 1.5, from: "us_cups", to: "milliliters" }], [
      { question: "Which cup, pint and quart variants are used?", answer: "The labels identify US customary liquid measures. Imperial and US dry pints or quarts are different units and are not silently substituted." },
      { question: "Can I enter cooking fractions?", answer: "Yes. Enter values such as 1/2, 1 1/2 or ½ and choose an explicitly labelled US cooking measure." },
    ]),
  },
  {
    id: "area", title: "Area", converter: "linear",
    units: [linear("square_meters", "Square Meters", "m²", 1, ["m2", "m^2", "metr kwadratowy", "metry kwadratowe", "metrów kwadratowych"]), linear("are", "Are", "a", 100, ["ar", "ares", "ary", "arów"]), linear("hectare", "Hectare", "ha", 10_000, ["hectares", "hektar", "hektary", "hektarów"]), linear("square_feet", "Square Feet", "ft²", 0.09290304, ["ft2", "sq ft"]), linear("square_kilometers", "Square Kilometers", "km²", 1_000_000, ["km2", "kilometry kwadratowe", "kilometrów kwadratowych"]), linear("acres", "Acres", "ac", 4046.8564224, ["acre"])],
    ...metadata("Area measures two-dimensional space. One are is exactly 100 square metres and one hectare is 100 ares.", "value in target = value × source factor / target factor", [{ input: 1, from: "are", to: "square_meters" }, { input: 1, from: "hectare", to: "are" }], [
      { question: "How many square metres are in one are?", answer: "1 are (ar) = 100 m² exactly." },
      { question: "How many ares are in one hectare?", answer: "1 hectare (ha) = 100 ares = 10,000 m² exactly." },
    ]),
  },
  {
    id: "pressure", title: "Pressure", converter: "linear",
    units: [linear("pascals", "Pascals", "Pa", 1, ["pa"]), linear("kilopascals", "Kilopascals", "kPa", 1000, ["kpa"]), linear("bar", "Bar", "bar", 100000), linear("psi", "Pounds per Square Inch", "psi", 6894.757293168), linear("atmospheres", "Atmospheres", "atm", 101325, ["atm"])],
    ...metadata("Pressure is force distributed over an area.", "value in target = value × source factor / target factor", [{ input: 1, from: "atmospheres", to: "pascals" }], factFaq(
      "How are bar and standard atmosphere defined in pascals?",
      "One bar equals exactly 100,000 pascals. One standard atmosphere equals exactly 101,325 pascals, so the two units are close but not equal.",
    )),
  },
  {
    id: "digital", title: "Digital Data", converter: "linear",
    units: [linear("bits", "Bits", "bit", 1), linear("bytes", "Bytes", "B", 8), linear("kilobits", "Kilobits", "kb", 1000), linear("kilobytes", "Kilobytes", "kB", 8000), linear("megabytes", "Megabytes", "MB", 8_000_000), linear("gigabytes", "Gigabytes", "GB", 8_000_000_000), linear("kibibytes", "Kibibytes", "KiB", 8 * 1024, ["kib"]), linear("mebibytes", "Mebibytes", "MiB", 8 * 1024 ** 2, ["mib"]), linear("gibibytes", "Gibibytes", "GiB", 8 * 1024 ** 3, ["gib"]), linear("tebibytes", "Tebibytes", "TiB", 8 * 1024 ** 4, ["tib"])],
    ...metadata("Digital data uses decimal SI units and clearly labelled binary units where applicable.", "value in target = value × source factor / target factor", [{ input: 1, from: "megabytes", to: "bytes" }], factFaq(
      "What is the difference between kB and KiB?",
      "A kilobyte (kB) is 1,000 bytes, while a kibibyte (KiB) is 1,024 bytes. Symbols are case-sensitive: lowercase b means bits and uppercase B means bytes.",
    )),
  },
  {
    id: "time", title: "Time", converter: "linear",
    units: [linear("seconds", "Seconds", "s", 1), linear("minutes", "Minutes", "min", 60), linear("hours", "Hours", "h", 3600), linear("days", "Days", "d", 86400), linear("weeks", "Weeks", "wk", 604800)],
    ...metadata("Time converts durations using exact SI seconds for the supported units.", "value in target = value × source factor / target factor", [{ input: 1, from: "hours", to: "minutes" }], factFaq(
      "Does this converter treat months and years as fixed durations?",
      "No. It converts only fixed durations from seconds through seven-day weeks. Calendar months and years vary in length and are intentionally not guessed.",
    )),
  },
  {
    id: "angle", title: "Angle", converter: "linear",
    units: [linear("degrees", "Degrees", "°", 1), linear("radians", "Radians", "rad", 180 / Math.PI), linear("gradians", "Gradians", "gon", 0.9)],
    ...metadata("Angle measurements describe rotation.", "value in target = value × source factor / target factor", [{ input: 180, from: "degrees", to: "radians" }], factFaq(
      "How do degrees, radians and gradians describe a full turn?",
      "One full turn is 360 degrees, 2π radians or 400 gradians. The converter preserves π-based precision until it formats the displayed result.",
    )),
  },
  {
    id: "fuel", title: "Fuel Economy", converter: "custom",
    units: [linear("liters_per_100km", "Liters per 100 km", "L/100 km", 1, ["l/100km", "l/100 km", "litry na 100 km", "litrów na 100 km"]), linear("miles_per_gallon", "Miles per Gallon (US)", "mpg", 1, ["mpg", "mile na galon", "mil na galon"])],
    convert: (value, from, to) => from === to ? value : 235.214583 / value,
    validateInput: (value) => value > 0 ? undefined : "Fuel economy requires a positive value.",
    ...metadata("Fuel economy can be expressed as volume used per distance or distance per volume.", "L/100 km × mpg = 235.214583 (US gallons)", [{ input: 7, from: "liters_per_100km", to: "miles_per_gallon" }], factFaq(
      "Why does fuel-economy conversion use division instead of multiplication?",
      "L/100 km measures fuel used, while US mpg measures distance traveled per fuel volume. They move in opposite directions, so their product is 235.214583.",
    )),
  },
  {
    id: "pace", title: "Pace", converter: "custom",
    units: [linear("minutes_per_kilometer", "Minutes per Kilometer", "min/km", 1), linear("minutes_per_mile", "Minutes per Mile", "min/mi", 1)],
    convert: (value, from, to) => from === to ? value : from === "minutes_per_kilometer" ? value * 1.609344 : value / 1.609344,
    validateInput: (value) => value > 0 ? undefined : "Pace requires a positive value.",
    ...metadata("Running pace is the time needed to cover a distance.", "min/mi = min/km × 1.609344", [{ input: 5, from: "minutes_per_kilometer", to: "minutes_per_mile" }], factFaq(
      "How do minutes per kilometer and minutes per mile relate?",
      "Multiply minutes per kilometer by 1.609344 to get minutes per mile. Divide minutes per mile by 1.609344 for the reverse conversion.",
    )),
  },
];

export const categories: CategoryDefinition[] = definitions;
export const footerCategories = categories.map((category) => ({
  title: category.title,
  items: category.units.map((unit) => `${unit.label} Converter`),
}));

export const getCategory = (id: string | undefined): CategoryDefinition | undefined =>
  categories.find((category) => category.id === id);

export const getUnit = (category: CategoryDefinition, id: string): UnitDefinition | undefined => {
  const needle = id.trim().toLowerCase();
  const directMatch = category.units.find((unit) => unit.value === id || unit.symbol === id) ??
    category.units.find((unit) =>
      unit.value.toLowerCase() === needle ||
      unit.aliases.some((alias) => alias.toLowerCase() === needle)
    );
  if (directMatch) return directMatch;
  const symbolMatches = category.units.filter((unit) => unit.symbol.toLowerCase() === needle);
  return symbolMatches.length === 1 ? symbolMatches[0] : undefined;
};

const baselineDefaultUnits: Readonly<Record<string, { from: string; to: string }>> = {
  speed: { from: "kph", to: "mph" },
  area: { from: "square_meters", to: "square_feet" },
};

export const defaultUnits = (category: CategoryDefinition): { from: string; to: string } =>
  baselineDefaultUnits[category.id] ?? {
    from: category.units[0]?.value ?? "",
    to: category.units[1]?.value ?? category.units[0]?.value ?? "",
  };
