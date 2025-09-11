// app/demo/dashboard/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type KPI = {
  ok: boolean;
  deflectionPct: number; // %
  p95s: number;          // seconds
  handoffPct: number;    // %
  leads: number;
  rdv: number;
};

export default function DashboardDemo() {
  const [kpi, setKpi] = useState<KPI | null>(null);
  const [loadedAt, setLoadedAt] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    fetch('/api/kpi')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return;
        setKpi(data?.ok ? data : null);
        setLoadedAt(new Date().toLocaleTimeString());
      })
      .catch(() => setKpi(null));
    return () => {
      mounted = false;
    };
  }, []);

  // Valeurs fallback élégantes pour preview instantané
  const data = kpi ?? {
    ok: true,
    deflectionPct: 52,
    p95s: 7.8,
    handoffPct: 18,
    leads: 21,
    rdv: 6,
  };

  const bookRate = useMemo(() => {
    const pct = data.leads ? Math.round((data.rdv / data.leads) * 100) : 0;
    return isFinite(pct) ? pct : 0;
  }, [data.leads, data.rdv]);

  return (
    <main className="relative min-h-[100dvh] overflow-hidden">
      {/* Fond artistique */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_40%_at_50%_-10%,rgba(99,102,241,.20),transparent),radial-gradient(50%_60%_at_120%_20%,rgba(16,185,129,.18),transparent)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-gradient-to-tr from-indigo-500/25 to-emerald-400/25 blur-3xl" />
        <div className="absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-gradient-to-tr from-fuchsia-500/25 to-cyan-400/25 blur-3xl" />
      </div>

      <section className="mx-auto max-w-6xl px-6 sm:px-10 pt-10 sm:pt-14">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">
              Nova Mode — Mini-dashboard <span className="text-foreground/50">(démo)</span>
            </h1>
            <p className="text-sm text-foreground/70">
              Données des 7 derniers jours — certaines valeurs peuvent être mockées si trafic faible.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="rounded-full">Live</Badge>
            {loadedAt ? (
              <span className="text-xs text-foreground/60">MAJ {loadedAt}</span>
            ) : (
              <span className="text-xs text-foreground/60">Chargement…</span>
            )}
          </div>
        </motion.div>

        {/* Grid KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ShimmerCard>
            <CardBody title="Déflection %" hint="Tickets résolus sans humain">
              <CircleGauge value={data.deflectionPct} />
              <BigNumber value={data.deflectionPct} suffix="%" />
              <Sparkline seed="deflect" base={data.deflectionPct} />
            </CardBody>
          </ShimmerCard>

          <ShimmerCard>
            <CardBody title="p95 (s)" hint="Temps de réponse (95e pctl)">
              <SpeedBar seconds={data.p95s} />
              <BigNumber value={data.p95s} decimals={1} suffix="s" />
              <Sparkline seed="p95" base={100 - Math.min(99, data.p95s * 10)} />
            </CardBody>
          </ShimmerCard>

          <ShimmerCard>
            <CardBody title="Handoff %" hint="Transferts vers humain">
              <CircleGauge value={data.handoffPct} tint="amber" />
              <BigNumber value={data.handoffPct} suffix="%" />
              <Sparkline seed="handoff" base={100 - data.handoffPct} />
            </CardBody>
          </ShimmerCard>

          <ShimmerCard>
            <CardBody title="Leads / RDV" hint="Pré-vente qualifiée">
              <div className="flex items-end gap-3">
                <StackNumber label="Leads" value={data.leads} />
                <StackNumber label="RDV" value={data.rdv} accent />
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="rounded-full">{bookRate}% book rate</Badge>
                <span className="text-xs text-foreground/60">Calendly</span>
              </div>
              <Sparkline seed="leads" base={Math.min(100, data.leads * 4)} />
            </CardBody>
          </ShimmerCard>
        </div>

        {/* Bandeau CTA */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1 }}
          className="mt-8"
        >
          <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
            <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-wide text-foreground/60">Action</p>
                <p className="text-sm sm:text-base text-foreground/80">
                  Alimente les métriques en testant le chat Support L1 & la qualification pré-vente.
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="secondary" className="rounded-xl">
                  <a href="/demo/support" target="_blank" rel="noreferrer">Ouvrir /demo/support</a>
                </Button>
                <Button asChild className="rounded-xl">
                  <a href="/demo/presales" target="_blank" rel="noreferrer">Ouvrir /demo/presales</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className="mt-6 mb-12 text-center text-xs text-foreground/60">
          Note : « données de démo » si peu d’événements. Continuez à discuter sur
          {' '}<a className="underline" href="/demo/support">/demo/support</a>{' '}
          et <a className="underline" href="/demo/presales">/demo/presales</a>.
        </p>
      </section>
    </main>
  );
}

/* ========== Building blocks ========== */

function ShimmerCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -4 }}
      className="relative rounded-2xl p-[1.2px] bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-emerald-500/40"
    >
      <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
        <CardContent className="p-5">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function CardBody({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <div className="text-xs uppercase tracking-wide text-foreground/60">{title}</div>
        {hint ? <div className="text-[11px] text-foreground/50">{hint}</div> : null}
      </div>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BigNumber({ value, suffix = '', decimals = 0 }: { value: number; suffix?: string; decimals?: number }) {
  const n = useAnimatedNumber(value, 600);
  return (
    <div className="mt-2 text-3xl font-semibold tracking-tight">
      {n.toFixed(decimals)}
      {suffix}
    </div>
  );
}

function StackNumber({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  const n = useAnimatedNumber(value, 600);
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-foreground/60">{label}</div>
      <div className={`text-2xl font-semibold ${accent ? 'text-emerald-500' : ''}`}>{Math.round(n)}</div>
    </div>
  );
}

/* ========== Visuals ========== */

// Sparkline (pure SVG, pas de lib)
function Sparkline({ seed, base }: { seed: string; base: number }) {
  // génère 24 points de 0..100, centrés autour de "base"
  const pts = useMemo(() => {
    const out: number[] = [];
    let s = hash(seed);
    for (let i = 0; i < 24; i++) {
      s = (s * 9301 + 49297) % 233280;
      const jitter = ((s / 233280) - 0.5) * 18; // ±9
      const v = clamp(base + jitter * Math.cos(i / 3), 4, 96);
      out.push(v);
    }
    return out;
  }, [seed, base]);

  const d = pointsToPath(pts);

  return (
    <div className="mt-4 h-12">
      <svg viewBox="0 0 100 24" className="h-full w-full">
        <defs>
          <linearGradient id={`g-${seed}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.8" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.2" />
          </linearGradient>
        </defs>
        <path d={d} fill="none" stroke={`url(#g-${seed})`} strokeWidth="1.8" className="text-indigo-500" />
      </svg>
    </div>
  );
}

// Jauge circulaire (%)
function CircleGauge({ value, tint = 'emerald' }: { value: number; tint?: 'emerald' | 'amber' }) {
  const radius = 42;
  const C = 2 * Math.PI * radius;
  const pct = clamp(value, 0, 100);
  const mv = useAnimatedNumber(pct, 700);
  const dash = useMemo(() => C - (mv / 100) * C, [C, mv]);

  const color = tint === 'emerald' ? 'text-emerald-500' : 'text-amber-500';

  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        <circle cx="50" cy="50" r={radius} stroke="currentColor" strokeWidth="10" className="text-foreground/10" fill="none" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          className={color}
          strokeDasharray={C}
          strokeDashoffset={dash}
          fill="none"
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-sm font-medium">{Math.round(mv)}%</div>
      </div>
    </div>
  );
}

// Barre “speedometer” pour p95 (0..12s)
function SpeedBar({ seconds }: { seconds: number }) {
  const max = 12;
  const v = clamp(seconds, 0, max);
  const mv = useAnimatedNumber((1 - v / max) * 100, 700); // plus c'est court, mieux c'est
  return (
    <div className="h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-emerald-500"
        style={{ width: `${mv}%` }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
      />
    </div>
  );
}

/* ========== Hooks & utils ========== */

function useAnimatedNumber(target: number, duration = 500) {
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 120, damping: 20 });
  const [val, setVal] = useState(0);

  useEffect(() => {
    const controls = spring.on('change', (v) => setVal(v));
    mv.set(target);
    const t = setTimeout(() => controls(), duration + 50);
    return () => {
      clearTimeout(t);
      controls();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return val;
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h || 1);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pointsToPath(values: number[]) {
  const stepX = 100 / (values.length - 1);
  const points = values.map((v, i) => [i * stepX, 24 - (v / 100) * 24] as const);
  let d = `M ${points[0][0]} ${points[0][1]}`;
  for (let i = 1; i < points.length; i++) {
    const [x, y] = points[i];
    const [px, py] = points[i - 1];
    const cx = (px + x) / 2;
    d += ` C ${cx} ${py}, ${cx} ${y}, ${x} ${y}`;
  }
  return d;
}
