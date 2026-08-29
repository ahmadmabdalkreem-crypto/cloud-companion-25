import { useEffect, useState } from "react";
import { CloudOff, CloudUpload, Wifi, WifiOff } from "lucide-react";

import {
  flushQueuedEvents,
  getPendingEventCount,
  subscribeOfflineQueue,
} from "@/lib/offline-queue";

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const updateConnection = () => setIsOnline(navigator.onLine);
    const sync = async () => {
      setIsOnline(true);
      setSyncing(true);
      await flushQueuedEvents();
      setPending(getPendingEventCount());
      setSyncing(false);
    };

    updateConnection();
    setPending(getPendingEventCount());
    window.addEventListener("online", sync);
    window.addEventListener("offline", updateConnection);
    const unsubscribe = subscribeOfflineQueue(setPending);
    void flushQueuedEvents().then(() => setPending(getPendingEventCount()));

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", updateConnection);
      unsubscribe();
    };
  }, []);

  if (isOnline && pending === 0 && !syncing) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-3 z-50 mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 text-xs font-bold text-foreground shadow-[var(--shadow-soft)] backdrop-blur sm:inset-x-auto sm:right-4 sm:left-auto"
      style={{ bottom: "calc(env(safe-area-inset-bottom) + 0.75rem)" }}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
        {!isOnline ? <WifiOff className="h-4 w-4" /> : syncing ? <CloudUpload className="h-4 w-4" /> : <CloudOff className="h-4 w-4" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block">{!isOnline ? "أنت غير متصل حالياً" : "جارٍ مزامنة بياناتك"}</span>
        <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
          {!isOnline
            ? "سيتم حفظ تحديثات الطلب ومزامنتها تلقائياً عند عودة الاتصال"
            : pending > 0
              ? `${pending} تحديث${pending === 1 ? "" : "ات"} بانتظار المزامنة`
              : "تمت مزامنة التحديثات بنجاح"}
        </span>
      </span>
      {isOnline && pending === 0 && <Wifi className="h-4 w-4 text-primary" aria-hidden="true" />}
    </div>
  );
}
