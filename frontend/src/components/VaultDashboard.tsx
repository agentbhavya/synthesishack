import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, RefreshCw, Github, Zap, CreditCard, Server, Eye, EyeOff } from "lucide-react";
import { api, type Service } from "../api";

const SERVICE_ICONS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  github: Github, slack: Zap, stripe: CreditCard,
};
const SERVICE_COLORS: Record<string, string> = {
  github: "text-cream", slack: "text-purple-300", stripe: "text-blue-300",
};

function ServiceIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = SERVICE_ICONS[name] ?? Server;
  return <Icon size={size} className={SERVICE_COLORS[name] ?? "text-cream-dim"} />;
}

interface AddCredentialModalProps {
  onClose: () => void;
  onSaved: () => void;
}

function AddCredentialModal({ onClose, onSaved }: AddCredentialModalProps) {
  const [service, setService] = useState("");
  const [credential, setCredential] = useState("");
  const [showCred, setShowCred] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!service.trim() || !credential.trim()) return;
    setLoading(true);
    setError("");
    try {
      await api.storeCredential(service.trim(), credential.trim());
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="panel w-full max-w-md glow-gold">
        {/* Header */}
        <div className="divider mb-6">
          <span>◆</span>
          <span className="font-display text-xs tracking-[0.25em] text-gold uppercase">Seal a Secret</span>
          <span>◆</span>
        </div>
        <p className="font-body italic text-cream-dim text-sm mb-6 text-center">
          The key will be encrypted before it ever reaches storage.
          No agent shall ever read it directly.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="label">Service Name</label>
            <input
              className="input"
              placeholder="github · slack · stripe"
              value={service}
              onChange={(e) => setService(e.target.value)}
              autoFocus
            />
          </div>
          <div>
            <label className="label">API Key / Secret</label>
            <div className="relative">
              <input
                className="input pr-10"
                type={showCred ? "text" : "password"}
                placeholder="sk-… · ghp_… · xoxb-…"
                value={credential}
                onChange={(e) => setCredential(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowCred(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-dim hover:text-gold transition-colors"
              >
                {showCred ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && <p className="text-danger text-sm font-body">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !service.trim() || !credential.trim()}
            >
              {loading ? "Sealing…" : "Seal & Encrypt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface VaultDashboardProps {
  onExecute: (service: string) => void;
}

export function VaultDashboard({ onExecute }: VaultDashboardProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setServices(await api.listServices()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleRemove(name: string) {
    setRemoving(name);
    try { await api.removeCredential(name); await refresh(); }
    finally { setRemoving(null); }
  }

  return (
    <>
      <section className="py-12 px-6">
        <div className="max-w-5xl mx-auto">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="divider max-w-sm mx-auto mb-5">
              <span>◆</span>
              <span className="font-display text-xs tracking-[0.25em] text-gold opacity-70 uppercase">
                {services.length === 0 ? "The Vault Awaits" : `${services.length} Secret${services.length !== 1 ? "s" : ""} Sealed`}
              </span>
              <span>◆</span>
            </div>
            <h2 className="heading-display text-3xl text-cream mb-6">Credential Vault</h2>
            <div className="flex items-center justify-center gap-3">
              <button className="btn-ghost flex items-center gap-2" onClick={refresh}>
                <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
                Refresh
              </button>
              <button className="btn-primary flex items-center gap-2" onClick={() => setShowAdd(true)}>
                <Plus size={12} />
                Seal a Secret
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 font-display text-xs tracking-widest text-gold opacity-40 uppercase">
              Consulting the vault…
            </div>
          ) : services.length === 0 ? (
            <div className="panel text-center py-20 max-w-md mx-auto">
              <div className="text-gold opacity-20 text-6xl mb-4 font-display">⚷</div>
              <p className="font-display text-sm uppercase tracking-widest text-cream-dim mb-2">The vault is empty</p>
              <p className="font-body italic text-cream-dim text-sm mb-6">
                No secrets have been sealed. Store your first credential to begin.
              </p>
              <button className="btn-primary" onClick={() => setShowAdd(true)}>
                Seal First Secret
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.map((svc) => (
                <div key={svc.name} className="panel glow-gold group hover:border-gold transition-colors duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-sm border border-ornament bg-gold-dim flex items-center justify-center group-hover:border-gold transition-colors">
                        <ServiceIcon name={svc.name} />
                      </div>
                      <div>
                        <div className="font-display text-sm text-cream uppercase tracking-wider capitalize">
                          {svc.name}
                        </div>
                        <div className="mt-0.5">
                          {svc.handler === "supported"
                            ? <span className="badge-gold">Supported</span>
                            : <span className="badge-muted">Custom</span>}
                        </div>
                      </div>
                    </div>
                    <button
                      className="btn-danger !px-2 !py-1.5"
                      onClick={() => handleRemove(svc.name)}
                      disabled={removing === svc.name}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  {/* Encrypted bar */}
                  <div className="font-mono text-xs bg-black bg-opacity-50 rounded-sm px-3 py-2 border border-border mb-4 flex items-center justify-between">
                    <span className="text-cream-dim opacity-40 tracking-widest">██████████████</span>
                    <span className="text-gold opacity-50 text-xs">AES-256-GCM</span>
                  </div>

                  <button
                    className="btn-primary w-full text-center justify-center flex"
                    onClick={() => onExecute(svc.name)}
                  >
                    Invoke Action
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {showAdd && (
        <AddCredentialModal onClose={() => setShowAdd(false)} onSaved={refresh} />
      )}
    </>
  );
}
