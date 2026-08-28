import { getCategory } from "./conversion-data";

export type MethodologyOrganization = "BIPM" | "NIST" | "IEC" | "CDC" | "King Arthur Baking";

export interface MethodologySource {
  readonly id: string;
  readonly organization: MethodologyOrganization;
  readonly title: string;
  readonly url: string;
  readonly scope: string;
}

export const methodologySources = {
  bipm: {
    id: "bipm-si-brochure",
    organization: "BIPM",
    title: "The International System of Units (SI Brochure)",
    url: "https://www.bipm.org/en/publications/si-brochure",
    scope: "SI definitions and published coefficients for selected non-SI units.",
  },
  nist: {
    id: "nist-sp811-appendix-b9",
    organization: "NIST",
    title: "NIST Guide to the SI — conversion factors by quantity",
    url: "https://www.nist.gov/pml/special-publication-811/nist-guide-si-appendix-b-conversion-factors/nist-guide-si-appendix-b9",
    scope: "Reference factors and named variants for commonly used units, including US liquid cooking measures and British stone.",
  },
  iec: {
    id: "iec-80000-13-2025",
    organization: "IEC",
    title: "IEC 80000-13:2025 — information science and technology",
    url: "https://webstore.iec.ch/en/publication/87379",
    scope: "Names, symbols and binary prefixes for digital information units.",
  },
  cdc: {
    id: "cdc-adult-bmi",
    organization: "CDC",
    title: "CDC Adult BMI Calculator",
    url: "https://www.cdc.gov/bmi/adult-calculator/index.html",
    scope: "Adult BMI formula, screening categories and interpretation limitations.",
  },
  kingArthur: {
    id: "king-arthur-ingredient-weight-chart",
    organization: "King Arthur Baking",
    title: "Ingredient Weight Chart",
    url: "https://www.kingarthurbaking.com/learn/ingredient-weight-chart",
    scope: "Tested recipe reference weights for common ingredients measured by volume and mass.",
  },
} as const satisfies Record<string, MethodologySource>;

const physicalSources = [methodologySources.bipm, methodologySources.nist] as const;

export const getMethodology = (categoryId: string): readonly MethodologySource[] => {
  if (!getCategory(categoryId)) return [];
  if (categoryId === "bmi") return [methodologySources.cdc];
  if (categoryId === "grams-to-cups") return [methodologySources.nist, methodologySources.kingArthur];
  if (categoryId === "digital") return [methodologySources.bipm, methodologySources.iec];
  return physicalSources;
};
