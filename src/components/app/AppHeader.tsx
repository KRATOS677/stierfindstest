import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Bell, LogOut, MessageSquare, BarChart3, User as UserIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Notif {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  from_user_id: string | null;
  item_name: string | null;
}

export const AppHeader = ({
  isAdmin = false,
  displayName = "",
  avatarUrl = null,
}: {
  isAdmin?: boolean;
  displayName?: string;
  avatarUrl?: string | null;
}) => {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [open, setOpen] = useState(false);

  const initials = (displayName || "U")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const loadNotifs = async () => {
    if (!user) return;
    const q = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    const { data } = isAdmin
      ? await q.eq("to_type", "admin")
      : await q.eq("to_user_id", user.id).eq("to_type", "student");
    setNotifs((data as Notif[]) || []);
  };

  useEffect(() => {
    loadNotifs();
    if (!user) return;
    const channel = supabase
      .channel("notif-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => loadNotifs())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  // close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (!t.closest("[data-notif-root]")) setOpen(false);
    };
    document.addEventListener("click", fn);
    return () => document.removeEventListener("click", fn);
  }, []);

  const unread = notifs.filter((n) => !n.is_read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    const q = supabase.from("notifications").update({ is_read: true });
    if (isAdmin) await q.eq("to_type", "admin").eq("is_read", false);
    else await q.eq("to_user_id", user.id).eq("is_read", false);
    loadNotifs();
  };

  const handleLogout = async () => {
    await signOut();
    toast.success("Signed out");
    navigate("/login");
  };

  return (
    <header className="bg-card px-4 sm:px-8 py-4 border-b border-border flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-card/95">
      <Link to={isAdmin ? "/admin" : "/dashboard"} className="flex items-center gap-3">
        <div className="bg-sti-yellow-bright text-sti-blue font-black px-2.5 py-1 rounded text-base tracking-tighter">
          STI
        </div>
        <span className="text-lg font-bold text-foreground hidden sm:inline">
          STIerFinds
          {isAdmin && (
            <span className="ml-2 text-[10px] font-extrabold tracking-[1.5px] uppercase text-accent border border-accent rounded px-1.5 py-0.5">
              Admin
            </span>
          )}
        </span>
      </Link>

      <div className="flex items-center gap-3 sm:gap-5">
        <Link
          to="/analytics"
          className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
          title="Analytics"
        >
          <BarChart3 className="w-5 h-5" />
        </Link>

        <Link
          to="/messages"
          className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-lg hover:bg-muted"
          title="Messages"
        >
          <MessageSquare className="w-5 h-5" />
        </Link>

        {/* NOTIFICATIONS */}
        <div className="relative" data-notif-root>
          <button
            onClick={() => setOpen((o) => !o)}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
            {unread > 0 && (
              <span className="absolute top-0 right-0 bg-destructive text-destructive-foreground text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute top-[140%] right-0 w-80 bg-card border border-border rounded-xl shadow-card overflow-hidden animate-fade-in">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">Notifications</span>
                <button
                  onClick={markAllRead}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  Mark all read
                </button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifs.length === 0 && (
                  <div className="p-6 text-center text-sm text-muted-foreground">No notifications yet</div>
                )}
                {notifs.map((n) => (
                  <div
                    key={n.id}
                    className={`px-4 py-3 border-b border-border last:border-0 text-sm hover:bg-muted/50 transition-colors ${
                      !n.is_read ? "bg-primary/5 border-l-4 border-l-primary" : ""
                    }`}
                  >
                    <p className="leading-snug">{n.message}</p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* PROFILE CHIP */}
        <Link
          to="/profile"
          className="flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          title="My profile"
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="profile" className="w-9 h-9 rounded-full object-cover border border-border" />
          ) : (
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white text-sm ${
                isAdmin ? "gradient-amber" : "gradient-blue"
              }`}
            >
              {initials}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-sm font-semibold leading-tight">{displayName || "User"}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">
              {isAdmin ? "Administrator" : "Student"}
            </p>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="bg-transparent border border-border text-muted-foreground px-3 py-1.5 rounded-lg text-sm hover:text-destructive hover:border-destructive transition-colors flex items-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
