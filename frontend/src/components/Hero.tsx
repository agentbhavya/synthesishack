import { Shield, ArrowRight, Lock } from "lucide-react";

export function Hero({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <section className="hero-bg relative overflow-hidden min-h-screen flex flex-col items-center justify-center px-6 py-24">

      {/* Atmospheric top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-40" />

      {/* Floating rune marks */}
      <div className="absolute top-16 left-12 text-gold opacity-10 font-display text-6xl select-none">⚷</div>
      <div className="absolute bottom-24 right-12 text-gold opacity-10 font-display text-5xl select-none">⚶</div>
      <div className="absolute top-1/3 left-6 text-gold opacity-5 font-display text-8xl select-none">◈</div>

      <div className="relative max-w-4xl mx-auto text-center">

        {/* Badge */}
        <div className="inline-flex items-center gap-3 mb-10">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-gold opacity-50" />
          <span className="font-display text-xs uppercase tracking-[0.3em] text-gold-light opacity-80 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-gold pulse-dot inline-block" />
            The Synthesis · Trust &amp; Encryption
            <span className="w-1 h-1 rounded-full bg-gold pulse-dot inline-block" />
          </span>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-gold opacity-50" />
        </div>

        {/* Main heading */}
        <div className="mb-3">
          <div className="font-display-deco text-gold opacity-60 text-sm uppercase tracking-[0.4em] mb-4">
            Concealment · Encryption · Trust
          </div>
          <h1 className="heading-display text-5xl md:text-7xl text-cream mb-2 flicker">
            CLOAK
          </h1>
          <div className="divider max-w-xs mx-auto my-4">
            <span>◆</span>
            <span className="font-display text-xs tracking-[0.25em] text-gold opacity-70">AGENT CREDENTIAL VAULT</span>
            <span>◆</span>
          </div>
        </div>

        <p className="font-body text-cream-dim text-lg md:text-xl max-w-2xl mx-auto mb-4 italic">
          "Every secret whispered into an agent's context becomes a liability.
          Every key stored in memory — a weakness waiting to be exploited."
        </p>
        <p className="font-body text-cream opacity-70 text-base max-w-xl mx-auto mb-14">
          Cloak seals your API keys in an AES-256-GCM vault.
          Agents execute actions — they never touch the secrets.
        </p>

        {/* Problem / Solution cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto mb-14">

          {/* Problem */}
          <div className="panel glow-red text-left">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-px h-4 bg-danger" />
              <span className="font-display text-xs uppercase tracking-[0.25em] text-danger">The Vulnerability</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-black bg-opacity-50 rounded-sm p-3 border border-danger border-opacity-20">
                <div className="text-cream-dim opacity-50 mb-1.5">// agent memory — plaintext</div>
                <div className="text-danger">GITHUB_TOKEN=ghp_<span className="opacity-60">abc123…</span></div>
                <div className="text-danger">STRIPE_KEY=sk_live_<span className="opacity-60">xyz…</span></div>
                <div className="text-danger opacity-60 mt-1">// one injection → all gone</div>
              </div>
              <ul className="space-y-2 text-cream-dim font-body text-sm not-italic">
                {["Credentials live in agent context", "Keys appear in log files", "Prompt injection steals secrets", "No standard auth infrastructure"].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-danger mt-1 text-xs">✕</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Solution */}
          <div className="panel glow-gold text-left">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-px h-4 bg-gold" />
              <span className="font-display text-xs uppercase tracking-[0.25em] text-gold">The Sanctuary</span>
            </div>
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-black bg-opacity-50 rounded-sm p-3 border border-gold border-opacity-20">
                <div className="text-cream-dim opacity-50 mb-1.5">// agent context — zero keys</div>
                <div className="text-gold">execute(<span className="text-cream-dim">"github"</span>, <span className="text-cream-dim">"list_repos"</span>)</div>
                <div className="text-cream-dim opacity-40 mt-1">// credential? sealed. never exposed.</div>
              </div>
              <ul className="space-y-2 text-cream-dim font-body text-sm not-italic">
                {["AES-256-GCM encrypted vault", "Agents receive results, never keys", "ZK identity via Self Protocol", "MCP-native — any agent, any model"].map(t => (
                  <li key={t} className="flex items-start gap-2">
                    <span className="text-gold mt-1 text-xs">◆</span> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={onGetStarted} className="btn-primary flex items-center gap-3 text-sm px-8 py-3">
            <Lock size={14} />
            Enter the Vault
            <ArrowRight size={14} />
          </button>
          <a
            href="https://github.com/gyan0890/synthesishack/tree/feat/cloak-mcp-vault"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <Shield size={14} />
            View Source
          </a>
        </div>
      </div>

      {/* Bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-20" />
    </section>
  );
}
