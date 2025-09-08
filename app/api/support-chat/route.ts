// app/api/support-chat/route.ts
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const TOP_K = 5;
const SIM_THRESHOLD = 0.78;

const SYSTEM_PROMPT = `
Tu es un assistant de support e-commerce STRICT.
- Réponds UNIQUEMENT avec les CONTEXTES (FAQs) fournis.
- Si la question n'est pas couverte, refuse poliment et propose un transfert humain.
- N'AJOUTE PAS toi-même une section "Sources:" dans ta réponse (elle est ajoutée par le serveur).
- Pas d'invention. Sois concis et précis.
`.trim();


async function embedQueryJina(text: string) {
  const resp = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      input: [text],
      embedding_type: 'float',
      normalized: true,
      dimensions: 1024
    })
  });
  if (!resp.ok) throw new Error(`Jina error: ${resp.status}`);
  const json = await resp.json();
  return json.data[0].embedding as number[];
}

function buildContext(matches: any[]) {
  if (!matches?.length) return '';
  return matches
    .map((m: any, i: number) => `【FAQ#${i + 1} | ${m.category}】Q: ${m.question}\nA: ${m.answer}`)
    .join('\n\n');
}

function sourcesLine(matches: any[]) {
  if (!matches?.length) return '';
  const titles = matches.slice(0, 2).map((m: any) => m.question);
  return `\n\nSources: ${titles.join(' ; ')}`;
}

export async function POST(req: NextRequest) {
    try {
      const { message } = await req.json();
      if (!message || typeof message !== 'string') {
        return NextResponse.json({ ok: false, error: 'missing_message' }, { status: 400 });
      }
  
      const queryEmbedding = await embedQueryJina(message);
  
      const { data: matches, error: matchErr } = await supabase.rpc('match_faqs', {
        query_embedding: queryEmbedding,
        match_count: TOP_K,
        similarity_threshold: SIM_THRESHOLD,
      });
      if (matchErr) {
        console.error('[match_faqs error]', matchErr);
        return NextResponse.json({ ok: false, error: 'retrieval_failed' }, { status: 500 });
      }
  
      if (!matches || matches.length === 0) {
        return NextResponse.json({
          ok: true,
          reply: "Je préfère transférer à un humain pour être sûr. Voulez-vous que je vous mette en relation ?",
          sources: [],
          matches: [],
          needHandoff: true,
          topSim: 0,
        });
      }
  
      const topSim = Number(matches[0].similarity ?? 0);
      const context = buildContext(matches);
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT + '\n\nCONTEXTES:\n' + context },
          { role: 'user', content: `Question:\n${message}\n\nRéponds strictement à partir des contextes.` },
        ],
        temperature: 0.2,
        max_tokens: 300,
      });
  
      const raw = completion.choices[0]?.message?.content?.trim()
         ?? "Je préfère transférer à un humain pour être sûr.";
      const hasSources = /(^|\n)\s*Sources\s*:/i.test(raw);
      const reply = hasSources ? raw : (raw + sourcesLine(matches));
  
      return NextResponse.json({
        ok: true,
        reply,
        sources: matches.slice(0, 2).map((m: any) => ({ id: m.faq_id, question: m.question })),
        matches,
        needHandoff: topSim < 0.80,  // <— handoff si le match est trop faible
        topSim,
      });
    } catch (e) {
      console.error(e);
      return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
    }
  }
  
