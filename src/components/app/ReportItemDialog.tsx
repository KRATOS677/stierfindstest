import { useState } from "react";
import { Plus, X, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const CATEGORIES = ["Electronics", "Bags", "Clothing", "Books", "Wallet/ID", "Keys", "Jewelry", "Other"];
const LOCATIONS = ["Library", "Cafeteria", "Hallways", "Classroom", "Gym", "Parking", "Restroom", "Other"];

export const ReportItemDialog = ({ onCreated, isAdmin = false }: { onCreated: () => void; isAdmin?: boolean }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"found" | "lost">("found");
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setDescription(""); setFile(null); setType("found");
    setCategory(CATEGORIES[0]); setLocation(LOCATIONS[0]);
    setDate(new Date().toISOString().slice(0, 10));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      let image_path: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("item-images").upload(path, file);
        if (upErr) throw upErr;
        image_path = path;
      }
      const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();
      const { error } = await supabase.from("items").insert({
        user_id: isAdmin ? null : user.id,
        uploaded_by_name: isAdmin ? "Admin" : profile?.name || null,
        type, name, category, location,
        date_reported: date, description, image_path,
        status: "unclaimed",
      });
      if (error) throw error;
      toast.success("Item reported!");
      reset();
      setOpen(false);
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Failed to report item");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`${isAdmin ? "gradient-amber shadow-amber" : "gradient-blue shadow-blue"} text-white font-semibold px-5 py-2.5 rounded-lg flex items-center gap-2 hover:opacity-90 hover:-translate-y-0.5 transition-all`}
      >
        <Plus className="w-4 h-4" /> Report Item
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setOpen(false)}>
          <div className="bg-card rounded-2xl shadow-card w-full max-w-md max-h-[90vh] overflow-y-auto animate-fade-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-border sticky top-0 bg-card">
              <h2 className="text-lg font-bold">Report an Item</h2>
              <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-muted rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={submit} className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {(["found", "lost"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`py-2.5 rounded-lg font-semibold uppercase text-sm tracking-wide transition-all ${
                      type === t
                        ? t === "found" ? "bg-success text-white" : "bg-destructive text-white"
                        : "bg-input text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {[
                { label: "Item name", value: name, set: setName, required: true, placeholder: "e.g., Black backpack" },
              ].map((f) => (
                <div key={f.label}>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">{f.label}</label>
                  <input
                    required={f.required}
                    value={f.value}
                    onChange={(e) => f.set(e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              ))}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary">
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Location</label>
                  <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-3 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary">
                    {LOCATIONS.map((l) => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary" />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Any extra details..."
                  className="w-full px-3.5 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">Photo (optional)</label>
                <label className="flex items-center justify-center gap-2 w-full px-3 py-3 rounded-lg border-2 border-dashed border-border bg-input/50 text-sm text-muted-foreground hover:border-primary hover:text-primary cursor-pointer transition-colors">
                  <Upload className="w-4 h-4" />
                  {file ? file.name : "Click to upload image"}
                  <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
                </label>
              </div>

              <button type="submit" disabled={loading} className={`w-full py-3 rounded-lg ${isAdmin ? "gradient-amber shadow-amber" : "gradient-blue shadow-blue"} text-white font-semibold hover:opacity-90 transition-all disabled:opacity-60`}>
                {loading ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
