import { createFileRoute, Link } from "@tanstack/react-router";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Watch3D } from "@/components/watch-3d";
import { Button } from "@/components/ui/button";
import { SYSTEMS, resolveColors, useWatchConfig } from "@/lib/watch-config";
import { ACCENTS, SCREEN_THEMES, findTheme, useWatchScreen } from "@/lib/watch-screen";

export const Route = createFileRoute("/watch-settings")({
  head: () => ({
    meta: [
      { title: "إعدادات شاشة الساعة — ساعة أهل مصر الذكية" },
      {
        name: "description",
        content:
          "اختر نمط خلفية شاشة الساعة ولون التمييز ومستوى الإضاءة مع معاينة فورية ثلاثية الأبعاد.",
      },
      { property: "og:title", content: "إعدادات شاشة الساعة — ساعة أهل مصر الذكية" },
      {
        property: "og:description",
        content: "تخصيص خلفية الشاشة والألوان والإضاءة مع معاينة حيّة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WatchSettingsPage,
});

function WatchSettingsPage() {
  const { config, update } = useWatchConfig();
  const { screen, update: updateScreen, reset } = useWatchScreen();
  const { caseHex, caseFinish, strapColor } = resolveColors(config);
  const theme = findTheme(screen.themeId);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-6 sm:px-6">
        <header className="mb-6 space-y-2 text-right">
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">إعدادات شاشة الساعة</h1>
          <p className="text-sm text-muted-foreground">
            اختر نمط الخلفية ولون التمييز ومستوى الإضاءة، وشاهد التغيير فوراً على الساعة.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* معاينة فورية */}
          <section
            aria-label="معاينة شاشة الساعة"
            className="glass-card sticky top-20 h-fit overflow-hidden p-0"
          >
            <div
              className="h-[320px] w-full transition-opacity duration-700 sm:h-[420px]"
              style={{ opacity: 0.35 + screen.brightness * 0.65 }}
              role="img"
              aria-label={`معاينة ساعة بخلفية ${theme.label} وإضاءة ${Math.round(screen.brightness * 100)} بالمئة`}
            >
              <Watch3D
                face={config.os}
                material={config.material}
                strapHex={strapColor.hex}
                caseHex={caseHex}
                caseFinish={caseFinish}
                size={config.size}
              />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3 text-xs text-muted-foreground">
              <span>{theme.label}</span>
              <span>الإضاءة {Math.round(screen.brightness * 100)}٪</span>
              <span>{config.os === "android" ? "Android" : "Apple"}</span>
            </div>
          </section>

          {/* الخيارات */}
          <div className="space-y-5">
            <section className="glass-card space-y-3">
              <h2 className="text-base font-bold text-foreground">نمط الخلفية</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SCREEN_THEMES.map((t) => {
                  const active = t.id === screen.themeId;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => updateScreen({ themeId: t.id })}
                      aria-pressed={active}
                      className={`rounded-xl border p-3 text-right transition-all duration-300 min-h-11 ${
                        active
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span
                        className="mb-2 block h-8 w-full rounded-lg"
                        style={{ background: `radial-gradient(circle at 50% 30%, ${t.tint}, #000)` }}
                      />
                      <span className="block text-sm font-semibold text-foreground">{t.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{t.note}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="glass-card space-y-3">
              <h2 className="text-base font-bold text-foreground">لون التمييز</h2>
              <div className="flex flex-wrap gap-3">
                {ACCENTS.map((a) => {
                  const active = a.hex.toLowerCase() === screen.accentHex.toLowerCase();
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => updateScreen({ accentHex: a.hex })}
                      aria-pressed={active}
                      aria-label={a.label}
                      title={a.label}
                      className={`h-11 w-11 rounded-full border-2 transition-transform duration-300 ${
                        active ? "border-primary scale-110" : "border-border hover:scale-105"
                      }`}
                      style={{ background: a.hex }}
                    />
                  );
                })}
              </div>
            </section>

            <section className="glass-card space-y-3">
              <h2 className="text-base font-bold text-foreground">مستوى الإضاءة</h2>
              <input
                type="range"
                min={40}
                max={100}
                step={5}
                value={Math.round(screen.brightness * 100)}
                onChange={(e) => updateScreen({ brightness: Number(e.target.value) / 100 })}
                aria-label="مستوى إضاءة الشاشة"
                className="w-full accent-[var(--color-primary,#00633C)]"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>٤٠٪</span>
                <span className="font-semibold text-foreground">
                  {Math.round(screen.brightness * 100)}٪
                </span>
                <span>١٠٠٪</span>
              </div>
            </section>

            <section className="glass-card space-y-3">
              <h2 className="text-base font-bold text-foreground">واجهة النظام</h2>
              <div className="grid grid-cols-2 gap-2">
                {SYSTEMS.map((s) => {
                  const active = s.id === config.os;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => update({ os: s.id })}
                      aria-pressed={active}
                      className={`min-h-11 rounded-xl border p-3 text-right transition-all duration-300 ${
                        active
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <span className="block text-sm font-semibold text-foreground">{s.label}</span>
                      <span className="block text-[11px] text-muted-foreground">{s.note}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-wrap gap-3">
              <Button asChild className="min-h-11 flex-1">
                <Link to="/select-watch">متابعة اختيار الساعة</Link>
              </Button>
              <Button type="button" variant="outline" className="min-h-11" onClick={reset}>
                استعادة الافتراضي
              </Button>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
