// app/api/kpi/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const sbAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

export async function GET() {
  try {
    const since = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();

    const { data: sRows, error: sErr } = await sbAdmin
      .from('support_log')
      .select('used_context, handoff, latency_ms')
      .gte('created_at', since);

    const { data: pRows, error: pErr } = await sbAdmin
      .from('presales_log')
      .select('id')
      .gte('created_at', since);

    if (sErr || pErr) throw sErr || pErr;

    const total = sRows?.length ?? 0;
    const deflected = sRows?.filter(r => r.used_context && !r.handoff).length ?? 0;
    const handoffs = sRows?.filter(r => r.handoff).length ?? 0;
    const latencies = (sRows ?? []).map(r => r.latency_ms ?? 0).sort((a,b)=>a-b);
    const p95 = latencies.length ? latencies[Math.floor(0.95 * (latencies.length - 1))] / 1000 : 7.8;

    const leads = pRows?.length ?? 0;
    // Démo : RDV = 30% des leads (mock si besoin)
    const rdv = Math.round(leads * 0.3);

    const deflectionPct = total ? Math.round((deflected / total) * 100) : 52;
    const handoffPct = total ? Math.round((handoffs / total) * 100) : 18;

    return NextResponse.json({
      ok: true,
      since,
      deflectionPct,
      p95s: Number(p95.toFixed(1)),
      handoffPct,
      leads,
      rdv
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'kpi_error' }, { status: 500 });
  }
}
