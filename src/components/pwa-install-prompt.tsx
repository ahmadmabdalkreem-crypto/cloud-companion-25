import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}

export function PwaInstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;

    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstallEvent(null);

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (!installEvent || dismissed) return null;

  return (
    <div className="fixed inset-x-4 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]" style={{ bottom: "calc(env(safe-area-inset-bottom) + 1rem)" }}>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
        <Download className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-foreground">ثبّت ساعة أهل مصر الذكية على جهازك</p>
        <p className="mt-0.5 text-xs text-muted-foreground">وصول أسرع من الشاشة الرئيسية</p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() => {
          void installEvent.prompt();
          void installEvent.userChoice.then(() => setInstallEvent(null));
        }}
      >
        تثبيت
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="إغلاق إشعار التثبيت"
        onClick={() => setDismissed(true)}
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
