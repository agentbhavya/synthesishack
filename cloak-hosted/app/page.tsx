import Link from "next/link";
import { Shield, Lock, Eye, Zap, Github, CreditCard, Cpu, Fingerprint } from "lucide-react";

const HOW_IT_WORKS = [
  { step: "I", title: "Seal your keys", body: "Paste your API credentials once. They are encrypted with AES-256-GCM before storage — your agent never sees the raw secret again." },
  { step: "II", title: "Invoke actions", body: "Instruct your AI agent to call GitHub, Slack, Stripe, Venice, or verify Self identity. Cloak decrypts in-memory and returns only the result." },
  { step: "III", title: "Review the Chronicle", body: "Every invocation is logged — service, action, outcome — so you maintain a complete audit trail without storing credentials in history." },
];

const SERVICES = [
  { icon: Github, name: "GitHub", desc: "List repos, create issues", color: "var(--color-cream)" },
  { icon: Zap, name: "Slack", desc: "Post messages, list channels", color: "#c084fc" },
  { icon: CreditCard, name: "Stripe", desc: "Check balance, list customers", color: "#93c5fd" },
  { icon: Cpu, name: "Venice AI", desc: "Private AI chat & image gen", color: "#f97316" },
  { icon: Fingerprint, name: "Self Protocol", desc: "ZK identity verification", color: "var(--color-gold)" },
];

export default function Home() {
  return (
    <div style={{ background: "#0a0805", minHeight: "100vh" }}>
      {/* Nav */}
      <nav style={{ background: "rgba(17,14,9,0.9)", borderBottom: "1px solid rgba(107,81,40,0.4)", backdropFilter: "blur(12px)", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "0 1.5rem", display: "flex", alignItems: "center", justifyContent: "space-between", height: "3.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Shield size={16} style={{ color: "var(--color-gold)" }} />
            <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.875rem", letterSpacing: "0.15em", color: "var(--color-cream)", fontWeight: 700 }}>CLOAK</span>
            <span style={{ color: "var(--color-ornament)", margin: "0 0.5rem" }}>·</span>
            <span style={{ fontFamily: "EB Garamond,serif", fontSize: "0.8rem", color: "var(--color-cream-dim)" }}>Agent Vault</span>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/login" style={{ fontFamily: "Cinzel,serif", fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", padding: "0.375rem 0.875rem", border: "1px solid transparent", background: "transparent", color: "var(--color-cream-dim)", borderRadius: "2px", textDecoration: "none" }}>Sign In</Link>
            <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", fontSize: "0.65rem" }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero-bg" style={{ padding: "7rem 1.5rem 5rem", textAlign: "center" }}>
        <div style={{ maxWidth: "48rem", margin: "0 auto" }}>
          <div className="divider" style={{ maxWidth: "20rem", margin: "0 auto 2rem" }}>
            <span>◆</span>
            <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.6rem", letterSpacing: "0.3em", color: "var(--color-gold)", opacity: 0.7, textTransform: "uppercase" }}>Zero-Exposure Credential Vault</span>
            <span>◆</span>
          </div>
          <h1 style={{ fontFamily: "Cinzel Decorative,serif", fontSize: "3.5rem", fontWeight: 700, color: "var(--color-cream)", letterSpacing: "0.05em", lineHeight: 1.1, marginBottom: "1.5rem", textShadow: "0 0 40px rgba(201,168,76,0.15)" }}>
            Your AI agent acts.<br />
            <span style={{ color: "var(--color-gold)" }}>Your secrets stay sealed.</span>
          </h1>
          <p style={{ fontFamily: "EB Garamond,serif", fontSize: "1.25rem", fontStyle: "italic", color: "var(--color-cream-dim)", lineHeight: 1.7, marginBottom: "2.5rem", maxWidth: "36rem", margin: "0 auto 2.5rem" }}>
            Cloak lets AI agents invoke real APIs on your behalf — GitHub, Slack, Stripe — without ever reading your credentials. Keys are sealed before storage and never appear in model context.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/signup" className="btn-primary" style={{ textDecoration: "none", padding: "0.75rem 2rem", fontSize: "0.75rem" }}>
              <Lock size={14} /> Start Sealing Secrets
            </Link>
            <Link href="/login" className="btn-ghost" style={{ textDecoration: "none", padding: "0.75rem 2rem", fontSize: "0.75rem" }}>
              Sign In to Vault
            </Link>
          </div>
        </div>
      </section>

      {/* Services */}
      <section style={{ padding: "4rem 1.5rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div className="divider" style={{ maxWidth: "20rem", margin: "0 auto 3rem" }}>
            <span>◆</span>
            <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.65rem", letterSpacing: "0.25em", color: "var(--color-gold)", opacity: 0.7, textTransform: "uppercase" }}>Supported Services</span>
            <span>◆</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: "1.25rem" }}>
            {SERVICES.map(({ icon: Icon, name, desc, color }) => (
              <div key={name} className="panel glow-gold" style={{ textAlign: "center", padding: "2rem 1.5rem" }}>
                <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "2px", border: "1px solid var(--color-ornament)", background: "var(--color-gold-dim)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.25rem" }}>
                  <Icon size={22} style={{ color }} />
                </div>
                <div style={{ fontFamily: "Cinzel,serif", fontSize: "0.875rem", color: "var(--color-cream)", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>{name}</div>
                <div style={{ fontFamily: "EB Garamond,serif", fontStyle: "italic", color: "var(--color-cream-dim)", fontSize: "0.875rem" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section style={{ padding: "4rem 1.5rem 6rem" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto" }}>
          <div className="divider" style={{ maxWidth: "20rem", margin: "0 auto 3rem" }}>
            <span>◆</span>
            <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.65rem", letterSpacing: "0.25em", color: "var(--color-gold)", opacity: 0.7, textTransform: "uppercase" }}>The Ritual</span>
            <span>◆</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "1.5rem" }}>
            {HOW_IT_WORKS.map(({ step, title, body }) => (
              <div key={step} className="panel">
                <div style={{ fontFamily: "Cinzel Decorative,serif", fontSize: "2rem", color: "var(--color-gold)", opacity: 0.3, marginBottom: "1rem" }}>{step}</div>
                <h3 style={{ fontFamily: "Cinzel,serif", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--color-cream)", marginBottom: "0.75rem" }}>{title}</h3>
                <p style={{ fontFamily: "EB Garamond,serif", fontStyle: "italic", color: "var(--color-cream-dim)", lineHeight: 1.7, fontSize: "0.9rem" }}>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: "1px solid rgba(107,81,40,0.2)", padding: "2rem 1.5rem", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <Eye size={12} style={{ color: "var(--color-gold)", opacity: 0.4 }} />
          <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.6rem", letterSpacing: "0.25em", color: "var(--color-gold)", opacity: 0.4, textTransform: "uppercase" }}>The agent acts. The key stays hidden.</span>
        </div>
        <div style={{ fontFamily: "EB Garamond,serif", fontSize: "0.8rem", color: "var(--color-cream-dim)", opacity: 0.3, fontStyle: "italic" }}>Cloak — Agent Vault</div>
      </footer>
    </div>
  );
}
