import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePosts } from "@/hooks/usePosts";
import { useAds } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Rss } from "lucide-react";
import { motion } from "framer-motion";
import CreatePostForm from "@/components/feed/CreatePostForm";
import PostCard from "@/components/feed/PostCard";
import SponsoredPost from "@/components/feed/SponsoredPost";

const Feed = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"following" | "explore">("following");
  const { posts, loading, createPost, deletePost, toggleLike, refresh } = usePosts(mode);
  const { ads } = useAds();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // Check premium status
  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("is_premium")
      .eq("user_id", user.id)
      .single()
      .then(({ data }) => {
        if (data) setIsPremium((data as any).is_premium ?? false);
      });
  }, [user]);

  // Build feed items interleaving ads
  const buildFeedItems = () => {
    if (isPremium || ads.length === 0) {
      return posts.map((p) => ({ type: "post" as const, data: p }));
    }

    const items: Array<{ type: "post"; data: typeof posts[0] } | { type: "ad"; data: typeof ads[0] }> = [];
    const frequency = ads[0]?.frequency ?? 5;
    let adIndex = 0;

    posts.forEach((post, i) => {
      items.push({ type: "post", data: post });
      if ((i + 1) % frequency === 0 && ads.length > 0) {
        items.push({ type: "ad", data: ads[adIndex % ads.length] });
        adIndex++;
      }
    });

    return items;
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const feedItems = buildFeedItems();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center gap-3 h-14 px-4 max-w-2xl mx-auto">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <Rss className="h-5 w-5 text-primary" />
            <h1 className="font-display font-bold text-lg">Feed</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6 max-w-2xl mx-auto space-y-4">
        <CreatePostForm onSubmit={createPost} />

        <Tabs value={mode} onValueChange={(v) => setMode(v as any)}>
          <TabsList className="w-full">
            <TabsTrigger value="following" className="flex-1">Seguindo</TabsTrigger>
            <TabsTrigger value="explore" className="flex-1">Explorar</TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-muted-foreground"
          >
            <Rss className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma publicação ainda</p>
            <p className="text-sm mt-1">
              {mode === "following"
                ? "Siga outros usuários para ver as publicações deles aqui"
                : "Seja o primeiro a compartilhar algo!"}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {feedItems.map((item, idx) =>
              item.type === "ad" ? (
                <SponsoredPost key={`ad-${item.data.id}-${idx}`} ad={item.data} />
              ) : (
                <PostCard
                  key={item.data.id}
                  post={item.data}
                  onLike={toggleLike}
                  onDelete={deletePost}
                />
              )
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Feed;
