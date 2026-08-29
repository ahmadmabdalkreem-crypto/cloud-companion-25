import { useEffect, useState } from "react";

import { WATCHES, type WatchModel } from "@/lib/watches";

export type OrderState = {
  watchId: string | null;
  /** ملخّص التصميم المختار من صفحة تصميم الساعة */
  spec: string | null;
  name: string;
  phone: string;
  city: string;
};

const KEY = "elite:order";
const LEGACY_WATCH_KEY = "elite:selectedWatch";
const EVENT = "elite:order-change";

const EMPTY: OrderState = { watchId: null, spec: null, name: "", phone: "", city: "" };

export function readOrder(): OrderState {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    const legacy = window.localStorage.getItem(LEGACY_WATCH_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<OrderState>) : {};
    return {
      ...EMPTY,
      ...parsed,
      watchId: parsed.watchId ?? legacy ?? null,
    };
  } catch {
    return EMPTY;
  }
}

export function saveOrder(patch: Partial<OrderState>) {
  if (typeof window === "undefined") return;
  const next = { ...readOrder(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  if (next.watchId) window.localStorage.setItem(LEGACY_WATCH_KEY, next.watchId);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function clearOrder() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
  window.localStorage.removeItem(LEGACY_WATCH_KEY);
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function findWatch(id: string | null | undefined): WatchModel | undefined {
  if (!id) return undefined;
  return WATCHES.find((w) => w.id === id);
}

/** Hydration-safe read of the stored order. */
export function useOrder() {
  const [order, setOrder] = useState<OrderState>(EMPTY);

  useEffect(() => {
    const sync = () => setOrder(readOrder());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { order, watch: findWatch(order.watchId) };
}
