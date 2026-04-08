import { useEffect, useRef, useCallback } from "react";
import { ExternalLink, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { Ad } from "@/hooks/useAds";
import { trackAdImpression, trackAdClick } from "@/hooks/useAds";

interface SponsoredPostProps {
  ad: Ad;
}

const SponsoredPost = ({ ad }: SponsoredPostProps) => {
  const tracked = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackAdImpression(ad.id);
    }
  }, [ad.id]);

  // Force autoplay with IntersectionObserver + play() promise
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !ad.video_url) return;

    const tryPlay = () => {
      video.muted = true;
      video.play().catch((err) => {
        console.warn("Autoplay blocked, retrying on interaction:", err);
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

    // Also try immediately
    tryPlay();

    return () => {
      observer.disconnect();
    };
  }, [ad.video_url]);

  const handleClick = () => {
    trackAdClick(ad.id);
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

      {/* Video */}
      {ad.video_url && (
        <video
          ref={videoRef}
          src={ad.video_url}
          autoPlay
          muted
          loop
          playsInline
          controls
          preload="auto"
          className="rounded-lg w-full max-h-80 object-contain bg-black/5"
        />
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

      {/* CTA link */}
      {ad.link_url && (
        <a
          href={ad.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
        >
          Saiba mais <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </motion.div>
  );
};

export default SponsoredPost;
