'use client';

import { useState, useEffect } from 'react';
import { useVoiceThreatDetection } from '@/hooks/useVoiceThreatDetection';
import { EmergencyAlert } from '@/components/EmergencyAlert';

export default function VoiceThreatDetectionPage() {
  const {
    isRecording,
    isAnalyzing,
    threatDetected,
    threatData,
    alertActive,
    alertData,
    timeRemaining,
    error,
    startRecording,
    stopRecording,
    confirmSafe,
    cancelAlert,
    triggerManualEmergency,
  } = useVoiceThreatDetection();

  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: 'Emergency Contact 1', phoneNumber: '+1234567890', relationship: 'Family' },
  ]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎤 Voice Threat Detection
          </h1>
          <p className="text-gray-600">
            AI-powered voice analysis with automatic emergency response
          </p>
        </div>

        {/* Emergency Alert */}
        {alertActive && alertData && (
          <div className="mb-6">
            <EmergencyAlert
              threatLevel={alertData.threatLevel}
              emergencyType={alertData.emergencyType}
              confidence={alertData.confidence}
              reasoning={alertData.reasoning}
              expiresAt={alertData.expiresAt}
              onConfirmSafe={confirmSafe}
              onCancel={cancelAlert}
            />
          </div>
        )}

        {/* Voice Recording Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Voice Monitoring</h2>

          <div className="flex flex-col items-center space-y-4">
            {/* Recording Status */}
            <div className="text-center">
              {isRecording && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 font-semibold">Recording...</span>
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-spin"></div>
                  <span className="text-blue-600 font-semibold">Analyzing with Gemini AI...</span>
                </div>
              )}
              {!isRecording && !isAnalyzing && (
                <span className="text-gray-500">Ready to record</span>
              )}
            </div>

            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              className={`
                w-32 h-32 rounded-full font-bold text-white text-lg
                transition-all duration-200 transform hover:scale-105
                ${isRecording
                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                  : 'bg-blue-500 hover:bg-blue-600'
                }
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isRecording ? '⏹️ Stop' : '🎤 Record'}
            </button>

            {/* Manual Emergency Button */}
            <button
              onClick={triggerManualEmergency}
              disabled={alertActive || isAnalyzing}
              className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              🚨 Manual Emergency Trigger
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 font-semibold">Error:</p>
              <p className="text-red-500">{error}</p>
            </div>
          )}
        </div>

        {/* Threat Detection Result */}
        {threatDetected && threatData && !alertActive && (
          <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-bold text-yellow-900 mb-3">
              ⚠️ Threat Detected
            </h3>
            <div className="space-y-2">
              <p><strong>Type:</strong> {threatData.emergencyType}</p>
              <p><strong>Level:</strong> {threatData.threatLevel}</p>
              <p><strong>Confidence:</strong> {(threatData.confidence * 100).toFixed(1)}%</p>
              <p><strong>Reasoning:</strong> {threatData.reasoning}</p>
              {threatData.transcript && (
                <p><strong>Transcript:</strong> "{threatData.transcript}"</p>
              )}
            </div>
          </div>
        )}

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">How It Works</h2>
          <div className="space-y-3 text-gray-700">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">1️⃣</span>
              <div>
                <strong>Record Voice:</strong> Click the record button and speak naturally
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">2️⃣</span>
              <div>
                <strong>AI Analysis:</strong> Gemini AI analyzes your voice for threats
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">3️⃣</span>
              <div>
                <strong>Threat Detection:</strong> If threat detected, siren plays immediately
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">4️⃣</span>
              <div>
                <strong>2-Minute Countdown:</strong> You have 2 minutes to click "I am safe"
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <span className="text-2xl">5️⃣</span>
              <div>
                <strong>Auto-Activation:</strong> After 2 minutes, if not cancelled:
                <ul className="list-disc ml-6 mt-2">
                  <li>WhatsApp messages sent to emergency contacts</li>
                  <li>GPS location shared automatically</li>
                  <li>Ambulance called (if configured)</li>
                  <li>Emergency event logged</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Emergency Contacts</h2>
          <div className="space-y-3">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-semibold">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.phoneNumber}</p>
                  <p className="text-xs text-gray-500">{contact.relationship}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-700 font-semibold">
                  Edit
                </button>
              </div>
            ))}
            <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 font-semibold">
              + Add Emergency Contact
            </button>
          </div>
        </div>

        {/* Status Info */}
        {alertActive && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-900 font-semibold">
              ⏱️ Time Remaining: {timeRemaining} seconds
            </p>
            <p className="text-blue-700 text-sm mt-1">
              Click "I am safe" to cancel the emergency alert
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
