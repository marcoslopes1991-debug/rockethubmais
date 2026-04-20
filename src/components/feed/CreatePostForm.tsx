import { useState, useRef, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImagePlus, FileText, X, Send, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useAdmin } from "@/hooks/useAdmin";
import { containsLink, LINK_NOT_ALLOWED_MESSAGE } from "@/lib/linkDetection";

interface CreatePostFormProps {
  onSubmit: (content: string, imageFile?: File, docFile?: File) => Promise<void>;
}

const CreatePostForm = ({ onSubmit }: CreatePostFormProps) => {
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { isAdmin } = useAdmin();

  const hasLink = useMemo(() => !isAdmin && containsLink(content), [content, isAdmin]);

  const handleImageSelect = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setImagePreview(e.target?.result as string);
    reader.readAsDataURL(file);
    setDocFile(null);
  };

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) handleImageSelect(file);
        break;
      }
    }
  }, []);

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed && !imageFile && !docFile) return;
    if (trimmed.length > 1000) {
      toast.error("Texto muito longo (máx 1000 caracteres)");
      return;
    }
    if (!isAdmin && containsLink(trimmed)) {
      toast.error(LINK_NOT_ALLOWED_MESSAGE);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(trimmed, imageFile ?? undefined, docFile ?? undefined);
      setContent("");
      setImageFile(null);
      setImagePreview(null);
      setDocFile(null);
      toast.success("Publicação criada!");
    } catch {
      toast.error("Erro ao publicar");
    }
    setSubmitting(false);
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <Textarea
        ref={textareaRef}
        placeholder="Compartilhe algo com a comunidade..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onPaste={handlePaste}
        className="min-h-[80px] resize-none border-0 bg-transparent p-0 focus-visible:ring-0 text-sm"
        maxLength={1000}
      />

      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="relative"
          >
            <img src={imagePreview} alt="Preview" className="rounded-lg max-h-48 object-cover" />
            <Button
              variant="destructive"
              size="icon"
              className="absolute top-1 right-1 h-6 w-6"
              onClick={() => { setImageFile(null); setImagePreview(null); }}
            >
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
        {docFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted"
          >
            <FileText className="h-4 w-4 text-primary" />
            <span className="text-xs truncate flex-1">{docFile.name}</span>
            <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setDocFile(null)}>
              <X className="h-3 w-3" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {hasLink && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-xs"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{LINK_NOT_ALLOWED_MESSAGE}</span>
          </motion.div>
        )}

      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <div className="flex gap-1">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImageSelect(f);
              e.target.value = "";
            }}
          />
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={() => imageInputRef.current?.click()}>
            <ImagePlus className="h-4 w-4 mr-1" /> Imagem
          </Button>
          <input
            ref={docInputRef}
            type="file"
            accept=".docx,.doc"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) { setDocFile(f); setImageFile(null); setImagePreview(null); }
              e.target.value = "";
            }}
          />
          <Button variant="ghost" size="sm" className="h-8 px-2 text-muted-foreground" onClick={() => docInputRef.current?.click()}>
            <FileText className="h-4 w-4 mr-1" /> Word
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground">{content.length}/1000</span>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || hasLink || (!content.trim() && !imageFile && !docFile)}
            className="h-8"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
            Publicar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreatePostForm;
