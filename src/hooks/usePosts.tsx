import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Post {
  id: string;
  user_id: string;
  content: string;
  image_url: string | null;
  file_url: string | null;
  file_name: string | null;
  type: string;
  created_at: string;
  profile?: {
    display_name: string;
    username: string | null;
    avatar_url: string | null;
    xp: number;
  };
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export const usePosts = (mode: "following" | "explore" = "explore") => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingIds, setFollowingIds] = useState<string[]>([]);

  const fetchFollowing = useCallback(async () => {
    if (!user) return [];
    const { data } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", user.id);
    const ids = (data ?? []).map((r: any) => r.following_id);
    setFollowingIds(ids);
    return ids;
  }, [user]);

  const fetchPosts = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (mode === "following") {
      const ids = await fetchFollowing();
      const allIds = [...ids, user.id];
      if (allIds.length > 0) {
        query = query.in("user_id", allIds);
      }
    }

    const { data: postsData } = await query;
    if (!postsData) { setLoading(false); return; }

    // Fetch profiles, likes and comments counts
    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const postIds = postsData.map(p => p.id);

    const [profilesRes, likesRes, commentsRes, myLikesRes] = await Promise.all([
      userIds.length > 0
        ? supabase.from("profiles").select("user_id, display_name, username, avatar_url, xp").in("user_id", userIds)
        : { data: [] },
      postIds.length > 0
        ? supabase.from("post_likes").select("post_id").in("post_id", postIds)
        : { data: [] },
      postIds.length > 0
        ? supabase.from("post_comments").select("post_id").in("post_id", postIds)
        : { data: [] },
      postIds.length > 0
        ? supabase.from("post_likes").select("post_id").eq("user_id", user.id).in("post_id", postIds)
        : { data: [] },
    ]);

    const profileMap = new Map((profilesRes.data ?? []).map((p: any) => [p.user_id, p]));
    const likesCount = new Map<string, number>();
    const commentsCount = new Map<string, number>();
    const myLikes = new Set((myLikesRes.data ?? []).map((l: any) => l.post_id));

    (likesRes.data ?? []).forEach((l: any) => {
      likesCount.set(l.post_id, (likesCount.get(l.post_id) ?? 0) + 1);
    });
    (commentsRes.data ?? []).forEach((c: any) => {
      commentsCount.set(c.post_id, (commentsCount.get(c.post_id) ?? 0) + 1);
    });

    const enriched: Post[] = postsData.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) as any,
      likes_count: likesCount.get(p.id) ?? 0,
      comments_count: commentsCount.get(p.id) ?? 0,
      liked_by_me: myLikes.has(p.id),
    }));

    setPosts(enriched);
    setLoading(false);
  }, [user, mode, fetchFollowing]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      await supabase.from("post_likes").delete().eq("user_id", user.id).eq("post_id", postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: false, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from("post_likes").insert({ user_id: user.id, post_id: postId });
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked_by_me: true, likes_count: p.likes_count + 1 } : p));
    }
  };

  const createPost = async (content: string, imageFile?: File, docFile?: File) => {
    if (!user) return;

    let image_url: string | null = null;
    let file_url: string | null = null;
    let file_name: string | null = null;
    let type = "text";

    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("posts").upload(path, imageFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        image_url = urlData.publicUrl;
        type = "image";
      }
    }

    if (docFile) {
      const path = `${user.id}/${Date.now()}_${docFile.name}`;
      const { error } = await supabase.storage.from("posts").upload(path, docFile);
      if (!error) {
        const { data: urlData } = supabase.storage.from("posts").getPublicUrl(path);
        file_url = urlData.publicUrl;
        file_name = docFile.name;
        type = "document";
      }
    }

    await supabase.from("posts").insert({
      user_id: user.id,
      content,
      image_url,
      file_url,
      file_name,
      type,
    });

    await fetchPosts();
  };

  const deletePost = async (postId: string) => {
    if (!user) return;
    await supabase.from("posts").delete().eq("id", postId).eq("user_id", user.id);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return { posts, loading, createPost, deletePost, toggleLike, refresh: fetchPosts };
};
