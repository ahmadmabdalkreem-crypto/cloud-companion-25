import { useCallback, useEffect, useState } from "react";

/** إعدادات شاشة الساعة: نمط الخلفية، لون التمييز، ومستوى الإضاءة. */
export type ScreenThemeId = "deep" | "olive" | "midnight" | "graphite" | "sand";

export type ScreenTheme = {
  id: ScreenThemeId;
  label: string;
  note: string;
  /** لون التوهّج الداخلي للخلفية. */
  tint: string;
  /** لون النصوص الأساسي. */
  text: string;
};

export const SCREEN_THEMES: ScreenTheme[] = [
  { id: "deep", label: "أسود عميق", note: "AMOLED نقي يوفّر البطارية.", tint: "#101314", text: "#f3ede1" },
  { id: "olive", label: "زيتوني", note: "توهّج أخضر هادئ.", tint: "#0a2a1f", text: "#eafff4" },
  { id: "midnight", label: "ليلي", note: "أزرق ليلي أنيق.", tint: "#0e1c33", text: "#eaf1ff" },
  { id: "graphite", label: "جرافيت", note: "رمادي محايد عالي الوضوح.", tint: "#1b1e21", text: "#f6f6f6" },
  { id: "sand", label: "رملي دافئ", note: "دفء صحراوي خفيف.", tint: "#2a1e12", text: "#fdeed6" },
];

export const ACCENTS: { id: string; label: string; hex: string }[] = [
  { id: "green", label: "أخضر", hex: "#4ade80" },
  { id: "gold", label: "ذهبي", hex: "#f5a800" },
  { id: "sky", label: "سماوي", hex: "#38bdf8" },
  { id: "coral", label: "مرجاني", hex: "#ff7a5c" },
  { id: "violet", label: "بنفسجي", hex: "#a78bfa" },
];

export type ScreenSettings = {
  themeId: ScreenThemeId;
  accentHex: string;
  /** ٠٫٤ إلى ١ */
  brightness: number;
};

export const DEFAULT_SCREEN: ScreenSettings = {
  themeId: "olive",
  accentHex: "#4ade80",
  brightness: 0.9,
};

export function findTheme(id: ScreenThemeId) {
  return SCREEN_THEMES.find((t) => t.id === id) ?? SCREEN_THEMES[0]!;
}

const KEY = "elite:watch-screen";
const EVENT = "elite:watch-screen-change";

export function readScreen(): ScreenSettings {
  if (typeof window === "undefined") return DEFAULT_SCREEN;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<ScreenSettings>) : {};
    const merged = { ...DEFAULT_SCREEN, ...parsed } as ScreenSettings;
    merged.brightness = Math.min(1, Math.max(0.4, Number(merged.brightness) || 0.9));
    return merged;
  } catch {
    return DEFAULT_SCREEN;
  }
}

export function saveScreen(patch: Partial<ScreenSettings>) {
  if (typeof window === "undefined") return;
  const next = { ...readScreen(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** إعدادات حيّة مع حفظ فوري. */
export function useWatchScreen() {
  const [screen, setScreen] = useState<ScreenSettings>(DEFAULT_SCREEN);

  useEffect(() => {
    const sync = () => setScreen(readScreen());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<ScreenSettings>) => {
    setScreen((prev) => ({ ...prev, ...patch }));
    saveScreen(patch);
  }, []);

  const reset = useCallback(() => {
    setScreen(DEFAULT_SCREEN);
    saveScreen(DEFAULT_SCREEN);
  }, []);

  return { screen, update, reset };
}
