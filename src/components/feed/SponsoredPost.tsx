import { useEffect, useRef, useState } from "react";
import { ArrowRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { Ad } from "@/hooks/useAds";
import { trackAdImpression, trackAdClick } from "@/hooks/useAds";

interface SponsoredPostProps {
  ad: Ad;
}

const DEFAULT_CTA_LABELS = [
  "Quero saber mais",
  "Ver como funciona",
  "Começar agora",
];

const SponsoredPost = ({ ad }: SponsoredPostProps) => {
  const tracked = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoEnded, setVideoEnded] = useState(false);

  // Use custom CTA text from admin, or fallback to deterministic default
  const ctaLabel = (ad as any).cta_text || DEFAULT_CTA_LABELS[ad.id.charCodeAt(0) % DEFAULT_CTA_LABELS.length];

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackAdImpression(ad.id);
    }
  }, [ad.id]);

  // Force autoplay with IntersectionObserver
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ad.video_url) return;

    const tryPlay = () => {
      video.muted = true;
      video.play().catch((err) => {
        console.warn("Autoplay blocked:", err);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            tryPlay();
          } else {
            video.pause();
          }
        });
      },
      { threshold: 0.3 }
    );

    observer.observe(video);
    tryPlay();

    return () => observer.disconnect();
  }, [ad.video_url]);

  // Listen for video end (don't loop — show CTA overlay instead)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ad.video_url) return;

    const onEnded = () => setVideoEnded(true);
    video.addEventListener("ended", onEnded);
    return () => video.removeEventListener("ended", onEnded);
  }, [ad.video_url]);

  const handleClick = () => {
    trackAdClick(ad.id);
  };

  const handleReplay = () => {
    const video = videoRef.current;
    if (video) {
      setVideoEnded(false);
      video.currentTime = 0;
      video.play().catch(() => {});
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-primary/20 bg-card p-4 space-y-3 relative"
    >
      {/* Sponsored badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-[10px] gap-1 text-primary border-primary/30 bg-primary/5">
          <Megaphone className="h-3 w-3" />
          Patrocinado
        </Badge>
      </div>

      {/* Title */}
      <h3 className="font-bold text-sm">{ad.title}</h3>

      {/* Description */}
      {ad.description && (
        <p className="text-sm text-muted-foreground leading-relaxed">{ad.description}</p>
      )}

      {/* Video with end-of-video CTA overlay */}
      {ad.video_url && (
        <div className="relative rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={ad.video_url}
            autoPlay
            muted
            playsInline
            controls
            preload="auto"
            className="w-full max-h-80 object-contain bg-black/5"
          />

          {/* Overlay CTA when video ends */}
          <AnimatePresence>
            {videoEnded && ad.link_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 z-10"
              >
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15, type: "spring", stiffness: 300 }}
                >
                  <a
                    href={ad.link_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleClick}
                  >
                    <Button size="lg" className="text-base px-8 py-3 gap-2 shadow-lg">
                      {ctaLabel} <ArrowRight className="h-5 w-5" />
                    </Button>
                  </a>
                </motion.div>
                <button
                  onClick={handleReplay}
                  className="text-xs text-white/70 hover:text-white transition-colors underline"
                >
                  Assistir novamente
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Image (only if no video) */}
      {!ad.video_url && ad.image_url && (
        <img
          src={ad.image_url}
          alt={ad.title}
          className="rounded-lg max-h-64 w-full object-cover"
          loading="lazy"
        />
      )}

      {/* CTA button — always visible below media */}
      {ad.link_url && (
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="block"
        >
          <Button className="w-full gap-2 text-sm font-semibold py-3 h-auto">
            {ctaLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        </a>
      )}
    </motion.div>
  );
};

export default SponsoredPost;
