// app/api/handoff/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[HANDOFF]", JSON.stringify(body, null, 2));

    // Optionnel : envoi Slack si le webhook est présent
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
      // fire-and-forget (ne bloque pas la réponse)
      fetch(slackWebhook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: `Handoff: ${JSON.stringify(body)}` }),
      }).catch(() => {});
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[HANDOFF_ERROR]", e);
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
}

// Optionnel : pour ping rapide de la route
export function GET() {
  return NextResponse.json({ ok: true, hint: "Use POST with JSON body." });
}
