import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AppBranding {
  appName: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  loading: boolean;
}

export function useAppBranding(): AppBranding {
  const [appName, setAppName] = useState("QuizLearn");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [faviconUrl, setFaviconUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("ai_config")
      .select("app_name, logo_url, favicon_url")
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) {
          const name = (data as any).app_name || "QuizLearn";
          setAppName(name);
          setLogoUrl(data.logo_url);
          setFaviconUrl((data as any).favicon_url);

          // Dynamic document title
          document.title = name;

          // Dynamic favicon
          const favicon = (data as any).favicon_url;
          if (favicon) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
            if (!link) {
              link = document.createElement("link");
              link.rel = "icon";
              document.head.appendChild(link);
            }
            link.href = favicon;
          }
        }
        setLoading(false);
      });
  }, []);

  return { appName, logoUrl, faviconUrl, loading };
}
