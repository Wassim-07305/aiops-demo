/* app/demo/hub.tsx */
'use client';

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const items = [
  {
    href: "/demo/support",
    title: "Support L1",
    desc: "RAG + citations + refus sûrs + handoff Slack.",
    tags: ["RAG", "Citations", "Slack"],
    icon: (
      // Casque (inline SVG)
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 12a9 9 0 0 1 18 0v6a2 2 0 0 1-2 2h-2" />
        <path d="M3 18v-6" />
        <rect x="5" y="13" width="4" height="6" rx="1.2" />
        <rect x="15" y="13" width="4" height="6" rx="1.2" />
      </svg>
    ),
  },
  {
    href: "/demo/presales",
    title: "Pré-vente",
    desc: "4 questions → Slack + Calendly (lead qualifié).",
    tags: ["Leads", "Calendly", "Slack"],
    icon: (
      // Carte contact
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h7M7 13h10" />
      </svg>
    ),
  },
  {
    href: "/demo/dashboard",
    title: "Mini-dashboard",
    desc: "Déflection %, p95 (s), Handoff %, Leads/RDV.",
    tags: ["KPI", "Temps réel"],
    icon: (
      // Graph
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M3 3v18h18" />
        <path d="M7 15l4-4 3 3 4-6" />
      </svg>
    ),
  },
  {
    href: "/docs",
    title: "Docs citée",
    desc: "Politique & FAQ (ancres) — source des réponses.",
    tags: ["Source", "RGPD"],
    icon: (
      // Livre
      <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />
        <path d="M6 17h13" />
      </svg>
    ),
  },
];

export default function DemoHub() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Fond gradient + halos */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(99,102,241,.25),transparent),radial-gradient(50%_60%_at_120%_20%,rgba(16,185,129,.20),transparent)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/30 to-emerald-400/30 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
      </div>

      {/* Header */}
      <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-14 sm:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs backdrop-blur bg-background/60">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Nova Mode — Demo Pack</span>
            <Badge variant="secondary" className="ml-1">Live</Badge>
          </div>

          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Montre <span className="bg-gradient-to-r from-indigo-500 via-fuchsia-500 to-emerald-500 bg-clip-text text-transparent">la valeur</span> en 4 liens
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm sm:text-base text-foreground/70">
            Support L1 automatisé, qualification des leads, KPIs clairs, et docs citées — prêts pour un client Shopify (Nova Mode).
          </p>
        </motion.div>

        {/* Grid cartes */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.06 * i, ease: "easeOut" }}
              whileHover={{ y: -6 }}
            >
              {/* Border gradient shimmer */}
              <div className="relative rounded-2xl p-[1.2px] bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-emerald-500/40">
                <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex size-10 items-center justify-center rounded-xl bg-foreground/5">
                        <span className="text-foreground/80">{item.icon}</span>
                      </div>
                      <div className="flex gap-1.5">
                        {item.tags.map(t => (
                          <Badge key={t} variant="outline" className="border-foreground/20">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <h3 className="mt-4 text-lg font-medium">{item.title}</h3>
                    <p className="mt-1 text-sm text-foreground/70">{item.desc}</p>

                    <div className="mt-4 flex items-center justify-between">
                      <Button asChild className="rounded-xl">
                        <Link href={item.href} target="_blank" rel="noreferrer">
                          Ouvrir <span aria-hidden className="ml-1">↗</span>
                        </Link>
                      </Button>

                      {/* micro-indicateur de “prêt” */}
                      <div className="flex items-center gap-1 text-xs text-foreground/60">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        prêt
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bandeau CTA */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.3 }}
          className="mt-10"
        >
          <Card className="border-foreground/15 bg-background/70 backdrop-blur rounded-2xl">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-foreground/60">Astuce</p>
                <p className="text-sm sm:text-base text-foreground/80">
                  Ouvre chaque lien et fais une démo live : <span className="font-medium">ce que tu montres = ce que le client obtient</span>.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="secondary" className="rounded-xl">
                  <Link href="/docs" target="_blank" rel="noreferrer">Voir les Docs</Link>
                </Button>
                <Button asChild className="rounded-xl">
                  <Link href="/demo/dashboard" target="_blank" rel="noreferrer">Voir le Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className="mt-6 mb-12 text-center text-xs text-foreground/50">
          Données de démo. Utilise <span className="font-medium">/demo/support</span> et <span className="font-medium">/demo/presales</span> pour alimenter les KPIs.
        </p>
      </section>
    </main>
  );
}
