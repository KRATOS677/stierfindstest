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
    const { data, error: signErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (signErr || !data.user) {
      setLoading(false);
      setError("Invalid email or password.");
      return;
    }
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-8 shadow-lg">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mb-3">
            <Settings className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Admin Login
            <span className="text-xs px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
              Admin
            </span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Restricted access — administrators only
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/15 text-destructive text-sm border border-destructive/30">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@stierfinds.com"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all placeholder:text-muted-foreground/60"
          />

          <label className="block text-sm font-medium text-foreground mb-1.5">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full px-3.5 py-[11px] rounded-lg border border-border bg-input text-foreground text-sm mb-[18px] outline-none focus:border-accent focus:ring-[3px] focus:ring-accent/15 transition-all placeholder:text-muted-foreground/60"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-accent text-accent-foreground font-semibold text-sm hover:bg-accent/90 transition-all disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-5">
          Not an admin?{" "}
          <Link
            to="/login"
            className="text-accent font-semibold hover:underline"
          >
            Back to Student Login
          </Link>
        </p>
      </div>
    </div>
  );
}
