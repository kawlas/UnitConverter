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

const commonFaq = (name: string): CategoryDefinition["faq"] => [
  {
    question: `What is a ${name} conversion?`,
    answer: `A ${name.toLowerCase()} conversion expresses the same quantity in another supported unit.`,
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
    ...metadata("Power is the rate at which energy is transferred.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilowatts", to: "watts" }], commonFaq("power")),
  },
  {
    id: "energy", title: "Energy", converter: "linear",
    units: [linear("joules", "Joules", "J", 1), linear("kilowatt_hours", "Kilowatt Hours", "kWh", 3_600_000, ["kwh"]), linear("kilojoules", "Kilojoules", "kJ", 1000, ["kj"]), linear("calories", "Calorie (thermochemical)", "cal", 4.184, ["small calorie"]), linear("kilocalories", "Kilocalorie (food Calorie)", "kcal", 4184, ["food calorie", "calorie"]), linear("btu", "BTU (International Table)", "BTU", 1055.05585262, ["btu it"])],
    ...metadata("Energy measures the capacity to perform work.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilowatt_hours", to: "joules" }], commonFaq("energy")),
  },
  {
    id: "speed", title: "Speed", converter: "linear",
    units: [linear("mph", "Miles per Hour", "mph", 0.44704, ["mi/h"]), linear("kph", "Kilometers per Hour", "km/h", 1000 / 3600, ["kmh", "km/h"]), linear("mps", "Meters per Second", "m/s", 1, ["m/s"]), linear("knots", "Knots", "kn", 1852 / 3600, ["kt"])],
    ...metadata("Speed measures distance travelled per unit of time.", "value in target = value × source factor / target factor", [{ input: 100, from: "kph", to: "mph" }], commonFaq("speed")),
  },
  {
    id: "length", title: "Length", converter: "linear",
    units: [linear("meters", "Meters", "m", 1, ["metres"]), linear("feet", "Feet", "ft", 0.3048), linear("centimeters", "Centimeters", "cm", 0.01, ["centimetres"]), linear("millimeters", "Millimeters", "mm", 0.001, ["millimetres"]), linear("inches", "Inches", "in", 0.0254), linear("yards", "Yards", "yd", 0.9144), linear("kilometers", "Kilometers", "km", 1000, ["kilometres"]), linear("miles", "Miles", "mi", 1609.344), linear("nautical_miles", "Nautical Miles", "nmi", 1852, ["nautical mile"])],
    ...metadata("Length measures distance or dimension.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilometers", to: "miles" }], commonFaq("length")),
  },
  {
    id: "weight", title: "Weight", converter: "linear",
    units: [linear("kilograms", "Kilograms", "kg", 1), linear("pounds", "Pounds", "lb", 0.45359237, ["lbs"]), linear("grams", "Grams", "g", 0.001), linear("metric_tonnes", "Metric Tonnes", "t", 1000, ["tonnes", "metric ton"]), linear("ounces", "Ounces", "oz", 0.028349523125)],
    ...metadata("Weight is commonly expressed with mass units in everyday conversions.", "value in target = value × source factor / target factor", [{ input: 1, from: "kilograms", to: "pounds" }], commonFaq("weight")),
  },
  {
    id: "temperature", title: "Temperature", converter: "affine",
    units: [affine("celsius", "Celsius", "°C", (v) => v + 273.15, (v) => v - 273.15), affine("fahrenheit", "Fahrenheit", "°F", (v) => (v - 32) * 5 / 9 + 273.15, (v) => (v - 273.15) * 9 / 5 + 32), affine("kelvin", "Kelvin", "K", (v) => v, (v) => v), affine("rankine", "Rankine", "°R", (v) => v * 5 / 9, (v) => v * 9 / 5)],
    validateInput: (value, from) => {
      const minimumByUnit: Record<string, number> = { celsius: -273.15, fahrenheit: -459.67, kelvin: 0, rankine: 0 };
      return value < minimumByUnit[from] ? "Temperature cannot be below absolute zero." : undefined;
    },
    ...metadata("Temperature scales describe how hot or cold something is.", "C → K: C + 273.15; F → K: (F − 32) × 5/9 + 273.15; R → K: R × 5/9", [{ input: 0, from: "celsius", to: "fahrenheit" }], commonFaq("temperature")),
  },
  {
    id: "volume", title: "Volume", converter: "linear",
    units: [linear("liters", "Liters", "L", 1, ["litres"]), linear("gallons", "US Gallons", "gal", 3.785411784), linear("milliliters", "Milliliters", "mL", 0.001, ["ml"]), linear("cubic_meters", "Cubic Meters", "m³", 1000, ["m3"])],
    ...metadata("Volume measures the amount of three-dimensional space.", "value in target = value × source factor / target factor", [{ input: 1, from: "gallons", to: "liters" }], commonFaq("volume")),
  },
  {
    id: "area", title: "Area", converter: "linear",
    units: [linear("square_meters", "Square Meters", "m²", 1, ["m2", "m^2"]), linear("are", "Are", "a", 100, ["ar", "ares"]), linear("hectare", "Hectare", "ha", 10_000, ["hectares"]), linear("square_feet", "Square Feet", "ft²", 0.09290304, ["ft2", "sq ft"]), linear("square_kilometers", "Square Kilometers", "km²", 1_000_000, ["km2"]), linear("acres", "Acres", "ac", 4046.8564224, ["acre"])],
    ...metadata("Area measures two-dimensional space. One are is exactly 100 square metres and one hectare is 100 ares.", "value in target = value × source factor / target factor", [{ input: 1, from: "are", to: "square_meters" }, { input: 1, from: "hectare", to: "are" }], [
      { question: "How many square metres are in one are?", answer: "1 are (ar) = 100 m² exactly." },
      { question: "How many ares are in one hectare?", answer: "1 hectare (ha) = 100 ares = 10,000 m² exactly." },
    ]),
  },
  {
    id: "pressure", title: "Pressure", converter: "linear",
    units: [linear("pascals", "Pascals", "Pa", 1, ["pa"]), linear("kilopascals", "Kilopascals", "kPa", 1000, ["kpa"]), linear("bar", "Bar", "bar", 100000), linear("psi", "Pounds per Square Inch", "psi", 6894.757293168), linear("atmospheres", "Atmospheres", "atm", 101325, ["atm"])],
    ...metadata("Pressure is force distributed over an area.", "value in target = value × source factor / target factor", [{ input: 1, from: "atmospheres", to: "pascals" }], commonFaq("pressure")),
  },
  {
    id: "digital", title: "Digital Data", converter: "linear",
    units: [linear("bits", "Bits", "bit", 1), linear("bytes", "Bytes", "B", 8), linear("kilobits", "Kilobits", "kb", 1000), linear("kilobytes", "Kilobytes", "kB", 8000), linear("megabytes", "Megabytes", "MB", 8_000_000), linear("gigabytes", "Gigabytes", "GB", 8_000_000_000), linear("kibibytes", "Kibibytes", "KiB", 8 * 1024, ["kib"]), linear("mebibytes", "Mebibytes", "MiB", 8 * 1024 ** 2, ["mib"]), linear("gibibytes", "Gibibytes", "GiB", 8 * 1024 ** 3, ["gib"]), linear("tebibytes", "Tebibytes", "TiB", 8 * 1024 ** 4, ["tib"])],
    ...metadata("Digital data uses decimal SI units and clearly labelled binary units where applicable.", "value in target = value × source factor / target factor", [{ input: 1, from: "megabytes", to: "bytes" }], commonFaq("digital data")),
  },
  {
    id: "time", title: "Time", converter: "linear",
    units: [linear("seconds", "Seconds", "s", 1), linear("minutes", "Minutes", "min", 60), linear("hours", "Hours", "h", 3600), linear("days", "Days", "d", 86400), linear("weeks", "Weeks", "wk", 604800)],
    ...metadata("Time converts durations using exact SI seconds for the supported units.", "value in target = value × source factor / target factor", [{ input: 1, from: "hours", to: "minutes" }], commonFaq("time")),
  },
  {
    id: "angle", title: "Angle", converter: "linear",
    units: [linear("degrees", "Degrees", "°", 1), linear("radians", "Radians", "rad", 180 / Math.PI), linear("gradians", "Gradians", "gon", 0.9)],
    ...metadata("Angle measurements describe rotation.", "value in target = value × source factor / target factor", [{ input: 180, from: "degrees", to: "radians" }], commonFaq("angle")),
  },
  {
    id: "fuel", title: "Fuel Economy", converter: "custom",
    units: [linear("liters_per_100km", "Liters per 100 km", "L/100 km", 1, ["l/100km"]), linear("miles_per_gallon", "Miles per Gallon (US)", "mpg", 1, ["mpg"])],
    convert: (value, from, to) => from === to ? value : 235.214583 / value,
    validateInput: (value) => value > 0 ? undefined : "Fuel economy requires a positive value.",
    ...metadata("Fuel economy can be expressed as volume used per distance or distance per volume.", "L/100 km × mpg = 235.214583 (US gallons)", [{ input: 7, from: "liters_per_100km", to: "miles_per_gallon" }], commonFaq("fuel economy")),
  },
  {
    id: "pace", title: "Pace", converter: "custom",
    units: [linear("minutes_per_kilometer", "Minutes per Kilometer", "min/km", 1), linear("minutes_per_mile", "Minutes per Mile", "min/mi", 1)],
    convert: (value, from, to) => from === to ? value : from === "minutes_per_kilometer" ? value * 1.609344 : value / 1.609344,
    validateInput: (value) => value > 0 ? undefined : "Pace requires a positive value.",
    ...metadata("Running pace is the time needed to cover a distance.", "min/mi = min/km × 1.609344", [{ input: 5, from: "minutes_per_kilometer", to: "minutes_per_mile" }], commonFaq("pace")),
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
