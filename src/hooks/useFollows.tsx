import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { playFollowSound, playUnfollowSound } from "@/lib/sounds";

let channelCounter = 0;

export const useFollows = () => {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState<Set<string>>(new Set());
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [newFollowersCount, setNewFollowersCount] = useState(0);

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

  // Realtime subscription for follower changes
  useEffect(() => {
    if (!user) return;

    const id = ++channelCounter;
    const channelName = `follows-counts-${user.id}-${id}`;

    const channel = supabase.channel(channelName);
    
    channel.on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${user.id}`,
      },
      () => {
        setFollowerCount((prev) => prev + 1);
        setNewFollowersCount((prev) => prev + 1);
      }
    ).on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${user.id}`,
      },
      () => {
        setFollowerCount((prev) => Math.max(0, prev - 1));
      }
    );

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    fetchMyFollowing();
  }, [fetchMyFollowing]);

  const sendFollowNotification = async (targetUserId: string) => {
    if (!user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .single();

    const displayName = profile?.display_name || "Alguém";

    await supabase.from("notifications").insert({
      user_id: targetUserId,
      type: "social",
      title: "Novo seguidor! 👋",
      message: `${displayName} começou a seguir você`,
      action_url: `/user/${user.id}`,
      reference_id: user.id,
    });
  };

  const toggleFollow = async (targetUserId: string) => {
    if (!user || loading) return;
    setLoading(true);
    const isFollowingTarget = followingIds.has(targetUserId);

    if (isFollowingTarget) {
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
      playUnfollowSound();
    } else {
      await supabase
        .from("follows")
        .insert({ follower_id: user.id, following_id: targetUserId });
      setFollowingIds((prev) => new Set(prev).add(targetUserId));
      sendFollowNotification(targetUserId);
      playFollowSound();
    }
    setLoading(false);
  };

  const isFollowing = (userId: string) => followingIds.has(userId);
  const clearNewFollowers = () => setNewFollowersCount(0);

  return {
    isFollowing, toggleFollow, followingIds,
    followerCount, followingCount, fetchCounts, loading,
    newFollowersCount, clearNewFollowers,
  };
};
