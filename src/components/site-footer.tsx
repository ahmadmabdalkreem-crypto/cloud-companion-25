import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";

function SiteFooterBase() {
  return (
    <footer className="mt-8 border-t border-dashboard-sidebar-border bg-dashboard-sidebar px-4 py-8 text-dashboard-sidebar-foreground">
      <div className="mx-auto grid max-w-6xl gap-6 text-center sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:text-start">
        <div className="min-w-0">
          <div className="flex items-center justify-center gap-2 text-sm font-black sm:justify-start">
            <ShieldCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
            ساعة أهل مصر الذكية
          </div>
          <p className="mt-1 text-xs text-dashboard-sidebar-muted">تجربة ذكية، آمنة، ومصممة ليومك.</p>
        </div>
        <Link to="/select-watch" className="text-sm font-bold text-dashboard-sidebar-foreground underline-offset-4 hover:underline">
          استعرض المجموعة
        </Link>
      </div>
    </footer>
  );
}

export const SiteFooter = memo(SiteFooterBase);
