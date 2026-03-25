import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, Check, X } from "lucide-react";
import { toast } from "sonner";

interface ProfileBioProps {
  bio: string;
  editable?: boolean;
  onUpdate?: (newBio: string) => void;
}

const ProfileBio = ({ bio, editable = false, onUpdate }: ProfileBioProps) => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(bio);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const trimmed = draft.trim().slice(0, 150);
    const { error } = await supabase
      .from("profiles")
      .update({ bio: trimmed } as any)
      .eq("user_id", user.id);

    if (error) {
      toast.error("Erro ao salvar bio");
    } else {
      onUpdate?.(trimmed);
      setEditing(false);
      toast.success("Bio atualizada!");
    }
    setSaving(false);
  };

  if (editing && editable) {
    return (
      <div className="w-full space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={150}
          rows={2}
          placeholder="Escreva sua bio..."
          className="text-sm resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{draft.length}/150</span>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setDraft(bio); setEditing(false); }} disabled={saving}>
              <X className="h-3 w-3 mr-1" /> Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Check className="h-3 w-3 mr-1" /> Salvar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full text-center">
      {bio ? (
        <p className="text-sm text-muted-foreground">{bio}</p>
      ) : editable ? (
        <p className="text-sm text-muted-foreground/50 italic">Adicione uma bio...</p>
      ) : null}
      {editable && (
        <button
          onClick={() => { setDraft(bio); setEditing(true); }}
          className="text-xs text-primary hover:underline mt-1 inline-flex items-center gap-1"
        >
          <Pencil className="h-3 w-3" /> Editar bio
        </button>
      )}
    </div>
  );
};

export default ProfileBio;
