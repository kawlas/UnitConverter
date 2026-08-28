import { useEffect, useState } from "react";
import { Download } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const InstallAppButton = () => {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent>();

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const clearPrompt = () => setInstallPrompt(undefined);

    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", clearPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", clearPrompt);
    };
  }, []);

  if (!installPrompt) return null;

  const install = async () => {
    try {
      await installPrompt.prompt();
      await installPrompt.userChoice;
    } catch {
      // The browser owns the prompt and may cancel it independently of the page.
    } finally {
      setInstallPrompt(undefined);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void install()}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-md font-medium text-indigo-700 underline-offset-4 hover:text-indigo-900 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
    >
      <Download aria-hidden="true" className="h-4 w-4" />
      Install app
    </button>
  );
};

export default InstallAppButton;
