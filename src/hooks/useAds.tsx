import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  video_url: string | null;
  link_url: string | null;
  start_date: string;
  end_date: string | null;
  frequency: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdMetrics {
  ad_id: string;
  title: string;
  impressions: number;
  clicks: number;
  ctr: number;
}

export const useAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const now = new Date().toISOString();
    const { data } = await supabase
      .from("ads")
      .select("*")
      .eq("is_active", true)
      .lte("start_date", now)
      .order("created_at", { ascending: false });

    // Filter out expired ads client-side (end_date can be null = no expiry)
    const active = (data ?? []).filter(
      (ad: any) => !ad.end_date || new Date(ad.end_date) >= new Date()
    );
    setAds(active);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  return { ads, loading, refresh: fetchAds };
};

// Track ad impression (deduplicated per session)
const trackedImpressions = new Set<string>();

export const trackAdImpression = async (adId: string) => {
  if (trackedImpressions.has(adId)) return;
  trackedImpressions.add(adId);

  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("ad_events").insert({
    ad_id: adId,
    user_id: user?.id ?? null,
    event_type: "impression",
  });
};

export const trackAdClick = async (adId: string) => {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from("ad_events").insert({
    ad_id: adId,
    user_id: user?.id ?? null,
    event_type: "click",
  });
};

export const useAdminAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("ads")
      .select("*")
      .order("created_at", { ascending: false });
    setAds((data as Ad[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const createAd = async (ad: Omit<Ad, "id" | "created_at" | "updated_at">) => {
    const { error } = await supabase.from("ads").insert(ad);
    if (!error) await fetchAds();
    return error;
  };

  const updateAd = async (id: string, updates: Partial<Ad>) => {
    const { error } = await supabase.from("ads").update(updates).eq("id", id);
    if (!error) await fetchAds();
    return error;
  };

  const deleteAd = async (id: string) => {
    const { error } = await supabase.from("ads").delete().eq("id", id);
    if (!error) await fetchAds();
    return error;
  };

  return { ads, loading, createAd, updateAd, deleteAd, refresh: fetchAds };
};

export const useAdMetrics = () => {
  const [metrics, setMetrics] = useState<AdMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);

    // Fetch ads
    const { data: ads } = await supabase
      .from("ads")
      .select("id, title")
      .order("created_at", { ascending: false });

    // Fetch events
    const { data: events } = await supabase
      .from("ad_events")
      .select("ad_id, event_type");

    if (ads && events) {
      const metricsMap = new Map<string, { impressions: number; clicks: number }>();
      
      for (const ad of ads) {
        metricsMap.set(ad.id, { impressions: 0, clicks: 0 });
      }

      for (const event of events) {
        const current = metricsMap.get(event.ad_id);
        if (current) {
          if (event.event_type === "impression") current.impressions++;
          else if (event.event_type === "click") current.clicks++;
        }
      }

      const result: AdMetrics[] = (ads ?? []).map((ad) => {
        const m = metricsMap.get(ad.id) ?? { impressions: 0, clicks: 0 };
        return {
          ad_id: ad.id,
          title: ad.title,
          impressions: m.impressions,
          clicks: m.clicks,
          ctr: m.impressions > 0 ? (m.clicks / m.impressions) * 100 : 0,
        };
      });

      setMetrics(result);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { metrics, loading, refresh: fetchMetrics };
};
