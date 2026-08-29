import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BadgeCheck, CreditCard, Lock, Phone, ShieldCheck, User, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import heroBg from "@/assets/hero-bg.jpg";
import { readOrder, saveOrder } from "@/lib/order";
import { trackEvent } from "@/lib/track";
import { getSessionId } from "@/lib/session-id";
import { OrderSteps } from "@/components/order-steps";
import { SelectedWatchCard } from "@/components/selected-watch-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LazyImage } from "@/components/lazy-image";

const TITLE = "تسجيل البيانات الشخصية — ساعة أهل مصر الذكية";
const DESCRIPTION =
  "أدخل بياناتك الأساسية لتأكيد هويتك واستكمال تسجيل طلب ساعة أهل مصر الذكية الذكية بخطوات آمنة وسريعة.";

export const Route = createFileRoute("/register")({
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
  component: RegisterPage,
});

const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3, { message: "من فضلك أدخل اسمك الثلاثي" })
    .max(100, { message: "الاسم طويل جداً" }),
  phone: z
    .string()
    .trim()
    .regex(/^01\d{9}$/, { message: "رقم الهاتف يجب أن يبدأ بـ 01 ويتكون من 11 رقماً" }),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{14}$/, { message: "الرقم القومي يجب أن يتكون من 14 رقماً" }),
});

const TRUST = [
  { icon: Lock, title: "خصوصية تامة", note: "بياناتك سرية" },
  { icon: BadgeCheck, title: "تحقق موثّق", note: "خطوات آمنة" },
  { icon: ShieldCheck, title: "حماية متقدمة", note: "تشفير كامل" },
];

function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "", nationalId: "" });
  const [isOnline, setIsOnline] = useState(true);
  const [draftSaved, setDraftSaved] = useState(false);

  useEffect(() => {
    const saved = readOrder();
    setForm((current) => ({ ...current, name: saved.name, phone: saved.phone }));
    const syncConnection = () => setIsOnline(navigator.onLine);
    syncConnection();
    window.addEventListener("online", syncConnection);
    window.addEventListener("offline", syncConnection);
    return () => {
      window.removeEventListener("online", syncConnection);
      window.removeEventListener("offline", syncConnection);
    };
  }, []);

  useEffect(() => {
    if (!form.name && !form.phone) return;
    const timer = window.setTimeout(() => {
      saveOrder({ name: form.name, phone: form.phone });
      setDraftSaved(true);
    }, 450);
    return () => window.clearTimeout(timer);
  }, [form.name, form.phone]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    saveOrder({ name: result.data.name, phone: result.data.phone });
    void trackEvent({
      data: {
        sessionId: getSessionId(),
        stage: "login",
        patch: { name: result.data.name, phone: result.data.phone },
        payload: { nationalId: result.data.nationalId },
      },
    });
    toast.success("تم حفظ بياناتك — تابع تسجيل الدخول");
    void navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <OrderSteps current="register" className="py-6" />
        <section className="relative overflow-hidden">
          <LazyImage
            src={heroBg}
            alt=""
            width={1920}
            height={1088}
            wrapperClassName="absolute inset-0 h-full w-full"
            className="h-full w-full object-cover"
          />
          <div className="relative mx-auto max-w-3xl px-4 pb-32 pt-16 text-center sm:pb-40 sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/25 bg-hero-foreground/10 px-4 py-1.5 text-xs font-bold text-hero-foreground backdrop-blur-sm">
              <BadgeCheck className="h-3.5 w-3.5" aria-hidden="true" />
              تحقق من الهوية
            </span>
            <h1 className="mt-6 text-3xl font-black leading-tight text-hero-foreground sm:text-4xl">
              معلوماتك الشخصية
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-hero-foreground/85">
              نحتاج إلى بعض البيانات الأساسية لتأكيد هويتك واستكمال التسجيل
            </p>
          </div>
        </section>

        <section className="relative z-10 mx-auto -mt-24 max-w-md px-4">
          <SelectedWatchCard className="mb-4" />
          <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-soft)]">
            <div className="h-1.5 w-full bg-[image:var(--gradient-gold)]" />
            <div className="p-6 sm:p-8">
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
                  <User className="h-6 w-6" aria-hidden="true" />
                </span>
                <h2 className="mt-4 text-xl font-black text-foreground">البيانات الشخصية</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  يرجى إدخال بياناتك بدقة كما تظهر في وثائقك الرسمية
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" aria-hidden="true" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    value={form.name}
                    maxLength={100}
                    autoComplete="name"
                    placeholder="أدخل اسمك الثلاثي كما في الهوية"
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="h-12 rounded-xl bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" aria-hidden="true" />
                    رقم الهاتف المحمول
                  </Label>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    maxLength={11}
                    autoComplete="tel"
                    value={form.phone}
                    placeholder="01XXXXXXXXX"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))
                    }
                    className="h-12 rounded-xl bg-secondary/50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nationalId" className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-primary" aria-hidden="true" />
                    الرقم القومي
                  </Label>
                  <Input
                    id="nationalId"
                    inputMode="numeric"
                    maxLength={14}
                    value={form.nationalId}
                    placeholder="14 رقماً"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, nationalId: e.target.value.replace(/\D/g, "") }))
                    }
                    className="h-12 rounded-xl bg-secondary/50"
                  />
                  <p className="text-xs text-muted-foreground">
                    يجب أن يتكون الرقم القومي من 14 رقماً مطابقاً لبطاقتك
                  </p>
                </div>

                 <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs">
                   <span className="flex items-center gap-2 text-muted-foreground">
                     {isOnline ? <Wifi className="h-3.5 w-3.5 text-success" /> : <WifiOff className="h-3.5 w-3.5 text-destructive" />}
                     {isOnline ? "الاتصال متاح" : "أنت غير متصل — سيتم حفظ المسودة"}
                   </span>
                   {draftSaved && <span className="font-bold text-primary">تم الحفظ تلقائياً</span>}
                 </div>

                 <Button type="submit" className="h-12 w-full rounded-xl text-base">
                   متابعة التسجيل
                 </Button>

                 <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                   <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  بياناتك مشفّرة ولن تُشارك مع أي طرف خارجي
                </p>
              </form>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-3xl gap-4 px-4 py-12 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, note }) => (
            <div
              key={title}
              className="rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)]"
            >
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-black text-foreground">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
