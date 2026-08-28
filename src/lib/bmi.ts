export type BmiHeightUnit = "cm" | "meters" | "inches" | "feet";
export type BmiWeightUnit = "kg" | "lbs";
export type AdultBmiCategory = "Underweight" | "Healthy Weight" | "Overweight" | "Obesity";

export type AdultBmiResult =
  | { readonly status: "empty" }
  | { readonly status: "error"; readonly message: string }
  | {
      readonly status: "ready";
      readonly bmi: number;
      readonly category: AdultBmiCategory;
      readonly referenceWeightKg: { readonly min: number; readonly max: number };
    };

const DECIMAL_NUMBER = /^(?:(?:\d+(?:[.,]\d*)?)|(?:[.,]\d+))$/;

const parseMeasurement = (raw: string): number | undefined => {
  const value = raw.trim();
  if (!DECIMAL_NUMBER.test(value)) return undefined;
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const roundToOneDecimal = (value: number): number => Math.round(value * 10) / 10;

export const classifyAdultBmi = (bmi: number): AdultBmiCategory => {
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Healthy Weight";
  if (bmi < 30) return "Overweight";
  return "Obesity";
};

export const calculateAdultBmi = (
  heightInput: string,
  weightInput: string,
  heightUnit: BmiHeightUnit,
  weightUnit: BmiWeightUnit,
): AdultBmiResult => {
  if (heightInput.trim() === "" || weightInput.trim() === "") return { status: "empty" };

  let height = parseMeasurement(heightInput);
  let weight = parseMeasurement(weightInput);
  if (height === undefined || weight === undefined) {
    return { status: "error", message: "Enter valid finite numbers for height and weight." };
  }
  if (height <= 0 || weight <= 0) {
    return { status: "error", message: "Height and weight must be greater than zero." };
  }

  if (heightUnit === "cm") height /= 100;
  else if (heightUnit === "inches") height *= 0.0254;
  else if (heightUnit === "feet") height *= 0.3048;
  if (weightUnit === "lbs") weight *= 0.45359237;

  const bmi = weight / (height * height);
  if (!Number.isFinite(bmi)) {
    return { status: "error", message: "The BMI result is outside the supported range." };
  }

  return {
    status: "ready",
    bmi: roundToOneDecimal(bmi),
    category: classifyAdultBmi(bmi),
    referenceWeightKg: {
      min: roundToOneDecimal(18.5 * height * height),
      max: roundToOneDecimal(24.9 * height * height),
    },
  };
};
