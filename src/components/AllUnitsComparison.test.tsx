import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getCategory } from "@/lib/conversion-data";
import { convertAllExact } from "@/lib/conversions";
import AllUnitsComparison, { formatComparisonValue } from "./AllUnitsComparison";

describe("AllUnitsComparison", () => {
  it("renders a semantic all-units table with source and selected target states", () => {
    const html = renderToStaticMarkup(
      <AllUnitsComparison
        categoryId="length"
        title="Length"
        results={convertAllExact(1, "meters", "length")}
        sourceUnit="meters"
        targetUnit="feet"
        precision={2}
        locale="en-US"
        onSelectTarget={() => undefined}
      />,
    );

    expect(html).toContain("Compare all length units");
    expect(html).toContain("Equivalent length values in every supported unit");
    expect(html).toContain('<th scope="row"');
    expect(html).toContain("Source");
    expect(html).toContain("Selected");
    expect(html).toContain("Use Nautical Miles as target");
    expect((html.match(/<tr/g) ?? []).length - 1).toBe(getCategory("length")!.units.length);
  });

  it("uses scientific notation instead of displaying non-zero values as zero", () => {
    expect(formatComparisonValue(0.000621371, "en-US", 2)).toMatch(/6\.21.*10|6\.21[eE]-4/);
    expect(formatComparisonValue(3.280839895, "en-US", 2)).toBe("3.28");
    expect(formatComparisonValue(3.280839895, "de-DE", 2)).toBe("3,28");
    expect(formatComparisonValue(1_000_000_000_000, "en-US", 2)).toMatch(/1[eE]12/);
  });

  it("renders actionable empty guidance when the current input is invalid", () => {
    const html = renderToStaticMarkup(
      <AllUnitsComparison
        categoryId="length"
        title="Length"
        results={[]}
        sourceUnit="meters"
        targetUnit="feet"
        precision={2}
        locale="en-US"
        onSelectTarget={() => undefined}
      />,
    );

    expect(html).toContain("Enter a valid value above to compare all units.");
    expect(html).not.toContain("<table");
  });
});
