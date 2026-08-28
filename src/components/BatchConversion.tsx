import { useMemo, useState } from "react";
import { ClipboardCopy } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  buildBatchCopyText,
  runBatchConversions,
  MAX_BATCH_INPUT_LENGTH,
  MAX_BATCH_LINES,
} from "@/lib/batch";
interface BatchConversionProps {
  categoryId: string;
  fromUnit: string;
  toUnit: string;
  locale: string;
  precision: number;
  fromLabel: string;
  toLabel: string;
}

const copyText = async (text: string): Promise<boolean> => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Try the DOM fallback below.
    }
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
};

export default function BatchConversion({
  categoryId,
  fromUnit,
  toUnit,
  locale,
  precision,
  fromLabel,
  toLabel,
}: BatchConversionProps) {
  const [raw, setRaw] = useState("");
  const [notice, setNotice] = useState("");

  const result = useMemo(
    () => runBatchConversions(raw, fromUnit, toUnit, categoryId, locale, precision),
    [categoryId, fromUnit, locale, precision, raw, toUnit],
  );

  const rejectedReason = result.rejected
    ? raw.length > MAX_BATCH_INPUT_LENGTH
      ? `Input exceeds the ${MAX_BATCH_INPUT_LENGTH}-character limit. The whole batch was rejected.`
      : `Input exceeds ${MAX_BATCH_LINES} non-empty lines. The whole batch was rejected.`
    : null;

  const lines = result.rejected ? [] : result.lines;
  const validCount = lines.filter((line) => line.ok === true).length;

  const copyAll = async () => {
    const text = buildBatchCopyText(lines, fromLabel, toLabel);
    if (!text) return;
    setNotice(await copyText(text) ? "Batch results copied." : "Unable to copy the batch results.");
  };

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5">
      <details className="group">
        <summary className="cursor-pointer list-none text-sm font-semibold text-slate-950">
          <span className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">Batch conversion
              <span className="text-xs font-normal text-slate-500">convert up to {MAX_BATCH_LINES} values at once</span>
            </span>
            <span aria-hidden="true" className="text-slate-400 transition-transform group-open:rotate-180">▾</span>
          </span>
        </summary>

        <div className="mt-3 space-y-3">
          <label htmlFor={`${categoryId}-batch-input`} className="block text-xs leading-5 text-slate-500">
            Paste one value per line (decimals, fractions and simple arithmetic are supported). Results re-use your current {fromLabel} → {toLabel} units, {locale} locale and {precision}-digit precision.
          </label>
          <Textarea
            id={`${categoryId}-batch-input`}
            value={raw}
            onChange={(event) => { setRaw(event.target.value); setNotice(""); }}
            placeholder="12.5&#10;3/8&#10;1 1/2&#10;(12*4)+6.5"
            rows={5}
            spellCheck={false}
            aria-invalid={Boolean(rejectedReason)}
            aria-describedby={`${categoryId}-batch-status`}
            className="min-h-32 font-mono"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p id={`${categoryId}-batch-status`} className={`text-xs ${rejectedReason ? "text-red-700" : "text-slate-500"}`} role="status" aria-live="polite">
              {raw.length > 0
                ? rejectedReason
                  ? rejectedReason
                  : `${validCount} of ${lines.length} lines converted.`
                : "No values yet."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void copyAll()}
              disabled={validCount === 0}
            >
              <ClipboardCopy aria-hidden="true" className="mr-2 h-4 w-4" /> Copy all
            </Button>
          </div>

          {!rejectedReason && lines.length > 0 && (
            <ul className="grid gap-1" data-testid="batch-results">
              {lines.map((line, index) => (
                <li key={`${index}-${line.input}`} className="flex flex-wrap items-baseline gap-x-2 rounded-lg bg-white px-3 py-2 text-sm">
                  {line.ok === true ? (
                    <>
                      <span className="font-mono text-slate-800">{line.input} {fromLabel} →</span>
                      <span className="font-mono font-semibold tabular-nums text-slate-950">{line.formatted} {toLabel}</span>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-slate-800">{line.input}</span>
                      <span className="text-red-700"><span className="sr-only">Line {index + 1} error: </span>{line.error}</span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}

          {notice && <p className="text-xs text-slate-500" role="status" aria-live="polite">{notice}</p>}
        </div>
      </details>
    </section>
  );
}
