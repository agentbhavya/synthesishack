import { useState } from "react";
import { Shield, Lock, Activity } from "lucide-react";
import { Hero } from "./components/Hero";
import { HowItWorks } from "./components/HowItWorks";
import { VaultDashboard } from "./components/VaultDashboard";
import { ExecutePanel } from "./components/ExecutePanel";
import { AuditLog } from "./components/AuditLog";

type Tab = "home" | "vault" | "execute" | "audit";

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [executeService, setExecuteService] = useState<string | undefined>();

  function handleExecute(service: string) {
    setExecuteService(service);
    setTab("execute");
  }

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <nav className="sticky top-0 z-40 bg-panel bg-opacity-90 backdrop-blur-md border-b border-ornament border-opacity-40">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <button
            onClick={() => setTab("home")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <Shield size={16} className="text-gold" />
            <span className="font-display text-sm tracking-widest text-cream uppercase">Cloak</span>
            <span className="text-ornament font-display text-xs tracking-widest hidden sm:block">· Agent Vault</span>
          </button>

          <div className="flex items-center gap-1">
            <NavBtn active={tab === "vault"}   onClick={() => setTab("vault")}   icon={<Lock size={12} />}     label="Vault"   />
            <NavBtn active={tab === "execute"} onClick={() => setTab("execute")} icon={<Shield size={12} />}   label="Execute" />
            <NavBtn active={tab === "audit"}   onClick={() => setTab("audit")}   icon={<Activity size={12} />} label="Chronicle" />
          </div>
        </div>
        {/* gold hairline */}
        <div className="h-px bg-gradient-to-r from-transparent via-gold to-transparent opacity-20" />
      </nav>

      {tab === "home"    && <><Hero onGetStarted={() => setTab("vault")} /><HowItWorks /></>}
      {tab === "vault"   && <VaultDashboard onExecute={handleExecute} />}
      {tab === "execute" && <ExecutePanel initialService={executeService} onBack={() => setTab("vault")} />}
      {tab === "audit"   && <AuditLog />}
    </div>
  );
}

function NavBtn({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs transition-all duration-200 font-display uppercase tracking-widest ${
        active
          ? "bg-gold-dim text-gold border border-ornament"
          : "text-cream-dim hover:text-gold hover:border-ornament border border-transparent"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
