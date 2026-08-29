import { createFileRoute, Link } from "@tanstack/react-router";
import { Compass } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";

const TITLE = "الصفحة غير موجودة — ساعة أهل مصر الذكية";
const DESCRIPTION = "لم نتمكن من العثور على الصفحة المطلوبة في متجر ساعة أهل مصر الذكية الذكية.";

export const Route = createFileRoute("/$")({
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
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-4 py-24 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-secondary text-primary">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>
        <h1 className="mt-6 text-3xl font-black text-foreground">الصفحة غير موجودة</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          ربما تم نقل الصفحة أو تغيير رابطها. يمكنك العودة إلى صفحة اختيار الساعة.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild className="h-11 rounded-xl px-6 font-black">
            <Link to="/select-watch">اختيار الساعة</Link>
          </Button>
        </div>

      </main>
      <SiteFooter />
    </div>
  );
}
