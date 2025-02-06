type ConversionFormulas = {
  [key: string]: {
    [key: string]: (value: number) => number;
  };
};

export const conversionFormulas: ConversionFormulas = {
  length: {
    meters_feet: (value) => value * 3.28084,
    meters_inches: (value) => value * 39.3701,
    meters_kilometers: (value) => value / 1000,
    feet_meters: (value) => value / 3.28084,
    feet_inches: (value) => value * 12,
    feet_kilometers: (value) => value / 3280.84,
    inches_meters: (value) => value / 39.3701,
    inches_feet: (value) => value / 12,
    inches_kilometers: (value) => value / 39370.1,
    kilometers_meters: (value) => value * 1000,
    kilometers_feet: (value) => value * 3280.84,
    kilometers_inches: (value) => value * 39370.1,
  },
  weight: {
    kilograms_pounds: (value) => value * 2.20462,
    kilograms_ounces: (value) => value * 35.274,
    kilograms_grams: (value) => value * 1000,
    pounds_kilograms: (value) => value / 2.20462,
    pounds_ounces: (value) => value * 16,
    pounds_grams: (value) => value * 453.592,
    ounces_kilograms: (value) => value / 35.274,
    ounces_pounds: (value) => value / 16,
    ounces_grams: (value) => value * 28.3495,
    grams_kilograms: (value) => value / 1000,
    grams_pounds: (value) => value / 453.592,
    grams_ounces: (value) => value / 28.3495,
  },
  temperature: {
    celsius_fahrenheit: (value) => (value * 9) / 5 + 32,
    celsius_kelvin: (value) => value + 273.15,
    fahrenheit_celsius: (value) => ((value - 32) * 5) / 9,
    fahrenheit_kelvin: (value) => ((value - 32) * 5) / 9 + 273.15,
    kelvin_celsius: (value) => value - 273.15,
    kelvin_fahrenheit: (value) => ((value - 273.15) * 9) / 5 + 32,
  },
  volume: {
    liters_gallons: (value) => value * 0.264172,
    liters_milliliters: (value) => value * 1000,
    liters_cubic_meters: (value) => value / 1000,
    gallons_liters: (value) => value / 0.264172,
    gallons_milliliters: (value) => value * 3785.41,
    gallons_cubic_meters: (value) => value / 264.172,
    milliliters_liters: (value) => value / 1000,
    milliliters_gallons: (value) => value / 3785.41,
    milliliters_cubic_meters: (value) => value / 1000000,
    cubic_meters_liters: (value) => value * 1000,
    cubic_meters_gallons: (value) => value * 264.172,
    cubic_meters_milliliters: (value) => value * 1000000,
  },
  area: {
    square_meters_square_feet: (value) => value * 10.7639,
    square_meters_square_kilometers: (value) => value / 1000000,
    square_meters_acres: (value) => value / 4046.86,
    square_feet_square_meters: (value) => value / 10.7639,
    square_feet_square_kilometers: (value) => value / 10763900,
    square_feet_acres: (value) => value / 43560,
    square_kilometers_square_meters: (value) => value * 1000000,
    square_kilometers_square_feet: (value) => value * 10763900,
    square_kilometers_acres: (value) => value * 247.105,
    acres_square_meters: (value) => value * 4046.86,
    acres_square_feet: (value) => value * 43560,
    acres_square_kilometers: (value) => value / 247.105,
  },
};

export const convert = (
  value: number,
  fromUnit: string,
  toUnit: string,
  category: string,
): number => {
  if (fromUnit === toUnit) return value;

  const formula = conversionFormulas[category]?.[`${fromUnit}_${toUnit}`];
  if (formula) {
    return Number(formula(value).toFixed(6));
  }

  return value;
};
