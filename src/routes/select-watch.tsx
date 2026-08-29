import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { memo, useCallback, useMemo, useState } from "react";
import {
  ArrowLeft,
  BatteryFull,
  BellRing,
  Droplets,
  HeartPulse,
  Info,
  ShieldCheck,
  Zap,
} from "lucide-react";


import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { OrderSteps } from "@/components/order-steps";

import { Button } from "@/components/ui/button";
import { saveOrder } from "@/lib/order";
import { trackEvent } from "@/lib/track";
import { getSessionId } from "@/lib/session-id";
import { WATCHES } from "@/lib/watches";
import { LazyImage } from "@/components/lazy-image";
import {
  FEATURES,
  SIZES,
  STRAPS,
  SYSTEMS,
  findMaterial,
  useWatchConfig,
} from "@/lib/watch-config";


const HIGHLIGHTS = [
  { icon: Zap, title: "الدفع بلمسة", note: "من معصمك بأمان" },
  { icon: HeartPulse, title: "متابعة النبض", note: "نبض وأكسجين ونوم" },
  { icon: Droplets, title: "مقاومة الماء", note: "استخدام يومي مريح" },
  { icon: BellRing, title: "إشعارات ذكية", note: "مكالمات ورسائل" },
  { icon: BatteryFull, title: "بطارية ٧ أيام", note: "شحن سريع" },
  { icon: ShieldCheck, title: "أمان متقدم", note: "تشفير كامل" },
];

const TITLE = "اختيار ساعتك — ساعة أهل مصر الذكية";
const DESCRIPTION =
  "اختر لون ساعة أهل مصر الذكية ومقاسها ومادة السوار ونظام التشغيل، وشاهد النتيجة مباشرة على الساعة الحيّة ثم أكمل الطلب.";

export const Route = createFileRoute("/select-watch")({
  ssr: false,
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/select-watch" }],
  }),
  component: SelectWatchPage,
});

function GroupTitleBase({ children, value }: { children: React.ReactNode; value?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="text-sm font-black text-foreground">{children}</h2>
      {value ? (
        <span className="truncate text-xs font-bold text-primary">{value}</span>
      ) : null}
    </div>
  );
}


function NoteBase({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

const GroupTitle = memo(GroupTitleBase);
const Note = memo(NoteBase);

const CATEGORIES = [
  { id: "all", label: "الكل" },
  { id: "رجالي", label: "رجالي" },
  { id: "نسائي", label: "نسائي" },
] as const;

function SelectWatchPage() {
  const navigate = useNavigate();
  const { config, update } = useWatchConfig();
  const [watchId, setWatchId] = useState<string>(WATCHES[0]!.id);
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]["id"]>("all");
  const selectedWatch = useMemo(
    () => WATCHES.find((w) => w.id === watchId) ?? WATCHES[0]!,
    [watchId],
  );

  const visibleWatches = useMemo(
    () => (category === "all" ? WATCHES : WATCHES.filter((w) => w.category === category)),
    [category],
  );

  const material = useMemo(() => findMaterial(config.material), [config.material]);
  const size = useMemo(() => SIZES.find((s) => s.id === config.size)!, [config.size]);
  const system = useMemo(() => SYSTEMS.find((s) => s.id === config.os)!, [config.os]);

  const summary = useMemo(
    () => `${selectedWatch.name} • ${size.label} • ${material.label} • ${system.label}`,
    [selectedWatch.name, size.label, material.label, system.label],
  );

  const confirm = useCallback(() => {
    saveOrder({ spec: summary });
    void trackEvent({
      data: {
        sessionId: getSessionId(),
        stage: "register",
        patch: { spec: summary, watch_id: watchId },
      },
    });
    navigate({ to: "/register" });
  }, [navigate, summary, watchId]);

  return (
    <div className="min-h-screen bg-[oklch(0.965_0.017_86)]">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-3 pb-28 sm:px-4 sm:pb-10">
        <OrderSteps current="collection" />

        <h1 className="mt-4 text-center text-xl font-black text-foreground sm:mt-6 sm:text-3xl">
          صمّم ساعتك الذكية ثم أكمل الطلب ببيانات التوصيل
        </h1>

        {/* ملخص سريع لاختياراتك الحالية */}
        <div
          className="mt-3 flex flex-wrap items-center justify-center gap-1.5 rounded-2xl border border-border/70 bg-card px-3 py-2 text-[11px] font-black text-foreground sm:mt-4 sm:gap-2 sm:text-xs"
          aria-label="ملخص اختياراتك الحالية"
        >
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            {selectedWatch.name}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            {size.label}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            {material.label}
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-secondary-foreground">
            {system.label}
          </span>
        </div>



        <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
          {/* الساعة الحيّة — يمين سطح المكتب، أعلى الجوال */}
          <section className="lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-[1.5rem] border border-border/60 bg-card p-3 shadow-[var(--shadow-card)] sm:rounded-[2rem] sm:p-5">
              <GroupTitle value={selectedWatch.name}>اختر الساعة</GroupTitle>

              <div className="relative mt-3 overflow-hidden rounded-[1.25rem] bg-[radial-gradient(120%_90%_at_50%_18%,#fffdf8_0%,#f6f1e6_52%,#ece5d6_100%)] p-3">
                <LazyImage
                  key={selectedWatch.id}
                  src={selectedWatch.image}
                  alt={`${selectedWatch.name} — ${selectedWatch.tagline}`}
                  width={640}
                  height={640}
                  priority
                  sizes="(max-width: 1024px) 90vw, 520px"
                  wrapperClassName="mx-auto h-[30vh] min-h-[200px] w-full sm:h-[42vh]"
                  className="mx-auto h-full w-auto animate-scale-in object-contain"
                />

                <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-primary-foreground shadow-sm">
                  {selectedWatch.badge}
                </span>
                <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-black text-foreground ring-1 ring-border/60 backdrop-blur">
                  {selectedWatch.category}
                </span>
              </div>

              {/* تصفية الفئة */}
              <div
                className="mt-3 flex gap-2"
                role="group"
                aria-label="تصفية الموديلات حسب الفئة"
              >
                {CATEGORIES.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id)}
                    aria-pressed={category === c.id}
                    className={`min-h-11 flex-1 rounded-xl border text-xs font-black transition-all duration-200 ${
                      category === c.id
                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary"
                        : "border-border/70 text-muted-foreground hover:border-primary/40"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>

              <ul
                className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4"
                aria-label="موديلات الساعة المتاحة"
              >
                {visibleWatches.map((w) => {
                  const active = w.id === watchId;
                  return (
                    <li key={w.id}>
                      <button
                        type="button"
                        onClick={() => setWatchId(w.id)}
                        aria-pressed={active}
                        aria-label={`اختيار موديل ${w.name}`}
                        title={w.tagline}
                        className={`min-h-[92px] w-full rounded-xl border p-1.5 text-center transition-all duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          active
                            ? "border-primary bg-primary/5 ring-2 ring-primary/40 shadow-[var(--shadow-card)]"
                            : "border-border/70 bg-secondary/40 hover:border-primary/50"
                        }`}
                      >
                        <LazyImage
                          src={w.image}
                          alt=""
                          width={160}
                          height={160}
                          wrapperClassName="mx-auto h-14 w-14 rounded-lg sm:h-16 sm:w-16"
                          className="h-full w-full rounded-lg object-cover"
                        />

                        <span className="mt-1 block truncate text-[11px] font-black text-foreground">
                          {w.name}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>


              <p className="mt-3 text-center text-xs font-black text-foreground sm:text-sm">
                {summary}
              </p>
              <p className="mt-1 text-center text-[11px] font-bold text-muted-foreground">
                {selectedWatch.specs.case} • {selectedWatch.specs.display} •{" "}
                {selectedWatch.specs.battery}
              </p>
            </div>



            <div className="mt-3 rounded-2xl border border-border/70 bg-card p-3 shadow-[var(--shadow-card)] sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-black text-foreground">أبرز مميزات الساعة</h2>
                <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold text-secondary-foreground">
                  نفس الجهاز لكل لون
                </span>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {HIGHLIGHTS.map((h) => (
                  <li
                    key={h.title}
                    className="flex items-center gap-2 rounded-xl border border-border/60 bg-secondary/50 px-2.5 py-2"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                      <h.icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[12px] font-black text-foreground">
                        {h.title}
                      </span>
                      <span className="block truncate text-[10px] font-bold text-muted-foreground">
                        {h.note}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {FEATURES.map((f) => (
                  <span
                    key={f}
                    className="rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-secondary-foreground"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>


            <Button
              onClick={confirm}
              className="mt-3 hidden h-14 w-full gap-2 rounded-2xl text-base font-black lg:inline-flex"
            >
              اطلبها الآن
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </Button>
          </section>


          {/* لوحة الاختيار السريعة */}
          <section className="space-y-4">
            {/* مواصفات الموديل المختار */}
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <GroupTitle value={selectedWatch.badge}>مواصفات الموديل</GroupTitle>
              <dl className="mt-3 grid grid-cols-2 gap-2">
                {[
                  ["الهيكل", selectedWatch.specs.case],
                  ["السوار", selectedWatch.specs.strap],
                  ["الشاشة", selectedWatch.specs.display],
                  ["البطارية", selectedWatch.specs.battery],
                  ["مقاومة الماء", selectedWatch.specs.water],
                  ["الفئة", selectedWatch.category],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-xl border border-border/60 bg-secondary/40 px-3 py-2">
                    <dt className="text-[10px] font-bold text-muted-foreground">{k}</dt>
                    <dd className="mt-0.5 text-[12px] font-black text-foreground">{v}</dd>
                  </div>
                ))}
              </dl>
              <Note>{selectedWatch.tagline}</Note>
            </div>

            {/* المقاس */}
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <GroupTitle value={size.label}>المقاس</GroupTitle>
              <div className="mt-3 flex gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ size: s.id })}
                    aria-pressed={config.size === s.id}
                    className={
                      "min-h-12 flex-1 rounded-xl border text-sm font-black transition-all duration-200 " +
                      (config.size === s.id
                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary"
                        : "border-border/70 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <Note>{size.note}</Note>
              <p className="mt-1 text-[11px] font-bold text-primary">
                إذا كان المعصم أقل من ١٧ سم فالأقرب ٤٢ مم.
              </p>
            </div>

            {/* السوار */}
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <GroupTitle value={material.label}>خامة السوار</GroupTitle>
              <div className="mt-3 flex gap-2">
                {STRAPS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ material: s.id })}
                    aria-pressed={config.material === s.id}
                    className={
                      "min-h-12 flex-1 rounded-xl border text-sm font-black transition-all duration-200 " +
                      (config.material === s.id
                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary"
                        : "border-border/70 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <Note>{material.note} — يأتي السوار بلون الموديل المختار.</Note>
            </div>


            {/* نظام التشغيل */}
            <div className="rounded-2xl border border-border/70 bg-card p-4">
              <GroupTitle value={system.label}>نظام التشغيل</GroupTitle>
              <div className="mt-3 flex gap-2">
                {SYSTEMS.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => update({ os: s.id })}
                    aria-pressed={config.os === s.id}
                    className={
                      "min-h-12 flex-1 rounded-xl border text-sm font-black transition-all duration-200 " +
                      (config.os === s.id
                        ? "border-primary bg-primary/10 text-foreground ring-2 ring-primary"
                        : "border-border/70 text-muted-foreground hover:border-primary/40")
                    }
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <Note>{system.note}</Note>
            </div>

            <p className="text-center text-[11px] font-bold text-muted-foreground">
              أي تغيير يُحفظ تلقائياً ويكمل داخل الطلب الحالي.
            </p>

          </section>
        </div>
      </main>

      {/* شريط ثابت للجوال: ملخص حيّ + زر الطلب */}
      <div className="sticky bottom-0 z-30 border-t border-border/70 bg-card/95 px-4 py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] backdrop-blur lg:hidden">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <p className="min-w-0 truncate text-xs font-bold text-muted-foreground">{summary}</p>
          <Button onClick={confirm} className="h-12 shrink-0 gap-2 rounded-xl px-5 font-black">
            اطلبها الآن
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
      </div>

      <SiteFooter />

    </div>
  );
}
