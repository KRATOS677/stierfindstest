import { AppHeader } from "@/components/app/AppHeader";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Send, Shield, User as UserIcon, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

type PartyType = "student" | "admin";

interface Message {
  id: string;
  message: string;
  sender_id: string | null;
  receiver_id: string | null;
  sender_type: PartyType;
  receiver_type: PartyType;
  is_read: boolean;
  created_at: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
}

interface Thread {
  partnerId: string;
  partnerName: string;
  partnerType: PartyType;
  lastMessage: string;
  lastAt: string;
  unread: number;
}

const ADMIN_PARTNER_ID = "__admin__";

export default function Messages() {
  const { user, role } = useAuth();
  const isAdmin = role === "admin";
  const [searchParams, setSearchParams] = useSearchParams();
  const [me, setMe] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activePartner, setActivePartner] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load my profile
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("id,name,email")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => data && setMe(data as Profile));
  }, [user]);

  // Load all messages I'm part of (or all admin-routed if I'm admin)
  const loadMessages = async () => {
    if (!user) return;
    let query = supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1000);

    if (isAdmin) {
      query = query.or(
        `sender_type.eq.admin,receiver_type.eq.admin,sender_id.eq.${user.id},receiver_id.eq.${user.id}`
      );
    } else {
      query = query.or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);
    }
    const { data, error } = await query;
    if (error) {
      console.error(error);
      return;
    }
    setMessages((data as Message[]) || []);
  };

  useEffect(() => {
    if (!user) return;
    loadMessages();
    const channel = supabase
      .channel("chat-feed")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => loadMessages()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAdmin]);

  // Resolve all partner profiles
  useEffect(() => {
    if (!user || messages.length === 0) return;
    const ids = new Set<string>();
    messages.forEach((m) => {
      if (m.sender_id && m.sender_id !== user.id) ids.add(m.sender_id);
      if (m.receiver_id && m.receiver_id !== user.id) ids.add(m.receiver_id);
    });
    const missing = Array.from(ids).filter((id) => !profiles[id]);
    if (missing.length === 0) return;
    supabase
      .from("profiles")
      .select("id,name,email")
      .in("id", missing)
      .then(({ data }) => {
        if (!data) return;
        const next = { ...profiles };
        (data as Profile[]).forEach((p) => (next[p.id] = p));
        setProfiles(next);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, user]);

  // Build threads
  const threads = useMemo<Thread[]>(() => {
    if (!user) return [];
    const map = new Map<string, Thread>();

    if (isAdmin) {
      // Admin: one thread per student that has any admin-routed message
      messages.forEach((m) => {
        let studentId: string | null = null;
        if (m.sender_type === "student" && m.receiver_type === "admin") studentId = m.sender_id;
        else if (m.sender_type === "admin" && m.receiver_type === "student") studentId = m.receiver_id;
        if (!studentId) return;
        const p = profiles[studentId];
        const existing = map.get(studentId);
        if (!existing || new Date(m.created_at) > new Date(existing.lastAt)) {
          map.set(studentId, {
            partnerId: studentId,
            partnerName: p?.name || "Student",
            partnerType: "student",
            lastMessage: m.message,
            lastAt: m.created_at,
            unread:
              (existing?.unread || 0) +
              (!m.is_read && m.receiver_type === "admin" ? 1 : 0),
          });
        } else {
          existing.unread += !m.is_read && m.receiver_type === "admin" ? 1 : 0;
        }
      });
    } else {
      // Student: one thread = "Admin Support" (all admin-routed) + one per other student
      let adminLast: Message | null = null;
      let adminUnread = 0;
      messages.forEach((m) => {
        if (m.sender_type === "admin" || m.receiver_type === "admin") {
          if (!adminLast || new Date(m.created_at) > new Date(adminLast.created_at)) adminLast = m;
          if (!m.is_read && m.receiver_id === user.id) adminUnread++;
          return;
        }
        const partnerId = m.sender_id === user.id ? m.receiver_id : m.sender_id;
        if (!partnerId) return;
        const p = profiles[partnerId];
        const existing = map.get(partnerId);
        const unreadInc = !m.is_read && m.receiver_id === user.id ? 1 : 0;
        if (!existing || new Date(m.created_at) > new Date(existing.lastAt)) {
          map.set(partnerId, {
            partnerId,
            partnerName: p?.name || "Student",
            partnerType: "student",
            lastMessage: m.message,
            lastAt: m.created_at,
            unread: (existing?.unread || 0) + unreadInc,
          });
        } else {
          existing.unread += unreadInc;
        }
      });
      if (adminLast) {
        map.set(ADMIN_PARTNER_ID, {
          partnerId: ADMIN_PARTNER_ID,
          partnerName: "Admin Support",
          partnerType: "admin",
          lastMessage: (adminLast as Message).message,
          lastAt: (adminLast as Message).created_at,
          unread: adminUnread,
        });
      } else {
        // Always show admin support entry
        map.set(ADMIN_PARTNER_ID, {
          partnerId: ADMIN_PARTNER_ID,
          partnerName: "Admin Support",
          partnerType: "admin",
          lastMessage: "Start a conversation with the admin team",
          lastAt: new Date(0).toISOString(),
          unread: 0,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastAt).getTime() - new Date(a.lastAt).getTime()
    );
  }, [messages, profiles, user, isAdmin]);

  // Auto-select first thread
  useEffect(() => {
    if (!activePartner && threads.length > 0) setActivePartner(threads[0].partnerId);
  }, [threads, activePartner]);

  // Open a conversation directly from ?to=<userId>
  useEffect(() => {
    if (!user) return;
    const to = searchParams.get("to");
    if (!to || to === user.id) return;
    setActivePartner(to);
    // Make sure we have the partner's profile loaded for the header
    if (!profiles[to]) {
      supabase
        .from("profiles")
        .select("id,name,email")
        .eq("id", to)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfiles((prev) => ({ ...prev, [to]: data as Profile }));
        });
    }
    // Clear the query param so refresh doesn't keep forcing it
    searchParams.delete("to");
    setSearchParams(searchParams, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchParams]);

  // If the active partner has no thread yet (new conversation), surface a virtual one
  const virtualThread = useMemo<Thread | null>(() => {
    if (!activePartner || activePartner === ADMIN_PARTNER_ID) return null;
    if (threads.find((t) => t.partnerId === activePartner)) return null;
    const p = profiles[activePartner];
    return {
      partnerId: activePartner,
      partnerName: p?.name || "Student",
      partnerType: "student",
      lastMessage: "Start a new conversation",
      lastAt: new Date().toISOString(),
      unread: 0,
    };
  }, [activePartner, threads, profiles]);

  // Filter messages for the active conversation
  const conversation = useMemo<Message[]>(() => {
    if (!user || !activePartner) return [];
    if (!isAdmin && activePartner === ADMIN_PARTNER_ID) {
      return messages.filter(
        (m) => m.sender_type === "admin" || m.receiver_type === "admin"
      );
    }
    return messages.filter(
      (m) =>
        (m.sender_id === user.id && m.receiver_id === activePartner) ||
        (m.receiver_id === user.id && m.sender_id === activePartner) ||
        (isAdmin &&
          ((m.sender_id === activePartner && m.receiver_type === "admin") ||
            (m.receiver_id === activePartner && m.sender_type === "admin")))
    );
  }, [messages, activePartner, user, isAdmin]);

  // Mark received messages as read when opening
  useEffect(() => {
    if (!user || !activePartner || conversation.length === 0) return;
    const unreadIds = conversation
      .filter((m) => !m.is_read && m.receiver_id === user.id)
      .map((m) => m.id);
    if (unreadIds.length === 0) return;
    supabase.from("messages").update({ is_read: true }).in("id", unreadIds).then(() => {
      // optimistic
      setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, is_read: true } : m)));
    });
  }, [activePartner, conversation, user]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation.length, activePartner]);

  const send = async () => {
    if (!user || !activePartner || !draft.trim() || sending) return;
    setSending(true);
    const text = draft.trim();
    setDraft("");

    let receiver_id: string | null = null;
    let receiver_type: PartyType;
    let sender_type: PartyType = isAdmin ? "admin" : "student";

    if (isAdmin) {
      receiver_id = activePartner;
      receiver_type = "student";
    } else if (activePartner === ADMIN_PARTNER_ID) {
      receiver_id = null;
      receiver_type = "admin";
    } else {
      receiver_id = activePartner;
      receiver_type = "student";
    }

    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id,
      sender_type,
      receiver_type,
      message: text,
    });

    if (error) {
      toast.error("Failed to send message");
      setDraft(text);
    } else {
      // Create a notification for the receiver
      const note =
        sender_type === "admin"
          ? `Admin replied: ${text.slice(0, 60)}`
          : `New message from ${me?.name || "a student"}: ${text.slice(0, 60)}`;
      await supabase.from("notifications").insert({
        from_user_id: user.id,
        from_type: sender_type,
        to_user_id: receiver_id,
        to_type: receiver_type,
        type: "message",
        message: note,
      });
      loadMessages();
    }
    setSending(false);
  };

  const allThreads = virtualThread ? [virtualThread, ...threads] : threads;
  const filteredThreads = allThreads.filter((t) =>
    t.partnerName.toLowerCase().includes(search.toLowerCase())
  );

  const activeThread = threads.find((t) => t.partnerId === activePartner) || virtualThread;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader displayName={me?.name || ""} isAdmin={isAdmin} />
      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col">
        <div className="mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Messages</h1>
          <p className="text-sm text-muted-foreground">
            {isAdmin ? "Conversations with students" : "Chat with admins and other students"}
          </p>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 min-h-[600px]">
          {/* THREADS LIST */}
          <aside
            className={`bg-card rounded-xl border border-border overflow-hidden flex flex-col ${
              activePartner ? "hidden md:flex" : "flex"
            }`}
          >
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations"
                  className="w-full bg-muted/50 border border-border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredThreads.length === 0 && (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No conversations yet
                </div>
              )}
              {filteredThreads.map((t) => {
                const active = t.partnerId === activePartner;
                return (
                  <button
                    key={t.partnerId}
                    onClick={() => setActivePartner(t.partnerId)}
                    className={`w-full text-left px-4 py-3 border-b border-border last:border-0 flex items-start gap-3 transition-colors ${
                      active ? "bg-primary/10" : "hover:bg-muted/50"
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold shrink-0 ${
                        t.partnerType === "admin" ? "gradient-amber" : "gradient-blue"
                      }`}
                    >
                      {t.partnerType === "admin" ? (
                        <Shield className="w-5 h-5" />
                      ) : (
                        t.partnerName
                          .split(" ")
                          .map((p) => p[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm truncate">{t.partnerName}</p>
                        {t.unread > 0 && (
                          <span className="bg-primary text-primary-foreground text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                            {t.unread}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {t.lastMessage}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* CHAT PANE */}
          <section
            className={`bg-card rounded-xl border border-border overflow-hidden flex flex-col ${
              activePartner ? "flex" : "hidden md:flex"
            }`}
          >
            {!activeThread ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-8 text-center">
                Select a conversation to start chatting
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-border flex items-center gap-3">
                  <button
                    onClick={() => setActivePartner(null)}
                    className="md:hidden text-muted-foreground hover:text-primary text-sm"
                  >
                    ←
                  </button>
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-semibold ${
                      activeThread.partnerType === "admin" ? "gradient-amber" : "gradient-blue"
                    }`}
                  >
                    {activeThread.partnerType === "admin" ? (
                      <Shield className="w-4 h-4" />
                    ) : (
                      <UserIcon className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{activeThread.partnerName}</p>
                    <p className="text-[11px] text-muted-foreground capitalize">
                      {activeThread.partnerType}
                    </p>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversation.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      No messages yet — say hello 👋
                    </div>
                  )}
                  {conversation.map((m) => {
                    const mine = m.sender_id === user?.id;
                    return (
                      <div
                        key={m.id}
                        className={`flex ${mine ? "justify-end" : "justify-start"} animate-fade-in`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                            mine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : m.sender_type === "admin"
                              ? "bg-accent/15 border border-accent/30 text-foreground rounded-bl-md"
                              : "bg-muted text-foreground rounded-bl-md"
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{m.message}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              mine ? "text-primary-foreground/70" : "text-muted-foreground"
                            }`}
                          >
                            {formatDistanceToNow(new Date(m.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  className="p-3 border-t border-border flex gap-2"
                >
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="Type a message…"
                    className="flex-1 bg-muted/50 border border-border rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    type="submit"
                    disabled={!draft.trim() || sending}
                    className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-40"
                    aria-label="Send"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}