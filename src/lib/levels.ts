import avatarLevel0 from "@/assets/avatar-level-0.png";
import avatarLevel1 from "@/assets/avatar-level-1.png";
import avatarLevel2 from "@/assets/avatar-level-2.png";
import avatarLevel3 from "@/assets/avatar-level-3.png";
import avatarLevel4 from "@/assets/avatar-level-4.png";

export interface LevelInfo {
  level: number;
  name: string;
  minXp: number;
  maxXp: number;
  avatar: string;
}

// Fallback static levels — used for avatar mapping and as defaults when DB is unavailable
export const LEVELS: LevelInfo[] = [
  { level: 0, name: "Usuário", minXp: 0, maxXp: 49, avatar: avatarLevel0 },
  { level: 1, name: "Key User em Evolução", minXp: 50, maxXp: 119, avatar: avatarLevel1 },
  { level: 2, name: "Consultor Júnior", minXp: 120, maxXp: 349, avatar: avatarLevel2 },
  { level: 3, name: "Consultor Pleno", minXp: 350, maxXp: 949, avatar: avatarLevel3 },
  { level: 4, name: "Consultor Sênior", minXp: 950, maxXp: Infinity, avatar: avatarLevel4 },
];

export function getLevelInfo(xp: number): LevelInfo {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXp) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getLevelProgress(xp: number): number {
  const current = getLevelInfo(xp);
  if (current.maxXp === Infinity) return 100;
  const range = current.maxXp - current.minXp + 1;
  const progress = xp - current.minXp;
  return Math.min(Math.round((progress / range) * 100), 100);
}

export function getNextLevel(xp: number): LevelInfo | null {
  const current = getLevelInfo(xp);
  const next = LEVELS.find((l) => l.level === current.level + 1);
  return next ?? null;
}

// Map DB level_number to avatar image
export function getAvatarForLevel(levelNumber: number): string {
  if (levelNumber <= 1) return avatarLevel0;
  if (levelNumber <= 3) return avatarLevel1;
  if (levelNumber <= 7) return avatarLevel2;
  if (levelNumber <= 10) return avatarLevel3;
  return avatarLevel4;
}
