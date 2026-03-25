import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, UserCheck } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";

interface UserSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SearchResult {
  user_id: string;
  display_name: string;
  xp: number;
  avatar_url: string | null;
  gender: string | null;
  username: string | null;
}

const UserSearchDialog = ({ open, onOpenChange }: UserSearchDialogProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { isFollowing, toggleFollow, loading: followLoading } = useFollows();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }, [open]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }

      const timeout = setTimeout(async () => {
        setSearching(true);
        const trimmed = query.trim();
        const isUsernameSearch = trimmed.startsWith("@");
        const searchTerm = isUsernameSearch ? trimmed.slice(1) : trimmed;

        let queryBuilder = supabase
          .from("profiles")
          .select("user_id, display_name, xp, avatar_url, gender, username")
          .eq("status", "active");

        if (isUsernameSearch) {
          queryBuilder = queryBuilder.ilike("username", `%${searchTerm}%`);
        } else {
          queryBuilder = queryBuilder.or(`display_name.ilike.%${searchTerm}%,username.ilike.%${searchTerm}%`);
        }

        const { data } = await queryBuilder.limit(20);
        setResults((data as any) ?? []);
        setSearching(false);
      }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh]">
        <DialogHeader>
          <DialogTitle className="font-display">Buscar Usuários</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou @usuario..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            autoFocus
          />
        </div>
        <div className="overflow-y-auto space-y-2 pr-1 max-h-[50vh]">
          {searching ? (
            <p className="text-center text-muted-foreground py-8">Buscando...</p>
          ) : query.trim().length >= 2 && results.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum usuário encontrado.</p>
          ) : (
            results.map((u) => {
              const levelInfo = levels.length > 0 ? getLevelFromList(levels, u.xp) : { name: "..." };
              const isSelf = u.user_id === user?.id;
              const following = isFollowing(u.user_id);

              return (
                <div key={u.user_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <button onClick={() => { onOpenChange(false); navigate(isSelf ? "/profile" : `/user/${u.user_id}`); }}>
                    <UserAvatar
                      avatarUrl={u.avatar_url}
                      gender={u.gender}
                      displayName={u.display_name}
                      size="sm"
                    />
                  </button>
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => { onOpenChange(false); navigate(isSelf ? "/profile" : `/user/${u.user_id}`); }}
                  >
                    <p className="font-medium truncate text-sm">
                      {u.display_name}
                      {isSelf && <span className="text-xs text-primary ml-1">(você)</span>}
                    </p>
                    {u.username && (
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    )}
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

export default UserSearchDialog;
