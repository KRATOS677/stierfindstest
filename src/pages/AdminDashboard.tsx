import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/app/AppHeader";
import { ItemCard, Item } from "@/components/app/ItemCard";
import { ReportItemDialog } from "@/components/app/ReportItemDialog";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const load = async () => {
    const [{ data }, { data: profile }] = await Promise.all([
      supabase.from("items").select("*").order("created_at", { ascending: false }),
      user ? supabase.from("profiles").select("name, avatar_path").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null }),
    ]);
    setItems((data as Item[]) || []);
    if (profile) {
      if ((profile as any).name) setName((profile as any).name);
      const ap = (profile as any).avatar_path;
      setAvatarUrl(ap ? supabase.storage.from("avatars").getPublicUrl(ap).data.publicUrl : null);
    }
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("admin-items")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader isAdmin displayName={name || "Admin"} avatarUrl={avatarUrl} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-1">Admin Console</h1>
            <p className="text-muted-foreground text-sm">{items.length} items in the system</p>
          </div>
          <ReportItemDialog onCreated={load} isAdmin />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              currentUserId={user?.id || null}
              isAdmin
              onDelete={async (i) => {
                if (!confirm(`Delete "${i.name}"?`)) return;
                const { error } = await supabase.from("items").delete().eq("id", i.id);
                if (error) toast.error(error.message); else toast.success("Deleted");
              }}
              onMarkReturned={async (i) => {
                const { error } = await supabase.from("items").update({ status: "returned" }).eq("id", i.id);
                if (error) toast.error(error.message); else toast.success("Marked returned");
              }}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
