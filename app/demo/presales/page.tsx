// app/demo/presales/page.tsx
'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Msg = { id: string; role: 'agent' | 'user' | 'system'; text: string; at: string; error?: boolean };
const uid = () => Math.random().toString(36).slice(2, 10);

const CATEGORIES = ['chemises', 'sweats', 'pantalons', 'autre'] as const;
const BUDGETS = ['< 50 €', '50–90 €', '90–150 €', '> 150 €'] as const;
const TIMELINES = ['cette semaine', '2–4 semaines', 'plus tard'] as const;

export default function PresalesDemo() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: uid(), role: 'agent', text: 'Bonjour 👋 On va qualifier votre besoin.', at: new Date().toISOString() },
  ]);

  const [category, setCategory] = useState<string>('');
  const [budget, setBudget] = useState<string>('');
  const [timeline, setTimeline] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [tool, setTool] = useState<string>('');
  const [sending, setSending] = useState(false);

  // Score live (même logique que l’API)
  const score = useMemo(() => {
    let s = 1;
    if (/\d/.test(budget)) s += 2;
    if (/(jour|semaine|mois)/i.test(timeline) || timeline.length > 0) s += 1;
    if (/@/.test(email)) s += 1;
    return Math.max(1, Math.min(5, s));
  }, [budget, timeline, email]);

  // UX: autosize email/tool inputs on mobile? (Focus)
  const emailRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    // just a tiny polish: autofocus email after category+bhoek
    if (category && budget && !email) emailRef.current?.focus();
  }, [category, budget, email]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!category || !email || sending) return;

    setSending(true);

    try {
      const payload = {
        need: category || 'chemises',
        budget,
        timeline,
        tool,
        email,
      };
      const res = await fetch('/api/presales', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();

      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'agent',
          text: data?.ok
            ? `✅ Lead qualifié (score ${data.score}/5). Réserver un RDV: ${data.calendlyUrl}`
            : '⚠️ Erreur qualification',
          at: new Date().toISOString(),
          error: !data?.ok,
        },
      ]);

      if (data?.ok && data.calendlyUrl) window.open(data.calendlyUrl, '_blank');
    } catch {
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'system', text: '❌ Réseau indisponible. Réessaie dans un instant.', at: new Date().toISOString(), error: true },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Fond artistique */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(99,102,241,.20),transparent),radial-gradient(50%_60%_at_120%_20%,rgba(16,185,129,.18),transparent)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/25 to-emerald-400/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
      </div>

      <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-10 sm:pt-14">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Nova Mode — Pré-vente (démo)</h1>
              <p className="text-sm text-foreground/70">
                Qualification express → Slack + Calendly. <span className="opacity-70">(Option: push Sheet/HubSpot via Zapier)</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="secondary" className="rounded-full">Leads</Badge>
              <Badge variant="secondary" className="rounded-full">Calendly</Badge>
              <Badge variant="secondary" className="rounded-full">Slack</Badge>
            </div>
          </div>
        </motion.div>

        {/* Grille principale */}
        <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
          {/* Carte Formulaire */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.05 }}
            className="relative rounded-2xl p-[1.2px] bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-emerald-500/40"
          >
            <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
              <CardContent className="p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="text-foreground/70">Qualification express</span>
                  </div>
                  <div className="text-xs text-foreground/60">Score live <span className="font-medium">{score}/5</span></div>
                </div>

                <form onSubmit={submit} className="mt-4 space-y-4">
                  {/* Catégorie */}
                  <Field label="Vous cherchez quoi ?">
                    <ChipRow value={category} onChange={setCategory} options={CATEGORIES as unknown as string[]} icon="bag" />
                  </Field>

                  {/* Budget */}
                  <Field label="Budget ?">
                    <ChipRow value={budget} onChange={setBudget} options={BUDGETS as unknown as string[]} icon="euro" />
                  </Field>

                  {/* Timeline */}
                  <Field label="Quand voulez-vous acheter ?">
                    <ChipRow value={timeline} onChange={setTimeline} options={TIMELINES as unknown as string[]} icon="calendar" />
                  </Field>

                  {/* Outil + Email */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label>Outil actuel</Label>
                      <input
                        value={tool}
                        onChange={(e) => setTool(e.target.value)}
                        placeholder="Ex: Shopify, Prestashop…"
                        className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>E-mail</Label>
                      <input
                        ref={emailRef}
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="prenom@entreprise.com"
                        required
                        className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
                      />
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button type="submit" disabled={!category || !email || sending} className="rounded-xl">
                      {sending ? 'Envoi…' : 'Envoyer'}
                    </Button>
                    <span className="text-xs text-foreground/60">Un récap est poussé sur Slack. Si qualifié, ouvre Calendly.</span>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>

          {/* Carte Messages + Score */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08 }}
            className="space-y-5"
          >
            {/* Score visuel */}
            <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Probabilité de **qualification**</h3>
                  <span className="text-xs text-foreground/60">Live</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <ScoreDots value={score} />
                  <span className="text-sm text-foreground/70">
                    {score >= 4 ? 'Élevée' : score === 3 ? 'Moyenne' : 'Faible'}
                  </span>
                </div>
                <p className="mt-2 text-xs text-foreground/60">
                  +2 si budget renseigné • +1 si délai renseigné • +1 si email valide.
                </p>
              </CardContent>
            </Card>

            {/* Transcript */}
            <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
              <CardContent className="p-0">
                <div className="px-4 py-3 border-b border-foreground/10 text-sm text-foreground/70">Historique</div>
                <div className="h-[300px] overflow-y-auto p-4 space-y-3">
                  <AnimatePresence initial={false}>
                    {messages.map((m) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.18 }}
                        className="mr-auto max-w-[95%]"
                      >
                        <div
                          className={[
                            'rounded-2xl px-3 py-2 text-sm border shadow-sm',
                            m.error
                              ? 'bg-destructive/10 border-destructive/30'
                              : 'bg-foreground/5 border-foreground/10',
                          ].join(' ')}
                        >
                          {m.text}
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <p className="mt-6 mb-10 text-center text-xs text-foreground/60">
          Astuce: pré-remplis les chips pour accélérer la qualif, puis clique <span className="font-medium">Envoyer</span>.
        </p>
      </section>
    </main>
  );
}

/* -------------------- UI helpers -------------------- */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-xs uppercase tracking-wide text-foreground/60">{children}</div>;
}

function ChipRow({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  icon?: 'bag' | 'euro' | 'calendar';
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map((opt) => {
        const active = value === opt;
        return (
          <Button
            key={opt}
            type="button"
            variant={active ? 'default' : 'outline'}
            className={`h-8 rounded-full px-3 text-xs ${active ? '' : 'border-foreground/20'}`}
            onClick={() => onChange(opt)}
          >
            {icon === 'bag' && <IconBag className="mr-1.5 size-3.5" />}
            {icon === 'euro' && <IconEuro className="mr-1.5 size-3.5" />}
            {icon === 'calendar' && <IconCalendar className="mr-1.5 size-3.5" />}
            {opt}
          </Button>
        );
      })}
    </div>
  );
}

function ScoreDots({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < value;
        return (
          <div key={i} className="relative">
            <div className={`h-3.5 w-3.5 rounded-full ${filled ? 'bg-emerald-500' : 'bg-foreground/15'}`} />
            {filled && <div className="absolute inset-0 rounded-full animate-ping bg-emerald-400/40" />}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- Icons (inline, no deps) -------------------- */

function IconBag({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M6 7h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7Z" />
      <path d="M9 7a3 3 0 0 1 6 0" />
    </svg>
  );
}
function IconEuro({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M5 12h10" />
      <path d="M5 8h10" />
      <path d="M9 16h6" />
      <path d="M15 6a6 6 0 1 1 0 12" />
    </svg>
  );
}
function IconCalendar({ className = 'size-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M16 3v4M8 3v4M3 11h18" />
    </svg>
  );
}
