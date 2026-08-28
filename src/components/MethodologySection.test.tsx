import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { getMethodology } from "@/lib/methodology";
import MethodologySection from "./MethodologySection";

describe("MethodologySection", () => {
  it("renders crawlable source links and neutral methodology copy", () => {
    const html = renderToStaticMarkup(
      <MethodologySection categoryId="length" sources={getMethodology("length")} />,
    );

    expect(html).toContain("Sources &amp; methodology");
    expect(html).toContain("https://www.bipm.org/en/publications/si-brochure");
    expect(html).toContain("https://www.nist.gov/pml/special-publication-811");
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain("links do not imply affiliation");
  });

  it("renders nothing without applicable references", () => {
    expect(renderToStaticMarkup(<MethodologySection categoryId="unknown" sources={[]} />)).toBe("");
  });
});
