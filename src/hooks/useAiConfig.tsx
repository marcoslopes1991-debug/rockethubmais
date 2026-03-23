import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AiConfig {
  id: string;
  ai_name: string;
  button_image_url: string | null;
}

let cached: AiConfig | null = null;

export function useAiConfig() {
  const [config, setConfig] = useState<AiConfig | null>(cached);
  const [loading, setLoading] = useState(!cached);

  const fetch_ = async () => {
    const { data } = await supabase
      .from("ai_config" as any)
      .select("id, ai_name, button_image_url")
      .limit(1)
      .single();
    if (data) {
      const c = data as unknown as AiConfig;
      cached = c;
      setConfig(c);
    }
    setLoading(false);
  };

  useEffect(() => { fetch_(); }, []);

  return { config, loading, refetch: fetch_ };
}
