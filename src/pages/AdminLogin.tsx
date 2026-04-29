import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { data, error: signErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signErr || !data.user) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }
    // verify admin role
    const { data: roleRows } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin");
    if (!roleRows || roleRows.length === 0) {
      await supabase.auth.signOut();
      setLoading(false);
      setError("This account is not an administrator.");
      return;
    }
    toast.success("Welcome, admin!");
    navigate("/admin", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card rounded-2xl p-9 shadow-card animate-fade-slide-up">
        <div className="text-center mb-7">
          <div className="inline-flex w-[60px] h-[60px] rounded-2xl gradient-amber items-center justify-center text-white shadow-amber animate-icon-pop">
            <Settings className="w-7 h-7" />
          </div>
          <h2 className="mt-4 mb-1 text-[22px] font-bold text-foreground tracking-tight">
            Admin Login
            <span className="ml-2 inline-block text-[10px] font-extrabold tracking-[1.5px] uppercase text-accent border-[1.5px] border-accent rounded px-1.5 py-0.5 align-middle">
              Admin
            </span>
          </h2>
          <p className="text-[13px] text-muted-foreground">Restricted access — administrators only</p>
        </div>

        {error && (
          <div className="mb-4 px-3.5 py-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-[13px]">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Email</label>
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@stierfinds.com"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all placeholder:text-muted-foreground/60"
          />

          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Password</label>
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all placeholder:text-muted-foreground/60"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-[9px] gradient-amber text-white text-[15px] font-semibold tracking-wide shadow-amber hover:opacity-90 hover:-translate-y-px active:translate-y-0 transition-all disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="text-center mt-[18px] text-[13.5px] text-muted-foreground">
          Not an admin?{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            Back to Student Login
          </Link>
        </p>
      </div>
    </div>
  );
}
