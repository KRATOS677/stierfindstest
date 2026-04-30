import { useEffect, useState } from "react";
import { Trash2, Archive as ArchiveIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/app/AppHeader";
import { toast } from "sonner";

interface Stats {
  total: number;
  found: number;
  lost: number;
  returned: number;
  pending: number;
  unclaimed: number;
  topCategories: { name: string; count: number }[];
  topLocations: { name: string; count: number }[];
  perDay: { day: string; count: number }[];
  users: number;
}

interface ArchivedItem {
  id: string;
  name: string;
  type: string;
  category: string | null;
  location: string | null;
  archived_at: string | null;
  created_at: string;
}

export default function Analytics() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [archived, setArchived] = useState<ArchivedItem[]>([]);
  const [archiving, setArchiving] = useState(false);

  const load = async () => {
    const [
      { data: items },
      { count: userCount },
      { data: prof },
      { data: arch },
    ] = await Promise.all([
      supabase
        .from("items")
        .select("type,status,category,location,created_at,archived_at"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      user
        ? supabase
            .from("profiles")
            .select("name, avatar_path")
            .eq("id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
      supabase
        .from("items")
        .select("id,name,type,category,location,archived_at,created_at")
        .not("archived_at", "is", null)
        .order("archived_at", { ascending: false }),
    ]);
    if (prof) {
      setName((prof as any).name || "");
      const ap = (prof as any).avatar_path;
      if (ap)
        setAvatarUrl(
          supabase.storage.from("avatars").getPublicUrl(ap).data.publicUrl,
        );
    }
    setArchived((arch as ArchivedItem[]) || []);
    const list = (items || []).filter((i: any) => !i.archived_at);
    const tally = (key: "category" | "location") => {
      const m: Record<string, number> = {};
      list.forEach((i: any) => {
        const v = i[key] || "Uncategorized";
        m[v] = (m[v] || 0) + 1;
      });
      return Object.entries(m)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
    };
    // last 7 days
    const days: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({ day: key, count: 0 });
    }
    list.forEach((i: any) => {
      const k = (i.created_at || "").slice(0, 10);
      const slot = days.find((x) => x.day === k);
      if (slot) slot.count++;
    });
    setStats({
      total: list.length,
      found: list.filter((i: any) => i.type === "found").length,
      lost: list.filter((i: any) => i.type === "lost").length,
      returned: list.filter((i: any) => i.status === "returned").length,
      pending: list.filter((i: any) => i.status === "pending").length,
      unclaimed: list.filter((i: any) => i.status === "unclaimed").length,
      topCategories: tally("category"),
      topLocations: tally("location"),
      perDay: days,
      users: userCount || 0,
    });
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("analytics-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const recoveryRate =
    stats && stats.total ? Math.round((stats.returned / stats.total) * 100) : 0;

  const runArchiveNow = async () => {
    setArchiving(true);
    const { data, error } = await supabase.rpc("archive_stale_items");
    setArchiving(false);
    if (error) return toast.error(error.message);
    toast.success(`Archived ${data ?? 0} item(s)`);
    load();
  };

  const deleteArchived = async (item: ArchivedItem) => {
    if (!confirm(`Permanently delete "${item.name}"?`)) return;
    const { error } = await supabase.from("items").delete().eq("id", item.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    load();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader isAdmin={isAdmin} displayName={name} avatarUrl={avatarUrl} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold mb-1">
            Community Analytics
          </h1>
          <p className="text-muted-foreground text-sm">
            Live insights from STIerFinds activity.
          </p>
        </div>

        {!stats ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              <Stat label="Total items" value={stats.total} />
              <Stat label="Found" value={stats.found} />
              <Stat label="Lost" value={stats.lost} />
              <Stat label="Returned" value={stats.returned} />
              <Stat label="Recovery rate" value={`${recoveryRate}%`} />
              <Stat label="Members" value={stats.users} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {/* Status breakdown */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-bold mb-4">Status breakdown</h2>
                <BreakdownBar
                  label="Unclaimed"
                  value={stats.unclaimed}
                  total={stats.total}
                  colorClass="bg-success"
                />
                <BreakdownBar
                  label="Pending"
                  value={stats.pending}
                  total={stats.total}
                  colorClass="bg-warning"
                />
                <BreakdownBar
                  label="Returned"
                  value={stats.returned}
                  total={stats.total}
                  colorClass="bg-primary"
                />
              </div>

              {/* Top categories */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-bold mb-4">Top categories</h2>
                {stats.topCategories.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  stats.topCategories.map((c) => (
                    <BreakdownBar
                      key={c.name}
                      label={c.name}
                      value={c.count}
                      total={stats.topCategories[0].count}
                      colorClass="gradient-blue"
                    />
                  ))
                )}
              </div>

              {/* Top locations */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h2 className="font-bold mb-4">Top locations</h2>
                {stats.topLocations.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No data yet.</p>
                ) : (
                  stats.topLocations.map((c) => (
                    <BreakdownBar
                      key={c.name}
                      label={c.name}
                      value={c.count}
                      total={stats.topLocations[0].count}
                      colorClass="gradient-amber"
                    />
                  ))
                )}
              </div>
            </div>

            {/* ARCHIVED ITEMS */}
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <ArchiveIcon className="w-5 h-5 text-muted-foreground" />
                  <h2 className="font-bold">Archived items</h2>
                  <span className="text-xs text-muted-foreground">
                    ({archived.length})
                  </span>
                </div>
                {isAdmin && (
                  <button
                    onClick={runArchiveNow}
                    disabled={archiving}
                    className="bg-accent/15 text-accent text-xs font-semibold py-2 px-3 rounded-lg border border-accent/30 hover:bg-accent/25 transition disabled:opacity-50"
                  >
                    {archiving ? "Archiving..." : "Run archive now"}
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                Items older than 30 days that weren't returned or claimed are
                auto-archived.{" "}
                {isAdmin ? "Admins can permanently delete them." : ""}
              </p>
              {archived.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No archived items.
                </p>
              ) : (
                <div className="space-y-2">
                  {archived.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 bg-muted/40 border border-border rounded-lg px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {item.type} · {item.category || "Uncategorized"} ·{" "}
                          {item.location || "—"} · archived{" "}
                          {item.archived_at
                            ? new Date(item.archived_at).toLocaleDateString()
                            : ""}
                        </p>
                      </div>
                      {isAdmin && (
                        <button
                          onClick={() => deleteArchived(item)}
                          className="bg-destructive/15 text-destructive text-xs font-semibold py-1.5 px-2 rounded-lg border border-destructive/30 hover:bg-destructive/25 transition flex items-center gap-1.5 shrink-0"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

const Stat = ({ label, value }: { label: string; value: number | string }) => (
  <div className="bg-card border border-border rounded-xl p-4">
    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
      {label}
    </p>
    <p className="text-2xl font-bold leading-none">{value}</p>
  </div>
);

const BreakdownBar = ({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="mb-3 last:mb-0">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-2 bg-input rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClass} rounded-full transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
