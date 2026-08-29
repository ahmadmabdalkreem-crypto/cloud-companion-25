import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

type AppShellProps = {
  children: ReactNode;
  className?: string;
  mainClassName?: string;
  footer?: boolean;
};

export function AppShell({ children, className, mainClassName, footer = true }: AppShellProps) {
  return (
    <div className={cn("flex min-h-screen flex-col bg-background text-foreground", className)}>
      <SiteHeader />
      <main className={cn("flex-1", mainClassName)}>{children}</main>
      {footer ? <SiteFooter /> : null}
    </div>
  );
}