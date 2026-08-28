import type { UnitConversionResult } from "@/lib/conversions";
import { Button } from "./ui/button";

interface AllUnitsComparisonProps {
  categoryId: string;
  title: string;
  results: readonly UnitConversionResult[];
  sourceUnit: string;
  targetUnit: string;
  precision: number;
  locale: string;
  onSelectTarget: (unit: string) => void;
}

export const formatComparisonValue = (
  value: number,
  locale: string,
  precision: number,
): string => {
  const roundsToZero = value !== 0 && Math.abs(value) < 0.5 * 10 ** -precision;
  const isVeryLarge = Math.abs(value) >= 1e12;
  return new Intl.NumberFormat(locale, roundsToZero || isVeryLarge
    ? { notation: "scientific", maximumSignificantDigits: Math.max(3, precision + 1) }
    : { maximumFractionDigits: precision }).format(value);
};

export default function AllUnitsComparison({
  categoryId,
  title,
  results,
  sourceUnit,
  targetUnit,
  precision,
  locale,
  onSelectTarget,
}: AllUnitsComparisonProps) {
  const headingId = `${categoryId}-all-units-heading`;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5" aria-labelledby={headingId}>
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <div>
          <h3 id={headingId} className="text-base font-semibold text-slate-950">Compare all {title.toLowerCase()} units</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">One input, every supported equivalent. Select any row as the main target.</p>
        </div>
        <span className="text-xs font-medium text-slate-600">{results.length} units</span>
      </div>

      {results.length === 0 ? (
        <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-4 py-5 text-sm text-slate-600">
          Enter a valid value above to compare all units.
        </p>
      ) : (
        <div className="mt-4 w-full min-w-0 max-w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full table-fixed text-left text-sm sm:min-w-[440px]">
            <caption className="sr-only">Equivalent {title.toLowerCase()} values in every supported unit</caption>
            <thead className="bg-slate-100 text-xs uppercase tracking-[0.08em] text-slate-600">
              <tr>
                <th scope="col" className="w-[42%] px-4 py-3 font-semibold">Unit</th>
                <th scope="col" className="w-[36%] px-4 py-3 text-right font-semibold">Equivalent</th>
                <th scope="col" className="w-[22%] px-4 py-3 text-right font-semibold"><span className="sr-only">Target action</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {results.map(({ unit, value }) => {
                const isSource = unit.value === sourceUnit;
                const isTarget = unit.value === targetUnit;
                const stateLabel = isSource && isTarget ? "Source and target" : isSource ? "Source" : isTarget ? "Selected" : "";
                const compactStateLabel = isSource && isTarget ? "Both" : isTarget ? "Target" : stateLabel;
                return (
                  <tr key={unit.value} className={isTarget ? "bg-indigo-50/80" : undefined}>
                    <th scope="row" className="px-4 py-3 font-medium text-slate-800">
                      <span>{unit.label}</span>{" "}
                      <span className="ml-2 font-normal text-slate-600">{unit.symbol}</span>
                    </th>
                    <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-950">
                      {formatComparisonValue(value, locale, precision)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      {stateLabel ? (
                        <span className="inline-flex min-h-11 items-center text-xs font-semibold text-indigo-700">
                          <span className="sm:hidden">{compactStateLabel}</span>
                          <span className="hidden sm:inline">{stateLabel}</span>
                        </span>
                      ) : (
                        <Button type="button" variant="ghost" size="sm" className="min-h-11 px-3 text-indigo-700" onClick={() => onSelectTarget(unit.value)} aria-label={`Use ${unit.label} as target`}>
                          Use
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
