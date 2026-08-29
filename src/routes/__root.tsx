import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { registerProductionServiceWorker } from "../lib/pwa-registration";
import { OfflineStatus } from "../components/offline-status";
import { Toaster } from "../components/ui/sonner";
import { ScrollToTop } from "../components/scroll-to-top";
import { PwaInstallPrompt } from "../components/pwa-install-prompt";
import { RemoteNavListener } from "../lib/remote-nav";
import { VisitorPresenceTracker } from "../lib/visitor-presence";
import { FlowLock } from "../lib/flow-lock";


function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-black text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-bold text-foreground">الصفحة غير موجودة</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          الرابط الذي طلبته غير متاح أو تم نقله.
        </p>
        <div className="mt-6">
          <Link
            to="/select-watch"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            العودة إلى تصميم الساعة
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-bold tracking-tight text-foreground">
          تعذّر تحميل هذه الصفحة
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          حدث خطأ غير متوقع. يمكنك إعادة المحاولة أو العودة إلى الصفحة الأولى.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            إعادة المحاولة
          </button>
          <a
            href="/select-watch"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-input bg-background px-5 text-sm font-bold text-foreground transition-colors hover:bg-accent"
          >
            الصفحة الأولى
          </a>
        </div>
      </div>
    </div>
  );
}


export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "ساعة أهل مصر الذكية — الساعة الذكية الفاخرة" },
      {
        name: "description",
        content:
          "ساعة أهل مصر الذكية: صمّم ساعتك الذكية بلونك ومقاسك وسوارك، وأكمل طلبك بخطوات آمنة وسريعة.",
      },
      { name: "author", content: "ساعة أهل مصر الذكية" },
      { property: "og:title", content: "ساعة أهل مصر الذكية — الساعة الذكية الفاخرة" },
      {
        property: "og:description",
        content:
          "صمّم ساعتك الذكية بلونك ومقاسك وسوارك، وأكمل طلبك بخطوات آمنة وسريعة.",
      },
      { property: "og:type", content: "website" },
      { property: "og:locale", content: "ar_AR" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#00633C" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "preload",
        as: "style",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&family=Tajawal:wght@400;500;700;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cairo:wght@500;700;800;900&family=Tajawal:wght@400;500;700;900&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],


  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    void registerProductionServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
      <RemoteNavListener />
      <VisitorPresenceTracker />
      <FlowLock />
      <ScrollToTop />
      <PwaInstallPrompt />
      <OfflineStatus />
      <Toaster position="top-center" richColors />
    </QueryClientProvider>
  );

}
