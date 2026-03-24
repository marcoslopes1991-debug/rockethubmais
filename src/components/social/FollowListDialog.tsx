import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface FollowListDialogProps {
  userId: string;
  type: "followers" | "following";
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserItem {
  user_id: string;
  display_name: string;
  xp: number;
  avatar_url: string | null;
  gender: string | null;
}

const FollowListDialog = ({ userId, type, open, onOpenChange }: FollowListDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    setLoading(true);

    const fetchList = async () => {
      // Get follow relationships
      const column = type === "followers" ? "following_id" : "follower_id";
      const selectColumn = type === "followers" ? "follower_id" : "following_id";

      const { data: follows } = await supabase
        .from("follows")
        .select(selectColumn)
        .eq(column, userId);

      if (!follows || follows.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const ids = follows.map((f: any) => f[selectColumn]);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp, avatar_url, gender")
        .in("user_id", ids);

      setUsers((profiles as any) ?? []);
      setLoading(false);
    };

    fetchList();
  }, [open, userId, type]);

  const title = type === "followers" ? "Seguidores" : "Seguindo";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto space-y-2 pr-1">
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : users.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
          ) : (
            users.map((u) => {
              const levelInfo = levels.length > 0 ? getLevelFromList(levels, u.xp) : { name: "..." };
              const isSelf = u.user_id === user?.id;
              const following = isFollowing(u.user_id);

              return (
                <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <button onClick={() => { onOpenChange(false); navigate(`/user/${u.user_id}`); }}>
                    <UserAvatar
                      avatarUrl={u.avatar_url}
                      gender={u.gender}
                      displayName={u.display_name}
                      size="sm"
                    />
                  </button>
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => { onOpenChange(false); navigate(`/user/${u.user_id}`); }}
                  >
                    <p className="font-medium truncate text-sm">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">{levelInfo.name}</p>
                  </button>
                  {!isSelf && user && (
                    <Button
                      variant={following ? "secondary" : "default"}
                      size="sm"
                      className="h-8 px-3 text-xs shrink-0"
                      disabled={followLoading}
                      onClick={() => toggleFollow(u.user_id)}
                    >
                      {following ? (
                        <><UserCheck className="h-3 w-3 mr-1" /> Seguindo</>
                      ) : (
                        <><UserPlus className="h-3 w-3 mr-1" /> Seguir</>
                      )}
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowListDialog;
