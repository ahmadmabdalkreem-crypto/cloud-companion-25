import { memo } from "react";

function SiteFooterBase() {
  return (
    <footer className="glass-footer mt-8 px-4 py-6">
      <div className="mx-auto max-w-6xl text-center text-sm font-bold text-primary-foreground/90">
        جميع الحقوق محفوظة
      </div>
    </footer>
  );
}

export const SiteFooter = memo(SiteFooterBase);
