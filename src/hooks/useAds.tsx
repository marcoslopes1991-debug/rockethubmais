import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Ad {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  link_url: string | null;
  start_date: string;
  end_date: string | null;
  frequency: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
