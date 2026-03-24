import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const useFollows = () => {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchMyFollowing = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    setFollowingIds(new Set((data ?? []).map((r: any) => r.following_id)));
  }, [user]);

  const fetchCounts = useCallback(async (userId: string) => {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("following_id", userId),
      supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", userId),
    ]);
    setFollowerCount(followers ?? 0);
    setFollowingCount(following ?? 0);
  }, []);

  useEffect(() => {
    fetchMyFollowing();
  }, [fetchMyFollowing]);

  const toggleFollow = async (targetUserId: string) => {
    if (!user || loading) return;
    setLoading(true);
    const isFollowing = followingIds.has(targetUserId);

    if (isFollowing) {
      await supabase
        .from("follows")
        .delete()
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId);
      setFollowingIds((prev) => {
        const next = new Set(prev);
        next.delete(targetUserId);
        return next;
      });
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      setFollowingIds((prev) => new Set(prev).add(targetUserId));
    }
    setLoading(false);
  };

  const isFollowing = (userId: string) => followingIds.has(userId);

  return { isFollowing, toggleFollow, followingIds, followerCount, followingCount, fetchCounts, loading };
};
