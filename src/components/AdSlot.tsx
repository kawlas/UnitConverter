import { useEffect } from "react";
import { adConfig } from "@/lib/ads";

interface AdSlotProps {
  readonly placement: "converter-after-answer" | "home-after-categories";
}

export default function AdSlot({ placement }: AdSlotProps) {
  useEffect(() => {
    if (!adConfig.enabled || !adConfig.clientId || !adConfig.slotId) {
      return;
    }

    const pushAd = () => {
      try {
        // @ts-expect-error - adsbygoogle injected by Google script
        window.adsbygoogle?.push({});
      } catch {
        // ignore ad fill failures
      }
    };

    pushAd();
  }, [placement]);

  if (!adConfig.enabled || !adConfig.clientId || !adConfig.slotId) {
    return null;
  }

  return (
    <aside aria-label="Advertisement" data-ad-placement={placement} className="my-8 flex min-h-[120px] w-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 text-center sm:min-h-[180px]">
      <ins
        className="adsbygoogle block w-full"
        style={{ display: "block", minHeight: "120px" }}
        data-ad-client={adConfig.clientId}
        data-ad-slot={adConfig.slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
