"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) { setError(error.message); setLoading(false); return; }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen hero-bg flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="divider max-w-xs mx-auto mb-4"><span>◆</span><span className="font-display text-xs tracking-[0.25em] text-gold opacity-70 uppercase" style={{fontFamily:"Cinzel,serif"}}>Begin the Ritual</span><span>◆</span></div>
          <h1 className="heading-display text-3xl" style={{color:"var(--color-cream)"}}>Create Your Vault</h1>
          <p style={{fontFamily:"EB Garamond,serif",fontStyle:"italic",color:"var(--color-cream-dim)",fontSize:"0.9rem",marginTop:"0.5rem"}}>Your credentials will be encrypted. Only you can invoke them.</p>
        </div>
        <div className="panel glow-gold">
          <form onSubmit={handleSignup} className="space-y-5">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} autoFocus />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" placeholder="min 6 characters" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            {error && <p style={{color:"var(--color-danger)",fontSize:"0.875rem"}}>{error}</p>}
            <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
              {loading ? "Sealing your vault…" : "Create Vault"}
            </button>
          </form>
          <p className="text-center mt-6" style={{fontFamily:"EB Garamond,serif",fontSize:"0.9rem",color:"var(--color-cream-dim)"}}>
            Already have a vault? <Link href="/login" style={{color:"var(--color-gold)"}}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
