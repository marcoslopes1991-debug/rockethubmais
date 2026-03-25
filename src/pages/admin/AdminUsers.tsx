import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShieldCheck, ShieldOff, Pencil, Zap, RotateCcw, Ban, UserX, Trash2, UserCheck } from "lucide-react";
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
  status: string;
}

type StatusFilter = "all" | "active" | "blocked" | "deactivated";

const AdminUsers = () => {
  const { toast } = useToast();
  const { levels: dbLevels } = useLevels();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editProfile, setEditProfile] = useState<Profile | null>(null);
  const [editXp, setEditXp] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<Profile | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Status change confirmation
  const [statusAction, setStatusAction] = useState<{ profile: Profile; newStatus: string } | null>(null);

  const fetchProfiles = async () => {
    let query = supabase
      .from("profiles")
      .select("id, user_id, display_name, xp, streak_count, last_activity_date, blocked, status")
      .order("xp", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }

    const { data } = await query;
    setProfiles((data as Profile[]) ?? []);
  };

  useEffect(() => { fetchProfiles(); }, [statusFilter]);

  const updateStatus = async (profile: Profile, newStatus: string) => {
    const blocked = newStatus === "blocked";
    const { error } = await supabase
      .from("profiles")
      .update({ status: newStatus, blocked } as any)
      .eq("id", profile.id);

    if (!error) {
      const labels: Record<string, string> = {
        active: "ativado",
        blocked: "bloqueado",
        deactivated: "desativado",
      };
      toast({ title: `${profile.display_name} foi ${labels[newStatus]}` });
      fetchProfiles();
    }
    setStatusAction(null);
  };

  const confirmStatusChange = (profile: Profile, newStatus: string) => {
    setStatusAction({ profile, newStatus });
  };

  const handlePermanentDelete = async () => {
    if (!deleteTarget || deleteConfirmText !== "EXCLUIR") return;

    const { error } = await supabase.rpc("admin_delete_user", {
      target_user_id: deleteTarget.user_id,
    });

    if (!error) {
      toast({ title: `${deleteTarget.display_name} foi excluído permanentemente` });
      fetchProfiles();
    } else {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
    setDeleteTarget(null);
    setDeleteConfirmText("");
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

  const statusBadge = (status: string) => {
    switch (status) {
      case "blocked":
        return <Badge variant="destructive">Bloqueado</Badge>;
      case "deactivated":
        return <Badge variant="outline" className="text-muted-foreground border-muted-foreground">Desativado</Badge>;
      default:
        return <Badge variant="secondary">Ativo</Badge>;
    }
  };

  const statusActionLabel: Record<string, string> = {
    active: "Ativar",
    blocked: "Bloquear",
    deactivated: "Desativar",
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display font-bold">Usuários</h1>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="blocked">Bloqueados</SelectItem>
            <SelectItem value="deactivated">Desativados</SelectItem>
          </SelectContent>
        </Select>
      </div>

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
                <TableHead className="w-52">Ações</TableHead>
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
                    <TableCell>{statusBadge(p.status)}</TableCell>
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

                        {/* Status actions */}
                        {p.status === "active" && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => confirmStatusChange(p, "blocked")} title="Bloquear">
                              <Ban className="h-4 w-4 text-destructive" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmStatusChange(p, "deactivated")} title="Desativar">
                              <UserX className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </>
                        )}
                        {p.status === "blocked" && (
                          <Button variant="ghost" size="icon" onClick={() => confirmStatusChange(p, "active")} title="Desbloquear">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                        {p.status === "deactivated" && (
                          <Button variant="ghost" size="icon" onClick={() => confirmStatusChange(p, "active")} title="Reativar">
                            <UserCheck className="h-4 w-4 text-green-500" />
                          </Button>
                        )}

                        <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(p)} title="Excluir permanentemente">
                          <Trash2 className="h-4 w-4 text-destructive" />
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

      {/* Status change confirmation */}
      <AlertDialog open={!!statusAction} onOpenChange={(open) => !open && setStatusAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar ação</AlertDialogTitle>
            <AlertDialogDescription>
              {statusAction?.newStatus === "blocked" &&
                `Tem certeza que deseja bloquear ${statusAction.profile.display_name}? O usuário não conseguirá acessar o sistema.`}
              {statusAction?.newStatus === "deactivated" &&
                `Tem certeza que deseja desativar ${statusAction.profile.display_name}? O usuário perderá acesso e ficará oculto no ambiente social.`}
              {statusAction?.newStatus === "active" &&
                `Deseja reativar ${statusAction?.profile.display_name}? O usuário voltará a ter acesso ao sistema.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => statusAction && updateStatus(statusAction.profile, statusAction.newStatus)}>
              {statusAction ? statusActionLabel[statusAction.newStatus] : ""}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) { setDeleteTarget(null); setDeleteConfirmText(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive">Excluir permanentemente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm">
              Tem certeza que deseja excluir permanentemente <strong>{deleteTarget?.display_name}</strong>?
              Esta ação <strong>não poderá ser desfeita</strong>. Todos os dados do usuário serão removidos.
            </p>
            <div>
              <Label htmlFor="delete-confirm">Digite <strong>EXCLUIR</strong> para confirmar</Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="EXCLUIR"
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}>Cancelar</Button>
            <Button variant="destructive" disabled={deleteConfirmText !== "EXCLUIR"} onClick={handlePermanentDelete}>
              Excluir permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
