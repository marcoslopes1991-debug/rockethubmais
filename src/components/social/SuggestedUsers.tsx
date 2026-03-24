import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useFollows } from "@/hooks/useFollows";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, UserCheck, Users } from "lucide-react";
import UserAvatar from "@/components/UserAvatar";
import { motion } from "framer-motion";

interface SuggestedUser {
  user_id: string;
  display_name: string;
  xp: number;
  avatar_url: string | null;
  gender: string | null;
}

const SuggestedUsers = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { levels } = useLevels();
  const { isFollowing, toggleFollow, followingIds, loading: followLoading } = useFollows();
  const [suggestions, setSuggestions] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchSuggestions = async () => {
      // Get users not followed yet, ordered by recent activity and xp
      const { data } = await supabase
        .from("profiles")
        .select("user_id, display_name, xp, avatar_url, gender")
        .neq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(50);

      if (!data) {
        setLoading(false);
        return;
      }

      // Filter out already followed users
      const notFollowed = (data as SuggestedUser[]).filter(
        (u) => !followingIds.has(u.user_id)
      );

      // Take top 5
      setSuggestions(notFollowed.slice(0, 5));
      setLoading(false);
    };

    fetchSuggestions();
  }, [user, followingIds]);

  if (loading || suggestions.length === 0) return null;

  return (
    <Card className="glass-card">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4 text-primary" />
          <span className="font-display font-bold text-sm">Pessoas para seguir</span>
        </div>
        <div className="space-y-2">
          {suggestions.map((u) => {
            const levelInfo = levels.length > 0 ? getLevelFromList(levels, u.xp) : { name: "..." };
            const following = isFollowing(u.user_id);

            return (
              <motion.div
                key={u.user_id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <button onClick={() => navigate(`/user/${u.user_id}`)}>
                  <UserAvatar
                    avatarUrl={u.avatar_url}
                    gender={u.gender}
                    displayName={u.display_name}
                    size="sm"
                  />
                </button>
                <button
                  className="flex-1 min-w-0 text-left"
                  onClick={() => navigate(`/user/${u.user_id}`)}
                >
                  <p className="font-medium truncate text-sm">{u.display_name}</p>
                  <p className="text-xs text-muted-foreground">{levelInfo.name}</p>
                </button>
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
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SuggestedUsers;
