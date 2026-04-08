import type { Ad } from "@/hooks/useAds";

const STORAGE_KEY = "ad_rotation_state";

interface RotationState {
  shownIds: string[];
  lastAdId: string | null;
}

function getState(): RotationState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { shownIds: [], lastAdId: null };
}

function setState(state: RotationState) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Fisher-Yates shuffle */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Returns the next ad to display from the active pool,
 * ensuring full rotation before repeating and avoiding
 * back-to-back duplicates on cycle restart.
 */
export function getNextAd(activeAds: Ad[]): Ad | null {
  if (activeAds.length === 0) return null;

  const activeIds = new Set(activeAds.map((a) => a.id));
  const state = getState();

  // Filter shown list to only still-active ads
  let shown = state.shownIds.filter((id) => activeIds.has(id));

  // Find unseen ads in this cycle
  let unseen = activeAds.filter((a) => !shown.includes(a.id));

  // If all seen, reset cycle
  if (unseen.length === 0) {
    shown = [];
    unseen = [...activeAds];
  }

  // Shuffle unseen for variety
  let candidates = shuffle(unseen);

  // Avoid showing the same ad as last time (cycle boundary)
  if (candidates.length > 1 && state.lastAdId && candidates[0].id === state.lastAdId) {
    // Move it to the end
    candidates.push(candidates.shift()!);
  }

  const chosen = candidates[0];

  // Update state
  setState({
    shownIds: [...shown, chosen.id],
    lastAdId: chosen.id,
  });

  return chosen;
}
