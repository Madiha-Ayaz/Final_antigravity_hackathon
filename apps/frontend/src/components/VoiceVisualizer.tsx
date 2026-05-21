'use client';

import { useEffect, useState } from 'react';

interface VoiceVisualizerProps {
  isRecording: boolean;
  isAnalyzing: boolean;
  threatDetected?: boolean;
}

export function VoiceVisualizer({
  isRecording,
  isAnalyzing,
  threatDetected,
}: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>(Array(20).fill(0));

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setBars(
          Array(20)
            .fill(0)
            .map(() => Math.random() * 100)
        );
      }, 100);
      return () => clearInterval(interval);
    } else {
      setBars(Array(20).fill(0));
    }
  }, [isRecording]);

  return (
    <div className="w-full">
      {/* Status Text */}
      <div className="text-center mb-4">
        {isRecording && (
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-red-600 font-bold text-lg">🎤 Recording Voice...</span>
          </div>
        )}
        {isAnalyzing && (
          <div className="flex items-center justify-center gap-3">
            <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-blue-600 font-bold text-lg">🤖 Gemini AI Analyzing...</span>
          </div>
        )}
        {threatDetected && (
          <div className="flex items-center justify-center gap-3">
            <div className="w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-red-600 font-bold text-lg">⚠️ THREAT DETECTED!</span>
          </div>
        )}
        {!isRecording && !isAnalyzing && !threatDetected && (
          <span className="text-gray-500 text-lg">Ready to record</span>
        )}
      </div>

      {/* Audio Visualizer Bars */}
      {isRecording && (
        <div className="flex items-end justify-center gap-1 h-32 bg-gray-900 rounded-lg p-4">
          {bars.map((height, index) => (
            <div
              key={index}
              className="w-2 bg-gradient-to-t from-blue-500 to-purple-500 rounded-full transition-all duration-100"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      )}

      {/* Analysis Progress */}
      {isAnalyzing && (
        <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <div className="flex-1">
                <p className="font-bold text-blue-900">Analyzing with Gemini AI...</p>
                <p className="text-sm text-blue-700">Detecting threats and emotions</p>
              </div>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full animate-pulse"
                style={{ width: '70%' }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Threat Alert */}
      {threatDetected && (
        <div className="bg-red-50 border-4 border-red-500 rounded-lg p-6 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-ping">
              <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <p className="font-bold text-red-900 text-xl">THREAT DETECTED!</p>
              <p className="text-red-700">Emergency alert will be triggered</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
