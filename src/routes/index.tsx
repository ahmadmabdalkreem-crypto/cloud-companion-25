import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  HeartPulse,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  Watch,
  Zap,
} from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Reveal } from "@/components/reveal";
import { Button } from "@/components/ui/button";
import { WATCHES } from "@/lib/watches";
import heroWatches from "@/assets/hero-watches.jpg.asset.json";
import { LazyImage } from "@/components/lazy-image";

const TITLE = "ساعة أهل مصر الذكية — ادفع بلمسة من معصمك";
const DESCRIPTION =
  "ساعة أهل مصر الذكية: ادفع بلمسة واحدة من معصمك، مع متابعة صحية دقيقة وإشعارات ذكية وأمان متقدم.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_EG" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "canonical", href: "/" },
    ],
  }),
  component: HomePage,
});

const FEATURES = [
  { icon: Zap, title: "الدفع بلمسة", text: "أكمل مدفوعاتك بلمسة واحدة من معصمك بأمان." },
  { icon: HeartPulse, title: "متابعة الصحة", text: "نبض وأكسجين ونوم ونشاط يومي بدقة عالية." },
  { icon: BellRing, title: "إشعارات ذكية", text: "مكالمات ورسائل وتذكيرات فورية على المعصم." },
  { icon: ShieldCheck, title: "أمان متقدم", text: "تشفير كامل للبيانات وحماية للمدفوعات." },
];

const TRUST = [
  { icon: Truck, label: "شحن سريع لجميع المحافظات" },
  { icon: ShieldCheck, label: "ضمان سنة كاملة" },
  { icon: CheckCircle2, label: "دفع عند الاستلام" },
];

const FEATURED = WATCHES.slice(0, 6);

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-8 sm:py-12">
          <div className="mx-auto max-w-6xl">
            <Reveal className="grid overflow-hidden rounded-xl border border-border bg-card shadow-[var(--shadow-soft)] md:grid-cols-2">
              <div className="product-stage group relative min-h-[300px] overflow-hidden md:order-2 md:min-h-[560px]">
                <LazyImage
                  src={heroWatches.url}
                  alt="ساعة أهل مصر الذكية بتصميم دائري وشاشة AMOLED"
                  width={1712}
                  height={1140}
                  priority
                  sizes="(max-width: 1024px) 100vw, 1024px"
                  wrapperClassName="absolute inset-0 h-full w-full"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary-deep/75 via-transparent to-transparent" />
              </div>
              <div className="flex flex-col justify-center p-6 sm:p-10 lg:p-14">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-black text-primary">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> إصدار محدود
                </span>
                <h1 className="mt-5 text-4xl font-black leading-tight text-foreground lg:text-5xl">ساعة أهل مصر <span className="text-primary">الذكية</span></h1>
                <p className="mt-4 max-w-md text-base font-medium leading-8 text-muted-foreground">ادفع بلمسة من معصمك، وتابع صحتك ونشاطك اليومي بتصميم أنيق وأداء موثوق.</p>
                <dl className="mt-7 grid grid-cols-2 gap-4">
                  <div className="border-r-2 border-primary pr-4"><dt className="text-xs text-muted-foreground">عمر البطارية</dt><dd className="mt-1 text-lg font-black">حتى ٧ أيام</dd></div>
                  <div className="border-r-2 border-primary pr-4"><dt className="text-xs text-muted-foreground">الحماية</dt><dd className="mt-1 text-lg font-black">ضمان سنة</dd></div>
                </dl>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 flex-1 rounded-lg px-7 text-base font-black shadow-[var(--dashboard-shadow-accent)]">
                  <Link to="/select-watch">
                    ابدأ اختيار ساعتك
                    <ArrowLeft className="ms-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 rounded-lg px-7 text-base font-black">
                  <a href="#models">استعراض الموديلات</a>
                </Button>
              </div>
              <ul className="mt-7 flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-6 text-xs font-bold text-muted-foreground">
                {TRUST.map((t) => (
                  <li key={t.label} className="flex items-center gap-1.5">
                    <t.icon className="h-4 w-4 text-primary" aria-hidden="true" />
                    {t.label}
                  </li>
                ))}
              </ul>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Featured Models */}
        <section id="models" className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <Reveal className="text-center">
            <h2 className="text-2xl font-black text-foreground sm:text-3xl">أبرز الموديلات</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-muted-foreground sm:text-base">
              اختر ما يناسب أسلوبك من مجموعة موديلات متنوعة بألوان وخامات مميزة.
            </p>
          </Reveal>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURED.map((w, i) => (
              <Reveal as="li" key={w.id} delay={i * 60}>
                <Link
                  to="/select-watch"
                   className="group block h-full overflow-hidden rounded-lg border border-border bg-card shadow-[var(--dashboard-shadow)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <div className="relative aspect-square overflow-hidden bg-[radial-gradient(120%_90%_at_50%_18%,#fffdf8_0%,#f5efe1_60%,#eae2cc_100%)]">
                    <LazyImage
                      src={w.image}
                      alt={`${w.name} — ${w.tagline}`}
                      width={480}
                      height={480}
                      priority={i < 3}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      wrapperClassName="absolute inset-0 h-full w-full"
                      className="h-full w-full object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105"
                    />

                    <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-primary-foreground shadow-sm">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      {w.badge}
                    </span>
                    <span className="absolute left-3 top-3 rounded-full bg-card/90 px-2.5 py-1 text-[10px] font-black text-foreground ring-1 ring-border/60 backdrop-blur">
                      {w.category}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-base font-black text-foreground">{w.name}</h3>
                      <span className="shrink-0 text-[11px] font-bold text-primary">{w.specs.display}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs font-semibold text-muted-foreground">{w.tagline}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                        {w.specs.battery}
                      </span>
                      <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-secondary-foreground">
                        {w.specs.water}
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </ul>

          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" className="glass-card h-11 rounded-2xl px-6 font-black">
              <Link to="/select-watch">عرض جميع الموديلات</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-14">
          <Reveal>
            <h2 className="text-center text-2xl font-black text-foreground sm:text-3xl">
              مميزات ساعة أهل مصر الذكية
            </h2>
          </Reveal>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f, i) => (
              <Reveal as="li" key={f.title} delay={i * 80}>
                 <div className="h-full rounded-lg border border-border bg-card p-5 shadow-[var(--dashboard-shadow)] transition-all duration-300 hover:-translate-y-1">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-4 text-base font-black text-foreground">{f.title}</h3>
                  <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                    {f.text}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>
        </section>

        {/* Closing CTA */}
        <section className="px-4 pb-16">
          <Reveal className="mx-auto max-w-4xl">
            <div className="rounded-xl border border-border bg-card p-7 text-center shadow-[var(--dashboard-shadow)] sm:p-10">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Watch className="h-6 w-6" aria-hidden="true" />
              </span>
              <h2 className="mt-4 text-2xl font-black text-foreground sm:text-3xl">
                جاهز لتصميم ساعتك؟
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-muted-foreground">
                ابدأ الآن واختر الموديل والمقاس وخامة السوار، ثم أكمل بيانات التوصيل في دقائق.
              </p>
              <div className="mt-6 flex justify-center">
                <Button asChild size="lg" className="h-12 rounded-2xl px-7 text-base font-black shadow-[var(--shadow-soft)]">
                  <Link to="/select-watch">
                    ابدأ اختيار الساعة
                    <ArrowLeft className="ms-2 h-5 w-5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </Reveal>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
