// app/api/handoff/route.ts
import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  // 🔁 ajoute ici ton domaine Shopify (ou plusieurs si besoin)
  "https://testag-7521.myshopify.com",
  // tu peux aussi ajouter ton domaine vitrine si tu testes depuis là
];

function corsHeaders(origin?: string) {
  const allowOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "*";
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

export function OPTIONS(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || undefined;
  try {
    const body = await req.json();
    console.log("[HANDOFF]", JSON.stringify(body, null, 2));

    const slackWebhook =
      process.env.SLACK_WEBHOOK_URL_SUPPORT || process.env.SLACK_WEBHOOK_URL;

    if (slackWebhook && !/placeholder/i.test(slackWebhook)) {
      const fields = [
        { title: "Onglet", value: String(body?.tab ?? "Support"), short: true },
        { title: "Quand", value: new Date().toISOString(), short: true },
        { title: "Shop", value: String(body?.shop ?? "n/a"), short: true },
        { title: "Question", value: body?.lastUserMessage || "(vide)", short: false },
        { title: "Réponse IA", value: (body?.lastAiReply || "(n/a)").slice(0, 500), short: false },
        { title: "Sources", value: (Array.isArray(body?.sources) ? body.sources.join(" | ") : (body?.sources || "—")), short: false },
      ];

      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "🔁 Handoff Support",
          attachments: [{ fields }],
        }),
      }).catch(() => {});
    }

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  } catch (e) {
    console.error("[HANDOFF_ERROR]", e);
    return new NextResponse(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...corsHeaders(origin) },
    });
  }
}
