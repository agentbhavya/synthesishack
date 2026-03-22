import { useState, useEffect } from "react";
import { Play, ArrowLeft, CheckCircle, XCircle, Shield } from "lucide-react";
import { api, type ActionDef, type ExecutionResult } from "../api";

interface ExecutePanelProps {
  initialService?: string;
  onBack: () => void;
}

export function ExecutePanel({ initialService, onBack }: ExecutePanelProps) {
  const [service, setService] = useState(initialService ?? "");
  const [services, setServices] = useState<string[]>([]);
  const [actions, setActions] = useState<ActionDef[]>([]);
  const [selectedAction, setSelectedAction] = useState<ActionDef | null>(null);
  const [params, setParams] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.listServices().then(svcs => setServices(svcs.map(s => s.name)));
  }, []);

  useEffect(() => {
    if (!service) { setActions([]); setSelectedAction(null); return; }
    api.getActions(service).then(acts => {
      setActions(acts); setSelectedAction(null); setParams({}); setResult(null);
    });
  }, [service]);

  useEffect(() => {
    if (!selectedAction) return;
    setParams(Object.fromEntries(selectedAction.params.map(p => [p, ""])));
    setResult(null);
  }, [selectedAction]);

  async function handleExecute() {
    if (!service || !selectedAction) return;
    setLoading(true); setResult(null);
    try { setResult(await api.execute(service, selectedAction.id, params)); }
    finally { setLoading(false); }
  }

  return (
    <section className="py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <button className="btn-ghost flex items-center gap-2 mb-8" onClick={onBack}>
          <ArrowLeft size={12} />
          Return to Vault
        </button>

        <div className="text-center mb-10">
          <div className="divider max-w-sm mx-auto mb-5">
            <span>◆</span>
            <span className="font-display text-xs tracking-[0.25em] text-gold opacity-70 uppercase">
              Zero-Exposure Execution
            </span>
            <span>◆</span>
          </div>
          <h2 className="heading-display text-3xl text-cream">Invoke an Action</h2>
        </div>

        <div className="panel mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Shield size={14} className="text-gold" />
              <span className="font-display text-xs uppercase tracking-widest text-cream-dim">
                Sealed Execution
              </span>
            </div>
            <span className="badge-gold">Credential stays hidden</span>
          </div>

          <div className="space-y-6">
            {/* Service */}
            <div>
              <label className="label">Choose Service</label>
              <select
                className="input"
                value={service}
                onChange={e => setService(e.target.value)}
              >
                <option value="">Select a sealed service…</option>
                {services.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Actions */}
            {actions.length > 0 && (
              <div>
                <label className="label">Choose Action</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {actions.map(act => (
                    <button
                      key={act.id}
                      onClick={() => setSelectedAction(act)}
                      className={`text-left rounded-sm border px-4 py-3 text-sm transition-all duration-200 ${
                        selectedAction?.id === act.id
                          ? "border-gold bg-gold-dim text-gold"
                          : "border-ornament bg-black bg-opacity-30 hover:border-gold text-cream-dim"
                      }`}
                    >
                      <div className="font-display text-xs uppercase tracking-wider">
                        {act.label}
                      </div>
                      <div className="text-xs text-cream-dim opacity-50 font-mono mt-0.5">
                        {act.id}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Params */}
            {selectedAction && selectedAction.params.length > 0 && (
              <div className="space-y-4">
                <label className="label">Parameters</label>
                {selectedAction.params.map(param => (
                  <div key={param}>
                    <label className="text-xs text-cream-dim opacity-60 mb-1 block font-mono">{param}</label>
                    <input
                      className="input"
                      placeholder={param}
                      value={params[param] ?? ""}
                      onChange={e => setParams(p => ({ ...p, [param]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Zero-exposure note */}
            {selectedAction && (
              <div className="bg-black bg-opacity-50 border border-ornament border-opacity-40 rounded-sm px-4 py-3 font-mono text-xs">
                <div className="text-gold mb-1">// sealed invocation</div>
                <div className="text-cream-dim">execute(<span className="text-gold">"{service}"</span>, <span className="text-gold">"{selectedAction.id}"</span>, params)</div>
                <div className="text-cream-dim opacity-30 mt-1">// the vault decrypts internally — you receive only the result</div>
              </div>
            )}

            <button
              className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              onClick={handleExecute}
              disabled={!service || !selectedAction || loading}
            >
              <Play size={12} />
              {loading ? "Invoking…" : "Execute Action"}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className={`panel ${result.success ? "glow-gold" : "glow-red"}`}>
            <div className="flex items-center gap-2 mb-4">
              {result.success
                ? <><CheckCircle size={14} className="text-gold" /><span className="font-display text-xs uppercase tracking-widest text-gold">Success {result.status ? `· HTTP ${result.status}` : ""}</span></>
                : <><XCircle size={14} className="text-danger" /><span className="font-display text-xs uppercase tracking-widest text-danger">Error {result.status ? `· HTTP ${result.status}` : ""}</span></>
              }
            </div>
            <pre className="bg-black bg-opacity-60 rounded-sm p-4 text-xs font-mono text-cream-dim overflow-auto max-h-96 border border-border">
              {result.error ? result.error : JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}
