import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppBranding {
  appName: string;
  logoUrl: string | null;
  loading: boolean;
}

export function useAppBranding(): AppBranding {
  const [appName, setAppName] = useState("QuizLearn");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ai_config")
      .select("app_name, logo_url")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          setAppName((data as any).app_name || "QuizLearn");
          setLogoUrl(data.logo_url);
        }
        setLoading(false);
      });
  }, []);

  return { appName, logoUrl, loading };
}
