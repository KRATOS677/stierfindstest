import { useEffect, useState, useMemo } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/app/AppHeader";
import { ItemCard, Item } from "@/components/app/ItemCard";
import { ReportItemDialog } from "@/components/app/ReportItemDialog";
import { toast } from "sonner";

const CATEGORIES = ["Electronics", "Bags", "Clothing", "Books", "Wallet/ID", "Keys", "Jewelry", "Other"];

export default function Dashboard() {
  const { user } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [myName, setMyName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "found" | "lost">("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [{ data: itemsData }, { data: profileData }, { data: me }] = await Promise.all([
      supabase.from("items").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, name"),
      user ? supabase.from("profiles").select("avatar_path").eq("id", user.id).maybeSingle() : Promise.resolve({ data: null } as any),
    ]);
    const map: Record<string, string> = {};
    (profileData || []).forEach((p: any) => { map[p.id] = p.name; });
    setProfiles(map);
    setItems(((itemsData as Item[]) || []).map((i) => ({
      ...i,
      uploader_name: i.user_id ? map[i.user_id] || i.uploaded_by_name || "Student" : i.uploaded_by_name || "Admin",
    })));
    if (user && map[user.id]) setMyName(map[user.id]);
    if (me && (me as any).avatar_path) {
      setAvatarUrl(supabase.storage.from("avatars").getPublicUrl((me as any).avatar_path).data.publicUrl);
    } else {
      setAvatarUrl(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("items-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "items" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const filtered = useMemo(() => {
    return items.filter((i) => {
      if (tab === "mine" && i.user_id !== user?.id) return false;
      if (filterType !== "all" && i.type !== filterType) return false;
      if (filterCategory !== "all" && i.category !== filterCategory) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          i.name.toLowerCase().includes(s) ||
          (i.category || "").toLowerCase().includes(s) ||
          (i.location || "").toLowerCase().includes(s) ||
          (i.description || "").toLowerCase().includes(s)
        );
      }
      return true;
    });
  }, [items, tab, filterType, filterCategory, search, user]);

  const handleClaim = async (item: Item) => {
    const { error } = await supabase.from("items").update({ status: "pending" }).eq("id", item.id);
    if (error) return toast.error(error.message);
    if (item.user_id) {
      await supabase.from("notifications").insert({
        to_user_id: item.user_id, to_type: "student",
        from_user_id: user?.id, from_type: "student",
        item_id: item.id, item_name: item.name,
        type: "claim",
        message: `${myName || "A student"} wants to claim your "${item.name}".`,
      });
    } else {
      await supabase.from("notifications").insert({
        to_type: "admin",
        from_user_id: user?.id, from_type: "student",
        item_id: item.id, item_name: item.name,
        type: "claim",
        message: `${myName || "A student"} wants to claim "${item.name}".`,
      });
    }
    toast.success("Claim submitted!");
  };

  const handleDelete = async (item: Item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Item deleted");
  };

  const handleMarkReturned = async (item: Item) => {
    const { error } = await supabase.from("items").update({ status: "returned" }).eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Marked as returned");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader displayName={myName} avatarUrl={avatarUrl} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold mb-1">Lost & Found</h1>
            <p className="text-muted-foreground text-sm">Browse items, report a new one, or claim what's yours.</p>
          </div>
          <ReportItemDialog onCreated={load} />
        </div>

        {/* Filters */}
        <div className="bg-card rounded-xl border border-border p-4 mb-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search items..."
              className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-border bg-input text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 rounded-lg border border-border bg-input text-foreground text-sm outline-none focus:border-primary min-w-[150px]"
            title="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="flex gap-1 bg-input rounded-lg p-1">
            {(["all", "found", "lost"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${
                  filterType === t ? "bg-primary text-primary-foreground shadow-blue" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex gap-1 bg-input rounded-lg p-1">
            {(["all", "mine"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${
                  tab === t ? "bg-accent text-accent-foreground shadow-amber" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t === "all" ? "All Items" : "My Items"}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground text-lg">No items match your filters.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">Try adjusting search, or report a new item.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                currentUserId={user?.id || null}
                isAdmin={false}
                onClaim={handleClaim}
                onDelete={handleDelete}
                onMarkReturned={handleMarkReturned}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
