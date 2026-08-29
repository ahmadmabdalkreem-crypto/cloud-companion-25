import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { BadgeCheck, CheckCircle2, Phone, ShieldCheck, Watch } from "lucide-react";

import heroBg from "@/assets/hero-bg.jpg";
import { AppShell } from "@/components/app-shell";
import { LazyImage } from "@/components/lazy-image";
import { OrderSteps } from "@/components/order-steps";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { clearOrder, findWatch, readOrder, type OrderState } from "@/lib/order";
import { resetFlowLock } from "@/lib/flow-lock";
import { getSessionId } from "@/lib/session-id";

const TITLE = "تم تأكيد طلبك بنجاح — ساعة أهل مصر الذكية";
const DESCRIPTION = "تم قبول طلبك وسيتواصل معك فريق ساعة أهل مصر الذكية لتأكيد التسليم.";

export const Route = createFileRoute("/success")({
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
  component: SuccessPage,
});

function SuccessPage() {
  const [order, setOrder] = useState<OrderState | null>(null);
  const [ref, setRef] = useState("");

  useEffect(() => {
    setOrder(readOrder());
    const sid = getSessionId();
    setRef(sid.replace(/[^a-zA-Z0-9]/g, "").slice(-8).toUpperCase() || "EGSW0001");
  }, []);

  const watch = findWatch(order?.watchId);

  function startNew() {
    clearOrder();
    resetFlowLock();
  }

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
          <StatusBadge status="completed" label="تم قبول الطلب" />
          <h1 className="mt-6 text-3xl font-black text-hero-foreground sm:text-4xl">
            تهانينا! تم تأكيد طلبك بنجاح
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-hero-foreground/85">
            استلمنا طلبك وتمت الموافقة عليه، وسيتواصل معك فريقنا خلال وقت قصير لتأكيد موعد التسليم.
          </p>
        </div>
      </section>

      <main className="relative z-10 mx-auto -mt-28 max-w-md px-4 pb-16">
        <OrderSteps current="success" className="mb-6" />

        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-soft)] sm:p-8">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-primary/10 text-primary">
            <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-black text-foreground">طلبك قيد التجهيز الآن</h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            احتفظ برقم الطلب أدناه، ستحتاجه عند التواصل مع خدمة العملاء.
          </p>

          <div className="mt-5 rounded-2xl border border-gold/40 bg-gold/10 px-4 py-3">
            <p className="text-[11px] font-bold text-muted-foreground">رقم الطلب</p>
            <p className="mt-1 text-xl font-black tracking-widest text-foreground">{ref || "—"}</p>
          </div>

          <ul className="mt-6 space-y-3 text-right">
            <SummaryRow icon={Watch} label="الساعة المختارة" value={watch?.name ?? "—"} />
            <SummaryRow icon={BadgeCheck} label="الاسم" value={order?.name || "—"} />
            <SummaryRow icon={Phone} label="رقم الهاتف" value={order?.phone || "—"} />
            {order?.city ? <SummaryRow icon={ShieldCheck} label="المدينة" value={order.city} /> : null}
            {order?.spec ? <SummaryRow icon={Watch} label="مواصفات التصميم" value={order.spec} /> : null}
          </ul>

          <div className="mt-6 grid gap-3">
            <Button asChild className="h-12 w-full rounded-xl text-base">
              <Link to="/select-watch" onClick={startNew}>
                طلب ساعة أخرى
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-12 w-full rounded-xl text-base">
              <Link to="/" onClick={startNew}>
                العودة للصفحة الرئيسية
              </Link>
            </Button>
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

function SummaryRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <li className="flex items-start justify-between gap-3 rounded-2xl border border-border bg-secondary/40 px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {label}
      </span>
      <span className="max-w-[60%] break-words text-left text-sm font-black text-foreground">
        {value}
      </span>
    </li>
  );
}
