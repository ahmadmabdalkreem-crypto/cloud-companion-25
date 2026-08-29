import { trackEvent as trackEventFn } from "@/lib/tracking.functions";
import { notifyOrderChange } from "@/lib/realtime";

export type TrackArgs = Parameters<typeof trackEventFn>[0];

type QueueItem = { id: string; args: TrackArgs; queuedAt: number };

const QUEUE_KEY = "elite:offline-events";
const QUEUE_EVENT = "elite:offline-queue-change";

function readQueue(): QueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? (JSON.parse(raw) as QueueItem[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeQueue(items: QueueItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(items));
  window.dispatchEvent(new CustomEvent(QUEUE_EVENT));
}

export function getPendingEventCount() {
  return readQueue().length;
}

export function queueTrackEvent(args: TrackArgs) {
  const items = readQueue();
  items.push({ id: crypto.randomUUID(), args, queuedAt: Date.now() });
  writeQueue(items);
}

function broadcastArgs(args: TrackArgs) {
  const data = (args as unknown as { data?: { sessionId?: string; stage?: string } }).data;
  if (data?.sessionId) notifyOrderChange(data.sessionId, data.stage);
}

export async function flushQueuedEvents() {
  if (typeof window === "undefined" || !navigator.onLine) return 0;

  const items = readQueue();
  if (!items.length) return 0;
  const remaining: QueueItem[] = [];
  let synced = 0;

  for (const item of items) {
    try {
      await trackEventFn(item.args);
      broadcastArgs(item.args);
      synced += 1;
    } catch {
      remaining.push(item);
    }
  }

  writeQueue(remaining);
  return synced;
}

export function subscribeOfflineQueue(onChange: (count: number) => void) {
  if (typeof window === "undefined") return () => {};
  const sync = () => onChange(getPendingEventCount());
  window.addEventListener(QUEUE_EVENT, sync);
  window.addEventListener("storage", sync);
  sync();
  return () => {
    window.removeEventListener(QUEUE_EVENT, sync);
    window.removeEventListener("storage", sync);
  };
}
