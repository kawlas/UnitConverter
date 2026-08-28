import type { MethodologySource } from "@/lib/methodology";

const badgeClasses: Record<MethodologySource["organization"], string> = {
  BIPM: "border-indigo-100 bg-indigo-50 text-indigo-700",
  NIST: "border-slate-200 bg-slate-100 text-slate-700",
  IEC: "border-teal-100 bg-teal-50 text-teal-700",
  CDC: "border-rose-100 bg-rose-50 text-rose-700",
};

interface MethodologySectionProps {
  readonly categoryId: string;
  readonly sources: readonly MethodologySource[];
}

export default function MethodologySection({ categoryId, sources }: MethodologySectionProps) {
  if (sources.length === 0) return null;
  const headingId = `${categoryId}-methodology-heading`;

  return (
    <section className="mt-10 border-t border-slate-200 pt-8 sm:mt-14 sm:pt-10" aria-labelledby={headingId}>
      <div className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600">Accuracy &amp; transparency</p>
        <h2 id={headingId} className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Sources &amp; methodology</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Calculations keep full numeric precision until display formatting. These references describe the definitions, variants or factors used; links do not imply affiliation.
        </p>
      </div>
      <ul className="mt-5 grid gap-3 md:grid-cols-2">
        {sources.map((source) => (
          <li key={source.id} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-[0_4px_18px_rgba(15,23,42,0.03)]">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${badgeClasses[source.organization]}`}>
                {source.organization}
              </span>
              <a className="text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600" href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">{source.scope}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
