import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ShieldCheck, ShieldOff, Pencil, Zap, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";

interface Profile {
  id: string;
  user_id: string;
  display_name: string;
  xp: number;
  streak_count: number;
  last_activity_date: string | null;
  blocked: boolean;
}

const AdminUsers = () => {
  const { toast } = useToast();
  const { levels: dbLevels } = useLevels();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editXp, setEditXp] = useState("");

  const fetchProfiles = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("id, user_id, display_name, xp, streak_count, last_activity_date, blocked")
      .order("xp", { ascending: false });
    setProfiles((data as Profile[]) ?? []);
  };

  useEffect(() => { fetchProfiles(); }, []);

  const toggleBlock = async (profile: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ blocked: !profile.blocked })
      .eq("id", profile.id);

    if (!error) {
      toast({ title: profile.blocked ? "Usuário desbloqueado" : "Usuário bloqueado" });
      fetchProfiles();
    }
  };

  const openEdit = (p: Profile) => {
    setEditProfile(p);
    setEditXp(String(p.xp));
  };

  const saveXp = async () => {
    if (!editProfile) return;
    const newXp = Math.max(0, parseInt(editXp) || 0);
    const { error } = await supabase
      .from("profiles")
      .update({ xp: newXp })
      .eq("id", editProfile.id);

    if (!error) {
      toast({ title: `XP de ${editProfile.display_name} atualizado para ${newXp}` });
      setEditProfile(null);
      fetchProfiles();
    } else {
      toast({ title: "Erro ao atualizar XP", variant: "destructive" });
    }
  };

  const setMaxLevel = async (profile: Profile) => {
    if (dbLevels.length === 0) return;
    const maxXp = dbLevels[dbLevels.length - 1].min_xp + 100;
    const { error } = await supabase
      .from("profiles")
      .update({ xp: maxXp })
      .eq("id", profile.id);

    if (!error) {
      toast({ title: `${profile.display_name} → nível máximo (${maxXp} XP)` });
      fetchProfiles();
    }
  };

  const resetProgress = async (profile: Profile) => {
    const { error } = await supabase
      .from("profiles")
      .update({ xp: 0, streak_count: 0 })
      .eq("id", profile.id);

    if (!error) {
      toast({ title: `Progresso de ${profile.display_name} resetado` });
      fetchProfiles();
    }
  };

  const currentLevelForXp = (xp: number) =>
    dbLevels.length > 0 ? getLevelFromList(dbLevels, xp) : { name: "..." };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-display font-bold">Usuários</h1>

      <Card className="glass-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>XP</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Última Atividade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const level = currentLevelForXp(p.xp);
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.display_name}</TableCell>
                    <TableCell>{level.name}</TableCell>
                    <TableCell>{p.xp}</TableCell>
                    <TableCell>{p.streak_count}🔥</TableCell>
                    <TableCell>{p.last_activity_date ?? "—"}</TableCell>
                    <TableCell>
                      {p.blocked ? (
                        <Badge variant="destructive">Bloqueado</Badge>
                      ) : (
                        <Badge variant="secondary">Ativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title="Editar XP">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setMaxLevel(p)} title="Simular nível máximo">
                          <Zap className="h-4 w-4 text-amber-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => resetProgress(p)} title="Resetar progresso">
                          <RotateCcw className="h-4 w-4 text-destructive" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleBlock(p)}
                          title={p.blocked ? "Desbloquear" : "Bloquear"}
                        >
                          {p.blocked ? (
                            <ShieldCheck className="h-4 w-4 text-success" />
                          ) : (
                            <ShieldOff className="h-4 w-4 text-destructive" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {profiles.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Nenhum usuário encontrado
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit XP Dialog */}
      <Dialog open={!!editProfile} onOpenChange={(open) => !open && setEditProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar XP — {editProfile?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label>Nível atual</Label>
              <p className="text-sm text-muted-foreground">
                {editProfile ? currentLevelForXp(parseInt(editXp) || 0).name : ""}
              </p>
            </div>
            <div>
              <Label htmlFor="xp-input">XP</Label>
              <Input
                id="xp-input"
                type="number"
                min={0}
                value={editXp}
                onChange={(e) => setEditXp(e.target.value)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                O nível é calculado automaticamente com base no XP.
              </p>
            </div>
            {dbLevels.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {dbLevels.map((l) => (
                  <Button
                    key={l.id}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => setEditXp(String(l.min_xp))}
                  >
                    Nv{l.level_number} ({l.min_xp})
                  </Button>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfile(null)}>Cancelar</Button>
            <Button onClick={saveXp}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
