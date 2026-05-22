'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useAudioMonitor } from '../../hooks';
import { useWakePhraseDetection } from '../../hooks';
import { useRollingAudioBuffer } from '../../hooks';
import { useGeolocation } from '../../hooks/useGeolocation';
import { useSiren } from '../../hooks/useSiren';
import {
  AudioVisualizer,
  CompatibilityBanner,
  WakePhraseIndicator,
  EmergencyCountdown,
} from '../../components';
import { Navbar } from '../../components/layout/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AgentLog {
  agent: string;
  action: string;
  reasoning: string;
  result: any;
  timestamp: string;
}

export default function AudioMonitorPage() {
  const [isActive, setIsActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<{
    confidence: string;
    keywords: string[];
  } | null>(null);
  const [analysisError, setAnalysisError] = useState('');
  const [autoStarted, setAutoStarted] = useState(false);
  const [emergencyCategory, setEmergencyCategory] = useState<string | null>(null);
  const router = useRouter();

  // Emergency Flow States
  const [showCountdown, setShowCountdown] = useState(false);
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [activeEmergencyEventId, setActiveEmergencyEventId] = useState<string | null>(null);
  const [emergencyStartTime, setEmergencyStartTime] = useState<number | null>(null);
  const [sirenTimeRemaining, setSirenTimeRemaining] = useState(180); // 3 minutes = 180 seconds

  const {
    isListening,
    isSupported,
    error: audioError,
    audioLevel,
    startListening,
    stopListening,
  } = useAudioMonitor();
  const { isDetecting, lastDetection, detectionCount, startDetection, stopDetection, error: wakeError } =
    useWakePhraseDetection();
  const {
    startRecording,
    stopRecording,
    getBufferDuration,
    clearBuffer,
    getBufferedAudioAsArrayBuffer,
  } = useRollingAudioBuffer();
  const { position: gpsPosition, requestPosition } = useGeolocation(true);
  const { startSiren, stopSiren } = useSiren();

  const hasAnalyzedRef = useRef(false);

  // Siren timer countdown - 3 minutes
  useEffect(() => {
    if (isEmergencyActive && emergencyStartTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - emergencyStartTime) / 1000);
        const remaining = Math.max(0, 180 - elapsed);
        setSirenTimeRemaining(remaining);

        // After 3 minutes, auto-call ambulance
        if (remaining === 0) {
          console.log('🚑 3 minutes elapsed! Auto-calling ambulance...');
          handleAutoCallAmbulance();
          clearInterval(interval);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isEmergencyActive, emergencyStartTime]);

  const handleAutoCallAmbulance = async () => {
    console.log('🚑 3 minutes elapsed! Auto-sending alerts to all contacts via Twilio...');
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const payload = {
        alertId: `auto_alert_${Date.now()}`,
        location: gpsPosition
          ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude }
          : undefined,
      };

      const res = await fetch(`${API_URL}/api/voice-threat/emergency/send-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        console.log('✅ Auto ambulance alerts sent via Twilio:', data);
      } else {
        console.error('❌ Auto alerts failed:', data.message);
      }
    } catch (err) {
      console.error('❌ Failed to send auto alerts:', err);
    }
  };

  // Detect if running as PWA on mobile
  const isMobileDevice = typeof window !== 'undefined' && typeof navigator !== 'undefined' && (
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );

  // Auto-start monitoring on page load — but NOT on mobile (requires user gesture for mic)
  useEffect(() => {
    if (!autoStarted && isSupported && !isMobileDevice) {
      handleStart();
      setAutoStarted(true);
    }
  }, [autoStarted, isSupported]);

  useEffect(() => {
    if (isListening && !isDetecting && isActive) {
      startDetection();
    }
  }, [isListening, isDetecting, isActive, startDetection]);

  // Automatically analyze voice when wake phrase detected
  useEffect(() => {
    if (lastDetection && isActive && !hasAnalyzedRef.current) {
      hasAnalyzedRef.current = true;
      console.log('🎤 Wake phrase detected! Starting analysis...', lastDetection.phrase);
      triggerAgentWorkflow(lastDetection.phrase);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastDetection, isActive]);

  // Detect emergency category from wake phrase
  const detectCategory = useCallback((phrase: string): string => {
    const p = phrase.toLowerCase();
    if (p.includes('fire') || p.includes('burning') || p.includes('smoke')) return 'fire';
    if (p.includes('flood') || p.includes('water')) return 'flood';
    if (p.includes('accident') || p.includes('crash')) return 'accident';
    if (p.includes('abuse') || p.includes('hitting') || p.includes('violence')) return 'abuse';
    return 'general';
  }, []);

  // Smart routing: navigate to crisis/alert page based on emergency type
  useEffect(() => {
    if (lastDetection && lastAnalysis && lastAnalysis.confidence === 'High' && !isEmergencyActive) {
      const category = detectCategory(lastDetection.phrase);
      setEmergencyCategory(category);
      console.log('🚨 Emergency detected! Category:', category, 'Phrase:', lastDetection.phrase);

      // Route based on emergency type
      if (category === 'fire' || category === 'flood' || category === 'abuse') {
        // Fire/Flood/Abuse → Crisis page with auto-trigger
        console.log(`🔀 Routing to crisis page with scenario: ${category}`);
        localStorage.setItem(
          'emergencyData',
          JSON.stringify({
            category,
            phrase: lastDetection.phrase,
            timestamp: Date.now(),
            location: gpsPosition,
          })
        );
        router.push(`/crisis?scenario=${category}&auto=true`);
      } else if (category === 'accident') {
        // Accident → Alert page (SAVE ME)
        console.log('🔀 Routing to alert page for accident');
        localStorage.setItem(
          'emergencyData',
          JSON.stringify({
            category,
            phrase: lastDetection.phrase,
            timestamp: Date.now(),
            location: gpsPosition,
          })
        );
        router.push('/alert?auto=true');
      } else {
        // General → Show countdown as before
        console.log('⚠️ General emergency, starting countdown');
        setShowCountdown(true);
      }
      hasAnalyzedRef.current = false;
    }
  }, [lastDetection, lastAnalysis, isEmergencyActive, detectCategory, gpsPosition, router]);

  const handleEmergencyComplete = async () => {
    console.log('🚨 Emergency countdown complete! Triggering alerts...');
    setShowCountdown(false);
    setIsEmergencyActive(true);
    setEmergencyStartTime(Date.now());
    startSiren();

    // Trigger Twilio alerts (SMS + WhatsApp + Call) to all emergency contacts
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const payload = {
        alertId: `alert_${Date.now()}`,
        location: gpsPosition
          ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude }
          : undefined,
      };

      console.log('📤 Sending Twilio emergency alerts to all contacts...', payload);

      const res = await fetch(`${API_URL}/api/voice-threat/emergency/send-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        console.log('✅ Twilio emergency alerts sent:', data);
      } else {
        console.error('❌ Twilio alerts failed:', data.message);
      }
    } catch (err) {
      console.error('❌ Failed to trigger Twilio alerts:', err);
    }
  };

  const getAudioBuffer = async () => {
    try {
      const buffer = await getBufferedAudioAsArrayBuffer();
      if (buffer) {
        return Array.from(new Uint8Array(buffer));
      }
    } catch (err) {
      console.error('Failed to get audio buffer:', err);
    }
    return null;
  };

  const handleEmergencyCancel = () => {
    setShowCountdown(false);
  };

  const handleStopEmergency = async () => {
    console.log('✅ User clicked "I am safe" button');
    stopSiren();
    setIsEmergencyActive(false);

    // Send "I am safe" message to all emergency contacts
    try {
      const safeMessage =
        `✅ *I AM SAFE* ✅\n\n` +
        `The emergency alert has been cancelled.\n` +
        `The person is safe and does not need assistance.\n\n` +
        `📍 *Current Location:*\n` +
        `${gpsPosition ? `Lat: ${gpsPosition.latitude.toFixed(6)}\nLng: ${gpsPosition.longitude.toFixed(6)}\n` : 'Location unavailable\n'}` +
        `${gpsPosition ? `https://maps.google.com/?q=${gpsPosition.latitude},${gpsPosition.longitude}\n\n` : ''}` +
        `⚠️ No further action needed.`;

      console.log('📤 Sending "I am safe" message to all contacts...');

      const safeRes = await fetch('/api/dispatch-textmebot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: safeMessage }),
      });

      if (safeRes.ok) {
        console.log('✅ "I am safe" message sent successfully!');
      } else {
        console.error('❌ Failed to send "I am safe" message');
      }
    } catch (err) {
      console.error('❌ Error sending "I am safe" message:', err);
    }

    if (activeEmergencyEventId) {
      try {
        await fetch(`${API_URL}/api/emergency/cancel/${activeEmergencyEventId}`, {
          method: 'POST',
        });
      } catch (err) {
        console.error('Failed to cancel emergency on backend:', err);
      }
      setActiveEmergencyEventId(null);
    }

    setEmergencyStartTime(null);
    setSirenTimeRemaining(180);
  };

  const triggerAgentWorkflow = useCallback(
    async (transcript: string) => {
      if (isAnalyzing) return;
      console.log('🔍 Starting AI analysis for transcript:', transcript);
      setIsAnalyzing(true);
      setAnalysisError('');
      setAgentLogs([]);

      try {
        const payload = {
          userId: 'monitor-user-001',
          transcript,
          location: gpsPosition
            ? { latitude: gpsPosition.latitude, longitude: gpsPosition.longitude }
            : undefined,
        };

        console.log('📤 Sending to AI workflow:', payload);

        const res = await fetch(`${API_URL}/api/workflow/trigger`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log('📥 AI workflow response:', data);

        if (data.success && data.logs) {
          setAgentLogs(data.logs);
          // Extract confidence from AudioAnalysisAgent log
          const audioLog = data.logs.find(
            (l: AgentLog) => l.agent === 'AudioAnalysisAgent' && l.result
          );
          if (audioLog?.result) {
            console.log('✅ Analysis result:', audioLog.result);
            setLastAnalysis({
              confidence: audioLog.result.confidence,
              keywords: audioLog.result.keywords || [],
            });
          } else {
            // Fallback: assume high confidence for emergency keywords
            const emergencyKeywords = ['help', 'emergency', 'danger', 'police'];
            const hasEmergency = emergencyKeywords.some((kw) =>
              transcript.toLowerCase().includes(kw)
            );

            if (hasEmergency) {
              console.log('⚠️ Emergency keywords detected, setting High confidence');
              setLastAnalysis({
                confidence: 'High',
                keywords: emergencyKeywords.filter((kw) => transcript.toLowerCase().includes(kw)),
              });
            }
          }
        } else {
          setAnalysisError(data.message || 'Analysis failed');
          console.error('❌ Analysis failed:', data.message);
        }
      } catch (err: any) {
        const errorMsg = `Connection error: ${err.message}. Is backend running on port 3001?`;
        setAnalysisError(errorMsg);
        console.error('❌ Analysis error:', err);

        // Fallback: Check for emergency keywords locally
        const emergencyKeywords = ['help', 'emergency', 'danger', 'police'];
        const hasEmergency = emergencyKeywords.some((kw) => transcript.toLowerCase().includes(kw));

        if (hasEmergency) {
          console.log('⚠️ Backend unavailable but emergency detected locally');
          setLastAnalysis({
            confidence: 'High',
            keywords: emergencyKeywords.filter((kw) => transcript.toLowerCase().includes(kw)),
          });
        }
      } finally {
        setIsAnalyzing(false);
      }
    },
    [isAnalyzing, gpsPosition]
  );

  const handleStart = async () => {
    try {
      const mediaStream = await startListening();
      if (mediaStream) {
        setStream(mediaStream);
        await startRecording(mediaStream);
        requestPosition();
        setIsActive(true);
      }
      // If mediaStream is null, startListening already set the error state
    } catch (error) {
      console.error('Failed to start monitoring:', error);
    }
  };

  const handleStop = () => {
    stopListening();
    stopDetection();
    stopRecording();
    clearBuffer();
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    setIsActive(false);
  };

  if (!isSupported) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="w-12 h-12 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Not Supported</h2>
          <p className="text-gray-600">
            Audio monitoring is not supported in your browser. Please use Chrome, Firefox, or Edge.
          </p>
        </div>
      </div>
    );
  }

  const confidenceColor =
    lastAnalysis?.confidence === 'High'
      ? 'bg-red-100 text-red-800 border-red-300'
      : lastAnalysis?.confidence === 'Medium'
        ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
        : 'bg-green-100 text-green-800 border-green-300';

  return (
    <>
      <Navbar isAuthenticated={true} />
      <CompatibilityBanner />
      {lastDetection && (
        <WakePhraseIndicator
          phrase={lastDetection.phrase}
          confidence={lastDetection.confidence}
          timestamp={lastDetection.timestamp}
        />
      )}

      {/* 3-Second Countdown Overlay */}
      {showCountdown && (
        <EmergencyCountdown
          duration={3}
          onComplete={handleEmergencyComplete}
          onCancel={handleEmergencyCancel}
          threatLevel="HIGH"
          confidence={lastDetection ? lastDetection.confidence : 0.85}
        />
      )}

      {/* Fullscreen Panic UI */}
      {isEmergencyActive && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-br from-red-950 via-black to-red-950 text-white p-4 sm:p-6 md:p-8 overflow-y-auto">
          {/* Animated background effects */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-1/3 left-1/3 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-red-600 rounded-full blur-3xl animate-pulse"></div>
            <div
              className="absolute bottom-1/3 right-1/3 w-64 h-64 sm:w-80 sm:h-80 lg:w-96 lg:h-96 bg-orange-600 rounded-full blur-3xl animate-pulse"
              style={{ animationDelay: '0.5s' }}
            ></div>
          </div>

          <div className="text-center space-y-4 sm:space-y-6 lg:space-y-8 max-w-2xl w-full relative z-10">
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </motion.div>

            <div className="space-y-3 sm:space-y-4">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400 drop-shadow-2xl animate-pulse px-4">
                EMERGENCY ACTIVE
              </h1>

              <div className="bg-red-950/50 backdrop-blur-sm border-2 border-red-500/50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6 space-y-3 sm:space-y-4">
                <div className="flex items-center justify-center gap-2 sm:gap-3 text-red-200">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-ping"></div>
                  <p className="text-base sm:text-lg lg:text-xl font-bold">ALERTS DISPATCHED</p>
                </div>

                <div className="space-y-1.5 sm:space-y-2 text-red-300 font-semibold text-xs sm:text-sm lg:text-base">
                  <p>✅ SMS alerts sent to emergency contacts</p>
                  <p>✅ WhatsApp messages delivered via TextMeBot</p>
                  <p>✅ Voice calls initiated</p>
                  <p>✅ Live GPS location shared</p>
                  <p>✅ Audio siren activated</p>
                </div>

                {/* 3-Minute Countdown Display */}
                <div className="bg-yellow-950/50 backdrop-blur-sm border-2 border-yellow-500/50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                  <div className="text-center">
                    <div className="text-xs sm:text-sm text-yellow-300 mb-1 sm:mb-2 font-semibold">
                      Auto-Ambulance Call In:
                    </div>
                    <div className="text-4xl sm:text-5xl lg:text-5xl font-black text-yellow-400 font-mono">
                      {Math.floor(sirenTimeRemaining / 60)}:
                      {(sirenTimeRemaining % 60).toString().padStart(2, '0')}
                    </div>
                    <div className="text-xs text-yellow-300 mt-1 sm:mt-2">
                      Click "I'M SAFE" below to cancel
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/80 backdrop-blur-sm border-2 border-purple-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-5 lg:p-6">
              <div className="text-xs sm:text-sm text-purple-300 mb-1 sm:mb-2 font-semibold uppercase tracking-wider">
                Live GPS Coordinates
              </div>
              <div className="font-mono text-lg sm:text-xl lg:text-2xl font-black text-purple-400 break-all">
                {gpsPosition
                  ? `${gpsPosition.latitude.toFixed(6)}, ${gpsPosition.longitude.toFixed(6)}`
                  : 'Acquiring GPS signal...'}
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleStopEmergency}
              className="w-full px-6 sm:px-8 lg:px-10 py-5 sm:py-6 lg:py-8 bg-gradient-to-r from-white to-gray-100 text-red-950 text-xl sm:text-2xl lg:text-3xl font-black rounded-2xl sm:rounded-3xl hover:from-gray-100 hover:to-white transition-all shadow-2xl border-4 border-white/20"
            >
              🔐 DISMISS EMERGENCY (I'M SAFE)
            </motion.button>

            <div className="bg-yellow-950/30 backdrop-blur-sm border border-yellow-500/30 rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <p className="text-xs sm:text-sm text-yellow-200 font-semibold">
                ⚠️ Your emergency contacts have been notified and can track your location in
                real-time
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
        <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-purple-500/20">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4 md:mb-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <div className="relative flex-shrink-0">
                    <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-ping"></div>
                  </div>
                  <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 truncate">
                    SilentSiren AI
                  </h1>
                </div>
                <p className="text-purple-300 text-xs sm:text-sm md:text-base lg:text-lg font-medium">
                  Autonomous Emergency Detection
                </p>
                <p className="text-slate-400 text-xs sm:text-sm mt-1">
                  Powered by Gemini AI • Real-time Voice Analysis
                </p>
              </div>
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-2 sm:gap-3 flex-shrink-0">
                <button
                  onClick={isActive ? handleStop : handleStart}
                  className={`w-full sm:w-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 rounded-lg sm:rounded-xl lg:rounded-2xl font-bold text-sm sm:text-base lg:text-lg transition-all shadow-lg transform hover:scale-105 touch-manipulation whitespace-nowrap ${
                    isActive
                      ? 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-red-500/50'
                      : 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-green-500/50'
                  }`}
                >
                  {isActive ? '⏹ Stop Protection' : '▶️ Start Protection'}
                </button>
              </div>
            </div>

            {/* Status Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
              <div
                className={`p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 backdrop-blur-sm ${isActive ? 'border-green-500/50 bg-green-500/10' : 'border-slate-600/50 bg-slate-800/50'}`}
              >
                <div className="text-xs text-slate-400 mb-1 sm:mb-2 font-semibold uppercase tracking-wider">
                  Status
                </div>
                <div
                  className={`font-black text-sm sm:text-base md:text-lg lg:text-xl flex items-center gap-1.5 sm:gap-2 ${isActive ? 'text-green-400' : 'text-slate-500'}`}
                >
                  <div
                    className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full flex-shrink-0 ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-600'}`}
                  ></div>
                  <span className="text-xs sm:text-sm md:text-base truncate">
                    {isActive ? 'ACTIVE' : 'STANDBY'}
                  </span>
                </div>
              </div>
              <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-blue-500/50 bg-blue-500/10 backdrop-blur-sm">
                <div className="text-xs text-slate-400 mb-1 sm:mb-2 font-semibold uppercase tracking-wider">
                  Detections
                </div>
                <div className="font-black text-blue-400 text-lg sm:text-xl md:text-2xl lg:text-3xl">
                  {detectionCount}
                </div>
              </div>
              <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-purple-500/50 bg-purple-500/10 backdrop-blur-sm">
                <div className="text-xs text-slate-400 mb-1 sm:mb-2 font-semibold uppercase tracking-wider">
                  Buffer
                </div>
                <div className="font-black text-purple-400 text-base sm:text-lg md:text-xl lg:text-2xl">
                  {getBufferDuration()}s
                </div>
              </div>
              <div className="p-2.5 sm:p-3 md:p-4 lg:p-5 rounded-lg sm:rounded-xl lg:rounded-2xl border-2 border-orange-500/50 bg-orange-500/10 backdrop-blur-sm">
                <div className="text-xs text-slate-400 mb-1 sm:mb-2 font-semibold uppercase tracking-wider">
                  GPS
                </div>
                <div className="font-bold text-orange-400 text-xs sm:text-sm break-all">
                  {gpsPosition
                    ? `${gpsPosition.latitude.toFixed(4)}, ${gpsPosition.longitude.toFixed(4)}`
                    : 'Acquiring...'}
                </div>
              </div>
            </div>

            {audioError && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-500/20 border-2 border-red-500/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                <p className="text-red-300 font-semibold text-xs sm:text-sm">
                  ⚠️ Audio Error: {audioError}
                </p>
              </div>
            )}

            {wakeError && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl sm:rounded-2xl backdrop-blur-sm">
                <p className="text-yellow-300 font-semibold text-xs sm:text-sm">
                  ⚠️ Voice Detection: {wakeError}
                </p>
              </div>
            )}

            {/* Mobile: show tap-to-start prompt instead of auto-starting */}
            {!isActive && isMobileDevice && (
              <div className="mt-3 sm:mt-4 p-4 sm:p-5 bg-purple-500/20 border-2 border-purple-500/50 rounded-xl sm:rounded-2xl backdrop-blur-sm text-center">
                <p className="text-purple-200 font-bold text-sm sm:text-base mb-2">
                  Tap "Start Protection" to begin voice monitoring
                </p>
                <p className="text-purple-300 text-xs">
                  Mobile requires user interaction to access microphone
                </p>
              </div>
            )}
          </div>

          {/* Audio Visualizer */}
          {isActive && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-purple-500/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse flex-shrink-0"></div>
                <h3 className="font-black text-base sm:text-lg md:text-xl lg:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                  Live Audio Analysis
                </h3>
              </div>
              <AudioVisualizer audioLevel={audioLevel} isActive={isActive} />
              <div className="mt-4 sm:mt-6">
                <div className="flex items-center justify-between text-xs sm:text-sm text-slate-400 mb-2">
                  <span className="font-semibold">VOLUME LEVEL</span>
                  <span className="font-black text-purple-400 text-base sm:text-lg">
                    {audioLevel}%
                  </span>
                </div>
                <div className="w-full bg-slate-700/50 rounded-full h-2.5 sm:h-3 overflow-hidden backdrop-blur-sm border border-slate-600/50">
                  <div
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 h-full transition-all duration-100 shadow-lg shadow-purple-500/50"
                    style={{ width: `${audioLevel}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Gemini AI Analysis Result */}
          {(lastAnalysis || isAnalyzing || analysisError) && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-purple-500/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse flex-shrink-0"></div>
                <h3 className="font-black text-base sm:text-lg md:text-xl lg:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">
                  Gemini AI Analysis
                </h3>
              </div>

              {isAnalyzing && (
                <div className="flex items-center gap-3 sm:gap-4 text-purple-300 bg-purple-500/20 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl border border-purple-500/30 backdrop-blur-sm">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-3 border-purple-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="font-semibold text-sm sm:text-base lg:text-lg">
                    Analyzing voice patterns with Gemini AI...
                  </span>
                </div>
              )}

              {analysisError && (
                <div className="bg-red-500/20 border-2 border-red-500/50 p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl text-red-300 font-semibold text-xs sm:text-sm backdrop-blur-sm">
                  ❌ {analysisError}
                </div>
              )}

              {lastAnalysis && !isAnalyzing && (
                <div className="space-y-4 sm:space-y-6">
                  <div
                    className={`inline-flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl sm:rounded-2xl border-2 font-black text-base sm:text-lg lg:text-xl backdrop-blur-sm ${
                      lastAnalysis.confidence === 'High'
                        ? 'border-red-500/50 bg-red-500/20 text-red-300'
                        : lastAnalysis.confidence === 'Medium'
                          ? 'border-yellow-500/50 bg-yellow-500/20 text-yellow-300'
                          : 'border-green-500/50 bg-green-500/20 text-green-300'
                    }`}
                  >
                    {lastAnalysis.confidence === 'High' ? (
                      <svg
                        className="w-4 h-4 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    ) : lastAnalysis.confidence === 'Medium' ? (
                      <svg
                        className="w-4 h-4 text-yellow-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="w-4 h-4 text-green-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    <span className="truncate">
                      THREAT LEVEL: {lastAnalysis.confidence.toUpperCase()}
                    </span>
                  </div>
                  {lastAnalysis.keywords.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm text-slate-400 mb-2 sm:mb-3 font-semibold uppercase tracking-wider">
                        Detected Keywords
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {lastAnalysis.keywords.map((kw, i) => (
                          <span
                            key={i}
                            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg sm:rounded-xl text-xs sm:text-sm font-bold backdrop-blur-sm"
                          >
                            {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Agent Workflow Logs */}
          {agentLogs.length > 0 && (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-purple-500/20">
              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse flex-shrink-0"></div>
                <h3 className="font-black text-base sm:text-lg md:text-xl lg:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  AI Agent Workflow
                </h3>
              </div>
              <div className="space-y-2 sm:space-y-3">
                {agentLogs.map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 sm:gap-3 lg:gap-4 p-2.5 sm:p-3 lg:p-4 bg-slate-800/50 rounded-lg sm:rounded-xl lg:rounded-2xl border border-slate-700/50 backdrop-blur-sm hover:border-purple-500/30 transition-all"
                  >
                    <div
                      className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full mt-1 sm:mt-1.5 flex-shrink-0 ${
                        log.action === 'Error'
                          ? 'bg-red-500 animate-pulse'
                          : log.action === 'Completion'
                            ? 'bg-green-500'
                            : log.action === 'Termination'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500'
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-1.5 sm:mb-2">
                        <span className="font-bold text-xs text-blue-300 bg-blue-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg border border-blue-500/30">
                          {log.agent}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{log.action}</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed break-words">
                        {log.reasoning}
                      </p>
                    </div>
                    <div className="text-xs text-slate-500 flex-shrink-0 font-mono hidden sm:block">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Wake Phrases Reference */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl sm:rounded-2xl lg:rounded-3xl shadow-2xl p-3 sm:p-4 md:p-6 lg:p-8 border border-purple-500/20">
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 md:mb-6">
              <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse flex-shrink-0"></div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Voice Detection Phrases
              </h2>
            </div>

            {/* General Phrases */}
            <div className="mb-4">
              <p className="text-xs text-slate-400 mb-2 font-medium">General Emergency:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  'help me',
                  'save me',
                  'emergency',
                  'call police',
                  'someone help',
                  'I need help',
                ].map((phrase) => (
                  <span
                    key={phrase}
                    className="px-3 py-1.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 rounded-lg text-xs font-bold"
                  >
                    &quot;{phrase}&quot;
                  </span>
                ))}
              </div>
            </div>

            {/* Fire Detection */}
            <div className="mb-4">
              <p className="text-xs text-red-400 mb-2 font-medium">Fire Detection → Crisis Page:</p>
              <div className="flex flex-wrap gap-2">
                {['fire', 'there is a fire', 'building is on fire'].map((phrase) => (
                  <span
                    key={phrase}
                    className="px-3 py-1.5 bg-red-500/20 text-red-300 border border-red-500/30 rounded-lg text-xs font-bold"
                  >
                    &quot;{phrase}&quot;
                  </span>
                ))}
              </div>
            </div>

            {/* Flood Detection */}
            <div className="mb-4">
              <p className="text-xs text-blue-400 mb-2 font-medium">
                Flood Detection → Crisis Page:
              </p>
              <div className="flex flex-wrap gap-2">
                {['flood', 'there is a flood', 'water is rising'].map((phrase) => (
                  <span
                    key={phrase}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg text-xs font-bold"
                  >
                    &quot;{phrase}&quot;
                  </span>
                ))}
              </div>
            </div>

            {/* Accident Detection */}
            <div className="mb-4">
              <p className="text-xs text-yellow-400 mb-2 font-medium">
                Accident Detection → Alert Page:
              </p>
              <div className="flex flex-wrap gap-2">
                {['accident', 'car accident', 'road accident'].map((phrase) => (
                  <span
                    key={phrase}
                    className="px-3 py-1.5 bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 rounded-lg text-xs font-bold"
                  >
                    &quot;{phrase}&quot;
                  </span>
                ))}
              </div>
            </div>

            {/* Abuse Detection */}
            <div className="mb-4">
              <p className="text-xs text-purple-400 mb-2 font-medium">
                Abuse/Violence Detection → Crisis Page:
              </p>
              <div className="flex flex-wrap gap-2">
                {['abuse', 'someone is hitting me', 'domestic violence'].map((phrase) => (
                  <span
                    key={phrase}
                    className="px-3 py-1.5 bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg text-xs font-bold"
                  >
                    &quot;{phrase}&quot;
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 sm:p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl sm:rounded-2xl backdrop-blur-sm">
              <p className="text-xs sm:text-sm text-purple-300 font-semibold leading-relaxed">
                🤖 Auto Mode: Say any phrase → AI analyzes → Routes to Crisis/Alert page →
                Auto-calls emergency services (ambulance, fire brigade, police)
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
