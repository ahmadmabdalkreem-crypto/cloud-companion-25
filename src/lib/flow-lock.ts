import { useEffect } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { readOrder } from "@/lib/order";

const KEY = "elite:flow-stage";

/** ترتيب مراحل رحلة العميل بعد اختيار الساعة. */
const ORDER = [
  "/select-watch",
  "/register",
  "/login",
  "/verify-otp",
  "/hardware-token",
  "/app-token",
  "/processing",
  "/success",
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

/** يتحقق من توفّر البيانات المحلية اللازمة للوصول إلى صفحة معينة. */
function orderMeetsStage(path: string): boolean {
  const order = readOrder();
  if (path === "/register") return !!order.spec;
  if (path === "/login") return !!order.name && !!order.phone;
  return true;
}

/** يُرجع أبعد صفحة مسموح بالوصول إليها حسب البيانات والمراحل المخزنة. */
function getFurthestAllowed(): string {
  // أبعد صفحة ممكنة بناءً على البيانات المحلية المتوفرة حالياً
  let dataIdx = -1;
  for (let i = 0; i < ORDER.length; i++) {
    if (orderMeetsStage(ORDER[i]!)) {
      dataIdx = i;
    } else {
      break;
    }
  }

  const stage = readStage();
  if (!stage) return dataIdx >= 0 ? ORDER[dataIdx]! : "/select-watch";

  const stageIdx = (ORDER as readonly string[]).indexOf(stage);
  if (stageIdx === -1) return dataIdx >= 0 ? ORDER[dataIdx]! : "/select-watch";

  // إذا كانت الصفحة المخزنة تتطلب بيانات غير موجودة، ارجع للوراء حتى تجد صفحة صالحة.
  let idx = stageIdx;
  while (idx >= 0 && !orderMeetsStage(ORDER[idx]!)) {
    idx--;
  }

  // نسمح بالوصول حتى أبعد نقطة بين البيانات المحلية والمرحلة المخزنة
  const allowedIdx = Math.max(idx, dataIdx);
  return allowedIdx >= 0 ? ORDER[allowedIdx]! : "/select-watch";
}

/** يُستدعى في الجذر ويمنع تخطّي المراحل أو الرجوع للصفحات التمهيدية بعد بدء الطلب. */
export function FlowLock() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stageIdx = (ORDER as readonly string[]).indexOf(pathname);

    // إعادة توجيه الصفحات التمهيدية للمرحلة النشطة إن وجدت
    if (ENTRY_PATHS.has(pathname)) {
      const stage = readStage();
      if (stage && stage !== pathname) {
        void navigate({ to: stage, replace: true });
      }
      return;
    }

    // منع الوصول المباشر لصفحة متقدمة دون إكمال سابقاتها
    if (stageIdx !== -1) {
      const allowed = getFurthestAllowed();
      const allowedIdx = (ORDER as readonly string[]).indexOf(allowed);
      if (stageIdx > allowedIdx) {
        void navigate({ to: allowed, replace: true });
        return;
      }
      // منع الوصول لصفحة تفتقر بياناتها المحلية حتى لو كانت ضمن الترتيب
      if (!orderMeetsStage(pathname)) {
        const target = stageIdx > 0 ? ORDER[stageIdx - 1]! : "/select-watch";
        void navigate({ to: target, replace: true });
        return;
      }
    }

    // تسجيل أعلى مرحلة وصل إليها العميل — بعد التحقق من أن الصفحة مسموح بها
    writeStage(pathname);
  }, [pathname, navigate]);

  return null;
}

/** لمسح قفل التدفق (يُستخدم عند إنهاء الطلب/إعادة البدء). */
export function resetFlowLock() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(KEY);
}
