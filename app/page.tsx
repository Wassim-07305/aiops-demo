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
  const [lastSupportReply, setLastSupportReply] = useState<string | null>(null);
  const [lastSupportSources, setLastSupportSources] = useState<string[]>([]);
  const [need, setNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [tool, setTool] = useState("");
  const [email, setEmail] = useState("");

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
  
    if (activeTab === "Support") {
      try {
        const res = await fetch("/api/support-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text }),
        });
        const data = await res.json();
        const reply = data?.ok && typeof data.reply === "string"
          ? data.reply
          : "⚠️ Erreur serveur (support)";
    
        setLastSupportReply(reply);
        setLastSupportSources(Array.isArray(data?.sources) ? data.sources.map((s:any)=>s.question) : []);
    
        setMessages((m) => [
          ...m,
          { id: uid(), role: "agent", text: reply, at: new Date().toISOString() },
        ]);
    
        // Suggestion d’escalade auto si nécessaire
        if (data?.needHandoff) {
          setMessages((m) => [
            ...m,
            { id: uid(), role: "agent", text: "Je peux vous mettre en relation avec un humain tout de suite. Cliquez sur Handoff.", at: new Date().toISOString() },
          ]);
        }
      } catch {
        setMessages((m) => [
          ...m,
          { id: uid(), role: "agent", text: "⚠️ Erreur réseau", at: new Date().toISOString() },
        ]);
      }
    } else {
      // Pré-vente : on n'utilise pas le chat libre, on passe par le formulaire
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "agent",
          text: "Pour la pré-vente, utilise le formulaire au-dessus (besoin, budget, délai, email) puis clique Envoyer. Je te donne ensuite un lien Calendly 👍",
          at: new Date().toISOString(),
        },
      ]);
      return;
    }
    
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
          lastAiReply: lastSupportReply,
          sources: lastSupportSources,
          at: new Date().toISOString(),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false }));
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          role: "agent",
          text: data?.ok ? "✅ Handoff envoyé" : "⚠️ Handoff échoué",
          at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
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
        {activeTab === "Pré-vente" && (
          <form
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 border-b border-foreground/10"
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await fetch("/api/presales", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ need, budget, timeline, tool, email }),
                });
            
                // 🔒 parse robuste (dev reloading friendly)
                let data: any = null;
                const ct = res.headers.get("content-type") || "";
                if (ct.includes("application/json")) {
                  data = await res.json();
                } else {
                  const txt = await res.text();
                  try { data = JSON.parse(txt); } catch { data = { ok: false }; }
                  console.warn("Non-JSON presales response:", txt);
                }
            
                if (data?.ok) {
                  setMessages((m) => [
                    ...m,
                    {
                      id: uid(),
                      role: "agent",
                      text: `✅ Lead qualifié (score ${data.score}/5). Réserver un RDV: ${data.calendlyUrl}`,
                      at: new Date().toISOString(),
                    },
                  ]);
                  // Option: ouvrir Calendly automatiquement
                  // window.open(data.calendlyUrl, "_blank");
                } else {
                  setMessages((m) => [
                    ...m,
                    { id: uid(), role: "agent", text: "⚠️ Erreur qualification", at: new Date().toISOString() },
                  ]);
                }
              } catch (err) {
                console.error(err);
                setMessages((m) => [
                  ...m,
                  { id: uid(), role: "agent", text: "⚠️ Erreur réseau (pré-vente)", at: new Date().toISOString() },
                ]);
              }
            }}
            
          >
            <input className="border rounded px-2 py-1" placeholder="Besoin" value={need} onChange={(e)=>setNeed(e.target.value)} required />
            <input className="border rounded px-2 py-1" placeholder="Budget (ex: 2 000 €)" value={budget} onChange={(e)=>setBudget(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="Délai (ex: 2-4 semaines)" value={timeline} onChange={(e)=>setTimeline(e.target.value)} />
            <input className="border rounded px-2 py-1" placeholder="Outil actuel" value={tool} onChange={(e)=>setTool(e.target.value)} />
            <input className="border rounded px-2 py-1 sm:col-span-2" placeholder="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} />
            <button className="border rounded px-3 py-2 text-sm bg-foreground text-background sm:col-span-2">Envoyer</button>
          </form>
        )}

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

  {/* ➜ Handoff visible uniquement en Support */}
  {activeTab === "Support" && (
    <button
      onClick={onHandoff}
      className="rounded-md border border-foreground/40 bg-background px-3 py-2 text-sm transition-colors hover:bg-foreground/5"
    >
      Handoff
    </button>
  )}
</div>

        </div>

        <p className="mt-3 text-xs text-foreground/50">
          Astuce : regarde les logs du terminal quand tu cliques <strong>Handoff</strong> — tu dois voir <code>[HANDOFF]</code>.
        </p>
      </div>
    </div>
  );
}
