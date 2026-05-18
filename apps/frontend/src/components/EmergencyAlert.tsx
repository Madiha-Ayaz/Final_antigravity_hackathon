'use client';

import { useState, useEffect, useRef } from 'react';

interface EmergencyAlertProps {
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  emergencyType: string;
  confidence: number;
  reasoning: string;
  expiresAt: Date;
  countdownId: string;
  onCancel: () => void;
  onExpired: () => void;
}

export function EmergencyAlert({
  threatLevel,
  emergencyType,
  confidence,
  reasoning,
  expiresAt,
  countdownId,
  onCancel,
  onExpired,
}: EmergencyAlertProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isCancelling, setIsCancelling] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate initial time remaining
    const updateTimeRemaining = () => {
      const now = new Date().getTime();
      const expires = new Date(expiresAt).getTime();
      const remaining = Math.max(0, expires - now);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        onExpired();
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      }
    };

    updateTimeRemaining();
    intervalRef.current = setInterval(updateTimeRemaining, 100);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [expiresAt, onExpired]);

  useEffect(() => {
    // Play siren sound
    if (typeof window !== 'undefined') {
      audioRef.current = new Audio('/sounds/emergency-siren.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 1.0;

      // Try to play (may be blocked by browser)
      audioRef.current.play().catch(err => {
        console.warn('Siren audio blocked by browser:', err);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleCancel = async () => {
    setIsCancelling(true);

    // Stop siren
    if (audioRef.current) {
      audioRef.current.pause();
    }

    await onCancel();
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getThreatColor = () => {
    switch (threatLevel) {
      case 'CRITICAL':
        return 'from-red-600 to-red-800';
      case 'HIGH':
        return 'from-orange-600 to-red-600';
      case 'MEDIUM':
        return 'from-yellow-600 to-orange-600';
      default:
        return 'from-blue-600 to-blue-800';
    }
  };

  const progress = (timeRemaining / (2 * 60 * 1000)) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
      {/* Pulsing background effect */}
      <div className="absolute inset-0 animate-pulse-slow">
        <div className={`absolute inset-0 bg-gradient-to-br ${getThreatColor()} opacity-20`}></div>
      </div>

      {/* Main alert card */}
      <div className="relative z-10 w-full max-w-2xl mx-4 bg-white dark:bg-dark-900 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header with threat level */}
        <div className={`bg-gradient-to-r ${getThreatColor()} p-6 text-white`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center animate-pulse">
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold">🚨 EMERGENCY DETECTED</h2>
                <p className="text-sm opacity-90">Threat Level: {threatLevel}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{formatTime(timeRemaining)}</div>
              <div className="text-xs opacity-90">Time Remaining</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-3 bg-white bg-opacity-20 rounded-full overflow-hidden">
            <div
              className="h-full bg-white transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Emergency details */}
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🚑</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Emergency Type</h3>
                <p className="text-gray-600 dark:text-gray-400">{emergencyType}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🤖</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                  AI Analysis ({(confidence * 100).toFixed(0)}% confidence)
                </h3>
                <p className="text-gray-600 dark:text-gray-400">{reasoning}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-xl">⏰</span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">What Happens Next</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  In {formatTime(timeRemaining)}, emergency alerts will be sent to all your contacts via WhatsApp with your GPS location.
                  {emergencyType === 'MEDICAL' && ' Ambulance will be automatically contacted.'}
                </p>
              </div>
            </div>
          </div>

          {/* Warning message */}
          <div className="bg-yellow-50 dark:bg-yellow-900 dark:bg-opacity-20 border-2 border-yellow-400 dark:border-yellow-600 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                  Are you safe?
                </h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  If this is a false alarm or you are safe, click the button below to cancel the emergency alert.
                </p>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col space-y-3">
            <button
              onClick={handleCancel}
              disabled={isCancelling}
              className="w-full py-4 px-6 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold text-lg rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 disabled:transform-none"
            >
              {isCancelling ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Cancelling...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  ✅ I'M SAFE - CANCEL ALERT
                </span>
              )}
            </button>

            <p className="text-center text-sm text-gray-500 dark:text-gray-400">
              Countdown ID: {countdownId.slice(-8)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
