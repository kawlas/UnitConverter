import { describe, expect, it } from "vitest";
import { getNextSearchResultIndex, searchOptionId } from "./SearchBar";

describe("search combobox keyboard navigation", () => {
  it("moves into the first option and wraps with ArrowDown", () => {
    expect(getNextSearchResultIndex(-1, 1, 3)).toBe(0);
    expect(getNextSearchResultIndex(2, 1, 3)).toBe(0);
  });

  it("moves into the last option and wraps with ArrowUp", () => {
    expect(getNextSearchResultIndex(-1, -1, 3)).toBe(2);
    expect(getNextSearchResultIndex(0, -1, 3)).toBe(2);
  });

  it("keeps no active option when there are no results", () => {
    expect(getNextSearchResultIndex(0, 1, 0)).toBe(-1);
  });

  it("builds stable option ids for aria-activedescendant", () => {
    expect(searchOptionId("digital")).toBe("conversion-search-option-digital");
  });
});
