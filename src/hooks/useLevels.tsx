import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DbLevel {
  id: string;
  level_number: number;
  name: string;
  min_xp: number;
  description: string;
  avatar_male_url: string | null;
  avatar_female_url: string | null;
}

let cachedLevels: DbLevel[] | null = null;

export function useLevels() {
  const [levels, setLevels] = useState<DbLevel[]>(cachedLevels ?? []);
  const [loading, setLoading] = useState(!cachedLevels);

  const fetchLevels = async () => {
    const { data } = await supabase
      .from("levels")
      .select("id, level_number, name, min_xp, description, avatar_male_url, avatar_female_url")
      .order("level_number");
    if (data) {
      cachedLevels = data;
      setLevels(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLevels();
  }, []);

  return { levels, loading, refetch: fetchLevels };
}

export function getLevelFromList(levels: DbLevel[], xp: number): DbLevel {
  for (let i = levels.length - 1; i >= 0; i--) {
    if (xp >= levels[i].min_xp) return levels[i];
  }
  return levels[0] ?? { id: "", level_number: 1, name: "Usuário", min_xp: 0, description: "", avatar_male_url: null, avatar_female_url: null };
}

export function getLevelProgressFromList(levels: DbLevel[], xp: number): number {
  const current = getLevelFromList(levels, xp);
  const nextIdx = levels.findIndex((l) => l.level_number === current.level_number + 1);
  if (nextIdx === -1) return 100;
  const next = levels[nextIdx];
  const range = next.min_xp - current.min_xp;
  if (range <= 0) return 100;
  return Math.min(Math.round(((xp - current.min_xp) / range) * 100), 100);
}

export function getNextLevelFromList(levels: DbLevel[], xp: number): DbLevel | null {
  const current = getLevelFromList(levels, xp);
  return levels.find((l) => l.level_number === current.level_number + 1) ?? null;
}
