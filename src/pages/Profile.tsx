import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Save, Sun, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { AppHeader } from "@/components/app/AppHeader";
import { toast } from "sonner";

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  avatar_path: string | null;
  course: string | null;
  year_level: string | null;
  phone: string | null;
  social: string | null;
}

export default function Profile() {
  const { user, role } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [p, setP] = useState<ProfileRow | null>(null);

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    setP(data as ProfileRow);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const avatarUrl = p?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(p.avatar_path).data.publicUrl
    : null;

  const handleAvatar = async (file: File) => {
    if (!user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { error } = await supabase.from("profiles").update({ avatar_path: path }).eq("id", user.id);
      if (error) throw error;
      toast.success("Avatar updated");
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !p) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: p.name,
        bio: p.bio,
        course: p.course,
        year_level: p.year_level,
        phone: p.phone,
        social: p.social,
      })
      .eq("id", user.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile saved");
  };

  if (loading || !p) {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader isAdmin={role === "admin"} displayName="" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  const initials = (p.name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader isAdmin={role === "admin"} displayName={p.name} avatarUrl={avatarUrl} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8">
        <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
          <h1 className="text-2xl font-bold mb-1">My Profile</h1>
          <p className="text-sm text-muted-foreground mb-6">Customize how others see you.</p>

          {/* Appearance / Theme */}
          <div className="mb-6 p-4 rounded-xl border border-border bg-muted/30 flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                {theme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                Appearance
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Currently using {theme} mode.
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-medium hover:border-primary hover:text-primary transition-colors flex items-center gap-2"
            >
              {theme === "dark" ? <><Sun className="w-4 h-4" /> Switch to light</> : <><Moon className="w-4 h-4" /> Switch to dark</>}
            </button>
          </div>

          {/* Avatar */}
          <div className="flex items-center gap-5 mb-8">
            <div className="relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-24 h-24 rounded-full object-cover border-2 border-border" />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white ${role === "admin" ? "gradient-amber" : "gradient-blue"}`}>
                  {initials}
                </div>
              )}
            </div>
            <label className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-input text-sm hover:border-primary hover:text-primary transition-colors">
              <Upload className="w-4 h-4" />
              {uploading ? "Uploading..." : "Change avatar"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAvatar(e.target.files[0])} />
            </label>
          </div>

          <form onSubmit={save} className="space-y-4">
            <Field label="Display name">
              <input value={p.name || ""} onChange={(e) => setP({ ...p, name: e.target.value })} required className={inputCls} />
            </Field>

            <Field label="Email">
              <input value={p.email || ""} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
            </Field>

            <Field label="Bio">
              <textarea value={p.bio || ""} onChange={(e) => setP({ ...p, bio: e.target.value })} rows={3} maxLength={300} placeholder="Tell others a bit about yourself..." className={`${inputCls} resize-none`} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Course / Program">
                <input value={p.course || ""} onChange={(e) => setP({ ...p, course: e.target.value })} placeholder="e.g., BSIT" className={inputCls} />
              </Field>
              <Field label="Year level">
                <select value={p.year_level || ""} onChange={(e) => setP({ ...p, year_level: e.target.value })} className={inputCls}>
                  <option value="">—</option>
                  <option>Grade 11</option>
                  <option>Grade 12</option>
                  <option>1st Year</option>
                  <option>2nd Year</option>
                  <option>3rd Year</option>
                  <option>4th Year</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Phone (optional)">
                <input value={p.phone || ""} onChange={(e) => setP({ ...p, phone: e.target.value })} placeholder="09xx xxx xxxx" className={inputCls} />
              </Field>
              <Field label="Social (optional)">
                <input value={p.social || ""} onChange={(e) => setP({ ...p, social: e.target.value })} placeholder="@username" className={inputCls} />
              </Field>
            </div>

            <button type="submit" disabled={saving} className="w-full mt-2 py-3 rounded-lg gradient-blue shadow-blue text-white font-semibold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-60">
              <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save changes"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

const inputCls = "w-full px-3.5 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{label}</label>
    {children}
  </div>
);