import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, Phone, AtSign, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AppHeader } from "@/components/app/AppHeader";

interface PublicProfile {
  id: string;
  name: string;
  bio: string | null;
  avatar_path: string | null;
  course: string | null;
  year_level: string | null;
  phone: string | null;
  social: string | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user, role } = useAuth();
  const navigate = useNavigate();
  const [p, setP] = useState<PublicProfile | null>(null);
  const [meName, setMeName] = useState("");
  const [meAvatar, setMeAvatar] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    (async () => {
      const [{ data }, me] = await Promise.all([
        supabase
          .from("profiles")
          .select("id,name,bio,avatar_path,course,year_level,phone,social")
          .eq("id", userId)
          .maybeSingle(),
        user
          ? supabase.from("profiles").select("name,avatar_path").eq("id", user.id).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      setP(data as PublicProfile);
      if (me?.data) {
        setMeName((me.data as any).name || "");
        const ap = (me.data as any).avatar_path;
        if (ap) setMeAvatar(supabase.storage.from("avatars").getPublicUrl(ap).data.publicUrl);
      }
      setLoading(false);
    })();
  }, [userId, user]);

  const avatarUrl = p?.avatar_path
    ? supabase.storage.from("avatars").getPublicUrl(p.avatar_path).data.publicUrl
    : null;

  const initials = (p?.name || "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const isMe = user?.id === userId;

  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader isAdmin={role === "admin"} displayName={meName} avatarUrl={meAvatar} />
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1.5 mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !p ? (
          <div className="text-center py-20 bg-card rounded-xl border border-border">
            <p className="text-muted-foreground">User not found.</p>
          </div>
        ) : (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-card">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={p.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-border"
                />
              ) : (
                <div className="w-24 h-24 rounded-full flex items-center justify-center font-bold text-2xl text-white gradient-blue">
                  {initials}
                </div>
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold">{p.name}</h1>
                {(p.course || p.year_level) && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <GraduationCap className="w-4 h-4" />
                    {[p.course, p.year_level].filter(Boolean).join(" • ")}
                  </p>
                )}
              </div>
              {!isMe && (
                <Link
                  to={`/messages?to=${p.id}`}
                  className="gradient-blue text-white px-4 py-2.5 rounded-lg shadow-blue font-semibold text-sm flex items-center gap-2 hover:opacity-90"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message
                </Link>
              )}
            </div>

            {p.bio && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                  About
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap">{p.bio}</p>
              </div>
            )}

            {(p.phone || p.social) && (
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {p.phone && (
                  <div className="flex items-center gap-2 text-sm p-3 rounded-lg border border-border bg-muted/30">
                    <Phone className="w-4 h-4 text-primary" />
                    <span>{p.phone}</span>
                  </div>
                )}
                {p.social && (
                  <div className="flex items-center gap-2 text-sm p-3 rounded-lg border border-border bg-muted/30">
                    <AtSign className="w-4 h-4 text-primary" />
                    <span>{p.social}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
