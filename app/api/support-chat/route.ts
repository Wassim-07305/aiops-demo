// app/api/support-chat/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const TOP_K = 8;               // ↑ de 5 à 8
const SIM_THRESHOLD = 0.76;    // ↑ de 0.74 à 0.76
const sbAdmin = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE!);

const SYSTEM_PROMPT = `
Tu es un assistant de support e-commerce STRICT.
- Réponds UNIQUEMENT avec les CONTEXTES (FAQs) fournis.
- Si la question n'est pas couverte, refuse poliment et propose un transfert humain.
- N'AJOUTE PAS toi-même une section "Sources:" dans ta réponse (elle est ajoutée par le serveur).
- Pas d'invention. Sois concis et précis.
`.trim();

type MatchRow = {
  faq_id: string;
  question: string;
  answer: string;
  category: string | null;
  similarity: number;
};

// -----------------------------
// Cache embeddings
// -----------------------------
const embedCache = new Map<string, number[]>();
const MAX_CACHE = 200;
function evictOldest(map: Map<string, number[]>) {
  const it = map.keys().next();           // { value?: string, done: boolean }
  if (!it.done && typeof it.value === 'string') {
    map.delete(it.value);
  }
}
function keyOf(s: string) { return s.trim().toLowerCase(); }
async function embedQueryJina(text: string): Promise<number[]> {
  const k = keyOf(text);
  const cached = embedCache.get(k);
  if (cached) return cached;

  const maxRetries = 2;
  const baseDelay = 300;
  const timeoutMs = 8000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);

    try {
      const resp = await fetch('https://api.jina.ai/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.JINA_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'jina-embeddings-v3',
          input: [text],
          embedding_type: 'float',
          normalized: true,
          dimensions: 1024,
        }),
        signal: ac.signal,
      });
      clearTimeout(t);

      if (!resp.ok) {
        if ((resp.status >= 500 || resp.status === 429) && attempt < maxRetries) {
          await new Promise(r => setTimeout(r, baseDelay * attempt));
          continue;
        }
        throw new Error(`Jina HTTP ${resp.status}`);
      }

      const json: { data: { embedding: number[] }[] } = await resp.json();
      const vec = json.data[0].embedding;
      if (embedCache.size >= MAX_CACHE) evictOldest(embedCache);  // <-- safe
      embedCache.set(k, vec);
      return vec;
    } catch (err) {
      clearTimeout(t);
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, baseDelay * attempt));
    }
  }
  throw new Error('Jina failed after retries');
}

function buildContext(matches: MatchRow[]): string {
  if (!matches?.length) return '';
  return matches
    .map(
      (m, i) => `【FAQ#${i + 1} | ${m.category ?? 'n/a'}】Q: ${m.question}\nA: ${m.answer}`
    )
    .join('\n\n');
}

function sourcesLine(matches: MatchRow[]): string {
  if (!matches?.length) return '';
  const labels: string[] = [];
  for (const m of matches) {
    const cat = m.category || '';
    const anchorMatch = cat.match(/\(#([^)]+)\)/);
    if (!anchorMatch) continue;
    const anchor = anchorMatch[1];
    const title = cat.replace(/\s*\(#.*\)\s*/,'').trim() || 'Doc';
    labels.push(`${title} (/docs#${anchor})`);
    if (labels.length === 2) break;
  }
  if (!labels.length) return '';
  return `\n\nSources: ${labels.join(' ; ')}`;
}

// -----------------------------
// Helpers intents fragiles
// -----------------------------

function findByAnchor(rows: MatchRow[], anchor: string) {
  const a = `#${anchor.toLowerCase()}`;
  return rows.find(r => (r.category || '').toLowerCase().includes(a)) || null;
}

function intentShortCircuit(q: string, rows: MatchRow[]): { text: string; sources: MatchRow[] } | null {
  const qL = q.toLowerCase();
  if ((qL.includes('délai') || qL.includes('delai')) && qL.includes('retour')) {
    const m = findByAnchor(rows, 'retour-delai');
    if (m) return { text: m.answer, sources: [m] };
  }
  if (/(changer|modifier)/i.test(qL) && /article/i.test(qL)) {
    const m = findByAnchor(rows, 'commande-modif');
    if (m) return { text: m.answer, sources: [m] };
  }
  if (/(contacter|joindre|contact)/i.test(qL)) {
    const m = rows.find(r => /(support-horaires|support-contact)/i.test(r.category || ''));
    if (m) return { text: m.answer, sources: [m] };
  }
  return null;
}

// -----------------------------
// Boost heuristique
// -----------------------------
function boostHeuristic(q: string, rows: MatchRow[]): MatchRow[] {
  const qL = q.toLowerCase();
  return [...rows].sort((a, b) => {
    const score = (r: MatchRow) => {
      let bonus = 0;
      const cat = (r.category || '').toLowerCase();
      const askDelay = qL.includes('délai') || qL.includes('delai');
      if (askDelay && qL.includes('retour')) {
        if (cat.includes('#retour-delai')) bonus += 0.20;
        if (cat.includes('#retour-remboursement')) bonus -= 0.08;
      }
      if (/(contacter|joindre|contact)/i.test(qL) &&
          /(support-horaires|support-contact)/i.test(cat)) {
        bonus += 0.12;
      }
      if (/adresse/i.test(qL) && cat.includes('#commande-adresse')) bonus += 0.05;
      return (r.similarity ?? 0) + bonus;
    };
    return score(b) - score(a);
  });
}

// -----------------------------
// Preflight intents (avant embeddings)
// -----------------------------
const preflightIntents: { test: (q: string) => boolean; anchor: string }[] = [
  { test: q => /(d[ée]lai|delai)/i.test(q) && /retour/i.test(q), anchor: 'retour-delai' },
  { test: q => /(contacter|joindre|contact)/i.test(q), anchor: 'support-horaires' },
  { test: q => /adresse/i.test(q), anchor: 'commande-adresse' },
];

async function getFaqByAnchor(anchor: string): Promise<MatchRow | null> {
  const { data, error } = await sbAdmin
    .from('faqs')
    .select('id, question, answer, category')
    .ilike('category', `%#${anchor}%`)
    .limit(1);

  if (error || !data?.length) return null;
  const r = data[0];
  return {
    faq_id: r.id,
    question: r.question,
    answer: r.answer,
    category: r.category,
    similarity: 1,
  };
}

// -----------------------------
// POST
// -----------------------------
export async function POST(req: NextRequest) {
  const t0 = Date.now();
  try {
    const body = (await req.json()) as { message?: string };
    const message = body?.message ?? '';
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'missing_message' }, { status: 400 });
    }

    // 🔸 PRE-FLIGHT : bypass embeddings si évident
    for (const intent of preflightIntents) {
      if (intent.test(message)) {
        const m = await getFaqByAnchor(intent.anchor);
        if (m) {
          const reply = `${m.answer}${sourcesLine([m])}`;
          const latency = Date.now() - t0;
          await sbAdmin.from('support_log').insert({
            question: message,
            reply,
            top_sim: 1,
            used_context: true,
            handoff: false,
            latency_ms: latency,
            sources: [m.category ?? m.question],
          });
          return NextResponse.json({
            ok: true,
            reply,
            sources: [{ id: m.faq_id, question: m.question }],
            matches: [m],
            needHandoff: false,
            topSim: 1,
          });
        }
      }
    }

    // Sinon embeddings + match
    const queryEmbedding = await embedQueryJina(message);
    const { data: matches, error: matchErr } = await supabase.rpc('match_faqs', {
      query_embedding: queryEmbedding,
      match_count: TOP_K,
      similarity_threshold: SIM_THRESHOLD,
    });

    const latency = Date.now() - t0;
    if (matchErr || !matches || matches.length === 0) {
      await sbAdmin.from('support_log').insert({
        question: message,
        reply: 'Je préfère transférer à un humain pour être sûr. Voulez-vous que je vous mette en relation ?',
        top_sim: 0,
        used_context: false,
        handoff: true,
        latency_ms: latency,
        sources: [],
      });
      return NextResponse.json({
        ok: true,
        reply: 'Je préfère transférer à un humain pour être sûr. Voulez-vous que je vous mette en relation ?',
        sources: [],
        matches: [],
        needHandoff: true,
        topSim: 0,
      });
    }

    const typedMatches: MatchRow[] = matches as MatchRow[];
    const boostedMatches = boostHeuristic(message, typedMatches);
    const focused = boostedMatches.slice(0, 3);
    const topSim = Number(focused[0].similarity ?? 0);

    const sc = intentShortCircuit(message, boostedMatches);
    if (sc) {
      const reply = `${sc.text}${sourcesLine(sc.sources)}`;
      const needHandoff = topSim < 0.80;
      await sbAdmin.from('support_log').insert({
        question: message,
        reply,
        top_sim: topSim,
        used_context: true,
        handoff: needHandoff,
        latency_ms: Date.now() - t0,
        sources: sc.sources.slice(0, 2).map(m => m.category ?? m.question),
      });
      return NextResponse.json({
        ok: true,
        reply,
        sources: sc.sources.slice(0, 2).map(m => ({ id: m.faq_id, question: m.question })),
        matches: focused,
        needHandoff,
        topSim,
      });
    }

    const context = buildContext(focused);
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT + '\n\nCONTEXTES:\n' + context },
        { role: 'user', content: `Question:\n${message}\n\nRéponds strictement à partir des contextes.` },
      ],
      temperature: 0.2,
      max_tokens: 300,
    });

    const REFUS = "Je préfère transférer à un humain pour être sûr. Voulez-vous que je vous mette en relation ?";
    const raw = completion.choices[0]?.message?.content?.trim() ?? REFUS;
    const onlyHorsScope = focused.every(m => (m.category || '').toLowerCase().includes('hors-scope'));
    const hasDocAnchor = /\/docs#/.test(sourcesLine(focused));
    const normalized = (onlyHorsScope || !hasDocAnchor) ? REFUS : raw;
    const hasSources = /(^|\n)\s*Sources\s*:/i.test(normalized);
    const reply = hasSources ? normalized : (normalized + sourcesLine(focused));

    const usedContext = topSim >= SIM_THRESHOLD;
    const needHandoff = topSim < 0.80;

    await sbAdmin.from('support_log').insert({
      question: message,
      reply,
      top_sim: topSim,
      used_context: usedContext,
      handoff: needHandoff,
      latency_ms: Date.now() - t0,
      sources: focused.slice(0, 2).map((m) => m.category ?? m.question),
    });

    return NextResponse.json({
      ok: true,
      reply,
      sources: focused.slice(0, 2).map((m) => ({ id: m.faq_id, question: m.question })),
      matches: focused,
      needHandoff,
      topSim,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
