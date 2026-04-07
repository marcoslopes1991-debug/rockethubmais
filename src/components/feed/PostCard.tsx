import { useState } from "react";
import { Heart, MessageCircle, FileText, Download, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import AvatarDisplay from "@/components/AvatarDisplay";
import PostComments from "./PostComments";
import type { Post } from "@/hooks/usePosts";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PostCardProps {
  post: Post;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

const PostCard = ({ post, onLike, onDelete }: PostCardProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const isOwner = user?.id === post.user_id;

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: ptBR,
  });

  const handleExportWord = () => {
    // Create a simple HTML blob that Word can open
    const html = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word">
      <head><meta charset="utf-8"><title>Post</title></head>
      <body>
        <h2>${post.profile?.display_name ?? "Usuário"}</h2>
        <p style="color:gray">@${post.profile?.username ?? ""} • ${new Date(post.created_at).toLocaleDateString("pt-BR")}</p>
        <hr/>
        <p>${post.content.replace(/\n/g, "<br/>")}</p>
      </body></html>
    `;
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `post_${post.id.slice(0, 8)}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(`/user/${post.user_id}`)} className="shrink-0">
          <AvatarDisplay xp={post.profile?.xp ?? 0} size="sm" />
        </button>
        <div className="flex-1 min-w-0">
          <button onClick={() => navigate(`/user/${post.user_id}`)} className="hover:underline">
            <span className="font-bold text-sm">{post.profile?.display_name ?? "Usuário"}</span>
          </button>
          {post.profile?.username && (
            <span className="text-xs text-muted-foreground ml-1.5">@{post.profile.username}</span>
          )}
          <p className="text-[11px] text-muted-foreground">{timeAgo}</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportWord}>
              <Download className="h-4 w-4 mr-2" /> Exportar .doc
            </DropdownMenuItem>
            {isOwner && (
              <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" /> Excluir
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Content */}
      {post.content && (
        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{post.content}</p>
      )}

      {/* Image */}
      {post.image_url && (
        <img
          src={post.image_url}
          alt="Post"
          className="rounded-lg max-h-96 w-full object-cover"
          loading="lazy"
        />
      )}

      {/* Document */}
      {post.file_url && post.file_name && (
        <a
          href={post.file_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
        >
          <FileText className="h-5 w-5 text-primary shrink-0" />
          <span className="text-sm font-medium truncate">{post.file_name}</span>
          <Download className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
        </a>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 pt-1 border-t border-border/50">
        <Button
          variant="ghost"
          size="sm"
          className={`h-8 px-2 gap-1.5 ${post.liked_by_me ? "text-red-500" : "text-muted-foreground"}`}
          onClick={() => onLike(post.id)}
        >
          <Heart className={`h-4 w-4 ${post.liked_by_me ? "fill-current" : ""}`} />
          <span className="text-xs">{post.likes_count > 0 ? post.likes_count : ""}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 gap-1.5 text-muted-foreground"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4" />
          <span className="text-xs">{post.comments_count > 0 ? post.comments_count : ""}</span>
        </Button>
      </div>

      {/* Comments */}
      {showComments && <PostComments postId={post.id} />}
    </motion.div>
  );
};

export default PostCard;
