// scripts/seed-faqs.mjs
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE);

const faqs = [
  // Suivi de commande
  { question: "Où est ma commande ?", answer: "Suivez votre colis via le lien reçu après expédition. Délais France 2–4 jours ouvrés.", category: "suivi" },
  { question: "Je n’ai pas reçu mon numéro de suivi", answer: "Il est envoyé à l’expédition. Vérifiez vos spams. Sinon, contactez-nous avec votre numéro de commande.", category: "suivi" },
  { question: "Colis indiqué livré mais rien reçu", answer: "Vérifiez auprès des voisins/gardien. Si introuvable après 24 h, contactez le transporteur puis notre support.", category: "suivi" },

  // Retours & échanges
  { question: "Comment retourner un article ?", answer: "Retour sous 30 jours, article non porté/étiqueté. Générez l’étiquette dans votre espace client.", category: "retours" },
  { question: "Délais de remboursement", answer: "5–10 jours ouvrés après réception et contrôle, recrédités sur le moyen de paiement initial.", category: "retours" },
  { question: "Échanger une taille", answer: "Échanges sous 30 jours selon stock. Lancez un retour ‘échange’ depuis votre espace client.", category: "retours" },

  // Tailles
  { question: "Quelle taille choisir ?", answer: "Référez-vous au guide des tailles sur la fiche produit. Pour un fit oversize, prenez +1 taille.", category: "tailles" },
  { question: "Guide des tailles", answer: "Disponible sous le prix sur chaque fiche produit. Écrivez-nous si vous hésitez entre deux tailles.", category: "tailles" },

  // Paiement
  { question: "Paiement refusé", answer: "Vérifiez fonds, 3D Secure, adresse de facturation. Essayez une autre carte ou PayPal. Contactez votre banque si besoin.", category: "paiement" },
  { question: "Paiement en plusieurs fois", answer: "3x disponible dès 100 € d’achat via notre partenaire pour les cartes éligibles.", category: "paiement" },

  // Livraison
  { question: "Frais de port", answer: "France: 4,90 €. Offerts dès 80 €. Express disponible avec supplément.", category: "livraison" },
  { question: "Délais de livraison", answer: "France 2–4 j ouvrés ; UE 3–6 j ; International 5–10 j (retards possibles en période de soldes).", category: "livraison" },
  { question: "Livraison internationale", answer: "Oui, la disponibilité et les tarifs s’affichent au checkout selon l’adresse.", category: "livraison" },

  // Commande & adresse
  { question: "Erreur d’adresse", answer: "Si non expédié, contactez-nous immédiatement pour corriger. Après expédition, modification impossible.", category: "commande" },
  { question: "Changer d’article après achat", answer: "Tant que non préparé : demande d’annulation puis nouvelle commande.", category: "commande" },

  // Produits
  { question: "Réassort d’un article", answer: "Activez l’alerte stock sur la fiche produit. Réassorts réguliers selon la demande.", category: "produits" },
  { question: "Conseils d’entretien", answer: "Lavage à 30°C sur l’envers. Évitez le sèche-linge pour préserver la coupe/couleur.", category: "produits" },

  // Politique / divers
  { question: "Annuler ma commande", answer: "Possible tant que non préparée. Après expédition, utilisez la procédure de retour (30 jours).", category: "commande" },
  { question: "Codes promo", answer: "Un seul code par commande. Non cumulable avec d’autres offres.", category: "commande" },
];

async function main() {
  const { data, error } = await supabase.from('faqs').insert(faqs).select('id');
  if (error) throw error;
  console.log(`Inserted ${data.length} FAQs`);
}
main().catch(e => { console.error(e); process.exit(1); });
