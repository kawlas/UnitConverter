import { describe, expect, it } from "vitest";
import {
  buildBatchCopyText,
  convertBatchLine,
  MAX_BATCH_INPUT_LENGTH,
  MAX_BATCH_LINES,
  MAX_BATCH_LINE_LENGTH,
  runBatchConversions,
  splitBatchInput,
} from "./batch";

const LENGTH = { categoryId: "length", from: "meters", to: "feet", locale: "en-US", precision: 2 };

describe("splitBatchInput", () => {
  it("splits non-empty lines and ignores blank ones", () => {
    expect(splitBatchInput("1\n\n2  \n  3\r\n4").lines).toEqual(["1", "2", "3", "4"]);
    const single = splitBatchInput("1");
    expect(single.lines).toEqual(["1"]);
    expect(single.overLength).toBe(false);
    expect(single.overLineCount).toBe(false);
  });

  it("returns no lines for empty or whitespace-only input", () => {
    const result = splitBatchInput("   \n  \n");
    expect(result.lines).toEqual([]);
    expect(result.overLength).toBe(false);
    expect(result.overLineCount).toBe(false);
  });

  it("rejects the whole batch when there are more than MAX_BATCH_LINES non-empty lines", () => {
    const raw = Array.from({ length: MAX_BATCH_LINES + 5 }, (_, i) => String(i + 1)).join("\n");
    const result = splitBatchInput(raw);
    expect(result.lines).toEqual([]);
    expect(result.overLineCount).toBe(true);
    expect(result.overLength).toBe(false);
  });

  it("rejects the whole batch when input exceeds MAX_BATCH_INPUT_LENGTH", () => {
    const raw = "a".repeat(MAX_BATCH_INPUT_LENGTH + 10);
    const result = splitBatchInput(raw);
    expect(result.lines).toEqual([]);
    expect(result.overLength).toBe(true);
    expect(result.overLineCount).toBe(false);
  });
});

describe("convertBatchLine", () => {
  it("converts decimals with the active precision and locale", () => {
    expect(convertBatchLine("12.5", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2))
      .toMatchObject({ ok: true, formatted: "41.01" });
  });

  it("converts fractions and simple arithmetic", () => {
    expect(convertBatchLine("1 1/2", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 3)).toMatchObject({ ok: true });
    expect(convertBatchLine("(12*4)+6.5", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2)).toMatchObject({ ok: true });
  });

  it("formats with the comma decimal separator for de-DE", () => {
    const result = convertBatchLine("1,5", LENGTH.from, LENGTH.to, LENGTH.categoryId, "de-DE", 2);
    expect(result.ok).toBe(true);
    if (result.ok === true) expect(result.formatted).toContain(",");
  });

  it("reports a local parse error for invalid input", () => {
    const result = convertBatchLine("abc", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/finite number/);
  });

  it("reports a fraction-specific parse error", () => {
    const result = convertBatchLine("1/0", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/denominator/);
  });

  it("does not allow a line longer than MAX_BATCH_LINE_LENGTH", () => {
    const result = convertBatchLine("x".repeat(MAX_BATCH_LINE_LENGTH + 1), LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
    expect(result.ok).toBe(false);
    if (result.ok === false) expect(result.error).toMatch(/too long/);
  });
});

describe("runBatchConversions mixed valid and invalid", () => {
  it("keeps order and marks each line as valid or invalid", () => {
    const result = runBatchConversions("1\nabc\n3/8\n", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
    if (result.rejected) throw new Error("expected processable batch");
    expect(result.lines).toHaveLength(3);
    expect(result.lines[0]).toMatchObject({ ok: true, input: "1" });
    expect(result.lines[1]).toMatchObject({ ok: false, input: "abc" });
    expect(result.lines[2]).toMatchObject({ ok: true, input: "3/8" });
    expect("totalLines" in result ? result.totalLines : 0).toBe(3);
  });

  it("rejects the whole batch when limits are exceeded with no partial lines", () => {
    const longInput = runBatchConversions("a".repeat(MAX_BATCH_INPUT_LENGTH + 1) + "\n1", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
    expect(longInput.rejected).toBe(true);
    if ("rejected" in longInput) expect(longInput.lines).toEqual([]);

    const manyLines = runBatchConversions(
      Array.from({ length: MAX_BATCH_LINES + 1 }, (_, i) => String(i)).join("\n"),
      LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2,
    );
    expect(manyLines.rejected).toBe(true);
    if ("rejected" in manyLines) expect(manyLines.lines).toEqual([]);
  });
});

describe("buildBatchCopyText", () => {
  const result = runBatchConversions("1\nbad\n2\n", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
  const results = result.rejected ? [] : result.lines;

  it("includes only valid lines in order with readable labels", () => {
    const text = buildBatchCopyText(results, "Meters", "Feet");
    expect(text).not.toContain("bad");
    expect(text).toContain("1 Meters →");
    expect(text).toContain("2 Meters →");
    expect(text).toContain("Feet");
    expect(text).not.toContain(LENGTH.from);
    const valid = text.split("\n");
    expect(valid).toHaveLength(2);
  });

  it("returns an empty string when there are no valid results", () => {
    const allInvalid = runBatchConversions("x\ny\n", LENGTH.from, LENGTH.to, LENGTH.categoryId, "en-US", 2);
    const lines = allInvalid.rejected ? [] : allInvalid.lines;
    expect(buildBatchCopyText(lines, "Meters", "Feet")).toBe("");
  });
});
