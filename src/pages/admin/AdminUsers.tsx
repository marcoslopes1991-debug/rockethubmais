import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, ShieldOff } from "lucide-react";
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
  const [profiles, setProfiles] = useState<Profile[]>([]);

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
                <TableHead className="w-24">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => {
                const level = dbLevels.length > 0 ? getLevelFromList(dbLevels, p.xp) : { name: "..." };
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
    </div>
  );
};

export default AdminUsers;
