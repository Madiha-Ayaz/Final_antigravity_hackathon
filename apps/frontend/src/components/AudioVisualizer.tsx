'use client';

import { motion } from 'framer-motion';

interface AudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export function AudioVisualizer({ audioLevel, isActive }: AudioVisualizerProps) {
  const bars = Array.from({ length: 32 }, (_, i) => i);

  return (
    <div className="flex items-end justify-center gap-1.5 h-40 bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm">
      {bars.map((i) => {
        const height = isActive
          ? Math.max(15, (audioLevel / 100) * 100 * (0.4 + Math.random() * 0.6))
          : 15;

        const delay = i * 0.02;

        return (
          <motion.div
            key={i}
            className="w-2 bg-gradient-to-t from-purple-600 via-pink-500 to-cyan-400 rounded-full shadow-lg"
            style={{
              boxShadow: isActive ? '0 0 10px rgba(168, 85, 247, 0.5)' : 'none',
            }}
            animate={{
              height: `${height}%`,
              opacity: isActive ? 1 : 0.3,
            }}
            transition={{
              duration: 0.15,
              ease: 'easeOut',
              delay: delay,
            }}
          />
        );
      })}
    </div>
  );
}
