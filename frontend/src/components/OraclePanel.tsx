import { useState, useEffect, useRef, useCallback } from "react";
import { Play, Eye } from "lucide-react";
import { api } from "../api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
};

export function OraclePanel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasVeniceKey, setHasVeniceKey] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Check if user has a venice credential stored
  const checkVeniceKey = useCallback(async () => {
    const services = await api.listServices();
    setHasVeniceKey(services.some(s => s.name === "venice"));
  }, []);

  useEffect(() => { checkVeniceKey(); }, [checkVeniceKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await api.chat(
      newMessages.map(m => ({ role: m.role, content: m.content }))
    );

    if (res.error) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠ ${res.error}`, toolsUsed: [] }]);
    } else {
      setMessages(prev => [...prev, { role: "assistant", content: res.response, toolsUsed: res.toolsUsed ?? [] }]);
    }
    setLoading(false);
  }

  return (
    <section className="py-8 px-6 pb-4">
      <div className="max-w-3xl mx-auto flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>

        {/* Header */}
        <div className="text-center mb-6 flex-shrink-0">
          <div className="divider max-w-sm mx-auto mb-4">
            <span>◆</span>
            <span className="font-display text-xs tracking-[0.25em] text-gold opacity-70 uppercase">Private AI Agent</span>
            <span>◆</span>
          </div>
          <h2 className="heading-display text-3xl text-cream mb-1">The Oracle</h2>
          <p className="font-body italic text-cream-dim text-sm">
            Powered by Venice AI — private inference, no data training. Your keys never leave the vault.
          </p>
        </div>

        {/* Warning: no Venice key */}
        {hasVeniceKey === false && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-sm border border-ornament border-opacity-50 bg-black bg-opacity-30 flex-shrink-0">
            <Eye size={14} className="text-gold flex-shrink-0" />
            <span className="font-body text-sm text-cream-dim">
              The Oracle requires a{" "}
              <span className="text-gold font-mono text-xs">venice</span>
              {" "}API key. Go to <strong className="text-gold">Vault</strong> → Seal a Secret → service:{" "}
              <code className="font-mono text-xs text-gold">venice</code>
            </span>
          </div>
        )}

        {/* Message history */}
        <div className="panel flex-1 overflow-auto mb-3 flex flex-col gap-4 p-5">
          {messages.length === 0 && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 opacity-40">
              <div className="text-gold text-5xl font-display">✦</div>
              <p className="font-display text-xs uppercase tracking-widest text-cream-dim">
                Ask the Oracle to act on your behalf
              </p>
              <p className="font-body italic text-cream-dim text-sm">
                "List my GitHub repos" · "Post a message to Slack" · "Check my Stripe balance"
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-sm font-body text-sm text-cream leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-gold-dim border border-ornament"
                    : "bg-black bg-opacity-40 border border-border"
                }`}
              >
                {msg.content}
              </div>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1.5 max-w-[85%]">
                  {msg.toolsUsed.map((t, j) => (
                    <span
                      key={j}
                      className="font-mono text-xs px-2 py-0.5 rounded-sm bg-black bg-opacity-40 border border-ornament border-opacity-50 text-gold opacity-80"
                    >
                      ⚡ {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex items-start">
              <div className="px-4 py-3 rounded-sm border border-border bg-black bg-opacity-40 font-display text-xs uppercase tracking-widest text-gold opacity-60">
                Oracle is consulting the void…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div className="flex gap-3 flex-shrink-0">
          <input
            className="input flex-1"
            placeholder={
              hasVeniceKey === false
                ? "Add a venice credential first…"
                : "Ask the Oracle… (Enter to send)"
            }
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={loading || hasVeniceKey === false}
            autoFocus
          />
          <button
            className="btn-primary flex items-center gap-2 px-5"
            onClick={sendMessage}
            disabled={loading || !input.trim() || hasVeniceKey === false}
          >
            <Play size={12} />
            {loading ? "…" : "Invoke"}
          </button>
        </div>
      </div>
    </section>
  );
}
