// app/api/presales/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

type Presales = {
  need: string;
  budget?: string;
  timeline?: string;
  tool?: string;
  email?: string;
};

function scoreLead(p: Presales) {
  let s = 1;
  if ((p.budget || "").match(/\d/)) s += 2;
  if ((p.timeline || "").match(/(jour|semaine|mois)/i)) s += 1;
  if (p.email && /@/.test(p.email)) s += 1;
  return Math.max(1, Math.min(5, s));
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Presales;
    if (!payload?.need) return NextResponse.json({ ok: false, error: 'missing_need' }, { status: 400 });

    const score = scoreLead(payload);
    const calendlyUrl = process.env.CALENDLY_URL || "https://calendly.com/";

    // Slack (optionnel)
    const slack =
        process.env.SLACK_WEBHOOK_URL_SALES ||
        process.env.SLACK_WEBHOOK_URL;
    if (slack && slack !== "placeholder") {
      const fields = [
        { title: "Besoin", value: payload.need, short: false },
        { title: "Budget", value: payload.budget || "n/a", short: true },
        { title: "Délai", value: payload.timeline || "n/a", short: true },
        { title: "Outil actuel", value: payload.tool || "n/a", short: true },
        { title: "Email", value: payload.email || "n/a", short: true },
        { title: "Score", value: String(score), short: true },
      ];
      fetch(slack, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: "Nouveau lead qualifié", attachments: [{ fields }] }),
      }).catch(() => {});
    }

    // (Option) Webhook Zapier ici via fetch()

    return NextResponse.json({ ok: true, score, calendlyUrl });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
