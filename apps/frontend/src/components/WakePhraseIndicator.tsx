'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface WakePhraseIndicatorProps {
  phrase: string;
  confidence: number;
  timestamp: Date;
  onDismiss?: () => void;
}

export function WakePhraseIndicator({
  phrase,
  confidence,
  timestamp,
  onDismiss,
}: WakePhraseIndicatorProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50"
      >
        <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-2xl border-2 border-red-700 min-w-[300px]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="w-3 h-3 bg-white rounded-full"
              />
              <h3 className="font-bold text-lg">Wake Phrase Detected!</h3>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white hover:text-red-200 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <div className="space-y-1 text-sm">
            <p>
              <span className="font-semibold">Phrase:</span> "{phrase}"
            </p>
            <p>
              <span className="font-semibold">Confidence:</span> {(confidence * 100).toFixed(1)}%
            </p>
            <p>
              <span className="font-semibold">Time:</span> {timestamp.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
