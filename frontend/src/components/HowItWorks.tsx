import { User, Lock, Cpu, Globe } from "lucide-react";

const steps = [
  {
    icon: User,
    num: "I",
    title: "Human Stores Key",
    desc: "The operator calls store_credential once. The raw secret is sealed before the agent ever runs.",
    code: 'store_credential("github", "ghp_…")',
    color: "text-blue-300",
    border: "border-blue-900",
  },
  {
    icon: Lock,
    num: "II",
    title: "Vault Encrypts",
    desc: "AES-256-GCM with scrypt key derivation. Stored in ~/.cloak/vault.json at 0o600.",
    code: "{ iv, salt, tag, data } → disk",
    color: "text-gold",
    border: "border-ornament",
  },
  {
    icon: Cpu,
    num: "III",
    title: "Agent Requests Action",
    desc: "The agent calls execute_with_credential — it never sees the key, only the action and params.",
    code: 'execute("github", "list_repos", {})',
    color: "text-purple-300",
    border: "border-purple-900",
  },
  {
    icon: Globe,
    num: "IV",
    title: "Only Result Returned",
    desc: "The executor decrypts internally, calls the API, returns only the response. Key never leaves.",
    code: '{ repos: […] }  // key: never surfaced',
    color: "text-emerald-400",
    border: "border-emerald-900",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 px-6 border-t border-ornament border-opacity-30">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-16">
          <div className="divider max-w-sm mx-auto mb-6">
            <span>◆</span>
            <span className="font-display text-xs tracking-[0.25em] text-gold opacity-70 uppercase">The Ritual</span>
            <span>◆</span>
          </div>
          <h2 className="heading-display text-3xl text-cream mb-4">How Cloak Works</h2>
          <p className="font-body italic text-cream-dim max-w-lg mx-auto">
            A four-step incantation — secrets sealed, agents empowered, credentials never exposed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
          {/* Connector */}
          <div className="hidden md:block absolute top-8 left-[13%] right-[13%] h-px bg-gradient-to-r from-transparent via-ornament to-transparent opacity-40 z-0" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-16 h-16 rounded-sm border ${step.border} bg-panel flex items-center justify-center mb-5 relative group-hover:border-gold transition-colors duration-300`}>
                  <Icon size={22} className={step.color} />
                  <div className="absolute -top-3 -right-3 font-display text-xs text-gold opacity-60 bg-panel px-1">
                    {step.num}
                  </div>
                </div>
                <div className="font-display text-sm text-cream uppercase tracking-wide mb-2">
                  {step.title}
                </div>
                <p className="font-body text-sm text-cream-dim leading-relaxed mb-3">
                  {step.desc}
                </p>
                <div className="bg-black bg-opacity-50 border border-border rounded-sm px-2 py-1.5 font-mono text-xs text-cream-dim w-full">
                  {step.code}
                </div>
              </div>
            );
          })}
        </div>

        {/* Callout */}
        <div className="mt-16 panel flex flex-col md:flex-row items-start md:items-center gap-5 glow-gold">
          <div className="flex-shrink-0 w-12 h-12 rounded-sm border border-ornament flex items-center justify-center bg-gold-dim">
            <Lock size={20} className="text-gold" />
          </div>
          <div>
            <div className="font-display text-sm text-gold uppercase tracking-widest mb-1">
              The Zero-Exposure Guarantee
            </div>
            <p className="font-body text-cream-dim leading-relaxed">
              Prompt injection attacks work by coercing agents to reveal their context.
              With Cloak, <em className="text-cream">there is nothing to reveal</em> — the agent
              never holds the key. Even a fully compromised agent context leaks no credentials.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
