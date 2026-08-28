import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

const ConnectivityStatus = () => {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const syncStatus = () => setIsOffline(!navigator.onLine);
    syncStatus();
    window.addEventListener("online", syncStatus);
    window.addEventListener("offline", syncStatus);
    return () => {
      window.removeEventListener("online", syncStatus);
      window.removeEventListener("offline", syncStatus);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-3 top-20 z-[70] mx-auto flex max-w-md items-center gap-3 rounded-xl border border-teal-300 bg-slate-950 px-4 py-3 text-sm leading-5 text-white shadow-2xl"
    >
      <WifiOff aria-hidden="true" className="h-5 w-5 shrink-0 text-teal-300" />
      <span><strong className="font-semibold">Offline mode.</strong> Cached converters still work normally.</span>
    </div>
  );
};

export default ConnectivityStatus;
