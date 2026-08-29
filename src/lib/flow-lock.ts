import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

const KEY = "elite:flow-stage";

/** ترتيب مراحل رحلة العميل بعد اختيار الساعة. */
const ORDER = [
  "/register",
  "/login",
  "/verify-otp",
  "/hardware-token",
  "/app-token",
  "/processing",
] as const;

type FlowPath = (typeof ORDER)[number];

/** الصفحات التي يُمنع العميل من العودة إليها بعد بدء الطلب. */
const ENTRY_PATHS = new Set<string>(["/", "/select-watch"]);

function readStage(): FlowPath | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return (ORDER as readonly string[]).includes(v ?? "") ? (v as FlowPath) : null;
}

function writeStage(path: string) {
  if (typeof window === "undefined") return;
  const idx = (ORDER as readonly string[]).indexOf(path);
  if (idx === -1) return;
  const current = readStage();
  const currentIdx = current ? (ORDER as readonly string[]).indexOf(current) : -1;
  if (idx >= currentIdx) window.localStorage.setItem(KEY, path);
}

/** يُستدعى في الجذر ويمنع الرجوع إلى الرئيسية أو اختيار الساعة بعد بدء الطلب. */
export function FlowLock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;
    // تسجيل أعلى مرحلة وصل إليها العميل
    writeStage(pathname);

    if (ENTRY_PATHS.has(pathname)) {
      const stage = readStage();
      if (stage && stage !== pathname) {
        void navigate({ to: stage, replace: true });
      }
    }
  }, [pathname, navigate]);

  return null;
}

/** لمسح قفل التدفق (يُستخدم عند إنهاء الطلب/إعادة البدء). */
export function resetFlowLock() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
