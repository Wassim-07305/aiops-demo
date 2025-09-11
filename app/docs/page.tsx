// app/docs/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type DocItem = { id: string; text: string };
type DocSection = { id: string; title: string; badge?: string; items: DocItem[] };

const SECTIONS: DocSection[] = [
  {
    id: 'livraison',
    title: 'Livraison',
    badge: 'Shipping',
    items: [
      { id: 'livraison-delais', text: 'Délais France : 2–4 jours ouvrés.' },
      { id: 'livraison-suivi', text: 'Suivi : un e-mail avec lien de suivi est envoyé après l’expédition.' },
      { id: 'livraison-frais', text: 'Frais : 4,90 € < 80 €, offerts ≥ 80 €.' },
      { id: 'livraison-retard', text: 'Retard : au-delà de 7 jours ouvrés, contactez support@novamode.fr.' },
    ],
  },
  {
    id: 'retours',
    title: 'Retours & échanges',
    badge: 'Returns',
    items: [
      { id: 'retour-delai', text: 'Délai : 30 jours, produits non portés, étiquettes intactes.' },
      { id: 'retour-procedure', text: 'Procédure : formulaire en ligne → étiquette retour par e-mail.' },
      { id: 'retour-remboursement', text: 'Remboursement : 5–10 jours après réception.' },
      { id: 'retour-echange', text: 'Échanges : même référence selon stock.' },
    ],
  },
  {
    id: 'tailles-produits',
    title: 'Tailles & produits',
    badge: 'Products',
    items: [
      { id: 'tailles-guide', text: 'Guide des tailles : sur chaque fiche produit.' },
      { id: 'tailles-conseils', text: 'Conseils : chemises ajustées ; sweats oversize.' },
      { id: 'produit-matieres', text: 'Matières : coton bio (basiques), laine mérinos (pulls).' },
    ],
  },
  {
    id: 'commandes-paiements',
    title: 'Commandes & paiements',
    badge: 'Orders',
    items: [
      { id: 'paiement-modes', text: 'Paiements : CB, PayPal, Apple Pay ; 3× via Alma.' },
      { id: 'commande-modif', text: 'Modification : possible avant expédition (répondre à l’e-mail).' },
      { id: 'commande-annulation', text: 'Annulation : possible avant expédition ; après = retour standard.' },
      { id: 'commande-adresse', text: 'Adresse erronée : écrire à support@novamode.fr au plus vite.' },
    ],
  },
  {
    id: 'promos-giftcards',
    title: 'Promotions & cartes cadeaux',
    badge: 'Promo',
    items: [
      { id: 'promo-codes', text: 'Codes promo : à saisir au checkout ; non cumulables sauf mention contraire.' },
      { id: 'giftcard', text: 'Cartes cadeaux : valables 24 mois, utilisables en plusieurs fois.' },
    ],
  },
  {
    id: 'support',
    title: 'Service client',
    badge: 'Support',
    items: [
      { id: 'support-horaires', text: 'Horaires : lun–ven, 9h–18h (Paris).' },
      { id: 'support-contact', text: 'Contact : support@novamode.fr' },
    ],
  },
  {
    id: 'rgpd',
    title: 'Protection des données (RGPD)',
    badge: 'Privacy',
    items: [
      { id: 'rgpd-minimisation', text: 'Données minimisées, accès restreint.' },
      { id: 'rgpd-droits', text: 'Droit d’accès/suppression : dpo@novamode.fr.' },
      { id: 'rgpd-paiement', text: 'Paiements traités par prestataires certifiés (Stripe/PayPal).' },
    ],
  },
];

export const dynamic = 'force-static';

export default function DocsPage() {
  const [q, setQ] = useState('');
  const [active, setActive] = useState<string>('');

  // Filtrage simple
  const filtered = useMemo(() => {
    if (!q.trim()) return SECTIONS;
    const t = norm(q);
    return SECTIONS.map(s => ({
      ...s,
      items: s.items.filter(it => norm(it.text).includes(t) || norm(it.id).includes(t)),
    })).filter(s => s.items.length > 0);
  }, [q]);

  // Scroll-spy (observe titres h2/h3)
  useScrollSpy(setActive);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* halos */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(99,102,241,.16),transparent),radial-gradient(50%_60%_at_120%_20%,rgba(16,185,129,.14),transparent)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/20 to-emerald-400/20 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-fuchsia-500/18 to-cyan-400/18 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 sm:px-10 py-10 sm:py-14">
        {/* Header + search */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Nova Mode — Politique & FAQ</h1>
            <p className="text-sm text-foreground/70">Ces ancres sont citées par le chatbot (Sources: …).</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="rounded-xl border border-foreground/15 bg-background/70 backdrop-blur px-3 py-2">
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher (ex: retour, frais, suivi)…"
                className="bg-transparent outline-none text-sm"
              />
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          {/* TOC sticky (desktop) */}
          <aside className="hidden lg:block">
            <nav className="sticky top-20 space-y-2">
              {SECTIONS.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`block rounded-lg px-3 py-2 text-sm transition
                    ${active.startsWith(s.id) ? 'bg-foreground/10 font-medium' : 'hover:bg-foreground/5'}`}
                >
                  <span className="mr-2">#</span>{s.title}
                </a>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div className="space-y-6">
            {filtered.map((section, idx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.04 * idx }}
              >
                <GradientCard>
                  <CardContent className="p-5 sm:p-6">
                    <SectionHeader id={section.id} title={section.title} badge={section.badge} />
                    <ul className="mt-3 space-y-2">
                      {section.items.map((it) => (
                        <li key={it.id} id={it.id} className="group relative rounded-lg border border-foreground/10 bg-foreground/5 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <span className="text-sm leading-relaxed">
                              <Highlighter q={q}>{it.text}</Highlighter>
                            </span>
                            <AnchorCopy id={it.id} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </GradientCard>
              </motion.div>
            ))}

            {/* Note */}
            <p className="text-xs text-foreground/60">
              Astuce : utilisez les ancres (ex. <code className="px-1 rounded bg-foreground/10">#livraison-delais</code>) pour citer précisément dans le chat.
            </p>

            {/* Back to top */}
            <div className="pt-2">
              <Button
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="rounded-xl"
                variant="secondary"
              >
                Remonter en haut ↑
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= Components ================= */

function GradientCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative rounded-2xl p-[1.2px] bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-emerald-500/40">
      <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
        {children}
      </Card>
    </div>
  );
}

function SectionHeader({ id, title, badge }: { id: string; title: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <a
          href={`#${id}`}
          id={id}
          className="text-lg font-semibold tracking-tight hover:underline decoration-dotted underline-offset-4"
        >
          {title}
        </a>
        {badge ? <Badge variant="outline" className="border-foreground/20">{badge}</Badge> : null}
      </div>
      <CopyBtn hash={id} label="Copier l’ancre" />
    </div>
  );
}

function CopyBtn({ hash, label }: { hash: string; label?: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        const url = `${location.origin}${location.pathname}#${hash}`;
        try {
          await navigator.clipboard.writeText(url);
          setOk(true);
          setTimeout(() => setOk(false), 1000);
        } catch {}
      }}
      className="text-xs rounded-lg border border-foreground/15 px-2 py-1 hover:bg-foreground/5"
      aria-label={label || 'Copier le lien'}
      title={label || 'Copier le lien'}
    >
      {ok ? 'Copié ✓' : 'Copier'}
    </button>
  );
}

function AnchorCopy({ id }: { id: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button
      onClick={async () => {
        const url = `${location.origin}${location.pathname}#${id}`;
        try {
          await navigator.clipboard.writeText(url);
          setOk(true);
          setTimeout(() => setOk(false), 1000);
        } catch {}
      }}
      className="opacity-60 hover:opacity-100 text-xs rounded-md border border-foreground/15 px-2 py-1"
      title="Copier le lien direct"
    >
      {ok ? 'Lien copié ✓' : `#${id}`}
    </button>
  );
}

function Highlighter({ q, children }: { q: string; children: string }) {
  if (!q.trim()) return <>{children}</>;
  const t = norm(q);
  const parts = splitMatch(children, t);
  return (
    <>
      {parts.map((p, i) =>
        p.m ? (
          <mark key={i} className="rounded px-1 bg-emerald-500/20">
            {p.s}
          </mark>
        ) : (
          <span key={i}>{p.s}</span>
        )
      )}
    </>
  );
}

/* ================= Hooks & Utils ================= */

function useScrollSpy(setActive: (id: string) => void) {
  useEffect(() => {
    const headings = Array.from(document.querySelectorAll('a[id]')) as HTMLElement[];
    if (!headings.length) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (a.boundingClientRect.top > b.boundingClientRect.top ? 1 : -1));
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: [0, 1] }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [setActive]);
}

function norm(s: string) {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function splitMatch(s: string, needle: string) {
  if (!needle) return [{ s, m: false }];
  const lower = norm(s);
  const idxs: { i: number; l: number }[] = [];
  let i = 0;
  while ((i = lower.indexOf(needle, i)) !== -1) {
    idxs.push({ i, l: needle.length });
    i += needle.length;
  }
  if (!idxs.length) return [{ s, m: false }];
  const out: { s: string; m: boolean }[] = [];
  let prev = 0;
  idxs.forEach(({ i, l }) => {
    if (i > prev) out.push({ s: s.slice(prev, i), m: false });
    out.push({ s: s.slice(i, i + l), m: true });
    prev = i + l;
  });
  if (prev < s.length) out.push({ s: s.slice(prev), m: false });
  return out;
}
