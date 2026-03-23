import officeStage1 from "@/assets/office-stage-1.png";
import officeStage2 from "@/assets/office-stage-2.png";
import officeStage3 from "@/assets/office-stage-3.png";
import { motion } from "framer-motion";

const stages = [officeStage1, officeStage2, officeStage3];

interface OfficeBackgroundProps {
  /** 0 = beginner, 1 = mid, 2 = executive */
  stageIndex: number;
}

const OfficeBackground = ({ stageIndex }: OfficeBackgroundProps) => {
  const img = stages[Math.min(stageIndex, stages.length - 1)];

  return (
    <motion.div
      key={stageIndex}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <img
        src={img}
        alt=""
        className="w-[280px] sm:w-[360px] opacity-[0.07] dark:opacity-[0.05] select-none"
        loading="lazy"
        width={512}
        height={512}
      />
    </motion.div>
  );
};

export default OfficeBackground;
