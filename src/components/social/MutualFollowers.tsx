import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface MutualFollowersProps {
  targetUserId: string;
}

const MutualFollowers = ({ targetUserId }: MutualFollowersProps) => {
  const { user } = useAuth();
  const [mutualNames, setMutualNames] = useState<string[]>([]);
  const [mutualCount, setMutualCount] = useState(0);

  useEffect(() => {
    if (!user || user.id === targetUserId) return;

    const fetchMutual = async () => {
      // Get who I follow
      const { data: myFollowing } = await supabase
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      // Get who follows the target
      const { data: targetFollowers } = await supabase
        .from("follows")
        .select("follower_id")
        .eq("following_id", targetUserId);

      if (!myFollowing || !targetFollowers) return;

      const myFollowingSet = new Set(myFollowing.map((f) => f.following_id));
      const mutualIds = targetFollowers
        .map((f) => f.follower_id)
        .filter((id) => myFollowingSet.has(id) && id !== user.id);

      setMutualCount(mutualIds.length);

      if (mutualIds.length === 0) return;

      const displayIds = mutualIds.slice(0, 2);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("display_name")
        .in("user_id", displayIds);

      setMutualNames((profiles ?? []).map((p) => p.display_name));
    };

    fetchMutual();
  }, [user, targetUserId]);

  if (mutualCount === 0 || !user || user.id === targetUserId) return null;

  const remaining = mutualCount - mutualNames.length;
  let text = "";
  if (mutualNames.length === 1 && remaining === 0) {
    text = `Seguido por ${mutualNames[0]}`;
  } else if (mutualNames.length === 2 && remaining === 0) {
    text = `Seguido por ${mutualNames[0]} e ${mutualNames[1]}`;
  } else if (remaining > 0) {
    text = `Seguido por ${mutualNames.join(", ")} e mais ${remaining}`;
  }

  return (
    <p className="text-xs text-muted-foreground mt-1">{text}</p>
  );
};

export default MutualFollowers;
