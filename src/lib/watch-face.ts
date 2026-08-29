import type { OsId } from "@/lib/watch-config";
import { DEFAULT_SCREEN, findTheme, type ScreenSettings } from "@/lib/watch-screen";
import logoAsset from "@/assets/logo.jpg.asset.json";

/** طبقة انتقال ناعمة عند التحميل أو تبديل الواجهة. */
function fadeOverlay(ctx: CanvasRenderingContext2D, S: number, fade: number) {
  if (fade >= 0.999) return;
  ctx.fillStyle = `rgba(0,0,0,${1 - fade})`;
  ctx.fillRect(0, 0, S, S);
}


export type FaceId = OsId;

/** شعار الموقع يُرسم داخل شاشة الساعة. */
let logoImg: HTMLImageElement | null = null;
let logoReady = false;

function getLogo() {
  if (typeof window === "undefined") return null;
  if (!logoImg) {
    logoImg = new Image();
    logoImg.crossOrigin = "anonymous";
    logoImg.onload = () => {
      logoReady = true;
    };
    logoImg.src = logoAsset.url;
  }
  return logoReady && logoImg?.naturalWidth ? logoImg : null;
}

/** يقيس سطوع الخلفية أسفل نقطة معيّنة لضبط تباين الشعار تلقائياً. */
function bgLuminance(ctx: CanvasRenderingContext2D, x: number, y: number) {
  try {
    const d = ctx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
    return (0.2126 * d[0]! + 0.7152 * d[1]! + 0.0722 * d[2]!) / 255;
  } catch {
    return 0;
  }
}

/**
 * يرسم الشعار داخل قرص أبيض بحلقة ذهبية مطابقة للصورة المرجعية،
 * مع الحفاظ على نسبة الأبعاد بدون قصّ أو تمدد.
 */
function drawLogo(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  accent = "#F5A800",
) {
  const img = getLogo();
  if (!img) return;

  void bgLuminance;
  ctx.save();

  // توهّج ذهبي خفيف جداً حول القرص
  const halo = ctx.createRadialGradient(cx, cy, r * 0.95, cx, cy, r * 1.55);
  halo.addColorStop(0, "rgba(245,168,0,0.16)");
  halo.addColorStop(1, "rgba(245,168,0,0)");
  ctx.fillStyle = halo;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.55, 0, Math.PI * 2);
  ctx.fill();

  // قرص أبيض يضمن وضوح الشعار على الشاشة السوداء
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.04, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  // حلقة ذهبية رفيعة
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.strokeStyle = accent;
  ctx.stroke();

  // احتواء الصورة داخل الدائرة مع الحفاظ على نسبة الأبعاد
  const ar = img.naturalWidth / img.naturalHeight;
  const box = r * 2;
  const w = ar >= 1 ? box : box * ar;
  const h = ar >= 1 ? box / ar : box;

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}



const AR = (n: number) => n.toLocaleString("ar-EG", { minimumIntegerDigits: 2 });

function ring(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  width: number,
  progress: number,
  color: string,
) {
  ctx.beginPath();
  ctx.strokeStyle = "rgba(255,255,255,0.12)";
  ctx.lineWidth = width;
  ctx.arc(c, c, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineCap = "round";
  ctx.lineWidth = width;
  ctx.arc(c, c, r, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2);
  ctx.stroke();
}

/** توهّج داخلي خفيف يحاكي شاشات AMOLED. */
function screenBase(ctx: CanvasRenderingContext2D, S: number, tint: string) {
  const c = S / 2;
  const bg = ctx.createRadialGradient(c, c * 0.62, S * 0.02, c, c, c * 1.05);
  bg.addColorStop(0, tint);
  bg.addColorStop(0.55, "#050706");
  bg.addColorStop(1, "#000000");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, S, S);

  // vignette
  const v = ctx.createRadialGradient(c, c, c * 0.6, c, c, c);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(1, "rgba(0,0,0,0.65)");
  ctx.fillStyle = v;
  ctx.fillRect(0, 0, S, S);
}

export type FaceOptions = {
  screen?: ScreenSettings;
  /** ٠ إلى ١ — يُستخدم للانتقال الناعم عند التحميل وتبديل الواجهة. */
  fade?: number;
};

/** يخفض السطوع بطبقة سوداء شفافة (يُطبَّق قبل رسم الشعار). */
function dim(ctx: CanvasRenderingContext2D, S: number, brightness: number) {
  const a = 1 - Math.min(1, Math.max(0.4, brightness));
  if (a <= 0.001) return;
  ctx.fillStyle = `rgba(0,0,0,${a * 0.85})`;
  ctx.fillRect(0, 0, S, S);
}

/** مشاهد الشاشة تتبدّل تلقائياً كل ٤ ثوانٍ بانتقال ناعم (تلاشٍ + تكبير). */
type Scene = { subtitle: string; metric: string; accent: string; logo: boolean };

const SCENES: Scene[] = [
  { subtitle: "الجمعة", metric: "نبض 71", accent: "#F5A800", logo: true },
  { subtitle: "مكالمة واردة", metric: "أحمد حسن", accent: "#4ade80", logo: false },
  { subtitle: "القاهرة ٣٢°", metric: "٢٥٠ خطوة", accent: "#fb923c", logo: false },
];

const SCENE_MS = 4000;
const MORPH_MS = 600;

export const SCENE_COUNT = SCENES.length;
export const SCENE_LABELS = SCENES.map((s) => s.subtitle);
const SCENE_EVENT = "elite:watch-scene";

/** حالة التبديل: تلقائي حتى يتدخّل المستخدم بالتمرير. */
let manualIndex: number | null = null;
let switchedAt = 0;
let prevIndex = 0;

function autoIndex() {
  return Math.floor(Date.now() / SCENE_MS) % SCENE_COUNT;
}

/** المشهد المعروض حالياً (يدوي إن وُجد، وإلا تلقائي). */
export function activeSceneIndex() {
  return manualIndex ?? autoIndex();
}

/** تبديل يدوي بالتمرير: dir = 1 للأمام، -1 للخلف. */
export function stepScene(dir: number) {
  prevIndex = activeSceneIndex();
  manualIndex = (prevIndex + (dir >= 0 ? 1 : SCENE_COUNT - 1)) % SCENE_COUNT;
  switchedAt = Date.now();
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SCENE_EVENT));
}

/** اختيار مشهد محدد (مؤشرات النقاط). */
export function setScene(index: number) {
  prevIndex = activeSceneIndex();
  manualIndex = ((index % SCENE_COUNT) + SCENE_COUNT) % SCENE_COUNT;
  switchedAt = Date.now();
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(SCENE_EVENT));
}

export function onSceneChange(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(SCENE_EVENT, cb);
  return () => window.removeEventListener(SCENE_EVENT, cb);
}

function currentScene() {
  const now = Date.now();
  const idx = activeSceneIndex();
  const into = manualIndex === null ? now % SCENE_MS : now - switchedAt;
  const p = Math.min(1, into / MORPH_MS); // 0 → 1 أثناء الانتقال
  const eased = p * p * (3 - 2 * p);
  void prevIndex;
  return { scene: SCENES[idx]!, alpha: eased, scale: 0.92 + 0.08 * eased, settled: p >= 1 };
}


/** موجة نبض متحركة تحاكي مؤشر Lottie. */
function drawWave(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  S: number,
  color: string,
) {
  const w = S * 0.28;
  const h = S * 0.05;
  const t = Date.now() / 260;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, S * 0.008);
  ctx.lineCap = "round";
  ctx.beginPath();
  for (let i = 0; i <= 48; i++) {
    const x = cx - w / 2 + (w * i) / 48;
    const k = i / 48;
    const spike = Math.exp(-Math.pow((k - ((t % 1) + 0) % 1) * 6, 2)) * h;
    const y = cy - Math.sin(k * Math.PI * 4 + t) * h * 0.28 - spike * 0.9;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

/** Draws the live watch screen for the selected operating system. */
export function drawFace(
  ctx: CanvasRenderingContext2D,
  os: FaceId,
  now: Date,
  opts: FaceOptions = {},
) {
  const S = ctx.canvas.width;
  const c = S / 2;
  const screen = opts.screen ?? DEFAULT_SCREEN;
  const theme = findTheme(screen.themeId);
  const { scene, alpha, scale } = currentScene();
  const accent = scene.accent || screen.accentHex;
  const fade = Math.min(1, Math.max(0, opts.fade ?? 1));
  ctx.clearRect(0, 0, S, S);

  screenBase(ctx, S, theme.tint);

  // توهّج خلفي خفيف جداً يحافظ على سواد AMOLED كما في التصميم المعتمد
  const glow = ctx.createRadialGradient(c, c, S * 0.02, c, c, c * 0.9);
  glow.addColorStop(0, `${accent}14`);
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, S, S);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const pad = (n: number) => String(n).padStart(2, "0");
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  const secs = (now.getSeconds() + now.getMilliseconds() / 1000) / 60;
  const cream = theme.text;
  void AR;

  // الشعار ثابت أعلى الشاشة في كل المشاهد
  drawLogo(ctx, c, c - S * 0.215, S * 0.135, "#F5A800");

  // محتوى المشهد بانتقال تلاشٍ + تكبير
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(c, c);
  ctx.scale(scale, scale);
  ctx.translate(-c, -c);

  // اليوم / عنوان المشهد
  ctx.fillStyle = "rgba(255,255,255,0.82)";
  ctx.font = `500 ${S * 0.055}px system-ui, sans-serif`;
  ctx.fillText(scene.subtitle, c, c - S * 0.015);

  // الوقت الكبير
  ctx.fillStyle = cream;
  ctx.font = `300 ${S * 0.235}px system-ui, sans-serif`;
  ctx.fillText(time, c, c + S * 0.11);

  // القياس الحيّ
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `500 ${S * 0.058}px system-ui, sans-serif`;
  ctx.fillText(scene.metric, c, c + S * 0.245);

  // موجة النبض الذهبية
  drawWave(ctx, c, c + S * 0.325, S, accent);

  // حلقة ثوانٍ رفيعة على واجهة أبل فقط
  if (os !== "android") {
    ring(ctx, c, c * 0.94, S * 0.012, secs, accent);
  }

  ctx.restore();

  dim(ctx, S, screen.brightness);
  fadeOverlay(ctx, S, fade);

}

