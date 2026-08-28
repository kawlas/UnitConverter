interface AdSlotProps {
  readonly placement: "converter-after-answer" | "home-after-categories";
}

const placeholdersEnabled = import.meta.env.VITE_ADSENSE_PLACEHOLDERS === "true";

export default function AdSlot({ placement }: AdSlotProps) {
  if (!placeholdersEnabled) return null;

  return (
    <aside
      aria-label="Advertisement"
      data-ad-placement={placement}
      className="my-8 flex min-h-[120px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center sm:min-h-[180px]"
    >
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Advertisement</p>
        <p className="mt-2 text-xs text-slate-400">Reserved responsive Google ad space</p>
      </div>
    </aside>
  );
}
