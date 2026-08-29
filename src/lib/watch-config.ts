import { useCallback, useEffect, useState } from "react";

export type OsId = "android" | "apple";
export type StrapMaterialId = "silicone" | "leather";
export type SizeId = 42 | 46;

export type ColorOption = {
  id: string;
  label: string;
  /** Short note shown only when this color is the current choice. */
  note: string;
  hex: string;
  finish: "gloss" | "matte";
  /** Case follows the strap color. */
  followsStrap?: boolean;
};

export const COLORS: ColorOption[] = [
  {
    id: "silver",
    label: "فضي",
    note: "يناسب اللباس الرسمي والعمل اليومي.",
    hex: "#c8ccd2",
    finish: "gloss",
  },
  {
    id: "charcoal",
    label: "فحمي",
    note: "ألمنيوم داكن يناسب المكتب والحركة.",
    hex: "#3a3f45",
    finish: "matte",
  },
  {
    id: "olive",
    label: "زيتوني",
    note: "يناسب الطبيعة والاستخدام اليومي.",
    hex: "#5c6b33",
    finish: "matte",
  },
  {
    id: "strap-match",
    label: "معدن بلون السوار",
    note: "الهيكل يتبع لون السوار دائماً.",
    hex: "#8b8f96",
    finish: "gloss",
    followsStrap: true,
  },
  {
    id: "indigo",
    label: "نيلي",
    note: "تيل عميق بلون النيل.",
    hex: "#1f4f5a",
    finish: "gloss",
  },
  {
    id: "dune",
    label: "كثبان",
    note: "ذهب صحراوي مطفي.",
    hex: "#b79b6a",
    finish: "matte",
  },
  {
    id: "navy",
    label: "كحلي",
    note: "ليلي غامق بحضور هادئ.",
    hex: "#243049",
    finish: "gloss",
  },
  {
    id: "clay",
    label: "فخاري",
    note: "طين مصري دافئ.",
    hex: "#9a5f45",
    finish: "matte",
  },
  {
    id: "frost",
    label: "صقيعي",
    note: "أبيض سيراميك بارد.",
    hex: "#eef1f3",
    finish: "gloss",
  },
  {
    id: "copper",
    label: "نحاسي",
    note: "نحاس مطفي بلمسة دافئة.",
    hex: "#8f5a34",
    finish: "matte",
  },
  {
    id: "ink",
    label: "حبري",
    note: "أسود حبر عميق.",
    hex: "#14161a",
    finish: "gloss",
  },
];

export const PRIMARY_COLOR_IDS = ["silver", "charcoal", "olive"];

export type StrapColor = { id: string; label: string; note: string; hex: string };

export type StrapMaterialOption = {
  id: StrapMaterialId;
  label: string;
  note: string;
  colors: StrapColor[];
};

export const STRAPS: StrapMaterialOption[] = [
  {
    id: "silicone",
    label: "سيليكون",
    note: "ملمس ناعم مرن للاستخدام اليومي والرياضة.",
    colors: [
      { id: "olive", label: "زيتوني", note: "الافتراضي", hex: "#5c6b33" },
      { id: "black", label: "أسود", note: "للجيم", hex: "#1b1d20" },
      { id: "sand", label: "رملي", note: "للصيف", hex: "#cbb591" },
    ],
  },
  {
    id: "leather",
    label: "جلد",
    note: "جلد طبيعي بخياطة خفيفة.",
    colors: [
      { id: "black", label: "أسود ليلي", note: "أناقة رسمية", hex: "#221f1e" },
      { id: "brown", label: "بني طيني دافئ", note: "دفء يومي", hex: "#6b4326" },
      { id: "sand", label: "رملي صحراوي", note: "إطلالة فاتحة", hex: "#b08b5f" },
    ],
  },
];

export const SIZES: { id: SizeId; label: string; note: string }[] = [
  {
    id: 42,
    label: "٤٢ مم",
    note: "أنسب لتوازن الحجم على المعصم النحيف، لمعصم أقل من ١٧ سم.",
  },
  {
    id: 46,
    label: "٤٦ مم",
    note: "قراءة أسهل وحضور أوضح، مع بقاء الجهاز نفسه بكل ميزاته.",
  },
];

export const SYSTEMS: { id: OsId; label: string; note: string }[] = [
  { id: "android", label: "Android", note: "واجهة Android مباشرة على شاشة الساعة." },
  { id: "apple", label: "Apple", note: "واجهة Apple مباشرة على شاشة الساعة." },
];

export const FEATURES = ["NFC", "٧ أيام", "GPS", "SpO2", "ECG", "سقوط", "صلاة"];

export type WatchConfig = {
  colorId: string;
  size: SizeId;
  material: StrapMaterialId;
  strapColorId: string;
  os: OsId;
};

export const DEFAULT_CONFIG: WatchConfig = {
  colorId: "olive",
  size: 46,
  material: "silicone",
  strapColorId: "olive",
  os: "android",
};

const KEY = "elite:watch-config";
const EVENT = "elite:watch-config-change";

export function findColor(id: string) {
  return COLORS.find((c) => c.id === id) ?? COLORS[0]!;
}

export function findMaterial(id: StrapMaterialId) {
  return STRAPS.find((s) => s.id === id) ?? STRAPS[0]!;
}

/** Sentinel: the strap follows the chosen watch color. */
export const STRAP_MATCH = "match";

export function findStrapColor(material: StrapMaterialId, id: string) {
  const m = findMaterial(material);
  if (id === STRAP_MATCH) return { id: STRAP_MATCH, label: "بلون الساعة", note: "متطابق مع لون الهيكل", hex: "#5c6b33" };
  return m.colors.find((c) => c.id === id) ?? m.colors[0]!;
}

/** Resolved hexes for the live watch. */
export function resolveColors(config: WatchConfig) {
  const color = findColor(config.colorId);
  const material = findMaterial(config.material);
  let strapColor = findStrapColor(config.material, config.strapColorId);
  if (config.strapColorId === STRAP_MATCH) {
    // one click on a color paints case + strap alike, inside the current material
    strapColor = color.followsStrap
      ? material.colors[0]!
      : { ...strapColor, label: color.label, hex: color.hex };
  }
  const caseHex = color.followsStrap ? strapColor.hex : color.hex;
  return { color, strapColor, caseHex, caseFinish: color.finish };
}

export function readConfig(): WatchConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<WatchConfig>) : {};
    const merged = { ...DEFAULT_CONFIG, ...parsed } as WatchConfig;
    // keep the strap color valid inside the current material
    if (merged.strapColorId !== STRAP_MATCH) {
      merged.strapColorId = findStrapColor(merged.material, merged.strapColorId).id;
    }
    return merged;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export const PAYLOAD_KEY = "watch_config_payload";

/** Human-readable payload carried into the order. */
export function buildPayload(config: WatchConfig) {
  const { color, strapColor, caseHex } = resolveColors(config);
  const material = findMaterial(config.material);
  return {
    ...config,
    colorLabel: color.label,
    caseHex,
    materialLabel: material.label,
    strapColorLabel: color.followsStrap && config.strapColorId === STRAP_MATCH ? strapColor.label : strapColor.label,
    strapHex: strapColor.hex,
    sizeLabel: config.size === 42 ? "٤٢ مم" : "٤٦ مم",
    osLabel: config.os === "android" ? "Android" : "Apple",
    features: FEATURES,
  };
}

export function saveConfig(patch: Partial<WatchConfig>) {
  if (typeof window === "undefined") return;
  const next = { ...readConfig(), ...patch };
  window.localStorage.setItem(KEY, JSON.stringify(next));
  try {
    window.sessionStorage.setItem(PAYLOAD_KEY, JSON.stringify(buildPayload(next)));
  } catch {
    /* session storage unavailable */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

/** Hydration-safe live config with an instant, persisted setter. */
export function useWatchConfig() {
  const [config, setConfig] = useState<WatchConfig>(DEFAULT_CONFIG);

  useEffect(() => {
    const sync = () => setConfig(readConfig());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const update = useCallback((patch: Partial<WatchConfig>) => {
    const prev = readConfig();
    const next = { ...prev, ...patch };
    if (patch.colorId && patch.strapColorId === undefined) {
      // one click on a color changes case + strap together
      next.strapColorId = STRAP_MATCH;
    }
    if (patch.material && prev.strapColorId !== STRAP_MATCH) {
      // keep the closest existing color inside the new material
      const target = findMaterial(patch.material).colors;
      next.strapColorId = (target.find((c) => c.id === prev.strapColorId) ?? target[0]!).id;
    }
    setConfig(next);
    saveConfig(next);
  }, []);



  return { config, update };
}
