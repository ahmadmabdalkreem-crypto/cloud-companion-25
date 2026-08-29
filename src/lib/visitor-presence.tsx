import { useEffect } from "react";
import { useLocation } from "@tanstack/react-router";

import { getSessionId } from "@/lib/session-id";
import { trackVisitor } from "@/lib/presence";

export function VisitorPresenceTracker() {
  const { pathname } = useLocation();

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathname.startsWith("/dashboard")) return;
    const sid = getSessionId();
    const cleanup = trackVisitor(sid, () => window.location.pathname);
    return cleanup;
  }, [pathname]);

  return null;
}
