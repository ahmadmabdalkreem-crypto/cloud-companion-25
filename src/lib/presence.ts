import { supabase } from "@/integrations/supabase/client";

const CHANNEL = "visitors";

export type VisitorPresence = {
  sessionId: string;
  path: string;
  online_at: number;
  ua?: string;
};

/** Customer: announce presence on the site. Returns cleanup. */
export function trackVisitor(sessionId: string, getPath: () => string) {
  const ch = supabase.channel(CHANNEL, {
    config: { presence: { key: sessionId } },
  });

  let heartbeat: number | undefined;
  ch.subscribe(async (status) => {
    if (status !== "SUBSCRIBED") return;
    await ch.track({
      sessionId,
      path: getPath(),
      online_at: Date.now(),
      ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "",
    } satisfies VisitorPresence);
    heartbeat = window.setInterval(async () => {
      await ch.track({
        sessionId,
        path: getPath(),
        online_at: Date.now(),
        ua: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 120) : "",
      } satisfies VisitorPresence);
    }, 15000);
  });

  return () => {
    if (heartbeat) window.clearInterval(heartbeat);
    void supabase.removeChannel(ch);
  };
}

/** Dashboard: subscribe to the presence roster. */
export function subscribeVisitors(cb: (list: VisitorPresence[]) => void) {
  const ch = supabase.channel(CHANNEL, {
    config: { presence: { key: "admin" } },
  });
  const emit = () => {
    const state = ch.presenceState<VisitorPresence>();
    const list: VisitorPresence[] = [];
    for (const key of Object.keys(state)) {
      if (key === "admin") continue;
      const latest = state[key]?.[state[key].length - 1];
      if (latest) list.push(latest);
    }
    cb(list);
  };
  ch.on("presence", { event: "sync" }, emit);
  ch.on("presence", { event: "join" }, emit);
  ch.on("presence", { event: "leave" }, emit);
  ch.subscribe(async (status) => {
    if (status === "SUBSCRIBED") await ch.track({ role: "admin" });
  });
  return () => {
    void supabase.removeChannel(ch);
  };
}
