export type CookingDirection = "grams-to-cups" | "cups-to-grams";

export interface CookingIngredient {
  readonly id: string;
  readonly label: string;
  readonly shortLabel: string;
  readonly gramsPerUsCup: number;
  readonly assumption: string;
  readonly sourceName: string;
  readonly sourceUrl: string;
}

const KING_ARTHUR_INGREDIENT_CHART =
  "https://www.kingarthurbaking.com/learn/ingredient-weight-chart";

export const cookingIngredients: readonly CookingIngredient[] = [
  {
    id: "all-purpose-flour",
    label: "All-purpose flour",
    shortLabel: "flour",
    gramsPerUsCup: 120,
    assumption: "Spooned gently into a dry measuring cup and leveled, not packed.",
    sourceName: "King Arthur Baking Ingredient Weight Chart",
    sourceUrl: KING_ARTHUR_INGREDIENT_CHART,
  },
  {
    id: "granulated-sugar",
    label: "Granulated white sugar",
    shortLabel: "granulated sugar",
    gramsPerUsCup: 198,
    assumption: "Standard granulated white sugar measured in a level US cup.",
    sourceName: "King Arthur Baking Ingredient Weight Chart",
    sourceUrl: KING_ARTHUR_INGREDIENT_CHART,
  },
  {
    id: "packed-brown-sugar",
    label: "Brown sugar (packed)",
    shortLabel: "packed brown sugar",
    gramsPerUsCup: 213,
    assumption: "Light or dark brown sugar pressed firmly into a US cup.",
    sourceName: "King Arthur Baking Ingredient Weight Chart",
    sourceUrl: KING_ARTHUR_INGREDIENT_CHART,
  },
  {
    id: "solid-butter",
    label: "Butter (solid)",
    shortLabel: "solid butter",
    gramsPerUsCup: 226,
    assumption: "Solid butter; the source lists 113 g per half US cup.",
    sourceName: "King Arthur Baking Ingredient Weight Chart",
    sourceUrl: KING_ARTHUR_INGREDIENT_CHART,
  },
  {
    id: "whole-milk",
    label: "Milk (fresh)",
    shortLabel: "fresh milk",
    gramsPerUsCup: 227,
    assumption: "Fresh liquid milk measured in a level US cup.",
    sourceName: "King Arthur Baking Ingredient Weight Chart",
    sourceUrl: KING_ARTHUR_INGREDIENT_CHART,
  },
] as const;

export type CookingValueResult =
  | { readonly status: "empty" }
  | { readonly status: "error"; readonly message: string }
  | { readonly status: "ready"; readonly value: number };

export const parseCookingValue = (input: string): CookingValueResult => {
  const normalized = input.trim();
  if (!normalized) return { status: "empty" };
  if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) {
    if (normalized.startsWith("-")) {
      return { status: "error", message: "Enter zero or a positive value." };
    }
    return { status: "error", message: "Enter a number only, such as 120 or 1.5." };
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) {
    return { status: "error", message: "Enter a smaller number." };
  }
  return { status: "ready", value };
};

export const getCookingIngredient = (ingredientId: string): CookingIngredient | undefined =>
  cookingIngredients.find(({ id }) => id === ingredientId);

export const convertCookingMeasurement = (
  value: number,
  direction: CookingDirection,
  ingredientId: string,
): number => {
  const ingredient = getCookingIngredient(ingredientId);
  if (!ingredient) throw new Error(`Unknown cooking ingredient: ${ingredientId}`);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Cooking measurements require a finite, non-negative value.");
  }
  return direction === "grams-to-cups"
    ? value / ingredient.gramsPerUsCup
    : value * ingredient.gramsPerUsCup;
};
