// app/api/presales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const sbAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

type Presales = {
  need: string;
  budget?: string;
  timeline?: string;
  tool?: string;
  email?: string;
};

function scoreLead(p: Presales) {
  let s = 1;
  if ((p.budget || '').match(/\d/)) s += 2;
  if ((p.timeline || '').match(/(jour|semaine|mois)/i)) s += 1;
  if (p.email && /@/.test(p.email)) s += 1;
  return Math.max(1, Math.min(5, s));
}

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as Presales;
    if (!payload?.need) {
      return NextResponse.json({ ok: false, error: 'missing_need', stage: 'input' }, { status: 400 });
    }

    const score = scoreLead(payload);
    const calendlyUrl = process.env.CALENDLY_URL || 'https://calendly.com/';

    // → Webhook SALES (fallback possible)
    const slack = process.env.SLACK_WEBHOOK_URL_SALES || process.env.SLACK_WEBHOOK_URL || '';
    let slackOk = false;
    let slackStatus: number | undefined;
    let slackError: string | undefined;

    if (slack && !/placeholder/i.test(slack)) {
      try {
        const fields = [
          { title: 'Besoin', value: payload.need, short: false },
          { title: 'Budget', value: payload.budget || 'n/a', short: true },
          { title: 'Délai', value: payload.timeline || 'n/a', short: true },
          { title: 'Outil actuel', value: payload.tool || 'n/a', short: true },
          { title: 'Email', value: payload.email || 'n/a', short: true },
          { title: 'Score', value: String(score), short: true },
        ];
        const resp = await fetch(slack, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: 'Nouveau lead qualifié', attachments: [{ fields }] }),
        });
        slackOk = resp.ok;
        slackStatus = resp.status;
        if (!resp.ok) {
          const txt = await resp.text().catch(() => '');
          slackError = `Slack ${resp.status}: ${txt.slice(0, 300)}`;
          console.error('[SLACK_SALES_ERROR]', slackError);
        }
      } catch (e) {
        slackOk = false;
        slackError = (e as Error).message;
        console.error('[SLACK_SALES_THROW]', e);
      }
    }

    // (Option) Zapier webhook ici…

    // → Insert dans Supabase
    await sbAdmin.from('presales_log').insert({
      need: payload.need,
      budget: payload.budget ?? null,
      timeline: payload.timeline ?? null,
      tool: payload.tool ?? null,
      email: payload.email ?? null,
      score,
      calendly_url: calendlyUrl,
      slack_ok: !!(slack && slack !== 'placeholder'),
    });

    return NextResponse.json({ ok: true, score, calendlyUrl, slackOk, slackStatus, slackError });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'server_error', stage: 'server' }, { status: 500 });
  }
}
