import { memo } from "react";
import { Link } from "@tanstack/react-router";

import logoAsset from "@/assets/logo.jpg.asset.json";

function SiteHeaderBase() {
  return (
    <header className="glass-header sticky top-0 z-50">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:flex sm:justify-between">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-2xl bg-primary-foreground ring-1 ring-primary-foreground/25 transition-transform group-hover:scale-105">
            <img
              src={logoAsset.url}
              alt="شعار ساعة أهل مصر الذكية"
              width={40}
              height={40}
              loading="eager"
              decoding="async"
              className="h-full w-full object-contain"
            />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-lg font-black tracking-tight text-primary-foreground">
              ساعة أهل مصر الذكية
            </span>
            <span className="mt-1 truncate text-[10px] font-bold tracking-[0.12em] text-primary-foreground/75">
              الدفع بلمسة من معصمك
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}

export const SiteHeader = memo(SiteHeaderBase);
