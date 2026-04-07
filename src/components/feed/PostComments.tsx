import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profile?: { display_name: string; username: string | null };
}

const PostComments = ({ postId }: { postId: string }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, username")
          .in("user_id", userIds);
        const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
        setComments(data.map(c => ({ ...c, profile: profileMap.get(c.user_id) as any })));
      } else {
        setComments([]);
      }
      setLoading(false);
    };
    fetchComments();
  }, [postId]);

  const handleSubmit = async () => {
    const trimmed = newComment.trim();
    if (!trimmed || !user || submitting) return;
    if (trimmed.length > 500) return;
    setSubmitting(true);

    const { data } = await supabase
      .from("post_comments")
      .insert({ user_id: user.id, post_id: postId, content: trimmed })
      .select()
      .single();

    if (data) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id, display_name, username")
        .eq("user_id", user.id)
        .single();
      setComments(prev => [...prev, { ...data, profile: profile as any }]);
    }
    setNewComment("");
    setSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    await supabase.from("post_comments").delete().eq("id", commentId);
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  return (
    <div className="space-y-2 pt-2 border-t border-border/50">
      {loading ? (
        <div className="flex justify-center py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <AnimatePresence>
          {comments.map(comment => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-2 group"
            >
              <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{comment.profile?.display_name ?? "Usuário"}</span>
                  {comment.profile?.username && (
                    <span className="text-[10px] text-muted-foreground">@{comment.profile.username}</span>
                  )}
                  <span className="text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
                <p className="text-xs mt-0.5">{comment.content}</p>
              </div>
              {user?.id === comment.user_id && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  onClick={() => handleDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Escreva um comentário..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmit()}
          className="h-8 text-xs"
          maxLength={500}
        />
        <Button
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={handleSubmit}
          disabled={!newComment.trim() || submitting}
        >
          {submitting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        </Button>
      </div>
    </div>
  );
};

export default PostComments;
