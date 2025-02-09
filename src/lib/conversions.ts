type ConversionFormulas = {
  [key: string]: {
    [key: string]: (value: number) => number;
  };
};

export const conversionFormulas: ConversionFormulas = {
  power: {
    watts_kilowatts: (value) => value / 1000,
    watts_horsepower: (value) => value / 745.7,
    watts_btu_per_hour: (value) => value * 3.41214,
    kilowatts_watts: (value) => value * 1000,
    kilowatts_horsepower: (value) => value * 1.34102,
    kilowatts_btu_per_hour: (value) => value * 3412.14,
    horsepower_watts: (value) => value * 745.7,
    horsepower_kilowatts: (value) => value / 1.34102,
    horsepower_btu_per_hour: (value) => value * 2544.43,
    btu_per_hour_watts: (value) => value / 3.41214,
    btu_per_hour_kilowatts: (value) => value / 3412.14,
    btu_per_hour_horsepower: (value) => value / 2544.43,
  },
  energy: {
    joules_kilowatt_hours: (value) => value / 3600000,
    joules_calories: (value) => value / 4.184,
    joules_btu: (value) => value / 1055.06,
    kilowatt_hours_joules: (value) => value * 3600000,
    kilowatt_hours_calories: (value) => value * 860421,
    kilowatt_hours_btu: (value) => value * 3412.14,
    calories_joules: (value) => value * 4.184,
    calories_kilowatt_hours: (value) => value / 860421,
    calories_btu: (value) => value / 251.996,
    btu_joules: (value) => value * 1055.06,
    btu_kilowatt_hours: (value) => value / 3412.14,
    btu_calories: (value) => value * 251.996,
  },
  speed: {
    mph_kph: (value) => value * 1.60934,
    mph_mps: (value) => value * 0.44704,
    mph_knots: (value) => value * 0.868976,
    kph_mph: (value) => value / 1.60934,
    kph_mps: (value) => value / 3.6,
    kph_knots: (value) => value * 0.539957,
    mps_mph: (value) => value / 0.44704,
    mps_kph: (value) => value * 3.6,
    mps_knots: (value) => value * 1.94384,
    knots_mph: (value) => value / 0.868976,
    knots_kph: (value) => value / 0.539957,
    knots_mps: (value) => value / 1.94384,
  },
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
