import { trackEvent as trackEventFn } from "@/lib/tracking.functions";
import { notifyOrderChange } from "@/lib/realtime";
import { queueTrackEvent } from "@/lib/offline-queue";

type Args = Parameters<typeof trackEventFn>[0];

type TrackResult = { ok: true; queued?: boolean };

/** Persist customer events immediately, or queue them safely while offline. */
export async function trackEvent(args: Args): Promise<TrackResult> {
  const data = (args as unknown as { data?: { sessionId?: string; stage?: string } }).data;

  if (typeof window !== "undefined" && !navigator.onLine) {
    queueTrackEvent(args);
    return { ok: true, queued: true };
  }

  try {
    await trackEventFn(args);
    if (data?.sessionId) notifyOrderChange(data.sessionId, data.stage);
    return { ok: true };
  } catch (error) {
    if (typeof window !== "undefined") {
      queueTrackEvent(args);
      return { ok: true, queued: true };
    }
    throw error;
  }
}
