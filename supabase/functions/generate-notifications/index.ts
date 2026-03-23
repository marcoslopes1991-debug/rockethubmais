import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const notifications: { user_id: string; type: string; title: string; message: string }[] = [];

    // 1. Check for new special missions available
    const { data: specialMissions } = await supabase
      .from("questions")
      .select("id")
      .eq("mission_type", "special")
      .lte("available_from", now.toISOString())
      .gte("available_until", now.toISOString());

    if (specialMissions && specialMissions.length > 0) {
      // Get all users with notifications enabled
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("notifications_enabled", true);

      if (profiles) {
        // Check which users already got notified today about special missions
        const { data: existingNotifs } = await supabase
          .from("notifications")
          .select("user_id")
          .eq("type", "special_mission")
          .gte("created_at", `${today}T00:00:00Z`);

        const notifiedUsers = new Set(existingNotifs?.map((n: any) => n.user_id) ?? []);

        for (const profile of profiles) {
          if (!notifiedUsers.has(profile.user_id)) {
            notifications.push({
              user_id: profile.user_id,
              type: "special_mission",
              title: "Nova missão especial! ⭐",
              message: "Uma missão especial está disponível com XP bônus! Não perca essa chance de evoluir 🚀",
            });
          }
        }
      }
    }

    // 2. Check streak warnings (users who were active yesterday but not today)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: atRiskProfiles } = await supabase
      .from("profiles")
      .select("user_id, streak_count, display_name")
      .eq("last_activity_date", yesterdayStr)
      .gt("streak_count", 0)
      .eq("notifications_enabled", true);

    if (atRiskProfiles) {
      const { data: existingStreakNotifs } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("type", "streak_warning")
        .gte("created_at", `${today}T00:00:00Z`);

      const streakNotified = new Set(existingStreakNotifs?.map((n: any) => n.user_id) ?? []);

      for (const profile of atRiskProfiles) {
        if (!streakNotified.has(profile.user_id)) {
          notifications.push({
            user_id: profile.user_id,
            type: "streak_warning",
            title: "Seu streak está em risco! 🔥",
            message: `Você tem ${profile.streak_count} dias de streak! Complete uma missão hoje para não perder sua sequência 💪`,
          });
        }
      }
    }

    // 3. Check inactive users (no activity for 3+ days)
    const threeDaysAgo = new Date(now);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threeDaysAgoStr = threeDaysAgo.toISOString().split("T")[0];

    const { data: inactiveProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .lt("last_activity_date", threeDaysAgoStr)
      .eq("notifications_enabled", true);

    if (inactiveProfiles) {
      const { data: existingInactiveNotifs } = await supabase
        .from("notifications")
        .select("user_id")
        .eq("type", "inactivity")
        .gte("created_at", `${today}T00:00:00Z`);

      const inactiveNotified = new Set(existingInactiveNotifs?.map((n: any) => n.user_id) ?? []);

      for (const profile of inactiveProfiles) {
        if (!inactiveNotified.has(profile.user_id)) {
          notifications.push({
            user_id: profile.user_id,
            type: "inactivity",
            title: "Sentimos sua falta! 💤",
            message: "Sua jornada de evolução continua te esperando. Volte e conquiste novos níveis! 🎯",
          });
        }
      }
    }

    // Insert all notifications
    if (notifications.length > 0) {
      const { error } = await supabase.from("notifications").insert(notifications);
      if (error) {
        console.error("Error inserting notifications:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        generated: notifications.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
