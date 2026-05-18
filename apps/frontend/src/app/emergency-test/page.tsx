'use client';

import { useState } from 'react';
import { EmergencyCountdown } from '../../components';
import {
  playEmergencySound,
  vibrateEmergencyPattern,
  playSuccessSound,
  stopVibration,
} from '@/lib/emergencyFeedback';
import { motion } from 'framer-motion';

export default function EmergencyTestPage() {
  const [showCountdown, setShowCountdown] = useState(false);
  const [result, setResult] = useState<'completed' | 'cancelled' | null>(null);

  const handleStart = () => {
    setResult(null);
    setShowCountdown(true);
    playEmergencySound();
    vibrateEmergencyPattern();
  };

  const handleComplete = () => {
    setShowCountdown(false);
    setResult('completed');
    stopVibration();
  };

  const handleCancel = () => {
    setShowCountdown(false);
    setResult('cancelled');
    playSuccessSound();
    stopVibration();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-white p-4 sm:p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header - Responsive */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Emergency Countdown Test
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Test the emergency countdown and biometric verification system
          </p>

          <div className="space-y-4">
            <button
              onClick={handleStart}
              disabled={showCountdown}
              className="w-full px-4 sm:px-6 py-3 sm:py-4 bg-red-600 text-white text-lg sm:text-xl font-bold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
            >
              {showCountdown ? 'Countdown Active...' : '🚨 Start Emergency Countdown'}
            </button>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-6 rounded-lg border-2 ${
                  result === 'completed'
                    ? 'bg-red-50 border-red-200'
                    : 'bg-green-50 border-green-200'
                }`}
              >
                <h3
                  className={`text-lg sm:text-xl font-bold mb-2 ${
                    result === 'completed' ? 'text-red-900' : 'text-green-900'
                  }`}
                >
                  {result === 'completed'
                    ? '🚨 Emergency Alert Sent'
                    : '✓ Alert Cancelled Successfully'}
                </h3>
                <p className={`text-sm sm:text-base ${result === 'completed' ? 'text-red-700' : 'text-green-700'}`}>
                  {result === 'completed'
                    ? 'Emergency contacts have been notified with your location and audio evidence.'
                    : 'The emergency alert was cancelled. Your emergency contacts were not notified.'}
                </p>
              </motion.div>
            )}
          </div>
        </div>

        {/* How It Works - Responsive */}
        <div className="bg-white rounded-lg shadow p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
            How It Works
          </h2>
          <div className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-600">
            <p>
              <strong>1. Emergency Detection:</strong> When a threat is detected, the countdown
              begins automatically
            </p>
            <p>
              <strong>2. 10-Second Window:</strong> You have 10 seconds to cancel if it's a false
              alarm
            </p>
            <p>
              <strong>3. Biometric Verification:</strong> Tap "I'M SAFE" and verify with
              fingerprint/face ID
            </p>
            <p>
              <strong>4. Alert Dispatch:</strong> If not cancelled, emergency contacts receive your
              location and audio
            </p>
            <p>
              <strong>5. Feedback:</strong> Visual, audio, and vibration alerts keep you informed
            </p>
          </div>
        </div>

        {/* Features - Responsive */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
          <h3 className="font-semibold text-blue-900 mb-2 text-base sm:text-lg">Features</h3>
          <ul className="space-y-1.5 sm:space-y-2 text-blue-800 text-xs sm:text-sm">
            <li>✓ Full-screen emergency modal</li>
            <li>✓ Large, accessible countdown timer</li>
            <li>✓ Biometric authentication (fingerprint/face ID)</li>
            <li>✓ Emergency sound alerts</li>
            <li>✓ Vibration patterns</li>
            <li>✓ Threat level display</li>
            <li>✓ Confidence score</li>
            <li>✓ Mobile-first responsive design</li>
            <li>✓ Accessibility compliant (WCAG 2.1 AA)</li>
            <li>✓ Smooth animations with Framer Motion</li>
          </ul>
        </div>
      </div>

      {showCountdown && (
        <EmergencyCountdown
          duration={3}
          onComplete={handleComplete}
          onCancel={handleCancel}
          threatLevel="HIGH"
          confidence={0.85}
        />
      )}
    </div>
  );
}
