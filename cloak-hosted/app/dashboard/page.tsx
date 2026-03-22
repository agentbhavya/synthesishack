"use client";
export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Plus, Trash2, RefreshCw, Play, ArrowLeft, CheckCircle, XCircle, Shield, Eye, EyeOff, Github, Zap, CreditCard, Server } from "lucide-react";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

type Tab = "vault" | "execute" | "audit" | "oracle";

interface Service { name: string; handler: string; }
interface ActionDef { id: string; label: string; params: string[]; }
interface AuditEntry { ts: string; service: string; action: string; success: boolean; }
interface ExecResult { success: boolean; status?: number; data?: unknown; error?: string; }

const SERVICE_ICONS: Record<string, React.FC<{size?:number;className?:string}>> = { github: Github, slack: Zap, stripe: CreditCard, venice: Eye, self: Shield };
const SERVICE_COLORS: Record<string, string> = { github: "var(--color-cream)", slack: "#c084fc", stripe: "#93c5fd", venice: "#f97316", self: "var(--color-gold)" };

function ServiceIcon({ name }: { name: string }) {
  const Icon = SERVICE_ICONS[name] ?? Server;
  return <span style={{color: SERVICE_COLORS[name] ?? "var(--color-cream-dim)", display:"flex"}}><Icon size={18} /></span>;
}

async function apiFetch(path: string, token: string, opts?: RequestInit) {
  const res = await fetch(path, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) } });
  return res.json();
}

export default function Dashboard() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("vault");
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  useEffect(() => {
    const redirect = () => { window.location.replace("/login"); };
    const timeout = setTimeout(redirect, 4000);
    supabase.auth.getSession().then(({ data }) => {
      clearTimeout(timeout);
      if (!data.session) { redirect(); return; }
      setToken(data.session.access_token);
    }).catch(() => { clearTimeout(timeout); redirect(); });
  }, []);

  const refreshServices = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    const data = await apiFetch("/api/services", token);
    setServices(Array.isArray(data) ? data : []);
    setLoading(false);
  }, [token]);

  useEffect(() => { if (token) refreshServices(); }, [token, refreshServices]);

  async function handleRemove(name: string) {
    if (!token) return;
    await apiFetch(`/api/credentials/${name}`, token, { method: "DELETE" });
    refreshServices();
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (!token) return <div className="min-h-screen hero-bg flex items-center justify-center" style={{color:"var(--color-gold)",fontFamily:"Cinzel,serif",fontSize:"0.8rem",letterSpacing:"0.2em"}}>ENTERING THE VAULT…</div>;

  return (
    <div className="min-h-screen" style={{background:"#0a0805"}}>
      {/* Nav */}
      <nav style={{background:"rgba(17,14,9,0.9)",borderBottom:"1px solid rgba(107,81,40,0.4)",backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:40}}>
        <div style={{maxWidth:"72rem",margin:"0 auto",padding:"0 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",height:"3.5rem"}}>
          <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}>
            <Shield size={16} style={{color:"var(--color-gold)"}} />
            <span style={{fontFamily:"Cinzel,serif",fontSize:"0.875rem",letterSpacing:"0.15em",color:"var(--color-cream)",fontWeight:700}}>CLOAK</span>
            <span style={{color:"var(--color-ornament)",margin:"0 0.5rem"}}>·</span>
            <span style={{fontFamily:"EB Garamond,serif",fontSize:"0.8rem",color:"var(--color-cream-dim)"}}>Agent Vault</span>
          </div>
          <div style={{display:"flex",gap:"0.5rem"}}>
            {(["vault","execute","audit","oracle"] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{fontFamily:"Cinzel,serif",fontSize:"0.65rem",letterSpacing:"0.15em",textTransform:"uppercase",padding:"0.375rem 0.875rem",border:`1px solid ${tab===t?"var(--color-gold)":"transparent"}`,background:tab===t?"var(--color-gold-dim)":"transparent",color:tab===t?"var(--color-gold)":"var(--color-cream-dim)",borderRadius:"2px",cursor:"pointer",transition:"all 0.2s"}}>
                {t}
              </button>
            ))}
            <button onClick={handleSignOut} className="btn-ghost" style={{fontSize:"0.6rem",padding:"0.375rem 0.75rem"}}>Sign Out</button>
          </div>
        </div>
      </nav>

      {/* Vault tab */}
      {tab === "vault" && (
        <section style={{padding:"3rem 1.5rem"}}>
          <div style={{maxWidth:"72rem",margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
              <div className="divider" style={{maxWidth:"20rem",margin:"0 auto 1.25rem"}}>
                <span>◆</span>
                <span style={{fontFamily:"Cinzel,serif",fontSize:"0.65rem",letterSpacing:"0.25em",color:"var(--color-gold)",opacity:0.7,textTransform:"uppercase"}}>
                  {services.length === 0 ? "The Vault Awaits" : `${services.length} Secret${services.length !== 1 ? "s" : ""} Sealed`}
                </span>
                <span>◆</span>
              </div>
              <h2 className="heading-display" style={{fontSize:"1.875rem",color:"var(--color-cream)",marginBottom:"1.5rem"}}>Credential Vault</h2>
              <div style={{display:"flex",gap:"0.75rem",justifyContent:"center"}}>
                <button className="btn-ghost" onClick={refreshServices}><RefreshCw size={12} /> Refresh</button>
                <button className="btn-primary" onClick={() => setShowAdd(true)}><Plus size={12} /> Seal a Secret</button>
              </div>
            </div>
            {loading ? (
              <div style={{textAlign:"center",padding:"5rem 0",fontFamily:"Cinzel,serif",fontSize:"0.7rem",letterSpacing:"0.2em",color:"var(--color-gold)",opacity:0.4,textTransform:"uppercase"}}>Consulting the vault…</div>
            ) : services.length === 0 ? (
              <div className="panel" style={{textAlign:"center",padding:"5rem 1.5rem",maxWidth:"28rem",margin:"0 auto"}}>
                <div style={{color:"var(--color-gold)",opacity:0.2,fontSize:"3.75rem",marginBottom:"1rem",fontFamily:"Cinzel,serif"}}>⚷</div>
                <p style={{fontFamily:"Cinzel,serif",fontSize:"0.875rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--color-cream-dim)",marginBottom:"0.5rem"}}>The vault is empty</p>
                <p style={{fontFamily:"EB Garamond,serif",fontStyle:"italic",color:"var(--color-cream-dim)",fontSize:"0.9rem",marginBottom:"1.5rem"}}>No secrets sealed. Store your first credential to begin.</p>
                <button className="btn-primary" onClick={() => setShowAdd(true)}>Seal First Secret</button>
              </div>
            ) : (
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:"1.25rem"}}>
                {services.map(svc => (
                  <div key={svc.name} className="panel glow-gold">
                    <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:"1rem"}}>
                      <div style={{display:"flex",alignItems:"center",gap:"0.75rem"}}>
                        <div style={{width:"2.5rem",height:"2.5rem",borderRadius:"2px",border:"1px solid var(--color-ornament)",background:"var(--color-gold-dim)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                          <ServiceIcon name={svc.name} />
                        </div>
                        <div>
                          <div style={{fontFamily:"Cinzel,serif",fontSize:"0.875rem",color:"var(--color-cream)",textTransform:"capitalize",letterSpacing:"0.05em"}}>{svc.name}</div>
                          <div style={{marginTop:"0.25rem"}}><span className={svc.handler === "supported" ? "badge-gold" : "badge-muted"}>{svc.handler}</span></div>
                        </div>
                      </div>
                      <button className="btn-danger" onClick={() => handleRemove(svc.name)} style={{padding:"0.375rem 0.5rem"}}><Trash2 size={12} /></button>
                    </div>
                    <div style={{fontFamily:"JetBrains Mono,monospace",fontSize:"0.75rem",background:"rgba(0,0,0,0.5)",borderRadius:"2px",padding:"0.5rem 0.75rem",border:"1px solid var(--color-border)",marginBottom:"1rem",display:"flex",justifyContent:"space-between"}}>
                      <span style={{color:"var(--color-cream-dim)",opacity:0.4,letterSpacing:"0.2em"}}>██████████████</span>
                      <span style={{color:"var(--color-gold)",opacity:0.5,fontSize:"0.7rem"}}>AES-256-GCM</span>
                    </div>
                    <button className="btn-primary" style={{width:"100%",justifyContent:"center"}} onClick={() => setTab("execute")}>Invoke Action</button>
                  </div>
                ))}
              </div>
            )}
          </div>
          {showAdd && <AddModal token={token} onClose={() => setShowAdd(false)} onSaved={refreshServices} />}
        </section>
      )}

      {tab === "execute" && <ExecuteTab token={token} />}
      {tab === "audit" && <AuditTab token={token} />}
      {tab === "oracle" && <OracleTab token={token} hasVeniceKey={services.some(s => s.name === "venice")} />}
    </div>
  );
}

function AddModal({ token, onClose, onSaved }: { token: string; onClose: ()=>void; onSaved: ()=>void }) {
  const [service, setService] = useState(""); const [credential, setCredential] = useState(""); const [show, setShow] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!service || !credential) return;
    setLoading(true); setError("");
    const res = await apiFetch("/api/credentials", token, { method:"POST", body: JSON.stringify({service,credential}) });
    if (res.error) { setError(res.error); setLoading(false); return; }
    onSaved(); onClose();
  }
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",backdropFilter:"blur(4px)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:"1rem"}}>
      <div className="panel glow-gold" style={{width:"100%",maxWidth:"28rem"}}>
        <div className="divider" style={{marginBottom:"1.5rem"}}><span>◆</span><span style={{fontFamily:"Cinzel,serif",fontSize:"0.7rem",letterSpacing:"0.25em",color:"var(--color-gold)",textTransform:"uppercase"}}>Seal a Secret</span><span>◆</span></div>
        <p style={{fontFamily:"EB Garamond,serif",fontStyle:"italic",color:"var(--color-cream-dim)",fontSize:"0.9rem",marginBottom:"1.5rem",textAlign:"center"}}>The key will be encrypted before it ever reaches storage.</p>
        <form onSubmit={handleSubmit} style={{display:"flex",flexDirection:"column",gap:"1.25rem"}}>
          <div><label className="label">Service Name</label><input className="input" placeholder="github · slack · stripe" value={service} onChange={e=>setService(e.target.value)} autoFocus /></div>
          <div><label className="label">API Key / Secret</label>
            <div style={{position:"relative"}}>
              <input className="input" type={show?"text":"password"} style={{paddingRight:"2.5rem"}} placeholder="sk-… · ghp_… · xoxb-…" value={credential} onChange={e=>setCredential(e.target.value)} />
              <button type="button" onClick={()=>setShow(v=>!v)} style={{position:"absolute",right:"0.75rem",top:"50%",transform:"translateY(-50%)",color:"var(--color-cream-dim)",background:"none",border:"none",cursor:"pointer"}}>
                {show ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          {error && <p style={{color:"var(--color-danger)",fontSize:"0.875rem"}}>{error}</p>}
          <div style={{display:"flex",gap:"0.75rem",justifyContent:"flex-end"}}>
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading||!service||!credential}>{loading?"Sealing…":"Seal & Encrypt"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ExecuteTab({ token }: { token: string }) {
  const [services, setServices] = useState<string[]>([]);
  const [service, setService] = useState("");
  const [actions, setActions] = useState<ActionDef[]>([]);
  const [selected, setSelected] = useState<ActionDef|null>(null);
  const [params, setParams] = useState<Record<string,string>>({});
  const [result, setResult] = useState<ExecResult|null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { apiFetch("/api/services", token).then(d => setServices(Array.isArray(d) ? d.map((s:Service)=>s.name) : [])); }, [token]);
  useEffect(() => {
    if (!service) { setActions([]); setSelected(null); return; }
    apiFetch(`/api/actions/${service}`, token).then(d => { setActions(d.actions ?? []); setSelected(null); setParams({}); setResult(null); });
  }, [service, token]);
  useEffect(() => { if (selected) setParams(Object.fromEntries(selected.params.map(p=>[p,""]))); }, [selected]);

  async function execute() {
    if (!service || !selected) return;
    setLoading(true); setResult(null);
    const res = await apiFetch("/api/execute", token, { method:"POST", body: JSON.stringify({service,action:selected.id,params}) });
    setResult(res); setLoading(false);
  }

  return (
    <section style={{padding:"3rem 1.5rem"}}>
      <div style={{maxWidth:"48rem",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div className="divider" style={{maxWidth:"20rem",margin:"0 auto 1.25rem"}}><span>◆</span><span style={{fontFamily:"Cinzel,serif",fontSize:"0.65rem",letterSpacing:"0.25em",color:"var(--color-gold)",opacity:0.7,textTransform:"uppercase"}}>Zero-Exposure Execution</span><span>◆</span></div>
          <h2 className="heading-display" style={{fontSize:"1.875rem",color:"var(--color-cream)"}}>Invoke an Action</h2>
        </div>
        <div className="panel" style={{marginBottom:"1.5rem"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem"}}><Shield size={14} style={{color:"var(--color-gold)"}}/><span style={{fontFamily:"Cinzel,serif",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--color-cream-dim)"}}>Sealed Execution</span></div>
            <span className="badge-gold">Credential stays hidden</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:"1.5rem"}}>
            <div><label className="label">Choose Service</label>
              <select className="input" value={service} onChange={e=>setService(e.target.value)}>
                <option value="">Select a sealed service…</option>
                {services.map(s=><option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {actions.length > 0 && (
              <div><label className="label">Choose Action</label>
                <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(180px,1fr))",gap:"0.5rem"}}>
                  {actions.map(act=>(
                    <button key={act.id} onClick={()=>setSelected(act)} style={{textAlign:"left",borderRadius:"2px",border:`1px solid ${selected?.id===act.id?"var(--color-gold)":"var(--color-ornament)"}`,padding:"0.75rem 1rem",background:selected?.id===act.id?"var(--color-gold-dim)":"rgba(0,0,0,0.3)",color:selected?.id===act.id?"var(--color-gold)":"var(--color-cream-dim)",cursor:"pointer",transition:"all 0.2s"}}>
                      <div style={{fontFamily:"Cinzel,serif",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.1em"}}>{act.label}</div>
                      <div style={{fontSize:"0.7rem",fontFamily:"JetBrains Mono,monospace",opacity:0.5,marginTop:"0.25rem"}}>{act.id}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {selected && selected.params.length > 0 && (
              <div style={{display:"flex",flexDirection:"column",gap:"1rem"}}>
                <label className="label">Parameters</label>
                {selected.params.map(p=>(
                  <div key={p}><label style={{fontSize:"0.75rem",color:"var(--color-cream-dim)",opacity:0.6,marginBottom:"0.25rem",display:"block",fontFamily:"JetBrains Mono,monospace"}}>{p}</label>
                    <input className="input" placeholder={p} value={params[p]??""} onChange={e=>setParams(prev=>({...prev,[p]:e.target.value}))} />
                  </div>
                ))}
              </div>
            )}
            <button className="btn-primary" style={{width:"100%",justifyContent:"center",padding:"0.75rem"}} onClick={execute} disabled={!service||!selected||loading}>
              <Play size={12} />{loading?"Invoking…":"Execute Action"}
            </button>
          </div>
        </div>
        {result && (
          <div className={`panel ${result.success?"glow-gold":"glow-red"}`}>
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",marginBottom:"1rem"}}>
              {result.success
                ? <><CheckCircle size={14} style={{color:"var(--color-gold)"}}/><span style={{fontFamily:"Cinzel,serif",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--color-gold)"}}>Success {result.status?`· HTTP ${result.status}`:""}</span></>
                : <><XCircle size={14} style={{color:"var(--color-danger)"}}/><span style={{fontFamily:"Cinzel,serif",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--color-danger)"}}>Error</span></>}
            </div>
            <pre style={{background:"rgba(0,0,0,0.6)",borderRadius:"2px",padding:"1rem",fontSize:"0.75rem",fontFamily:"JetBrains Mono,monospace",color:"var(--color-cream-dim)",overflow:"auto",maxHeight:"24rem",border:"1px solid var(--color-border)"}}>
              {result.error ? result.error : JSON.stringify(result.data,null,2)}
            </pre>
          </div>
        )}
      </div>
    </section>
  );
}

function OracleTab({ token, hasVeniceKey }: { token: string; hasVeniceKey: boolean }) {
  type ChatMessage = { role: "user" | "assistant"; content: string; toolsUsed?: string[] };
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg: ChatMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    const res = await apiFetch("/api/chat", token, {
      method: "POST",
      body: JSON.stringify({ messages: newMessages.map(m => ({ role: m.role, content: m.content })) }),
    });
    if (res.error) {
      setMessages(prev => [...prev, { role: "assistant", content: `⚠ ${res.error}`, toolsUsed: [] }]);
    } else {
      setMessages(prev => [...prev, { role: "assistant", content: res.response, toolsUsed: res.toolsUsed ?? [] }]);
    }
    setLoading(false);
  }

  return (
    <section style={{ padding: "2rem 1.5rem 1.5rem" }}>
      <div style={{ maxWidth: "48rem", margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 8rem)" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "1.25rem", flexShrink: 0 }}>
          <div className="divider" style={{ maxWidth: "20rem", margin: "0 auto 1rem" }}>
            <span>◆</span>
            <span style={{ fontFamily: "Cinzel,serif", fontSize: "0.65rem", letterSpacing: "0.25em", color: "var(--color-gold)", opacity: 0.7, textTransform: "uppercase" }}>Private AI Agent</span>
            <span>◆</span>
          </div>
          <h2 className="heading-display" style={{ fontSize: "1.875rem", color: "var(--color-cream)", marginBottom: "0.25rem" }}>The Oracle</h2>
          <p style={{ fontFamily: "EB Garamond,serif", fontStyle: "italic", color: "var(--color-cream-dim)", fontSize: "0.875rem" }}>
            Powered by Venice AI — private inference, no data training. Your keys never leave the vault.
          </p>
        </div>

        {/* Warning: no Venice key */}
        {!hasVeniceKey && (
          <div style={{ background: "rgba(107,81,40,0.12)", border: "1px solid var(--color-ornament)", borderRadius: "2px", padding: "0.75rem 1rem", marginBottom: "1rem", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Eye size={14} style={{ color: "var(--color-gold)", flexShrink: 0 }} />
            <span style={{ fontFamily: "EB Garamond,serif", fontSize: "0.9rem", color: "var(--color-cream-dim)" }}>
              The Oracle requires a Venice AI key. Go to the <strong style={{ color: "var(--color-gold)" }}>Vault</strong> tab → Seal a Secret → service: <code style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.78rem", color: "var(--color-gold)" }}>venice</code>
            </span>
          </div>
        )}

        {/* Message history */}
        <div className="panel" style={{ flex: 1, overflow: "auto", marginBottom: "0.75rem", display: "flex", flexDirection: "column", gap: "1rem", padding: "1.25rem" }}>
          {messages.length === 0 && !loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", gap: "1rem", opacity: 0.4 }}>
              <div style={{ color: "var(--color-gold)", fontSize: "3rem", fontFamily: "Cinzel,serif" }}>✦</div>
              <p style={{ fontFamily: "Cinzel,serif", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--color-cream-dim)" }}>Ask the Oracle to act on your behalf</p>
              <p style={{ fontFamily: "EB Garamond,serif", fontStyle: "italic", color: "var(--color-cream-dim)", fontSize: "0.85rem" }}>
                &ldquo;List my GitHub repos&rdquo; &middot; &ldquo;Post a message to Slack&rdquo; &middot; &ldquo;Check my Stripe balance&rdquo;
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start", gap: "0.375rem" }}>
              <div style={{ maxWidth: "85%", padding: "0.75rem 1rem", borderRadius: "2px", background: msg.role === "user" ? "var(--color-gold-dim)" : "rgba(0,0,0,0.45)", border: `1px solid ${msg.role === "user" ? "var(--color-gold)" : "var(--color-border)"}`, fontFamily: "EB Garamond,serif", fontSize: "0.9rem", color: "var(--color-cream)", lineHeight: "1.65", whiteSpace: "pre-wrap" }}>
                {msg.content}
              </div>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.375rem", maxWidth: "85%" }}>
                  {msg.toolsUsed.map((t, j) => (
                    <span key={j} style={{ fontFamily: "JetBrains Mono,monospace", fontSize: "0.65rem", padding: "0.15rem 0.5rem", borderRadius: "2px", background: "rgba(107,81,40,0.2)", border: "1px solid var(--color-ornament)", color: "var(--color-gold)", opacity: 0.85 }}>
                      ⚡ {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
              <div style={{ padding: "0.75rem 1rem", borderRadius: "2px", background: "rgba(0,0,0,0.4)", border: "1px solid var(--color-border)", fontFamily: "Cinzel,serif", fontSize: "0.62rem", textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--color-gold)", opacity: 0.6 }}>
                Oracle is consulting the void…
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input row */}
        <div style={{ display: "flex", gap: "0.75rem", flexShrink: 0 }}>
          <input
            className="input"
            style={{ flex: 1 }}
            placeholder={hasVeniceKey ? "Ask the Oracle… (Enter to send)" : "Add a venice credential first…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            disabled={loading || !hasVeniceKey}
            autoFocus
          />
          <button
            className="btn-primary"
            onClick={sendMessage}
            disabled={loading || !input.trim() || !hasVeniceKey}
            style={{ padding: "0 1.25rem", flexShrink: 0, gap: "0.5rem" }}
          >
            <Play size={12} />
            {loading ? "…" : "Invoke"}
          </button>
        </div>
      </div>
    </section>
  );
}

function AuditTab({ token }: { token: string }) {
  const [log, setLog] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const refresh = useCallback(async () => { setLoading(true); const d = await apiFetch("/api/audit",token); setLog(Array.isArray(d)?d:[]); setLoading(false); }, [token]);
  useEffect(()=>{refresh();},[refresh]);
  return (
    <section style={{padding:"3rem 1.5rem 6rem"}}>
      <div style={{maxWidth:"72rem",margin:"0 auto"}}>
        <div style={{textAlign:"center",marginBottom:"2.5rem"}}>
          <div className="divider" style={{maxWidth:"20rem",margin:"0 auto 1.25rem"}}><span>◆</span><span style={{fontFamily:"Cinzel,serif",fontSize:"0.65rem",letterSpacing:"0.25em",color:"var(--color-gold)",opacity:0.7,textTransform:"uppercase"}}>Chronicle</span><span>◆</span></div>
          <h2 className="heading-display" style={{fontSize:"1.875rem",color:"var(--color-cream)",marginBottom:"0.5rem"}}>Execution Audit Log</h2>
          <p style={{fontFamily:"EB Garamond,serif",fontStyle:"italic",color:"var(--color-cream-dim)",fontSize:"0.875rem"}}>Every invocation recorded. No credential ever committed to history.</p>
        </div>
        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:"1rem"}}>
          <button className="btn-ghost" onClick={refresh}><RefreshCw size={12} className={loading?"animate-spin":""}/> Refresh</button>
        </div>
        <div className="panel">
          {log.length === 0 ? (
            <div style={{textAlign:"center",padding:"3.5rem 0"}}>
              <div style={{color:"var(--color-gold)",opacity:0.1,fontSize:"3rem",marginBottom:"1rem",fontFamily:"Cinzel,serif"}}>✦</div>
              <p style={{fontFamily:"Cinzel,serif",fontSize:"0.7rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--color-cream-dim)",opacity:0.4}}>No incantations recorded yet</p>
            </div>
          ) : (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr auto",gap:"1rem",paddingBottom:"0.75rem",borderBottom:"1px solid rgba(107,81,40,0.3)",fontFamily:"Cinzel,serif",fontSize:"0.65rem",textTransform:"uppercase",letterSpacing:"0.2em",color:"var(--color-gold)",opacity:0.6}}>
                <div/><div>Time</div><div>Service</div><div>Action</div><div>Status</div>
              </div>
              {log.map((entry,i)=>(
                <div key={i} style={{display:"grid",gridTemplateColumns:"auto 1fr 1fr 1fr auto",gap:"1rem",padding:"0.75rem 0",borderBottom:"1px solid rgba(44,35,24,0.5)",fontFamily:"JetBrains Mono,monospace",fontSize:"0.7rem",alignItems:"center"}}>
                  {entry.success?<CheckCircle size={11} style={{color:"var(--color-gold)",opacity:0.7}}/>:<XCircle size={11} style={{color:"var(--color-danger)"}}/>}
                  <span style={{color:"var(--color-cream-dim)",opacity:0.5}}>{new Date(entry.ts).toLocaleTimeString()}</span>
                  <span style={{color:"var(--color-cream)",textTransform:"capitalize"}}>{entry.service}</span>
                  <span style={{color:"var(--color-cream-dim)"}}>{entry.action}</span>
                  <span>{entry.success?<span className="badge-gold">ok</span>:<span className="badge-red">err</span>}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
