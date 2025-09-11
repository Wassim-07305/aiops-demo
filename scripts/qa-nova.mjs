// scripts/qa-nova.mjs
import 'dotenv/config';

const BASE = process.env.BASE_URL || 'http://localhost:3000';

const normalizeDashes = (s='') => s.replace(/[–—−-]/g, '-');
const norm = (s='') =>
  normalizeDashes(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

// helper: tous les tokens doivent être présents
function includesAll(haystack, tokens=[]) {
  return tokens.every(t => norm(haystack).includes(norm(t)));
}

const cases = [
  // --- Livraison (7)
  { q: "C’est livré en combien de temps en France ?", expect: ["2–4","jours","livraison-delais"] },
  { q: "Je n’ai pas reçu de tracking.", expect: ["suivi","expedition","livraison-suivi"] },
  { q: "C’est combien les frais de port ?", expect: ["4,90","80","livraison-frais"] },
  { q: "Ma commande est en retard.", expect: ["7","jours","support@novamode.fr","livraison-retard"] },
  { q: "Livrez-vous en Belgique ?", expect: ["transf","humain"] },        // hors-scope -> refus sûr
  { q: "Puis-je choisir Chronopost ?", expect: ["transf","humain"] },     // hors-scope -> refus sûr
  { q: "Puis-je changer l’adresse après commande ?", expect: ["adresse","support@novamode.fr","commande-adresse"] },

  // --- Retours (6)
  { q: "Délai de retour ?", expect: ["30","jours","retour-delai"] },
  { q: "Comment faire un retour ?", expect: ["formulaire","etiquette","retour-procedure"] },
  { q: "Remboursement en combien de temps ?", expect: ["5–10","jours","retour-remboursement"] },
  { q: "Échange possible ?", expect: ["meme","reference","stock","retour-echange"] },
  { q: "Retour en boutique ?", expect: ["transf","humain"] },             // hors-scope
  { q: "Frais de retour ?", expect: ["transf","humain"] },                // hors-scope

  // --- Tailles & produits (5)
  { q: "Ça taille grand ou petit ?", expect: ["chemises","ajuste","sweats","oversize","tailles-conseils"] },
  { q: "Guide des tailles où ?", expect: ["fiche","produit","tailles-guide"] },
  { q: "Matière du pull ?", expect: ["laine","merinos","produit-matieres"] },
  { q: "Laver à combien ?", expect: ["transf","humain"] },                // hors-scope
  { q: "Y a-t-il une garantie ?", expect: ["transf","humain"] },          // hors-scope

  // --- Commandes & paiements (6)
  { q: "Quels moyens de paiement ?", expect: ["cb","paypal","apple","alma","paiement-modes"] },
  { q: "Je veux annuler.", expect: ["avant","expedition","apres","retour","commande-annulation"] },
  { q: "Changer l’article après commande ?", expect: ["avant","expedition","repondre","email","commande-modif"] },
  { q: "Adresse erronée, je fais quoi ?", expect: ["support@novamode.fr","commande-adresse"] },
  { q: "Facture ?", expect: ["transf","humain"] },                         // hors-scope
  { q: "Paiement refusé.", expect: ["transf","humain"] },                  // hors-scope (rediriger)

  // --- Promos / Giftcards / RGPD / Service (6)
  { q: "Puis-je cumuler 2 codes promo ?", expect: ["non","promo-codes"] },
  { q: "Carte cadeau : durée ?", expect: ["24","mois","giftcard"] },
  { q: "Comment vous contacter ?", expect: ["support@novamode.fr","9","18","support-horaires"] },
  { q: "Supprimer mes données ?", expect: ["dpo@novamode.fr","rgpd-droits"] },
  { q: "Stockez-vous mes CB ?", expect: ["stripe","paypal","rgpd-paiement"] },
  { q: "Puis-je parler à un humain ?", expect: ["transf","humain"] },

  // --- Variantes/typos utiles
  { q: "Ou est ma commande svp ?", expect: ["suivi","expedition","livraison-suivi"] },
  { q: "Comment je retourne mon article ???", expect: ["formulaire","etiquette","retour-procedure"] },
  { q: "Frais de port ?", expect: ["4,90","80","livraison-frais"] },
  { q: "Delai remboursement", expect: ["5–10","jours","retour-remboursement"] },
];

async function ask(q) {
  const t0 = Date.now();
  const r = await fetch(`${BASE}/api/support-chat`, {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({ message: q }),
  });
  const j = await r.json();
  const ms = Date.now() - t0;
  return { reply: j.reply || '', ms, raw: j };
}

async function run() {
  const lat = [];
  let ok = 0;
  for (const c of cases) {
    const { reply, ms } = await ask(c.q);
    const pass = includesAll(reply, c.expect);
    lat.push(ms);
    console.log(`${pass ? '✅' : '❌'} ${c.q} | ${(ms/1000).toFixed(2)}s`);
    if (!pass) {
      console.log('   → expect:', c.expect.join(', '));
      console.log('   → reply :', reply);
    } else {
      ok++;
    }
    await new Promise(r => setTimeout(r, 200)); // petite pause anti-rate limit
  }
  lat.sort((a,b)=>a-b);
  const p95 = lat[Math.floor(0.95 * (lat.length - 1))] || 0;
  console.log(`\nScore: ${ok}/${cases.length}  | p95: ${(p95/1000).toFixed(2)}s`);
}

run().catch(e => { console.error(e); process.exit(1); });
