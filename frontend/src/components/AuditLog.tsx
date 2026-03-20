import { useState, useEffect, useCallback } from "react";
import { RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { api, type AuditEntry } from "../api";

export function AuditLog() {
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try { setLog(await api.getAuditLog()); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <section className="py-12 px-6 pb-24">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-10">
          <div className="divider max-w-sm mx-auto mb-5">
            <span>◆</span>
            <span className="font-display text-xs tracking-[0.25em] text-gold opacity-70 uppercase">Chronicle</span>
            <span>◆</span>
          </div>
          <h2 className="heading-display text-3xl text-cream mb-2">Execution Audit Log</h2>
          <p className="font-body italic text-cream-dim text-sm">
            Every invocation recorded. No credential ever committed to history.
          </p>
        </div>

        <div className="flex justify-end mb-4">
          <button className="btn-ghost flex items-center gap-2" onClick={refresh}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="panel">
          {log.length === 0 ? (
            <div className="text-center py-14">
              <div className="text-gold opacity-10 text-5xl mb-4 font-display">✦</div>
              <p className="font-display text-xs uppercase tracking-widest text-cream-dim opacity-40">
                No incantations recorded yet
              </p>
            </div>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 pb-3 border-b border-ornament border-opacity-30 font-display text-xs uppercase tracking-widest text-gold opacity-60 text-left">
                <div />
                <div>Time</div>
                <div>Service</div>
                <div>Action</div>
                <div>Status</div>
              </div>
              {log.map((entry, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[auto_1fr_1fr_1fr_auto] gap-4 py-3 border-b border-border border-opacity-50 last:border-0 font-mono text-xs items-center"
                >
                  {entry.success
                    ? <CheckCircle size={11} className="text-gold opacity-70" />
                    : <XCircle size={11} className="text-danger" />}
                  <span className="text-cream-dim opacity-50">
                    {new Date(entry.ts).toLocaleTimeString()}
                  </span>
                  <span className="text-cream capitalize">{entry.service}</span>
                  <span className="text-cream-dim">{entry.action}</span>
                  <span>
                    {entry.success
                      ? <span className="badge-gold">ok</span>
                      : <span className="badge-red">err</span>}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
