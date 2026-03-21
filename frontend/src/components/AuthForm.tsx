import { useState } from "react";
import { Shield } from "lucide-react";
import { supabase } from "../supabase";

export function AuthForm() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    if (mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setInfo("Account created — check your email to confirm, then sign in.");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold opacity-[0.025] blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield size={20} className="text-gold" />
            <span className="font-display text-xl tracking-widest text-cream uppercase">Cloak</span>
          </div>
          <div className="divider max-w-[14rem] mx-auto mb-4">
            <span>◆</span>
            <span className="font-display text-[0.6rem] tracking-[0.25em] text-gold opacity-70 uppercase">
              Enter the Vault
            </span>
            <span>◆</span>
          </div>
          <h1 className="heading-display text-2xl text-cream">
            {mode === "login" ? "Sign In to Cloak" : "Create Your Vault"}
          </h1>
        </div>

        {/* Form */}
        <div className="panel glow-gold">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoFocus
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-danger text-sm font-body">{error}</p>
            )}
            {info && (
              <p className="text-gold text-sm font-body">{info}</p>
            )}

            <button
              type="submit"
              className="btn-primary w-full justify-center py-2.5"
              disabled={loading || !email || !password}
            >
              {loading
                ? (mode === "login" ? "Entering…" : "Creating…")
                : (mode === "login" ? "Enter the Vault" : "Create Vault")}
            </button>
          </form>
        </div>

        {/* Toggle mode */}
        <p className="text-center mt-6 font-body text-cream-dim text-sm">
          {mode === "login" ? (
            <>No account?{" "}
              <button onClick={() => { setMode("signup"); setError(""); setInfo(""); }} className="text-gold hover:opacity-80 transition-opacity">
                Create one
              </button>
            </>
          ) : (
            <>Already have a vault?{" "}
              <button onClick={() => { setMode("login"); setError(""); setInfo(""); }} className="text-gold hover:opacity-80 transition-opacity">
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
