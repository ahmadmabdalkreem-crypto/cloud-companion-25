import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import logoAsset from "@/assets/logo.jpg.asset.json";
import { Button } from "@/components/ui/button";

function SiteHeaderBase() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 text-foreground backdrop-blur-xl">
      <div className="mx-auto grid min-h-16 max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 sm:flex sm:justify-between">
        <Link to="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-lg bg-secondary ring-1 ring-border transition-transform group-hover:scale-105">
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
            <span className="truncate text-base font-black text-foreground sm:text-lg">
              ساعة أهل مصر الذكية
            </span>
            <span className="mt-1 truncate text-[10px] font-bold text-muted-foreground">
              الدفع بلمسة من معصمك
            </span>
          </span>
        </Link>
        <Button asChild size="sm" className="shrink-0 rounded-lg font-black">
          <Link to="/select-watch">
            <span className="hidden sm:inline">اختر ساعتك</span>
            <span className="sm:hidden">ابدأ</span>
            <ArrowLeft className="ms-1.5 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </header>
  );
}

export const SiteHeader = memo(SiteHeaderBase);
