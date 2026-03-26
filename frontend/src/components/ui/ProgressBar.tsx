/**
 * ProgressBar.tsx
 *
 * Animated indeterminate progress bar used during polling/processing.
 */

import { motion } from "framer-motion";

type ProgressBarProps = {
  label?: string;
};

function ProgressBar({ label = "Analysing media" }: ProgressBarProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm text-slate-300">{label}</p>
      <div className="h-2 overflow-hidden rounded-full bg-slate-800">
        <motion.div
          className="h-full w-1/3 rounded-full bg-cyan-400"
          animate={{ x: ["-120%", "350%"] }}
          transition={{ duration: 1.2, ease: "linear", repeat: Infinity }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
