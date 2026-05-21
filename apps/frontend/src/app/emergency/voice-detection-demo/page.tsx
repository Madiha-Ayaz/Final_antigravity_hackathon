'use client';

import { useState } from 'react';
import { useVoiceThreatDetectionWithFeedback } from '@/hooks/useVoiceThreatDetectionWithFeedback';
import { VoiceVisualizer } from '@/components/VoiceVisualizer';
import { EmergencyAlert } from '@/components/EmergencyAlert';

export default function VoiceThreatDetectionDemo() {
  const {
    isRecording,
    isAnalyzing,
    threatDetected,
    threatData,
    alertActive,
    alertData,
    timeRemaining,
    error,
    statusMessage,
    startRecording,
    stopRecording,
    triggerEmergency,
    confirmSafe,
    cancelAlert,
    testSiren,
  } = useVoiceThreatDetectionWithFeedback();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6 border border-white/20">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-4xl">🎤</span>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Voice Threat Detection</h1>
              <p className="text-blue-200 text-lg">AI-Powered Emergency Detection with Gemini</p>
            </div>
          </div>

          {/* Status Bar */}
          <div className="bg-black/30 rounded-lg p-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isRecording
                    ? 'bg-red-500 animate-pulse'
                    : isAnalyzing
                      ? 'bg-blue-500 animate-spin'
                      : threatDetected
                        ? 'bg-red-500 animate-ping'
                        : 'bg-green-500'
                }`}
              ></div>
              <span className="text-white font-semibold text-lg">{statusMessage}</span>
            </div>
          </div>
        </div>

        {/* Emergency Alert */}
        {alertActive && alertData && (
          <div className="mb-6">
            <EmergencyAlert
              threatLevel={alertData.threatLevel as any}
              emergencyType={alertData.emergencyType}
              confidence={alertData.confidence}
              reasoning={alertData.reasoning}
              expiresAt={alertData.expiresAt}
              countdownId={alertData.alertId}
              onCancel={confirmSafe}
              onExpired={() => {
                console.log('⏰ Countdown expired - emergency alerts sent');
                cancelAlert();
              }}
            />
          </div>
        )}

        {/* Voice Visualizer */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 mb-6 border border-white/20">
          <VoiceVisualizer
            isRecording={isRecording}
            isAnalyzing={isAnalyzing}
            threatDetected={threatDetected}
          />

          {/* Recording Controls */}
          <div className="mt-8 flex flex-col items-center gap-4">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              className={`
                w-40 h-40 rounded-full font-bold text-white text-xl
                transition-all duration-300 transform hover:scale-110 shadow-2xl
                ${
                  isRecording
                    ? 'bg-gradient-to-br from-red-500 to-red-700 animate-pulse'
                    : 'bg-gradient-to-br from-blue-500 to-purple-600'
                }
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-3xl'}
              `}
            >
              {isRecording ? (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">⏹️</span>
                  <span>Stop</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="text-4xl mb-2">🎤</span>
                  <span>Record</span>
                </div>
              )}
            </button>

            {/* Test Siren Button */}
            <button
              onClick={testSiren}
              disabled={isRecording || isAnalyzing}
              className="px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              🔊 Test Siren
            </button>
          </div>
        </div>

        {/* Threat Detection Result - Only show briefly before auto-triggering */}
        {threatDetected && threatData && !alertActive && (
          <div className="bg-red-500/20 backdrop-blur-lg border-4 border-red-500 rounded-2xl p-8 mb-6 animate-pulse">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                <span className="text-3xl">⚠️</span>
              </div>
              <div>
                <h3 className="text-3xl font-bold text-white mb-1">THREAT DETECTED!</h3>
                <p className="text-red-200 text-lg">Starting emergency countdown...</p>
              </div>
            </div>

            <div className="bg-black/30 rounded-lg p-6 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Type:</span>
                <span className="text-red-300 font-bold text-lg">{threatData.emergencyType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Level:</span>
                <span
                  className={`font-bold text-lg ${
                    threatData.threatLevel === 'CRITICAL'
                      ? 'text-red-400'
                      : threatData.threatLevel === 'HIGH'
                        ? 'text-orange-400'
                        : threatData.threatLevel === 'MEDIUM'
                          ? 'text-yellow-400'
                          : 'text-green-400'
                  }`}
                >
                  {threatData.threatLevel}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-white font-semibold">Confidence:</span>
                <span className="text-blue-300 font-bold text-lg">
                  {(threatData.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <div className="pt-3 border-t border-white/20">
                <span className="text-white font-semibold block mb-2">AI Analysis:</span>
                <p className="text-gray-300">{threatData.reasoning}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 backdrop-blur-lg border-2 border-red-500 rounded-lg p-6 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">❌</span>
              <div>
                <p className="text-white font-bold text-lg">Error</p>
                <p className="text-red-200">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
          <h3 className="text-2xl font-bold text-white mb-6">📋 How It Works</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">1</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Click Record Button</p>
                <p className="text-blue-200">Start recording your voice - you'll hear a beep</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">2</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Speak Clearly</p>
                <p className="text-purple-200">Say something (try: "Help me, I'm in danger!")</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">3</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Stop Recording</p>
                <p className="text-pink-200">Click stop - audio will be sent to Gemini AI</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">4</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">AI Analysis</p>
                <p className="text-green-200">Gemini analyzes voice for threats and emotions</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">5</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">Threat Detection</p>
                <p className="text-red-200">
                  If threat detected: Siren plays + Emergency alert shown
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold">6</span>
              </div>
              <div>
                <p className="text-white font-semibold text-lg">2-Minute Countdown</p>
                <p className="text-yellow-200">
                  Click "I am safe" to cancel, or wait for auto-alert
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500/20 backdrop-blur-lg rounded-lg p-6 border border-blue-500/30">
            <div className="text-4xl mb-3">🎤</div>
            <h4 className="text-white font-bold text-lg mb-2">Voice Recording</h4>
            <p className="text-blue-200 text-sm">Real-time audio capture with visual feedback</p>
          </div>

          <div className="bg-purple-500/20 backdrop-blur-lg rounded-lg p-6 border border-purple-500/30">
            <div className="text-4xl mb-3">🤖</div>
            <h4 className="text-white font-bold text-lg mb-2">Gemini AI</h4>
            <p className="text-purple-200 text-sm">Advanced threat detection and analysis</p>
          </div>

          <div className="bg-red-500/20 backdrop-blur-lg rounded-lg p-6 border border-red-500/30">
            <div className="text-4xl mb-3">🚨</div>
            <h4 className="text-white font-bold text-lg mb-2">Emergency Alert</h4>
            <p className="text-red-200 text-sm">Automatic siren and countdown timer</p>
          </div>
        </div>
      </div>
    </div>
  );
}
