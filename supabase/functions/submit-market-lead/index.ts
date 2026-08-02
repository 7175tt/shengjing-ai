import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json" },
});

const cleanText = (value: unknown, maxLength: number) => String(value ?? "").trim().slice(0, maxLength);

function adminKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, string>;
    return keys.default;
  } catch {
    return undefined;
  }
}

function isValidEmail(email: string) {
  return email.length >= 3 && email.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildNotificationText(input: { email: string; role: string; note: string; source: string }) {
  return [
    "聲境 AI 收到一筆新的創始測試名單",
    "",
    `Email：${input.email}`,
    `身分：${input.role === "creator" ? "作者／工作室" : "讀者"}`,
    `需求：${input.note || "（未填寫）"}`,
    `來源：${input.source}`,
    "",
    "請到 Supabase 的 public.market_leads 查看完整名單。",
  ].join("\n");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = adminKey();
    if (!url || !serviceKey) throw new Error("Supabase 後端服務尚未完成設定");

    const input = await request.json() as Record<string, unknown>;
    const email = cleanText(input.email, 320).toLowerCase();
    const role = input.role === "creator" ? "creator" : input.role === "reader" ? "reader" : "";
    const note = cleanText(input.note, 1000);
    const source = cleanText(input.source, 80) || "shengjing-landing";
    const honeypot = cleanText(input.website, 120);
    if (honeypot) return json({ stored: false, notificationSent: false }, 400);
    if (!isValidEmail(email)) throw new Error("Email 格式不正確");
    if (!role) throw new Error("使用身分不正確");

    const admin = createClient(url, serviceKey);
    const recentCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentLead } = await admin.from("market_leads")
      .select("id, notification_status")
      .eq("email", email)
      .gte("created_at", recentCutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentLead?.id) {
      return json({ stored: true, duplicate: true, notificationSent: recentLead.notification_status === "sent" });
    }

    const { data: lead, error: insertError } = await admin.from("market_leads").insert({
      email,
      role,
      note: note || null,
      source,
      notification_status: "pending",
    }).select("id").single();
    if (insertError || !lead) throw insertError ?? new Error("候補名單儲存失敗");

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const recipient = Deno.env.get("MARKET_LEAD_TO_EMAIL") ?? "7175tt@gmail.com";
    const sender = Deno.env.get("MARKET_LEAD_FROM_EMAIL") ?? "Shengjing AI <onboarding@resend.dev>";
    if (!resendApiKey) {
      await admin.from("market_leads").update({ notification_status: "not_configured", notification_error: "RESEND_API_KEY is not configured" }).eq("id", lead.id);
      return json({ stored: true, notificationSent: false, reason: "notification_not_configured" });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: sender,
        to: [recipient],
        reply_to: email,
        subject: "聲境 AI｜新的創始測試名單",
        text: buildNotificationText({ email, role, note, source }),
      }),
    });
    const emailPayload = await emailResponse.json().catch(() => ({}));
    if (!emailResponse.ok) {
      const errorMessage = cleanText(emailPayload?.message ?? emailPayload?.error, 500) || `Resend HTTP ${emailResponse.status}`;
      await admin.from("market_leads").update({ notification_status: "failed", notification_error: errorMessage }).eq("id", lead.id);
      return json({ stored: true, notificationSent: false, reason: "notification_failed" });
    }

    await admin.from("market_leads").update({ notification_status: "sent", notification_sent_at: new Date().toISOString(), notification_error: null }).eq("id", lead.id);
    return json({ stored: true, notificationSent: true });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unknown error" }, 400);
  }
});
