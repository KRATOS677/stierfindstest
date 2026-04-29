import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setError(error.message.includes("Invalid") ? "Invalid email or password." : error.message);
      return;
    }
    toast.success("Welcome back!");
    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card text-card-foreground rounded-2xl p-9 shadow-card animate-fade-slide-up">
        <div className="text-center mb-7">
          <div className="inline-flex w-15 h-15 w-[60px] h-[60px] rounded-2xl gradient-blue items-center justify-center text-white shadow-blue animate-icon-pop">
            <Lock className="w-7 h-7" />
          </div>
          <h2 className="mt-4 mb-1.5 text-[22px] font-bold text-foreground tracking-tight">Welcome Back</h2>
          <p className="text-[13.5px] text-muted-foreground">Enter your credentials to access your account</p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label htmlFor="email" className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
          />

          <label htmlFor="password" className="text-[12.5px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15 transition-all placeholder:text-muted-foreground/60"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[9px] gradient-blue text-white text-[15px] font-semibold tracking-wide shadow-blue hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>

          <a href="#" className="block text-center mt-3.5 text-sm text-primary hover:text-primary/80 hover:underline transition-colors">
            Forgot password?
          </a>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-semibold hover:underline">
              Sign up
            </Link>
          </div>

          <div className="mt-5 p-2.5 rounded-lg text-center bg-input border border-border hover:border-primary hover:bg-[hsl(220_30%_19%)] transition-all">
            <Link to="/admin/login" className="block text-muted-foreground hover:text-foreground inline-flex items-center justify-center gap-1.5 text-sm font-medium">
              <Settings className="w-4 h-4" />
              Admin Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
