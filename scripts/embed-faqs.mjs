// scripts/embed-faqs.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

async function fetchFaqsNeedingEmbeddings() {
  const { data: existing, error: e1 } = await sb.from('faq_embeddings').select('faq_id');
  if (e1) throw e1;
  const have = new Set((existing ?? []).map(x => x.faq_id));
  const { data: faqs, error: e2 } = await sb.from('faqs').select('id, question, answer');
  if (e2) throw e2;
  return faqs.filter(f => !have.has(f.id));
}

async function embedBatch(texts) {
  const resp = await fetch('https://api.jina.ai/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'jina-embeddings-v3',
      input: texts,
      embedding_type: 'float',
      normalized: true,
      dimensions: 1024
    })
  });
  if (!resp.ok) throw new Error(`Jina error: ${resp.status}`);
  const json = await resp.json();
  return json.data.map(d => d.embedding);
}

async function main() {
  const rows = await fetchFaqsNeedingEmbeddings();
  console.log(`Embedding ${rows.length} FAQs...`);
  if (!rows.length) return console.log('Nothing to embed.');

  // par paquets de 32
  const B = 32;
  for (let i = 0; i < rows.length; i += B) {
    const slice = rows.slice(i, i + B);
    const embeddings = await embedBatch(slice.map(r => `${r.question}\n\n${r.answer}`));
    for (let j = 0; j < slice.length; j++) {
      const { error } = await sb.from('faq_embeddings').upsert({
        faq_id: slice[j].id,
        embedding: embeddings[j]
      }, { onConflict: 'faq_id' });
      if (error) throw error;
    }
    console.log(`Upserted ${Math.min(i + B, rows.length)} / ${rows.length}`);
  }
  console.log('✅ Done.');
}

main().catch(e => { console.error(e); process.exit(1); });
