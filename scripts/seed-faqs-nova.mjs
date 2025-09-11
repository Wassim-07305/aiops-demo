// scripts/seed-faqs-nova.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const faqs = [
  // Livraison
  { q: "Délais de livraison en France ?", a: "2–4 jours ouvrés.", c: "livraison — délais (#livraison-delais)" },
  { q: "Je n’ai pas reçu mon tracking", a: "E-mail avec lien de suivi après expédition.", c: "livraison — suivi (#livraison-suivi)" },
  { q: "Combien coûtent les frais de port ?", a: "4,90 € < 80 €, offerts ≥ 80 €.", c: "livraison — frais (#livraison-frais)" },
  { q: "Ma commande est en retard", a: "Au-delà de 7 j ouvrés, contactez support@novamode.fr.", c: "livraison — retard (#livraison-retard)" },
  { q: "Livrez-vous en Belgique ?", a: "Hors du périmètre du doc. Je préfère transférer à un humain.", c: "hors-scope" },
  { q: "Puis-je choisir Chronopost ?", a: "Non mentionné. Je préfère transférer à un humain.", c: "hors-scope" },
  { q: "Changer l’adresse après commande ?", a: "Voir Commandes — adresse.", c: "commande — adresse (#commande-adresse)" },

  // Retours
  { q: "Délai de retour", a: "30 jours, produits non portés, étiquettes intactes.", c: "retours — délai (#retour-delai)" },
  { q: "Comment faire un retour ?", a: "Formulaire → étiquette par e-mail.", c: "retours — procédure (#retour-procedure)" },
  { q: "Remboursement en combien de temps ?", a: "5–10 jours après réception.", c: "retours — remboursement (#retour-remboursement)" },
  { q: "Échange possible ?", a: "Oui, même référence si stock.", c: "retours — échange (#retour-echange)" },
  { q: "Retour en boutique ?", a: "Non mentionné. Je préfère transférer à un humain.", c: "hors-scope" },
  { q: "Frais de retour ?", a: "Non précisé. Je préfère transférer à un humain.", c: "hors-scope" },

  // Tailles & produits
  { q: "Ça taille comment ?", a: "Chemises ajustées ; sweats oversize.", c: "tailles — conseils (#tailles-conseils)" },
  { q: "Où est le guide des tailles ?", a: "Sur chaque fiche produit.", c: "tailles — guide (#tailles-guide)" },
  { q: "Matière du pull ?", a: "Laine mérinos.", c: "produits — matières (#produit-matieres)" },
  { q: "Lavage à combien ?", a: "Non mentionné. Je préfère transférer à un humain.", c: "hors-scope" },
  { q: "Garantie ?", a: "Non mentionné. Je préfère transférer à un humain.", c: "hors-scope" },

  // Commandes & paiements
  { q: "Moyens de paiement ?", a: "CB, PayPal, Apple Pay ; 3× via Alma.", c: "paiement — modes (#paiement-modes)" },
  { q: "Je veux annuler", a: "Avant expédition : oui. Après : retour standard.", c: "commandes — annulation (#commande-annulation)" },
  { q: "Changer l’article après achat", a: "Avant expédition : répondre à l’e-mail.", c: "commandes — modification (#commande-modif)" },
  { q: "Adresse erronée", a: "Écrire à support@novamode.fr au plus vite.", c: "commandes — adresse (#commande-adresse)" },
  { q: "Facture", a: "Non mentionné. Je préfère transférer à un humain.", c: "hors-scope" },
  { q: "Paiement refusé", a: "Non précisé dans le doc. Je préfère transférer à un humain.", c: "hors-scope" },

  // Promos / Giftcards / RGPD / Service
  { q: "Cumuler 2 codes promo ?", a: "Non, sauf mention contraire.", c: "promotions — codes (#promo-codes)" },
  { q: "Carte cadeau : durée ?", a: "24 mois, utilisable en plusieurs fois.", c: "cartes cadeaux (#giftcard)" },
  { q: "Comment vous contacter ?", a: "support@novamode.fr ; lun–ven 9–18.", c: "service client — horaires/contact (#support-horaires #support-contact)" },
  { q: "Supprimer mes données ?", a: "Écrire à dpo@novamode.fr.", c: "rgpd — droits (#rgpd-droits)" },
  { q: "Stockez-vous mes CB ?", a: "Paiements via Stripe/PayPal.", c: "rgpd — paiement (#rgpd-paiement)" },
  { q: "Parler à un humain", a: "Oui — bouton Transférer (Slack).", c: "service client" },

  // Variantes/typos utiles (améliore le rappel)
  { q: "Ou est ma commande svp ?", a: "Suivi après expédition via e-mail.", c: "livraison — suivi (#livraison-suivi)" },
  { q: "Comment je retourne mon article ???", a: "Formulaire → étiquette par e-mail.", c: "retours — procédure (#retour-procedure)" },
  { q: "Frais de port ?", a: "4,90 € < 80 €, offerts ≥ 80 €.", c: "livraison — frais (#livraison-frais)" },
  { q: "Delai remboursement", a: "5–10 jours après réception.", c: "retours — remboursement (#retour-remboursement)" },
];

async function main() {
  const rows = faqs.map(x => ({
    question: x.q,
    answer: x.a,
    category: x.c
  }));
  const { data, error } = await sb.from('faqs').insert(rows).select('id');
  if (error) throw error;
  console.log(`Inserted ${data.length} Nova Mode FAQs`);
}
main().catch(e => { console.error(e); process.exit(1); });
