// app/page.tsx
"use client";

import { useMemo, useState } from "react";

type Role = "user" | "agent";
type Message = { id: string; role: Role; text: string; at: string };
type Tab = "Support" | "Pré-vente";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("Support");
  const [input, setInput] = useState("");

  const [supportMessages, setSupportMessages] = useState<Message[]>([
    { id: uid(), role: "agent", text: "Bonjour 👋 Que puis-je faire pour vous (support L1) ?", at: new Date().toISOString() },
  ]);
  const [presalesMessages, setPresalesMessages] = useState<Message[]>([
    { id: uid(), role: "agent", text: "Bonjour 👋 Souhaitez-vous être qualifié et prendre un RDV ?", at: new Date().toISOString() },
  ]);

  const messages = activeTab === "Support" ? supportMessages : presalesMessages;
  const setMessages = activeTab === "Support" ? setSupportMessages : setPresalesMessages;

  const lastUserMessage = useMemo(
    () => [...messages].reverse().find((m) => m.role === "user")?.text ?? null,
    [messages]
  );

  async function onSend() {
    const text = input.trim();
    if (!text) return;
    setInput("");
    const now = new Date().toISOString();

    setMessages((m) => [...m, { id: uid(), role: "user", text, at: now }]);

    // Réponse mock (le vrai RAG viendra demain)
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "agent",
          text: `J'ai reçu: "${text}" (réponse mock)`,
          at: new Date().toISOString(),
        },
      ]);
    }, 250);
  }

  async function onHandoff() {
    try {
      const res = await fetch("/api/handoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tab: activeTab,
          lastUserMessage,
          transcript: messages,
          at: new Date().toISOString(),
        }),
      });

      const data = await res.json().catch(() => ({ ok: false }));
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "agent",
          text: data?.ok ? "✅ Handoff envoyé (mock)" : "⚠️ Handoff échoué",
          at: new Date().toISOString(),
        },
      ]);
      console.log("Handoff response:", data);
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        { id: uid(), role: "agent", text: "⚠️ Erreur handoff", at: new Date().toISOString() },
      ]);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl p-6 sm:p-10">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">AI Ops Demo</h1>
          <p className="text-sm text-foreground/60">Squelette — 2 onglets, chat &amp; handoff (mock)</p>
        </header>

        {/* Tabs */}
        <div className="mb-3 flex gap-2">
          {(["Support", "Pré-vente"] as Tab[]).map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                aria-pressed={active}
                className={[
                  "rounded-lg border px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-foreground border-foreground/20 hover:bg-foreground/5",
                ].join(" ")}
              >
                {tab}
              </button>
            );
          })}
        </div>

        {/* Card */}
        <div className="rounded-xl border border-foreground/15 bg-background">
          {/* Chat area */}
          <div
            className="h-[420px] overflow-auto p-4 space-y-2"
            aria-live="polite"
            role="log"
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className={[
                  "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                  m.role === "user"
                    ? "ml-auto bg-blue-100 text-blue-950 dark:bg-blue-900/40 dark:text-blue-50"
                    : "mr-auto bg-foreground/10",
                ].join(" ")}
              >
                {m.text}
              </div>
            ))}
            {messages.length === 0 && (
              <p className="text-sm text-foreground/60">Aucun message pour l’instant…</p>
            )}
          </div>

          {/* Input row */}
          <div className="flex items-center gap-2 border-t border-foreground/10 p-3">
            <input
              className="flex-1 rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm outline-none focus:border-foreground/40"
              placeholder={activeTab === "Support" ? "Écrire au support..." : "Écrire côté pré-vente..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" ? onSend() : undefined}
            />
            <button
              onClick={onSend}
              className="rounded-md border border-foreground bg-foreground px-3 py-2 text-sm text-background transition-colors hover:bg-foreground/90"
            >
              Envoyer
            </button>
            <button
              onClick={onHandoff}
              className="rounded-md border border-foreground/40 bg-background px-3 py-2 text-sm transition-colors hover:bg-foreground/5"
            >
              Handoff
            </button>
          </div>
        </div>

        <p className="mt-3 text-xs text-foreground/50">
          Astuce : regarde les logs du terminal quand tu cliques <strong>Handoff</strong> — tu dois voir <code>[HANDOFF]</code>.
        </p>
      </div>
    </div>
  );
}
