import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus } from "lucide-react";
import { useFollows } from "@/hooks/useFollows";
import FollowListDialog from "@/components/social/FollowListDialog";
import { useAuth } from "@/hooks/useAuth";

export default function NewFollowersBubble() {
  const { user } = useAuth();
  const { newFollowersCount, clearNewFollowers } = useFollows();
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!user || newFollowersCount === 0) return null;

  const label = newFollowersCount === 1
    ? "+1 novo seguidor"
    : `+${newFollowersCount} novos seguidores`;

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
            onClick={() => {
              setDialogOpen(true);
              clearNewFollowers();
            }}
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

      {user && (
        <FollowListDialog
          userId={user.id}
          type="followers"
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}
