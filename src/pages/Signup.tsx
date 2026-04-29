import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    toast.success("Account created! Signing you in...");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-2xl p-9 shadow-card animate-fade-slide-up">
        <div className="text-center mb-7">
          <div className="inline-flex w-[60px] h-[60px] rounded-2xl gradient-blue items-center justify-center text-white shadow-blue animate-icon-pop">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="mt-4 mb-1.5 text-[22px] font-bold text-foreground tracking-tight">Create Account</h2>
          <p className="text-[13.5px] text-muted-foreground">Join STIerFinds Manager</p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Full Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
          />

          <label className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
          />

          <label className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[9px] gradient-blue text-white text-[15px] font-semibold tracking-wide shadow-blue hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="flex items-center gap-2.5 my-5">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground/80 whitespace-nowrap">Already have an account?</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="text-center text-sm">
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
