import {
  MapPin,
  Calendar,
  User,
  Trash2,
  CheckCircle2,
  Hand,
  MessageSquare,
  Search,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "react-router-dom";

export interface Item {
  id: string;
  user_id: string | null;
  uploaded_by_name: string | null;
  type: "found" | "lost";
  name: string;
  category: string | null;
  location: string | null;
  image_path: string | null;
  date_reported: string | null;
  status: "unclaimed" | "pending" | "claimed" | "returned";
  description: string | null;
  created_at: string;
  uploader_name?: string;
}

const statusStyles: Record<Item["status"], string> = {
  unclaimed: "bg-success/15 text-success border-success/30",
  pending: "bg-warning/15 text-warning border-warning/30",
  claimed: "bg-primary/15 text-primary border-primary/30",
  returned: "bg-muted text-muted-foreground border-border",
};

export const ItemCard = ({
  item,
  currentUserId,
  isAdmin,
  onClaim,
  onDelete,
  onMarkReturned,
}: {
  item: Item;
  currentUserId: string | null;
  isAdmin: boolean;
  onClaim?: (i: Item) => void;
  onDelete?: (i: Item) => void;
  onMarkReturned?: (i: Item) => void;
}) => {
  const navigate = useNavigate();
  const isOwner = currentUserId && item.user_id === currentUserId;
  // Only FOUND items can be claimed. LOST items get "Message Owner" / "I Found This" instead.
  const canClaim =
    !isOwner &&
    item.status === "unclaimed" &&
    !isAdmin &&
    item.type === "found";
  const canHelpFind =
    !isOwner &&
    item.status === "unclaimed" &&
    !isAdmin &&
    item.type === "lost" &&
    !!item.user_id;
  const canDelete = isOwner || isAdmin;
  const canMarkReturned = (isOwner || isAdmin) && item.status !== "returned";

  const imgUrl = item.image_path
    ? supabase.storage.from("item-images").getPublicUrl(item.image_path).data
        .publicUrl
    : null;

  return (
    <article className="bg-card rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-elevated group">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {imgUrl ? (
          <img
            src={imgUrl}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground/40 text-6xl">
            ?
          </div>
        )}
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
              item.type === "found"
                ? "bg-success text-white"
                : "bg-destructive text-white"
            }`}
          >
            {item.type}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${statusStyles[item.status]}`}
          >
            {item.status}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-bold text-foreground text-base mb-1 line-clamp-1">
          {item.name}
        </h3>
        {item.category && (
          <p className="text-xs text-primary font-semibold uppercase tracking-wider mb-2">
            {item.category}
          </p>
        )}
        {item.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {item.description}
          </p>
        )}

        <div className="space-y-1.5 text-xs text-muted-foreground border-t border-border pt-3">
          {item.location && (
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 shrink-0" /> {item.location}
            </div>
          )}
          {item.date_reported && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 shrink-0" /> {item.date_reported}
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 shrink-0" />
            {item.user_id && currentUserId !== item.user_id ? (
              <>
                <Link
                  to={`/u/${item.user_id}`}
                  className="text-primary hover:underline font-medium"
                  title="View profile"
                >
                  {item.uploader_name || item.uploaded_by_name || "Student"}
                </Link>
                <Link
                  to={`/messages?to=${item.user_id}`}
                  className="ml-auto text-primary hover:text-primary/80 inline-flex items-center gap-1"
                  title="Message uploader"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                </Link>
              </>
            ) : (
              <span>
                {item.uploader_name || item.uploaded_by_name || "Admin"}
                {item.user_id && currentUserId === item.user_id ? " (You)" : ""}
              </span>
            )}
          </div>
        </div>

        {(canClaim || canHelpFind || canDelete || canMarkReturned) && (
          <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-2">
            {canClaim && onClaim && (
              <button
                onClick={() => onClaim(item)}
                className="flex-1 min-w-fit gradient-blue text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-blue hover:opacity-90 transition flex items-center justify-center gap-1.5"
              >
                <Hand className="w-3.5 h-3.5" /> Claim
              </button>
            )}
            {canHelpFind && (
              <>
                <button
                  onClick={() => navigate(`/messages?to=${item.user_id}`)}
                  className="flex-1 min-w-fit gradient-blue text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-blue hover:opacity-90 transition flex items-center justify-center gap-1.5"
                >
                  <Search className="w-3.5 h-3.5" /> I Found This
                </button>
                <button
                  onClick={() => navigate(`/messages?to=${item.user_id}`)}
                  className="flex-1 min-w-fit bg-primary/15 text-primary text-xs font-semibold py-2 px-3 rounded-lg border border-primary/30 hover:bg-primary/25 transition flex items-center justify-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" /> Message Owner
                </button>
              </>
            )}
            {canMarkReturned && onMarkReturned && (
              <button
                onClick={() => onMarkReturned(item)}
                className="flex-1 min-w-fit bg-success/20 text-success text-xs font-semibold py-2 px-3 rounded-lg border border-success/30 hover:bg-success/30 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Returned
              </button>
            )}
            {canDelete && onDelete && (
              <button
                onClick={() => onDelete(item)}
                className="bg-destructive/15 text-destructive text-xs font-semibold py-2 px-3 rounded-lg border border-destructive/30 hover:bg-destructive/25 transition flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
};
