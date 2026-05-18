'use client';

import { useState, useEffect, useRef } from 'react';
import VoiceAnalysisIndicator from '@/components/VoiceAnalysisIndicator';

export default function VoiceMonitorTestPage() {
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs((prev) => [`[${timestamp}] ${message}`, ...prev].slice(0, 20));
  };

  const startListening = async () => {
    try {
      addLog('🎤 Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      addLog('✅ Microphone access granted');
      setIsListening(true);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        addLog('🔄 Processing audio...');
        setIsAnalyzing(true);

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();

        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];

          try {
            addLog('🤖 Sending to Gemini AI for analysis...');
            const response = await fetch('/api/analyze-audio', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio: base64Audio,
                mimeType: 'audio/webm',
              }),
            });

            const result = await response.json();

            if (result.success) {
              addLog('✅ Analysis complete!');
              setLastAnalysis(result.analysis);

              if (result.analysis.emergencyDetected) {
                addLog('🚨 EMERGENCY DETECTED!');
                addLog(`Threat Level: ${result.analysis.threatLevel}`);
                addLog(`Confidence: ${(result.analysis.confidence * 100).toFixed(0)}%`);

                if (result.alertSent) {
                  addLog('📱 WhatsApp alert sent successfully!');
                } else {
                  addLog('⚠️ WhatsApp alert not sent (check configuration)');
                }
              } else {
                addLog('✓ No emergency detected');
              }
            } else {
              addLog(`❌ Analysis failed: ${result.error}`);
            }
          } catch (error: any) {
            addLog(`❌ Error: ${error.message}`);
          } finally {
            setIsAnalyzing(false);
            chunksRef.current = [];
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      // Record for 5 seconds, then analyze
      mediaRecorder.start();
      addLog('🎙️ Recording audio (5 seconds)...');

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
          stream.getTracks().forEach((track) => track.stop());
        }
      }, 5000);
    } catch (error: any) {
      addLog(`❌ Microphone error: ${error.message}`);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
    addLog('⏹️ Stopped listening');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            🎤 Voice Monitor Test
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Test voice analysis with Gemini AI and automatic WhatsApp alerts
          </p>
        </div>

        {/* Control Panel */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            Control Panel
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Voice Monitoring</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isListening ? 'Recording audio for analysis...' : 'Click to start monitoring'}
                </p>
              </div>
              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isAnalyzing}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  isListening
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isListening ? '⏹️ Stop' : '🎤 Start Monitoring'}
              </button>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                📝 How to Test:
              </h4>
              <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
                <li>Click "Start Monitoring"</li>
                <li>Say emergency words: "Help me!", "Emergency!", "Fire!"</li>
                <li>Wait 5 seconds for recording to complete</li>
                <li>AI will analyze and send WhatsApp alert if emergency detected</li>
                <li>Check your WhatsApp: +923343717260</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Activity Logs */}
        <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
            📋 Activity Logs
          </h2>
          <div className="bg-gray-900 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm">
            {logs.length === 0 ? (
              <p className="text-gray-500">No activity yet. Start monitoring to see logs.</p>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="text-green-400 mb-1">
                  {log}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Configuration Info */}
        <div className="mt-6 p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
            ✅ Configuration Status
          </h3>
          <div className="text-sm text-green-800 dark:text-green-200 space-y-1">
            <p>• Gemini AI: gemini-2.5-flash ✓</p>
            <p>• TextMeBot API: Configured ✓</p>
            <p>• WhatsApp Number: +923343717260 ✓</p>
            <p>• Auto Alerts: Enabled ✓</p>
          </div>
        </div>
      </div>

      {/* Voice Analysis Indicator (Bottom Right) */}
      <VoiceAnalysisIndicator
        isListening={isListening}
        isAnalyzing={isAnalyzing}
        lastAnalysis={lastAnalysis}
      />
    </div>
  );
}
