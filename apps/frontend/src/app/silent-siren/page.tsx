'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisLog {
  id: string;
  timestamp: string;
  transcript: string;
  emergencyDetected: boolean;
  confidence: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
}

interface AlertLog {
  id: string;
  timestamp: string;
  message: string;
  status: 'sent' | 'failed';
  details?: string;
}

export default function SilentSirenPage() {
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingManualAlert, setIsSendingManualAlert] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [countdown, setCountdown] = useState(10);
  
  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopProtection();
    };
  }, []);

  const blobToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const startProtection = async () => {
    try {
      setAudioLevel(0);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsActive(true);

      // 1. Start real-time volume level visualizer
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const percentage = Math.min(100, Math.round((average / 128) * 100));
        setAudioLevel(percentage);
        animationFrameIdRef.current = requestAnimationFrame(updateLevel);
      };
      
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      updateLevel();

      // 2. Start continuous 10-second MediaRecorder loop
      startRecordingSession();

      // Start the 10-second countdown display
      setCountdown(10);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
      }, 1000);

    } catch (err: any) {
      console.error('Failed to access microphone:', err);
      alert('Microphone access is required for Silent Siren protection. Please grant permissions and try again.');
    }
  };

  const startRecordingSession = () => {
    if (!streamRef.current) return;
    
    audioChunksRef.current = [];
    const options = { mimeType: 'audio/webm' };
    
    let recorder;
    try {
      recorder = new MediaRecorder(streamRef.current, options);
    } catch {
      // Fallback
      recorder = new MediaRecorder(streamRef.current);
    }

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        audioChunksRef.current.push(event.data);
      }
    };

    recorder.onstop = async () => {
      if (audioChunksRef.current.length > 0) {
        const audioBlob = new Blob(audioChunksRef.current, { type: recorder.mimeType });
        await analyzeAudioSegment(audioBlob, recorder.mimeType);
      }
    };

    mediaRecorderRef.current = recorder;
    recorder.start();

    // Set a 10-second interval to stop the current segment and process it
    intervalRef.current = setTimeout(() => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      // Instantly start next segment to avoid recording gaps
      if (isActive) {
        startRecordingSession();
      }
    }, 10000);
  };

  const stopProtection = () => {
    setIsActive(false);
    setAudioLevel(0);
    setCountdown(10);

    if (intervalRef.current) clearTimeout(intervalRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const analyzeAudioSegment = async (blob: Blob, mimeType: string) => {
    try {
      setIsAnalyzing(true);
      const base64Audio = await blobToBase64(blob);

      const res = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mimeType }),
      });

      const data = await res.json();
      if (data.success) {
        const newLog: AnalysisLog = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          transcript: data.analysis.transcript,
          emergencyDetected: data.analysis.emergencyDetected,
          confidence: data.analysis.confidence,
          threatLevel: data.analysis.threatLevel,
          reasoning: data.analysis.reasoning,
        };

        setAnalysisLogs((prev) => [newLog, ...prev].slice(0, 50));

        if (data.alertSent) {
          const newAlert: AlertLog = {
            id: Math.random().toString(),
            timestamp: new Date().toLocaleTimeString(),
            message: `🚨 Auto WhatsApp sent! Detected threat: "${data.analysis.transcript}"`,
            status: 'sent',
            details: JSON.stringify(data.alertResponse),
          };
          setAlertLogs((prev) => [newAlert, ...prev].slice(0, 50));
        }
      }
    } catch (err: any) {
      console.error('Audio analysis failed:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualPanicTrigger = async () => {
    try {
      setIsSendingManualAlert(true);
      const text = `🚨 *MANUAL PANIC ALERT* 🚨\n\n*Emergency Triggered Manually!*\nSilent Siren user has requested immediate help.\n\n📍 _Location tracking is active._`;

      const res = await fetch('/api/dispatch-textmebot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });

      const data = await res.json();
      const status = data.success ? 'sent' : 'failed';
      const details = data.success ? JSON.stringify(data.data) : data.error;

      const newAlert: AlertLog = {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: data.success ? '🚨 Manual WhatsApp Panic Alert dispatched successfully!' : '❌ Failed to send WhatsApp panic alert.',
        status,
        details,
      };

      setAlertLogs((prev) => [newAlert, ...prev].slice(0, 50));
    } catch (err: any) {
      console.error('Manual alert failed:', err);
    } finally {
      setIsSendingManualAlert(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-red-600 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-3xl p-8 backdrop-blur-md">
          <div className="text-center md:text-left space-y-2">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <span className="text-4xl">🚨</span>
              <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 via-orange-400 to-purple-400">
                SilentSiren Alert Hub
              </h1>
            </div>
            <p className="text-slate-400 text-sm md:text-base">
              Continuous Voice Monitoring • Intelligent Gemini Crisis Analysis • TextMeBot WhatsApp Alerts
            </p>
          </div>

          <button
            onClick={isActive ? stopProtection : startProtection}
            className={`mt-4 md:mt-0 px-8 py-4 rounded-2xl font-bold text-lg transition-all transform hover:scale-105 shadow-xl ${
              isActive
                ? 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 shadow-red-500/25'
                : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-500/25'
            }`}
          >
            {isActive ? '⏹ Stop Protection' : '▶️ Start Protection'}
          </button>
        </header>

        {/* Live Protection Status Visualizer */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Visualizer Panel */}
          <section className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span> Live Analyzer
              </h2>
              {isActive && (
                <div className="text-sm font-semibold bg-slate-800/60 border border-slate-700/50 px-4 py-2 rounded-xl text-slate-300">
                  Next Gemini check: <span className="font-mono text-red-400 text-base">{countdown}s</span>
                </div>
              )}
            </div>

            {/* Glowing Waveform Visualizer */}
            <div className="h-48 bg-slate-950/80 border border-slate-800 rounded-2xl flex items-center justify-center relative overflow-hidden">
              {!isActive ? (
                <div className="text-center text-slate-500 space-y-2">
                  <p className="text-lg font-semibold">Monitoring Standby</p>
                  <p className="text-xs">Click Start Protection above to begin microphone analysis</p>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center gap-[6px] px-8">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const randomScale = (audioLevel / 100) * (Math.sin(i * 0.3) + 1.2) * 1.5;
                    return (
                      <motion.div
                        key={i}
                        animate={{
                          height: isActive ? `${Math.max(8, Math.min(130, randomScale * 50))}px` : '8px',
                          backgroundColor: audioLevel > 50 ? '#ef4444' : '#10b981',
                        }}
                        transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                        className="w-2 rounded-full"
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Volume Status and Panic Button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="text-slate-400 font-semibold uppercase tracking-wider text-xs">Mic Volume</div>
                <div className="flex-1 md:w-32 bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-400 h-full transition-all duration-100"
                    style={{ width: `${audioLevel}%` }}
                  ></div>
                </div>
                <div className="font-mono text-sm font-bold w-12 text-right">{audioLevel}%</div>
              </div>

              <button
                onClick={handleManualPanicTrigger}
                disabled={isSendingManualAlert}
                className="w-full md:w-auto px-8 py-5 bg-gradient-to-r from-red-600 via-rose-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-extrabold rounded-2xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-red-500/30"
              >
                {isSendingManualAlert ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>DISPATCHING...</span>
                  </>
                ) : (
                  <>
                    <span>🚨</span>
                    <span>MANUAL PANIC TRIGGER</span>
                  </>
                )}
              </button>
            </div>
          </section>

          {/* Quick Stats Panel */}
          <section className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-md flex flex-col justify-between">
            <h3 className="text-2xl font-bold mb-4">Device Status</h3>
            
            <div className="space-y-4 my-auto">
              <div className="flex justify-between items-center p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
                <span className="text-slate-400 font-medium">Protection State</span>
                <span className={`px-4 py-1 rounded-xl text-xs font-bold ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                  {isActive ? 'SHIELDED' : 'OFFLINE'}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
                <span className="text-slate-400 font-medium">TextMeBot Service</span>
                <span className="px-4 py-1 rounded-xl text-xs font-bold bg-purple-500/20 text-purple-400">
                  CONNECTED
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-slate-950/40 border border-slate-800/50 rounded-2xl">
                <span className="text-slate-400 font-medium">Gemini 1.5 Flash</span>
                <span className="px-4 py-1 rounded-xl text-xs font-bold bg-blue-500/20 text-blue-400">
                  ONLINE
                </span>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-slate-500">
              Auto-saves base64 audio chunks securely in a 10s rolling buffer.
            </div>
          </section>
        </main>

        {/* Logs Console Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Gemini Analysis Logs */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>🧠</span> Gemini Audio Analysis logs
            </h3>
            
            <div className="h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {isAnalyzing && (
                <div className="flex items-center gap-3 p-4 bg-slate-950/60 border border-slate-800/50 rounded-2xl">
                  <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm text-slate-400">Gemini is parsing the latest 10s audio segment...</span>
                </div>
              )}
              {analysisLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm py-12">
                  No analysis cycles complete yet.
                </div>
              ) : (
                analysisLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border-2 transition-all ${
                      log.emergencyDetected
                        ? 'bg-red-950/20 border-red-500/40'
                        : 'bg-slate-950/40 border-slate-800/80'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs text-slate-500">{log.timestamp}</span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                        log.emergencyDetected
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {log.emergencyDetected ? `🚨 THREAT: ${log.threatLevel}` : '✓ SECURE'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold mb-1 text-slate-200">
                      Transcript: <span className="italic font-normal">"{log.transcript}"</span>
                    </p>
                    <p className="text-xs text-slate-400">{log.reasoning}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* WhatsApp Alerts Dispatch Console */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-3xl p-8 backdrop-blur-md">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <span>💬</span> TextMeBot WhatsApp Dispatch Logs
            </h3>

            <div className="h-80 overflow-y-auto space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
              {alertLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500 text-sm py-12">
                  No WhatsApp alert dispatches triggered yet.
                </div>
              ) : (
                alertLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-4 rounded-2xl border-2 ${
                      log.status === 'sent'
                        ? 'bg-emerald-950/10 border-emerald-500/30'
                        : 'bg-red-950/10 border-red-500/30'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-mono text-xs text-slate-500">{log.timestamp}</span>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-bold ${
                        log.status === 'sent'
                          ? 'bg-emerald-500/25 text-emerald-400'
                          : 'bg-red-500/25 text-red-400'
                      }`}>
                        {log.status === 'sent' ? '✓ DELIVERED' : '❌ FAILED'}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-200">{log.message}</p>
                    {log.details && (
                      <pre className="mt-2 p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-[10px] font-mono overflow-x-auto text-slate-400 max-h-16">
                        {log.details}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
