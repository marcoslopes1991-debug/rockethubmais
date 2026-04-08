import type { Ad } from "@/hooks/useAds";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "ad_rotation_state";

interface RotationState {
  shownIds: string[];
  lastAdId: string | null;
  impressionCounts: Record<string, number>; // per-ad impression count for this user
}

function getState(): RotationState {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { shownIds: [], lastAdId: null, impressionCounts: {} };
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

/** Priority weight for sorting: alta=3, normal=2, baixa=1 */
function priorityWeight(p: string): number {
  if (p === "alta") return 3;
  if (p === "baixa") return 1;
  return 2;
}

/** Weighted shuffle: higher priority ads appear earlier */
function weightedShuffle(ads: Ad[]): Ad[] {
  // Group by priority, shuffle within each group, then concat alta -> normal -> baixa
  const alta = shuffle(ads.filter((a) => a.priority === "alta"));
  const normal = shuffle(ads.filter((a) => a.priority !== "alta" && a.priority !== "baixa"));
  const baixa = shuffle(ads.filter((a) => a.priority === "baixa"));
  return [...alta, ...normal, ...baixa];
}

/**
 * Filter ads that are still eligible for this user based on:
 * - per-user impression limit
 * - total impression limit (fetched async, so we pass counts in)
 */
function filterEligible(
  ads: Ad[],
  userImpressions: Record<string, number>,
  totalImpressions: Record<string, number>
): Ad[] {
  return ads.filter((ad) => {
    // Check per-user limit
    if (ad.max_impressions_per_user != null) {
      const userCount = userImpressions[ad.id] ?? 0;
      if (userCount >= ad.max_impressions_per_user) return false;
    }
    // Check total limit
    if (ad.max_impressions_total != null) {
      const totalCount = totalImpressions[ad.id] ?? 0;
      if (totalCount >= ad.max_impressions_total) return false;
    }
    return true;
  });
}

/** Cache for total impression counts (refreshed once per session load) */
let totalImpressionsCache: Record<string, number> | null = null;
let totalImpressionsFetchPromise: Promise<Record<string, number>> | null = null;

async function fetchTotalImpressions(): Promise<Record<string, number>> {
  if (totalImpressionsCache) return totalImpressionsCache;
  if (totalImpressionsFetchPromise) return totalImpressionsFetchPromise;

  totalImpressionsFetchPromise = (async () => {
    const { data } = await supabase
      .from("ad_events")
      .select("ad_id")
      .eq("event_type", "impression");

    const counts: Record<string, number> = {};
    (data ?? []).forEach((e: any) => {
      counts[e.ad_id] = (counts[e.ad_id] ?? 0) + 1;
    });
    totalImpressionsCache = counts;
    return counts;
  })();

  return totalImpressionsFetchPromise;
}

/** Invalidate cache so next call re-fetches */
export function invalidateTotalImpressionsCache() {
  totalImpressionsCache = null;
  totalImpressionsFetchPromise = null;
}

/**
 * Returns the next ad to display from the active pool,
 * ensuring full rotation before repeating, respecting priority,
 * and enforcing impression limits.
 */
export function getNextAd(activeAds: Ad[], totalImpressions: Record<string, number> = {}): Ad | null {
  if (activeAds.length === 0) return null;

  const state = getState();
  const activeIds = new Set(activeAds.map((a) => a.id));

  // Filter by impression limits
  const eligible = filterEligible(activeAds, state.impressionCounts, totalImpressions);
  if (eligible.length === 0) return null;

  // Filter shown list to only still-eligible ads
  const eligibleIds = new Set(eligible.map((a) => a.id));
  let shown = state.shownIds.filter((id) => eligibleIds.has(id));

  // Find unseen ads in this cycle
  let unseen = eligible.filter((a) => !shown.includes(a.id));

  // If all seen, reset cycle
  if (unseen.length === 0) {
    shown = [];
    unseen = [...eligible];
  }

  // Weighted shuffle for priority
  let candidates = weightedShuffle(unseen);

  // Avoid showing the same ad as last time (cycle boundary)
  if (candidates.length > 1 && state.lastAdId && candidates[0].id === state.lastAdId) {
    candidates.push(candidates.shift()!);
  }

  const chosen = candidates[0];

  // Update state with impression count
  const newImpressions = { ...state.impressionCounts };
  newImpressions[chosen.id] = (newImpressions[chosen.id] ?? 0) + 1;

  setState({
    shownIds: [...shown, chosen.id],
    lastAdId: chosen.id,
    impressionCounts: newImpressions,
  });

  return chosen;
}

/**
 * Async version that fetches total impressions before selecting.
 * Use this in the feed to respect global impression limits.
 */
export async function getNextAdAsync(activeAds: Ad[]): Promise<Ad | null> {
  const totals = await fetchTotalImpressions();
  return getNextAd(activeAds, totals);
}
