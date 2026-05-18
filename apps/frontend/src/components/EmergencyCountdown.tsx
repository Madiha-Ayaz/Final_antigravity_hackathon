'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EmergencyCountdownProps {
  duration?: number;
  onComplete: () => void;
  onCancel: () => void;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
}

export function EmergencyCountdown({
  duration = 10,
  onComplete,
  onCancel,
  threatLevel,
  confidence,
}: EmergencyCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onComplete]);

  useEffect(() => {
    if ('vibrate' in navigator) {
      const pattern = timeLeft <= 3 ? [200, 100, 200] : [100];
      navigator.vibrate(pattern);
    }
  }, [timeLeft]);

  const handleCancel = useCallback(async () => {
    setIsCancelling(true);

    try {
      const confirmed = await requestBiometricVerification();
      if (confirmed) {
        onCancel();
      } else {
        setIsCancelling(false);
      }
    } catch (error) {
      console.error('Biometric verification failed:', error);
      setIsCancelling(false);
    }
  }, [onCancel]);

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'CRITICAL':
        return 'from-red-600 to-red-700';
      case 'HIGH':
        return 'from-orange-600 to-orange-700';
      case 'MEDIUM':
        return 'from-yellow-600 to-yellow-700';
      default:
        return 'from-blue-600 to-blue-700';
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-950 via-black to-red-950"
        role="alertdialog"
        aria-labelledby="emergency-title"
        aria-describedby="emergency-description"
      >
        <div className="w-full h-full flex flex-col items-center justify-center p-6 relative overflow-hidden">
          {/* Animated background effects */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          <motion.div
            animate={{
              scale: timeLeft <= 3 ? [1, 1.05, 1] : 1,
            }}
            transition={{
              duration: 0.5,
              repeat: timeLeft <= 3 ? Infinity : 0,
            }}
            className="text-center space-y-8 relative z-10"
          >
            <div className="space-y-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                className="w-32 h-32 mx-auto"
              >
                <svg
                  className="w-full h-full text-red-500 drop-shadow-2xl"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </motion.div>

              <h1 id="emergency-title" className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 drop-shadow-2xl">
                EMERGENCY DETECTED
              </h1>

              <p id="emergency-description" className="text-2xl md:text-3xl text-red-200 font-bold">
                Dispatching alerts in
              </p>
            </div>

            <motion.div
              key={timeLeft}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-[10rem] md:text-[16rem] font-black bg-gradient-to-br ${getThreatColor()} bg-clip-text text-transparent drop-shadow-2xl`}
            >
              {timeLeft}
            </motion.div>

            <div className="space-y-6">
              <div className="flex items-center justify-center gap-6 text-white">
                <div className="text-center bg-red-950/50 backdrop-blur-sm px-6 py-4 rounded-2xl border-2 border-red-500/30">
                  <div className="text-sm text-red-300 mb-1 font-semibold uppercase tracking-wider">Threat Level</div>
                  <div className="text-3xl font-black text-red-400">{threatLevel}</div>
                </div>
                <div className="w-px h-16 bg-red-500/30" />
                <div className="text-center bg-red-950/50 backdrop-blur-sm px-6 py-4 rounded-2xl border-2 border-red-500/30">
                  <div className="text-sm text-red-300 mb-1 font-semibold uppercase tracking-wider">Confidence</div>
                  <div className="text-3xl font-black text-red-400">{(confidence * 100).toFixed(0)}%</div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={isCancelling}
                className="w-full max-w-2xl px-10 py-8 bg-gradient-to-r from-white to-gray-100 text-gray-900 text-3xl font-black rounded-3xl hover:from-gray-100 hover:to-white transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl border-4 border-white/20"
                aria-label="Cancel emergency alert"
              >
                {isCancelling ? '🔐 VERIFYING...' : "✋ I'M SAFE - CANCEL ALERT"}
              </motion.button>

              <div className="bg-red-950/30 backdrop-blur-sm border border-red-500/30 rounded-2xl p-4 max-w-2xl mx-auto">
                <p className="text-sm text-red-200 font-semibold">
                  🔒 Biometric verification required to cancel • SMS, WhatsApp & Voice calls will be sent to emergency contacts
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

async function requestBiometricVerification(): Promise<boolean> {
  if (!('credentials' in navigator)) {
    return confirm('Are you sure you want to cancel this emergency alert?');
  }

  try {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);

    const credential = await navigator.credentials.get({
      publicKey: {
        challenge,
        timeout: 60000,
        userVerification: 'required',
      } as any,
    });

    return credential !== null;
  } catch (error) {
    console.error('Biometric verification failed:', error);
    return confirm('Biometric verification unavailable. Cancel emergency alert?');
  }
}
