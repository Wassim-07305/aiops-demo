// app/demo/support/page.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type Msg = { id: string; role: 'user' | 'agent' | 'system'; text: string; at: string; error?: boolean };
const uid = () => Math.random().toString(36).slice(2, 10);

const SUGGESTIONS = [
  'Délais de livraison ?',
  'Délai de retour ?',
  'Quels moyens de paiement ?',
  'Je veux annuler.',
  'Puis-je parler à un humain ?',
];

export default function SupportDemo() {
  const [messages, setMessages] = useState<Msg[]>([
    {
      id: uid(),
      role: 'agent',
      text: 'Bonjour 👋 Que puis-je faire pour vous (support L1) ?',
      at: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize du textarea
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = '0px';
    ta.style.height = Math.min(180, Math.max(56, ta.scrollHeight)) + 'px';
  }, [input]);

  // Scroll bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  async function send(raw?: string) {
    const text = (raw ?? input).trim();
    if (!text || sending) return;
    setInput('');
    setSending(true);
    setTyping(true);

    const userMsg: Msg = { id: uid(), role: 'user', text, at: new Date().toISOString() };
    setMessages((m) => [...m, userMsg]);

    try {
      const res = await fetch('/api/support-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
      const data = await res.json();
      const replyText = data?.reply ?? '⚠️ Erreur de réponse.';
      const agentMsg: Msg = { id: uid(), role: 'agent', text: replyText, at: new Date().toISOString() };
      setMessages((m) => [...m, agentMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'system',
          text: '❌ Réseau indisponible. Réessaie dans un instant.',
          at: new Date().toISOString(),
          error: true,
        },
      ]);
    } finally {
      setSending(false);
      setTyping(false);
    }
  }

  async function handoff() {
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')?.text ?? null;
    try {
      await fetch('/api/handoff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tab: 'Support',
          lastUserMessage: lastUser,
          transcript: messages,
          at: new Date().toISOString(),
        }),
      });
      setMessages((m) => [
        ...m,
        { id: uid(), role: 'agent', text: '✅ Handoff envoyé sur Slack. Un humain prend le relais.', at: new Date().toISOString() },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: 'system',
          text: '❌ Handoff Slack indisponible (webhook ?).',
          at: new Date().toISOString(),
          error: true,
        },
      ]);
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
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

      {/* Header */}
      <section className="mx-auto max-w-5xl px-6 sm:px-10 pt-10 sm:pt-14">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">Nova Mode — Support L1 (démo)</h1>
              <p className="text-sm text-foreground/70">
                Réponses **strict RAG** avec citations → hors-scope = refus sûr. Bouton{' '}
                <span className="font-medium">Handoff Slack</span>.
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className="rounded-full" variant="secondary">
                RAG
              </Badge>
              <Badge className="rounded-full" variant="secondary">
                Citations
              </Badge>
              <Badge className="rounded-full" variant="secondary">
                Handoff
              </Badge>
            </div>
          </div>
        </motion.div>

        {/* Shell Chat */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="relative rounded-2xl p-[1.2px] bg-gradient-to-br from-indigo-500/40 via-fuchsia-500/30 to-emerald-500/40"
        >
          <Card className="rounded-2xl bg-background/70 backdrop-blur border-foreground/15 shadow-sm">
            <CardContent className="p-0">
              {/* Barre d’état */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-foreground/10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span className="text-xs text-foreground/70">En ligne — citations activées</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" className="rounded-xl" onClick={handoff} disabled={sending}>
                    Handoff Slack
                  </Button>
                </div>
              </div>

              {/* Zone messages */}
              <div ref={scrollRef} className="h-[64vh] sm:h-[60vh] overflow-y-auto px-3 sm:px-4 py-4 space-y-3">
                <AnimatePresence initial={false}>
                  {messages.map((m) => (
                    <MessageBubble key={m.id} msg={m} />
                  ))}
                  {typing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.2 }}
                      className="mr-auto max-w-[85%]"
                    >
                      <div className="inline-flex items-center gap-2 rounded-2xl bg-foreground/10 px-3 py-2 text-sm">
                        <TypingDots /> <span className="text-foreground/70">Rédaction…</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Composer */}
              <div className="border-t border-foreground/10 p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <textarea
                      ref={taRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={onKey}
                      rows={2}
                      placeholder="Posez votre question… (Entrée = envoyer, Shift+Entrée = retour à la ligne)"
                      className="flex-1 resize-none rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/15"
                    />
                    <Button onClick={() => send()} disabled={sending || !input.trim()} className="rounded-xl">
                      {sending ? '…' : 'Envoyer'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => send(s)}
                        className="text-xs rounded-full border border-foreground/15 px-2 py-1 hover:bg-foreground/5"
                        disabled={sending}
                      >
                        {s}
                      </button>
                    ))}
                    <Link href="/docs" target="_blank" className="text-xs underline opacity-70 hover:opacity-100 ml-auto">
                      Voir les docs citées ↗
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <p className="mt-4 mb-10 text-center text-xs text-foreground/60">
          Démo stricte : si la réponse n’est pas dans la page docs, l’agent **refuse** et propose le handoff.
        </p>
      </section>
    </main>
  );
}

/* ---------- Composants ---------- */

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === 'user';
  const isSystem = msg.role === 'system';
  const parts = useMemo(() => splitSources(msg.text), [msg.text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`${isUser ? 'ml-auto' : 'mr-auto'} max-w-[85%]`}
    >
      <div
        className={[
          'rounded-2xl px-3 py-2 text-sm shadow-sm border',
          isSystem
            ? 'bg-destructive/10 border-destructive/30 text-destructive-foreground'
            : isUser
            ? 'bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10 border-foreground/15'
            : 'bg-foreground/5 border-foreground/10',
        ].join(' ')}
      >
        {/* Contenu principal sans la ligne Sources */}
        <div className="whitespace-pre-wrap leading-relaxed">{parts.body}</div>

        {/* Citations (si présentes) */}
        {parts.sources.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-xs opacity-60">Sources :</span>
            {parts.sources.map((s, i) =>
              s.href ? (
                <a
                  key={i}
                  className="text-xs rounded-full border border-foreground/20 px-2 py-0.5 hover:bg-foreground/5"
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  title={s.label}
                >
                  {s.short}
                </a>
              ) : (
                <span key={i} className="text-xs rounded-full border border-foreground/20 px-2 py-0.5">
                  {s.short}
                </span>
              ),
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1">
      <i className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:-0.2s]" />
      <i className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:0s]" />
      <i className="h-1.5 w-1.5 rounded-full bg-foreground/60 animate-bounce [animation-delay:0.2s]" />
    </span>
  );
}

/* ---------- Utils ---------- */

/**
 * Sépare le corps et les citations "Sources: …" et extrait des liens /docs#ancre.
 * Retourne { body, sources: {label, short, href?}[] }
 */
function splitSources(text: string): { body: string; sources: { label: string; short: string; href?: string }[] } {
  const m = text.match(/([\s\S]*?)\n*\s*Sources\s*:\s*(.*)$/i);
  if (!m) return { body: text, sources: [] };

  const body = m[1].trim();
  const tail = m[2].trim();

  // Sépare par " ; "
  const bits = tail.split(/\s*;\s*/g).filter(Boolean);

  const sources = bits.map((b) => {
    // Exemple attendu: "livraison — délais (/docs#livraison-delais)"
    const anchor = b.match(/\(\/docs#([^)]+)\)/);
    const label = b.replace(/\s*\(\/docs#[^)]+\)\s*/g, '').trim();
    const short = label.length > 24 ? label.slice(0, 22) + '…' : label;
    return anchor
      ? { label, short, href: `/docs#${anchor[1]}` }
      : { label, short };
  });

  return { body, sources };
}
