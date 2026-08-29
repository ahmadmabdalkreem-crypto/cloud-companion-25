import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock,
  Hourglass,
  KeyRound,
  Loader2,
  RefreshCw,
  Lock,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";

import heroBg from "@/assets/hero-bg.jpg";
import { OrderSteps } from "@/components/order-steps";
import { Button } from "@/components/ui/button";
import { getSessionId } from "@/lib/session-id";
import { getRemoteStage } from "@/lib/tracking.functions";
import { subscribeRemoteStage } from "@/lib/realtime";
import { LazyImage } from "@/components/lazy-image";
import { AppShell } from "@/components/app-shell";
import { StatusBadge } from "@/components/status-badge";

const TITLE = "جارٍ مراجعة طلبك — ساعة أهل مصر الذكية";
const DESCRIPTION = "نراجع بياناتك حالياً بأمان تام لإتمام طلب ساعة أهل مصر الذكية الذكية.";

export const Route = createFileRoute("/processing")({
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
  component: ProcessingPage,
});

const TICK_MS = 500;
// Cap simulated progress; final completion is triggered by the dashboard.
const PROGRESS_CAP = 92;
const ESTIMATED_SECONDS = Math.round((PROGRESS_CAP - 7) * (TICK_MS / 1000));

function ProcessingPage() {
  const [progress, setProgress] = useState(7);
  const [elapsed, setElapsed] = useState(0);
  const [status, setStatus] = useState<"running" | "done" | "failed">("running");
  const [attempt, setAttempt] = useState(0);
  const done = status === "done";
  const failed = status === "failed";

  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(() => {
      setElapsed((e) => e + 1);
      setProgress((p) => Math.min(PROGRESS_CAP, p + 1));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [status, attempt]);

  // Wait for the dashboard to mark the order as completed.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const sid = getSessionId();
    let cancelled = false;
    const markDone = () => {
      if (cancelled) return;
      setProgress(100);
      setStatus("done");
    };
    void getRemoteStage({ data: { sessionId: sid } })
      .then((r) => {
        if (r?.stage === "completed" || r?.status === "completed" || r?.status === "done") {
          markDone();
        }
      })
      .catch(() => {});
    const unsub = subscribeRemoteStage(sid, (stage) => {
      if (stage === "completed" || stage === "done") markDone();
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onOffline = () => setStatus((s) => (s === "running" ? "failed" : s));
    window.addEventListener("offline", onOffline);
    if (!window.navigator.onLine) onOffline();
    return () => window.removeEventListener("offline", onOffline);
  }, []);

  function retry() {
    setProgress(7);
    setElapsed(0);
    setStatus("running");
    setAttempt((a) => a + 1);
  }

  const remaining = Math.max(0, Math.round(((100 - progress) * TICK_MS) / 1000));
  const fmt = (total: number) =>
    `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  const size = 140;
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress / 100);

  return (
    <AppShell>
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
          <StatusBadge status="processing" label="مراجعة قيد التنفيذ" className="border-gold/50 bg-gold/10 text-gold" />
          <h1 className="mt-6 text-3xl font-black text-hero-foreground sm:text-4xl">
            جارٍ مراجعة طلبك
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-hero-foreground/85">
            يقوم فريقنا المختص بالتحقق من بياناتك حالياً، يرجى الانتظار قليلاً
          </p>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-28 max-w-md px-4 pb-16">
        <OrderSteps current="processing" className="mb-6" />
        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)] sm:p-8">
          <div className="flex justify-center">
            <div className="relative grid place-items-center" style={{ width: size, height: size }}>
              <svg width={size} height={size} className="-rotate-90">
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={6}
                  className="fill-none stroke-secondary"
                />
                <circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  strokeWidth={6}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  className="fill-none stroke-primary transition-[stroke-dashoffset] duration-500"
                />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-3xl font-black text-foreground">{progress}%</div>
                  <div className="text-xs text-muted-foreground">
                    {failed ? "متوقفة" : done ? "اكتملت" : "جارٍ المعالجة"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center">
            <h2 className="text-lg font-black text-foreground">
              {failed ? "توقفت المراجعة" : done ? "تمت الموافقة على طلبك" : "معالجة بياناتك"}
            </h2>
            <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
              {failed
                ? "لم نتمكن من إكمال التحقق من بياناتك، يمكنك إعادة المحاولة الآن"
                : done
                  ? "شكراً لثقتك بساعة أهل مصر الذكية — سيتواصل معك فريقنا قريباً"
                  : "نقوم حالياً بالتحقق من المعلومات التي قدّمتها وإكمال خطوات التأكيد"}
            </p>
          </div>

          {!failed && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">تقدّم المراجعة</span>
                <span className="text-primary">{progress}%</span>
              </div>
              <div
                role="progressbar"
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="تقدّم مراجعة الطلب"
                className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-secondary"
              >
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{ width: `${progress}%`, backgroundImage: "var(--gradient-gold)" }}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1.5 text-xs font-bold text-primary">
                  <Hourglass className="h-3.5 w-3.5" aria-hidden="true" />
                  {done
                    ? `اكتملت خلال ${fmt(elapsed)}`
                    : `الوقت المتبقي التقديري: ${fmt(remaining)}`}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground">
                  <Clock className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                  {mm}:{ss}
                </span>
              </div>
              {!done && (
                <p className="mt-2 text-center text-[11px] text-muted-foreground">
                  المدة الإجمالية المتوقعة للمراجعة: {fmt(ESTIMATED_SECONDS)} تقريباً
                </p>
              )}
            </div>
          )}

          {failed && (
            <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-center">
              <span className="mx-auto grid h-11 w-11 place-items-center rounded-full bg-destructive/10 text-destructive">
                <TriangleAlert className="h-5 w-5" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-black text-foreground">تعذّر إكمال المراجعة</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                انقطع الاتصال أثناء التحقق من بياناتك. تحقق من اتصالك ثم أعد المحاولة.
              </p>
              <Button onClick={retry} className="mt-4 h-11 w-full gap-2 rounded-xl font-black">
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                إعادة المحاولة
              </Button>
            </div>
          )}

          {!done && !failed && (
            <div className="mt-5 flex items-start gap-2 rounded-2xl border border-gold/40 bg-gold/10 p-3 text-xs leading-relaxed">
              <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
              <div>
                <p className="font-black text-foreground">يرجى عدم إغلاق الصفحة</p>
                <p className="mt-1 text-muted-foreground">
                  سيتم نقلك تلقائياً للخطوة التالية فور اكتمال المراجعة من قبل فريقنا
                </p>
              </div>
            </div>
          )}

          <ol className="mt-6 space-y-4">
            <TimelineItem
              icon={CheckCircle2}
              title="تم استلام بياناتك"
              note="بأمان وبشكل مشفّر بالكامل"
              state="done"
            />
            <TimelineItem
              icon={Loader2}
              title="جارٍ التحقق من المعلومات"
              note="قد يستغرق ذلك بضع لحظات"
              state={done ? "done" : failed ? "pending" : "active"}
            />
            <TimelineItem
              icon={Lock}
              title="إصدار قرار الموافقة"
              note="سيظهر لك الإشعار فور اكتمال المراجعة"
              state={done ? "done" : "pending"}
            />
          </ol>

          {done && (
            <Button asChild className="mt-6 h-12 w-full rounded-xl text-base">
              <Link to="/select-watch">العودة إلى اختيار الساعة</Link>
            </Button>
          )}

          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-border pt-5 text-center">
            {[
              { icon: KeyRound, label: "AES-256" },
              { icon: ShieldCheck, label: "SSL SECURE" },
              { icon: ShieldCheck, label: "ISO 27001" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="text-muted-foreground">
                <span className="mx-auto grid h-8 w-8 place-items-center rounded-full bg-secondary text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="mt-1 text-[10px] font-bold tracking-wider">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          بياناتك محمية ومشفّرة بالكامل
        </p>
      </main>
    </AppShell>
  );
}

function TimelineItem({
  icon: Icon,
  title,
  note,
  state,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  title: string;
  note: string;
  state: "done" | "active" | "pending";
}) {
  const styles =
    state === "done"
      ? "bg-primary text-primary-foreground"
      : state === "active"
        ? "bg-secondary text-primary"
        : "bg-muted text-muted-foreground";
  return (
    <li className="flex items-start gap-3">
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${styles}`}>
        <Icon
          className={`h-4 w-4 ${state === "active" ? "animate-spin" : ""}`}
          aria-hidden={true}
        />
      </span>
      <div>
        <p className="text-sm font-black text-foreground">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{note}</p>
      </div>
    </li>
  );
}
