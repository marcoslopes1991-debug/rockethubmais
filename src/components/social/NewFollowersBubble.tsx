import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import FollowListDialog from "@/components/social/FollowListDialog";
import confetti from "canvas-confetti";

const LAST_SEEN_FOLLOWERS_KEY = "last_seen_followers_at";

export default function NewFollowersBubble() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  // Fire confetti from button position
  const fireConfetti = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({ particleCount: 40, spread: 60, origin: { x, y }, colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#A78BFA"], startVelocity: 20, gravity: 0.8, scalar: 0.8 });
  };

  // Load unseen followers on mount
  useEffect(() => {
    if (!user) return;

    const loadUnseen = async () => {
      const lastSeen = localStorage.getItem(LAST_SEEN_FOLLOWERS_KEY) || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count: newCount } = await supabase
        .from("follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", user.id)
        .gte("created_at", lastSeen);

      if (newCount && newCount > 0) {
        setCount(newCount);
      }
    };

    loadUnseen();

    // Realtime: increment on new follower
    const channel = supabase
      .channel('new-followers-bubble')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${user.id}`,
        },
        () => setCount((prev) => prev + 1)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  if (!user || count === 0) return null;

  const label = count === 1
    ? "+1 novo seguidor"
    : `+${count} novos seguidores`;

  const handleClick = () => {
    setDialogOpen(true);
    setCount(0);
    localStorage.setItem(LAST_SEEN_FOLLOWERS_KEY, new Date().toISOString());
  };

  return (
    <>
      <div className="fixed bottom-24 right-6 z-50">
        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ scale: 1.08 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            onClick={handleClick}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground shadow-xl text-sm font-bold"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            >
              <UserPlus className="h-4 w-4" />
            </motion.div>
            {label}
          </motion.button>
        </AnimatePresence>
      </div>

      <FollowListDialog
        userId={user.id}
        type="followers"
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
}
