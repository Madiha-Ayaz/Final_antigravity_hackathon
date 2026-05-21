'use client';

import { useState, useEffect } from 'react';

interface VoiceAnalysisIndicatorProps {
  isListening: boolean;
  isAnalyzing: boolean;
  lastAnalysis?: {
    emergencyDetected: boolean;
    threatLevel: string;
    confidence: number;
    alertSent?: boolean;
  };
}

export default function VoiceAnalysisIndicator({
  isListening,
  isAnalyzing,
  lastAnalysis,
}: VoiceAnalysisIndicatorProps) {
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    if (isListening || isAnalyzing) {
      const interval = setInterval(() => setPulse((p) => !p), 1000);
      return () => clearInterval(interval);
    }
  }, [isListening, isAnalyzing]);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 min-w-[300px] border border-gray-200 dark:border-dark-700">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Voice Monitor</h3>
          <div className="flex items-center space-x-2">
            {isListening && (
              <div
                className={`w-3 h-3 rounded-full bg-green-500 ${pulse ? 'animate-pulse' : ''}`}
              />
            )}
            {isAnalyzing && (
              <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
            )}
          </div>
        </div>

        {/* Status Text */}
        <div className="space-y-2">
          {isListening && !isAnalyzing && (
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Listening for emergencies...</span>
            </div>
          )}

          {isAnalyzing && (
            <div className="flex items-center space-x-2 text-primary-600 dark:text-primary-400">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-sm font-medium">Analyzing audio with AI...</span>
            </div>
          )}

          {!isListening && !isAnalyzing && (
            <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-medium">Monitoring paused</span>
            </div>
          )}
        </div>

        {/* Last Analysis Result */}
        {lastAnalysis && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Last Analysis:</span>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded ${
                    lastAnalysis.emergencyDetected
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                  }`}
                >
                  {lastAnalysis.emergencyDetected ? '🚨 Emergency' : '✓ Safe'}
                </span>
              </div>

              {lastAnalysis.emergencyDetected && (
                <>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Threat Level:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      {lastAnalysis.threatLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Confidence:</span>
                    <span className="font-semibold">
                      {(lastAnalysis.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  {lastAnalysis.alertSent && (
                    <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="flex items-center space-x-2 text-green-700 dark:text-green-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="text-xs font-medium">WhatsApp alert sent!</span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            🤖 Powered by Gemini AI
            <br />
            📱 Auto WhatsApp alerts enabled
          </p>
        </div>
      </div>
    </div>
  );
}
