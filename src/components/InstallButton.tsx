import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

// Captured beforeinstallprompt event (module scope so it survives re-renders).
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
let deferredPrompt: BeforeInstallPromptEvent | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    window.dispatchEvent(new Event("pwa-installable"));
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
  });
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches === true ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

export default function InstallButton() {
  const [showHint, setShowHint] = useState(false);
  const [standalone, setStandalone] = useState(isStandalone());

  useEffect(() => {
    const mq = window.matchMedia?.("(display-mode: standalone)");
    const onChange = () => setStandalone(isStandalone());
    mq?.addEventListener?.("change", onChange);
    window.addEventListener("appinstalled", onChange);
    return () => {
      mq?.removeEventListener?.("change", onChange);
      window.removeEventListener("appinstalled", onChange);
    };
  }, []);

  if (standalone) return null; // already installed

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  const onClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        deferredPrompt = null;
        return;
      }
      deferredPrompt = null;
    }
    setShowHint(true);
  };

  return (
    <>
      <button
        onClick={() => void onClick()}
        title="Install this app"
        className="flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <Download className="h-3.5 w-3.5" />
        <span className="hidden xs:inline">Install</span>
      </button>

      {showHint && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          onClick={() => setShowHint(false)}
        >
          <div
            className="w-full max-w-sm rounded-lg border bg-background p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Install the tracker app</p>
              <button
                onClick={() => setShowHint(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {isIOS ? (
              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  Tap the <span className="font-medium text-foreground">Share</span>{" "}
                  button (square with an arrow) in Safari's toolbar.
                </li>
                <li>
                  Scroll down and tap{" "}
                  <span className="font-medium text-foreground">
                    Add to Home Screen
                  </span>
                  .
                </li>
                <li>Tap Add — the tracker opens full-screen from its own icon.</li>
              </ol>
            ) : (
              <ol className="list-decimal pl-5 space-y-1.5 text-sm text-muted-foreground">
                <li>
                  Open the browser menu{" "}
                  <span className="font-medium text-foreground">(⋮)</span>.
                </li>
                <li>
                  Tap{" "}
                  <span className="font-medium text-foreground">
                    Install app
                  </span>{" "}
                  or{" "}
                  <span className="font-medium text-foreground">
                    Add to Home screen
                  </span>
                  .
                </li>
                <li>Confirm — the tracker opens full-screen from its own icon.</li>
              </ol>
            )}
          </div>
        </div>
      )}
    </>
  );
}
