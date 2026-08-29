import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { ShoppingBag, Watch as WatchIcon } from "lucide-react";

import { LazyImage } from "@/components/lazy-image";
import { useOrder } from "@/lib/order";


function SelectedWatchCardBase({ className = "" }: { className?: string }) {
  const { order, watch } = useOrder();

  if (!watch && !order.spec) {
    return (
      <div
        className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-border bg-card p-4 ${className}`}
      >
        <span className="text-sm font-bold text-muted-foreground">
          لم تُصمّم ساعتك بعد
        </span>
        <Link
          to="/select-watch"
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 text-sm font-black text-primary-foreground transition-colors hover:bg-primary/90"
        >
          تصميم الساعة
        </Link>
      </div>
    );
  }

  if (!watch) {
    return (
      <div
        className={`flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] ${className}`}
      >
        <span className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
          <WatchIcon className="h-7 w-7" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-[11px] font-black text-gold-foreground">
            <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
            تصميمك المختار
          </span>
          <p className="text-sm font-black leading-6 text-foreground">{order.spec}</p>
        </div>
        <Link
          to="/select-watch"
          className="shrink-0 self-center rounded-xl border border-border px-3 py-2 text-xs font-black text-foreground transition-colors hover:bg-accent"
        >
          تعديل
        </Link>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-card)] ${className}`}
    >
      <LazyImage
        src={watch.image}
        alt={watch.name}
        width={160}
        height={160}
        wrapperClassName="h-16 w-16 shrink-0 rounded-xl bg-secondary"
        className="h-full w-full rounded-xl object-cover"
      />

      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 text-[11px] font-black text-gold-foreground">
          <ShoppingBag className="h-3.5 w-3.5" aria-hidden="true" />
          ساعتك المختارة
        </span>
        <p className="truncate text-sm font-black text-foreground">{watch.name}</p>
        <p className="truncate text-xs text-muted-foreground">{watch.tagline}</p>
      </div>
      <Link
        to="/select-watch"
        className="shrink-0 self-center rounded-xl border border-border px-3 py-2 text-xs font-black text-foreground transition-colors hover:bg-accent"
      >
        تعديل
      </Link>
    </div>
  );
}

export const SelectedWatchCard = memo(SelectedWatchCardBase);
