import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Lock, Check, Sparkles } from "lucide-react";
import { useLevels, getLevelFromList } from "@/hooks/useLevels";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface Item {
  id: string;
  name: string;
  description: string;
  category: string;
  icon_emoji: string;
  required_xp: number;
  required_level: number;
}

interface UserItem {
  item_id: string;
  equipped: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  roupa: "👔 Roupas",
  acessorio: "💍 Acessórios",
  equipamento: "🛠️ Equipamentos",
};

const Items = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [userItems, setUserItems] = useState<UserItem[]>([]);
  const [xp, setXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const [itemsRes, userItemsRes, profileRes] = await Promise.all([
        supabase.from("items").select("*").order("required_xp"),
        supabase.from("user_items").select("item_id, equipped").eq("user_id", user.id),
        supabase.from("profiles").select("xp").eq("user_id", user.id).single(),
      ]);

      setItems(itemsRes.data ?? []);
      setUserItems(userItemsRes.data ?? []);
      setXp(profileRes.data?.xp ?? 0);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const level = getLevelInfo(xp);

  const isUnlocked = (item: Item) =>
    userItems.some((ui) => ui.item_id === item.id);

  const isEquipped = (item: Item) =>
    userItems.some((ui) => ui.item_id === item.id && ui.equipped);

  const canUnlock = (item: Item) =>
    xp >= item.required_xp && level.level >= item.required_level && !isUnlocked(item);

  const handleUnlock = async (item: Item) => {
    if (!user || !canUnlock(item)) return;

    const { error } = await supabase.from("user_items").insert({
      user_id: user.id,
      item_id: item.id,
      equipped: false,
    });

    if (!error) {
      setUserItems((prev) => [...prev, { item_id: item.id, equipped: false }]);
      toast({ title: `${item.icon_emoji} ${item.name} desbloqueado!` });
    }
  };

  const handleToggleEquip = async (item: Item) => {
    if (!user || !isUnlocked(item)) return;

    const equipped = isEquipped(item);
    
    const { error } = await supabase
      .from("user_items")
      .update({ equipped: !equipped })
      .eq("user_id", user.id)
      .eq("item_id", item.id);

    if (!error) {
      setUserItems((prev) =>
        prev.map((ui) =>
          ui.item_id === item.id ? { ...ui, equipped: !equipped } : ui
        )
      );
    }
  };

  const categories = ["roupa", "acessorio", "equipamento"];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container flex items-center h-14 px-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Button>
        </div>
      </header>

      <main className="container px-4 py-8 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-display font-bold">Inventário</h1>
          <p className="text-sm text-muted-foreground">Desbloqueie e equipe itens com seu XP</p>
        </div>

        {loading ? (
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        ) : (
          categories.map((cat) => {
            const catItems = items.filter((i) => i.category === cat);
            if (catItems.length === 0) return null;

            return (
              <Card key={cat} className="glass-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-display">
                    {CATEGORY_LABELS[cat] ?? cat}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {catItems.map((item) => {
                    const unlocked = isUnlocked(item);
                    const equipped = isEquipped(item);
                    const canGet = canUnlock(item);
                    const locked = !unlocked && !canGet;

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border transition-all",
                          equipped
                            ? "border-primary bg-primary/5"
                            : unlocked
                            ? "border-border bg-card"
                            : locked
                            ? "border-border bg-muted/30 opacity-60"
                            : "border-accent/50 bg-accent/5"
                        )}
                      >
                        <span className="text-2xl">{item.icon_emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                          {!unlocked && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.required_xp} XP · Nível {item.required_level}
                            </p>
                          )}
                        </div>
                        <div>
                          {equipped ? (
                            <Button size="sm" variant="outline" onClick={() => handleToggleEquip(item)}>
                              <Check className="h-3 w-3 mr-1" /> Equipado
                            </Button>
                          ) : unlocked ? (
                            <Button size="sm" variant="secondary" onClick={() => handleToggleEquip(item)}>
                              Equipar
                            </Button>
                          ) : canGet ? (
                            <Button size="sm" onClick={() => handleUnlock(item)}>
                              <Sparkles className="h-3 w-3 mr-1" /> Pegar
                            </Button>
                          ) : (
                            <Lock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })
        )}
      </main>
    </div>
  );
};

export default Items;
