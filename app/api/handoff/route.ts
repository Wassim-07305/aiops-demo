// app/api/handoff/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[HANDOFF]", JSON.stringify(body, null, 2));

    const slackWebhook =
      process.env.SLACK_WEBHOOK_URL_SUPPORT ||
      process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook && slackWebhook !== "placeholder") {
      const fields = [
        { title: "Onglet", value: String(body?.tab ?? "Support"), short: true },
        { title: "Quand", value: new Date().toISOString(), short: true },
        { title: "Question", value: body?.lastUserMessage || "(vide)", short: false },
        { title: "Réponse IA", value: (body?.lastAiReply || "(n/a)").slice(0, 500), short: false },
        { title: "Sources", value: (Array.isArray(body?.sources) ? body.sources.join(" | ") : (body?.sources || "—")), short: false },
      ];
      await fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "Handoff Support", attachments: [{ fields }] }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[HANDOFF_ERROR]", e);
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}

export function GET() {
  return NextResponse.json({ ok: true, hint: "Use POST with JSON body." });
}
