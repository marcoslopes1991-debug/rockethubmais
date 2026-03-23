import officeBgBeginner from "@/assets/office-bg-beginner.jpg";
import officeBgMid from "@/assets/office-bg-mid.jpg";
import officeBgExecutive from "@/assets/office-bg-executive.jpg";
import { motion } from "framer-motion";

const stages = [officeBgBeginner, officeBgMid, officeBgExecutive];

interface OfficeBackgroundProps {
  /** 0 = beginner, 1 = mid, 2 = executive */
  stageIndex: number;
}

const OfficeBackground = ({ stageIndex }: OfficeBackgroundProps) => {
  const img = stages[Math.min(stageIndex, stages.length - 1)];

  return (
    <motion.div
      key={stageIndex}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="pointer-events-none fixed inset-0 z-0"
    >
      <img
        src={img}
        alt=""
        className="w-full h-full object-cover opacity-[0.12] dark:opacity-[0.08] select-none"
        loading="lazy"
        width={1920}
        height={1080}
      />
      {/* Gradient overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background/80" />
    </motion.div>
  );
};

export default OfficeBackground;
