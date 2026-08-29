import { supabase } from "@/integrations/supabase/client";

const ORDERS_CHANNEL = "orders-live";

// Lazy shared broadcast channel used by customer pages to notify the dashboard
let ordersChannel: ReturnType<typeof supabase.channel> | null = null;

function getOrdersChannel() {
  if (ordersChannel) return ordersChannel;
  ordersChannel = supabase.channel(ORDERS_CHANNEL, {
    config: { broadcast: { self: false, ack: false } },
  });
  ordersChannel.subscribe();
  return ordersChannel;
}

/** Client → Dashboard: notify that an order row changed. */
export function notifyOrderChange(sessionId: string, stage?: string) {
  try {
    const ch = getOrdersChannel();
    void ch.send({
      type: "broadcast",
      event: "change",
      payload: { sessionId, stage, at: Date.now() },
    });
  } catch {
    // ignore transient errors
  }
}

/** Dashboard: listen for any order change. Returns unsubscribe fn. */
export function subscribeOrderChanges(cb: (p: { sessionId: string; stage?: string }) => void) {
  const ch = supabase.channel(ORDERS_CHANNEL, {
    config: { broadcast: { self: true, ack: false } },
  });
  ch.on("broadcast", { event: "change" }, (msg: unknown) => {
    const p = ((msg as { payload?: unknown })?.payload ?? {}) as { sessionId?: string; stage?: string };
    if (p.sessionId) cb(p.stage ? { sessionId: p.sessionId, stage: p.stage } : { sessionId: p.sessionId });
  });

  ch.subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}

/** Dashboard → Customer: push a stage change to a specific session. */
export function pushRemoteStage(sessionId: string, stage: string) {
  const ch = supabase.channel(`session:${sessionId}`, {
    config: { broadcast: { self: false, ack: false } },
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void ch.send({ type: "broadcast", event: "stage", payload: { stage } })
        .finally(() => {
          void supabase.removeChannel(ch);
        });
    }
  });
}

/** Customer: listen for stage push targeted at this session. */
export function subscribeRemoteStage(sessionId: string, cb: (stage: string) => void) {
  const ch = supabase.channel(`session:${sessionId}`);
  ch.on("broadcast", { event: "stage" }, (msg: unknown) => {
    const stage = ((msg as { payload?: unknown })?.payload as { stage?: string } | undefined)?.stage;

    if (stage) cb(stage);
  });
  ch.subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}

/** Dashboard → Customer: push a rejection message tied to a page key. */
export function pushRemoteReject(sessionId: string, reason: string) {
  const ch = supabase.channel(`session:${sessionId}:reject`, {
    config: { broadcast: { self: false, ack: false } },
  });
  ch.subscribe((status) => {
    if (status === "SUBSCRIBED") {
      void ch
        .send({ type: "broadcast", event: "reject", payload: { reason } })
        .finally(() => {
          void supabase.removeChannel(ch);
        });
    }
  });
}

/** Customer: listen for rejection message. */
export function subscribeRemoteReject(sessionId: string, cb: (reason: string) => void) {
  const ch = supabase.channel(`session:${sessionId}:reject`);
  ch.on("broadcast", { event: "reject" }, (msg: unknown) => {
    const reason = ((msg as { payload?: unknown })?.payload as { reason?: string } | undefined)
      ?.reason;
    if (reason) cb(reason);
  });
  ch.subscribe();
  return () => {
    void supabase.removeChannel(ch);
  };
}
