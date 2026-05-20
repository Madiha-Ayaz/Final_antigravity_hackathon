'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sirenService } from '@/services/siren.service';
import EmergencyMessageEditor from '@/components/EmergencyMessageEditor';
import { useGPSLocation } from '@/hooks/useGPSLocation';
import { Navbar } from '@/components/layout/Navbar';

interface AnalysisLog {
  id: string;
  timestamp: string;
  transcript: string;
  emergencyDetected: boolean;
  confidence: number;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasoning: string;
  category?: string;
}

interface AlertLog {
  id: string;
  timestamp: string;
  message: string;
  status: 'sent' | 'failed';
  type: 'whatsapp' | 'sms' | 'call';
  recipient?: string;
  details?: string;
}

interface WhatsAppMessage {
  id: string;
  timestamp: string;
  direction: 'incoming' | 'outgoing';
  from: string;
  to: string;
  message: string;
  status: 'delivered' | 'sent' | 'failed' | 'pending';
}

export default function SilentSirenPage() {
  const [isActive, setIsActive] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSendingManualAlert, setIsSendingManualAlert] = useState(false);
  const [analysisLogs, setAnalysisLogs] = useState<AnalysisLog[]>([]);
  const [alertLogs, setAlertLogs] = useState<AlertLog[]>([]);
  const [whatsappMessages, setWhatsappMessages] = useState<WhatsAppMessage[]>([]);
  const [countdown, setCountdown] = useState(10);
  const [showMessageEditor, setShowMessageEditor] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [lastEmergencyData, setLastEmergencyData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'whatsapp' | 'alerts'>('analysis');
  const { location, getCurrentLocation } = useGPSLocation();

  // Refs
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Detect emergency category from transcript
  const detectCategoryFromTranscript = (transcript: string): string => {
    const t = transcript.toLowerCase();
    if (t.includes('fire') || t.includes('burning') || t.includes('smoke')) return 'fire';
    if (t.includes('flood') || t.includes('water') || t.includes('drowning')) return 'flood';
    if (t.includes('accident') || t.includes('crash') || t.includes('collision')) return 'accident';
    if (t.includes('abuse') || t.includes('hitting') || t.includes('violence') || t.includes('help')) return 'abuse';
    return 'general';
  };

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
      setIsActive(true);

      // Try to get microphone - if denied, still allow manual panic mode
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        // Start real-time volume level visualizer
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

        // Start continuous 10-second MediaRecorder loop
        startRecordingSession();

        // Start the 10-second countdown display
        setCountdown(10);
        countdownIntervalRef.current = setInterval(() => {
          setCountdown((prev) => (prev <= 1 ? 10 : prev - 1));
        }, 1000);

      } catch (micErr: any) {
        console.warn('Microphone not available, running in manual-only mode:', micErr.message);
        // Still activate protection - user can use manual panic button
        addAlertLog({
          message: 'Microphone not available - Manual panic mode active',
          status: 'sent',
          type: 'whatsapp',
        });
      }

    } catch (err: any) {
      console.error('Failed to start protection:', err);
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

      // Use Next.js API route (avoids CORS and auth issues)
      const res = await fetch('/api/analyze-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64Audio, mimeType }),
      });

      const data = await res.json();
      if (data.success && data.analysis) {
        const analysis = data.analysis;
        const category = detectCategoryFromTranscript(analysis.transcript || '');
        const newLog: AnalysisLog = {
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          transcript: analysis.transcript || 'No transcript',
          emergencyDetected: analysis.emergencyDetected || false,
          confidence: analysis.confidence || 0,
          threatLevel: analysis.threatLevel || 'LOW',
          reasoning: analysis.reasoning || '',
          category,
        };

        setAnalysisLogs((prev) => [newLog, ...prev].slice(0, 50));

        // Emergency detected - trigger actions
        if (newLog.emergencyDetected) {
          sirenService.playSiren();

          try {
            await getCurrentLocation();
          } catch (err) {
            console.error('Failed to get GPS location:', err);
          }

          const message = `🚨 *EMERGENCY ALERT* 🚨\n\n*Category:* ${category.toUpperCase()}\n*Threat Level:* ${newLog.threatLevel}\n*Transcript:* "${newLog.transcript}"\n*Reasoning:* ${newLog.reasoning}\n*Confidence:* ${(newLog.confidence * 100).toFixed(0)}%\n\n*Time:* ${new Date().toLocaleString()}\n\nThis is an automated alert from SilentSiren AI.`;

          setEmergencyMessage(message);
          setLastEmergencyData(newLog);
          setShowMessageEditor(true);

          // Auto-dispatch WhatsApp via TextMeBot
          try {
            const dispatchRes = await fetch('/api/dispatch-textmebot', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: message }),
            });
            const dispatchData = await dispatchRes.json();

            addWhatsAppMessage({
              direction: 'outgoing',
              from: 'SilentSiren AI',
              to: '923343717260',
              message: `Threat: "${newLog.transcript}" (${newLog.threatLevel})`,
              status: dispatchData.success ? 'delivered' : 'failed',
            });

            addAlertLog({
              message: dispatchData.success ? 'WhatsApp alert sent via TextMeBot' : 'WhatsApp dispatch failed',
              status: dispatchData.success ? 'sent' : 'failed',
              type: 'whatsapp',
            });

            // Store in Neon DB via backend
            const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const storeData = {
              transcript: newLog.transcript,
              threatLevel: newLog.threatLevel,
              confidence: newLog.confidence,
              category,
              reasoning: newLog.reasoning,
              whatsappSent: dispatchData.success,
              location: location ? { lat: location.latitude, lng: location.longitude } : null,
            };

            // Store in voice_alerts
            fetch(`${API_URL}/api/voice-threat/store-alert`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(storeData),
            }).catch(() => {});

            // Store in emergency_events
            fetch(`${API_URL}/api/neon/emergency-events`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventType: 'voice_detection',
                threatLevel: newLog.threatLevel,
                confidence: newLog.confidence,
                transcript: newLog.transcript,
                reasoning: newLog.reasoning,
                category,
                latitude: location?.latitude,
                longitude: location?.longitude,
                contactsNotified: 1,
                whatsappSent: dispatchData.success,
              }),
            }).catch(() => {});

            // Log dispatch
            fetch(`${API_URL}/api/neon/dispatch-logs`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                dispatchType: 'whatsapp',
                recipientPhone: '923343717260',
                recipientName: 'Emergency Contact',
                message: `Threat: "${newLog.transcript}"`,
                threatLevel: newLog.threatLevel,
                latitude: location?.latitude,
                longitude: location?.longitude,
                status: dispatchData.success ? 'sent' : 'failed',
                provider: 'textmebot',
              }),
            }).catch(() => {});

          } catch (dispatchErr) {
            console.error('WhatsApp dispatch failed:', dispatchErr);
          }

          // Auto-call emergency services based on category
          if (category === 'fire' || category === 'flood' || category === 'abuse' || category === 'accident') {
            addWhatsAppMessage({
              direction: 'outgoing',
              from: 'SilentSiren AI',
              to: 'Emergency Services',
              message: `Auto-dispatching ${category} emergency response...`,
              status: 'sent',
            });
          }
        }
      } else {
        // API returned error
        addAlertLog({
          message: `Gemini analysis error: ${data.error || 'Unknown error'}`,
          status: 'failed',
          type: 'whatsapp',
        });
      }
    } catch (err: any) {
      console.error('Audio analysis failed:', err);
      addAlertLog({
        message: `Analysis error: ${err.message}`,
        status: 'failed',
        type: 'whatsapp',
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addAlertLog = (log: Omit<AlertLog, 'id' | 'timestamp'>) => {
    const newLog: AlertLog = {
      ...log,
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setAlertLogs((prev) => [newLog, ...prev].slice(0, 50));
  };

  const addWhatsAppMessage = (msg: Omit<WhatsAppMessage, 'id' | 'timestamp'>) => {
    const newMsg: WhatsAppMessage = {
      ...msg,
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
    };
    setWhatsappMessages((prev) => [newMsg, ...prev].slice(0, 50));
  };

  const handleManualPanicTrigger = async () => {
    try {
      setIsSendingManualAlert(true);
      sirenService.playSiren();

      let gpsLocation = null;
      try {
        gpsLocation = await getCurrentLocation();
      } catch (err) {
        console.error('Failed to get GPS location:', err);
      }

      const locationText = gpsLocation
        ? `\n📍 *GPS Location:*\nhttps://www.google.com/maps?q=${gpsLocation.latitude},${gpsLocation.longitude}`
        : '';

      const text = `🚨 *MANUAL PANIC ALERT* 🚨\n\n*Emergency Triggered Manually!*\nSilent Siren user has requested immediate help.\n\n*Time:* ${new Date().toLocaleString()}${locationText}\n\nThis is an automated alert from SilentSiren AI.`;

      setEmergencyMessage(text);
      setShowMessageEditor(true);

      // Send WhatsApp via TextMeBot
      try {
        const dispatchRes = await fetch('/api/dispatch-textmebot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
        const dispatchData = await dispatchRes.json();

        addWhatsAppMessage({
          direction: 'outgoing',
          from: 'User (Manual)',
          to: '923343717260',
          message: 'MANUAL PANIC ALERT triggered',
          status: dispatchData.success ? 'delivered' : 'failed',
        });

        addAlertLog({
          message: dispatchData.success ? 'Panic alert sent via WhatsApp' : 'WhatsApp dispatch failed',
          status: dispatchData.success ? 'sent' : 'failed',
          type: 'whatsapp',
        });

        // Store in Neon DB
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const storeData = {
          transcript: 'MANUAL PANIC ALERT',
          threatLevel: 'CRITICAL',
          confidence: 1.0,
          category: 'manual',
          reasoning: 'User triggered manual panic button',
          whatsappSent: dispatchData.success,
          location: gpsLocation ? { lat: gpsLocation.latitude, lng: gpsLocation.longitude } : null,
        };

        // Store in voice_alerts
        fetch(`${API_URL}/api/voice-threat/store-alert`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(storeData),
        }).catch(() => {});

        // Store in emergency_events
        fetch(`${API_URL}/api/neon/emergency-events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            eventType: 'manual_panic',
            threatLevel: 'CRITICAL',
            confidence: 1.0,
            transcript: 'MANUAL PANIC ALERT',
            reasoning: 'User triggered manual panic button',
            category: 'manual',
            latitude: gpsLocation?.latitude,
            longitude: gpsLocation?.longitude,
            contactsNotified: 1,
            whatsappSent: dispatchData.success,
          }),
        }).catch(() => {});

        // Log dispatch
        fetch(`${API_URL}/api/neon/dispatch-logs`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            dispatchType: 'whatsapp',
            recipientPhone: '923343717260',
            recipientName: 'Emergency Contact',
            message: 'MANUAL PANIC ALERT',
            threatLevel: 'CRITICAL',
            latitude: gpsLocation?.latitude,
            longitude: gpsLocation?.longitude,
            status: dispatchData.success ? 'sent' : 'failed',
            provider: 'textmebot',
          }),
        }).catch(() => {});
      } catch (dispatchErr) {
        console.error('WhatsApp dispatch failed:', dispatchErr);
      }

    } catch (err: any) {
      console.error('Manual alert failed:', err);
    } finally {
      setIsSendingManualAlert(false);
    }
  };

  const handleSendEmergencyMessage = async (message: string, location?: { latitude: number; longitude: number }) => {
    try {
      let finalMessage = message;
      if (location) {
        finalMessage += `\n\n📍 *GPS Location:*\nhttps://www.google.com/maps?q=${location.latitude},${location.longitude}`;
      }

      addWhatsAppMessage({
        direction: 'outgoing',
        from: 'SilentSiren AI',
        to: '923343717260',
        message: finalMessage.substring(0, 100) + '...',
        status: 'pending',
      });

      // Send via TextMeBot
      const res = await fetch('/api/dispatch-textmebot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: finalMessage }),
      });

      const data = await res.json();
      const success = data.success;

      addAlertLog({
        message: success ? 'WhatsApp Alert sent successfully via TextMeBot' : 'Failed to send WhatsApp alert',
        status: success ? 'sent' : 'failed',
        type: 'whatsapp',
      });

      // Update last WhatsApp message status
      setWhatsappMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[0] = { ...updated[0], status: success ? 'delivered' : 'failed' };
        }
        return updated;
      });

      // Store in Neon DB
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      fetch(`${API_URL}/api/voice-threat/store-alert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: lastEmergencyData?.transcript || 'Manual alert',
          threatLevel: lastEmergencyData?.threatLevel || 'HIGH',
          confidence: lastEmergencyData?.confidence || 0.9,
          category: lastEmergencyData?.category || 'general',
          reasoning: lastEmergencyData?.reasoning || 'User sent manual alert',
          whatsappSent: success,
          location: location ? { lat: location.latitude, lng: location.longitude } : null,
        }),
      }).catch(() => {});

      setShowMessageEditor(false);
      sirenService.stopSiren();
    } catch (err: any) {
      console.error('Failed to send emergency message:', err);
      addAlertLog({
        message: `Send error: ${err.message}`,
        status: 'failed',
        type: 'whatsapp',
      });
    }
  };

  // SVG Icons
  const Icons = {
    shield: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    alert: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    microphone: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
    ),
    brain: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    whatsapp: (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    send: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    check: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    x: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    clock: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    play: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    stop: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
      </svg>
    ),
    fire: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
      </svg>
    ),
    signal: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.789m13.788 0c3.808 3.808 3.808 9.981 0 13.79M12 12h.008v.007H12V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
      </svg>
    ),
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return { bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' };
      case 'HIGH': return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
      case 'MEDIUM': return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
      default: return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    }
  };

  return (
    <>
      <Navbar isAuthenticated={true} />
      {showMessageEditor && (
        <EmergencyMessageEditor
          initialMessage={emergencyMessage}
          onSend={handleSendEmergencyMessage}
          autoSendDelay={180}
        />
      )}

      <div className="min-h-screen bg-slate-950 text-white">
        {/* Background Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-red-600 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] bg-purple-600 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 relative z-10">
          {/* Header */}
          <header className="flex flex-col sm:flex-row items-center justify-between bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 sm:p-6 backdrop-blur-md gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-xl flex items-center justify-center">
                {Icons.alert}
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-400">
                  SilentSiren Alert Hub
                </h1>
                <p className="text-slate-400 text-xs">Voice Monitoring + AI Analysis + WhatsApp Alerts</p>
              </div>
            </div>

            <button
              onClick={isActive ? stopProtection : startProtection}
              className={`w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm transition-all transform hover:scale-105 shadow-xl flex items-center justify-center gap-2 ${
                isActive
                  ? 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/25'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/25'
              }`}
            >
              {isActive ? Icons.stop : Icons.play}
              {isActive ? 'Stop Protection' : 'Start Protection'}
            </button>
          </header>

          {/* Main Content */}
          <main className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Audio Visualizer Panel */}
            <section className="lg:col-span-2 bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 sm:p-6 backdrop-blur-md space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-red-500 animate-ping' : 'bg-slate-500'}`} />
                  Live Audio Analyzer
                </h2>
                {isActive && (
                  <div className="text-xs font-semibold bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-lg text-slate-300 flex items-center gap-2">
                    {Icons.clock}
                    Next: <span className="font-mono text-red-400">{countdown}s</span>
                  </div>
                )}
              </div>

              {/* Waveform */}
              <div className="h-32 sm:h-40 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center relative overflow-hidden">
                {!isActive ? (
                  <div className="text-center text-slate-500 space-y-2">
                    <div className="flex justify-center">{Icons.microphone}</div>
                    <p className="text-sm font-semibold">Monitoring Standby</p>
                    <p className="text-xs">Click Start Protection to begin</p>
                  </div>
                ) : (
                  <div className="w-full h-full flex items-center justify-center gap-1 px-4">
                    {Array.from({ length: 32 }).map((_, i) => {
                      const randomScale = (audioLevel / 100) * (Math.sin(i * 0.3) + 1.2) * 1.5;
                      return (
                        <motion.div
                          key={i}
                          animate={{
                            height: `${Math.max(4, Math.min(120, randomScale * 50))}px`,
                            backgroundColor: audioLevel > 50 ? '#ef4444' : '#10b981',
                          }}
                          transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                          className="w-1.5 rounded-full"
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Volume + Panic */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {Icons.signal}
                  <div className="flex-1 sm:w-32 bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-100 ${audioLevel > 50 ? 'bg-red-400' : 'bg-emerald-400'}`}
                      style={{ width: `${audioLevel}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs font-bold w-10 text-right">{audioLevel}%</span>
                </div>

                <button
                  onClick={handleManualPanicTrigger}
                  disabled={isSendingManualAlert}
                  className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold rounded-xl shadow-xl transition-all transform hover:scale-105 disabled:opacity-50 flex items-center justify-center gap-2 border border-red-500/30 text-sm"
                >
                  {isSendingManualAlert ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      DISPATCHING...
                    </>
                  ) : (
                    <>
                      {Icons.alert}
                      PANIC TRIGGER
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* Device Status Panel */}
            <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 sm:p-6 backdrop-blur-md">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                {Icons.shield} Device Status
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                  <span className="text-slate-400 text-sm">Protection</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
                    {isActive ? Icons.shield : Icons.x}
                    {isActive ? 'SHIELDED' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                  <span className="text-slate-400 text-sm">WhatsApp</span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 text-green-400 flex items-center gap-1">
                    {Icons.whatsapp}
                    CONNECTED
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                  <span className="text-slate-400 text-sm">Gemini AI</span>
                  <span className="px-3 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-400 flex items-center gap-1">
                    {Icons.brain}
                    ONLINE
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-950/40 border border-slate-800/50 rounded-xl">
                  <span className="text-slate-400 text-sm">GPS</span>
                  <span className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 ${location ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                    {location ? Icons.check : Icons.clock}
                    {location ? 'LOCKED' : 'ACQUIRING'}
                  </span>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-600/20 to-cyan-600/20 rounded-xl border border-blue-500/20 text-center">
                  <div className="text-2xl font-black text-blue-400">{analysisLogs.length}</div>
                  <div className="text-[10px] text-slate-400">Scans</div>
                </div>
                <div className="p-3 bg-gradient-to-br from-red-600/20 to-orange-600/20 rounded-xl border border-red-500/20 text-center">
                  <div className="text-2xl font-black text-red-400">{analysisLogs.filter(l => l.emergencyDetected).length}</div>
                  <div className="text-[10px] text-slate-400">Threats</div>
                </div>
              </div>
            </section>
          </main>

          {/* Logs Section with Tabs */}
          <section className="bg-slate-900/40 border border-slate-800/60 rounded-2xl backdrop-blur-md overflow-hidden">
            {/* Tab Header */}
            <div className="flex border-b border-slate-800">
              {[
                { id: 'analysis', label: 'Gemini Analysis', icon: Icons.brain, count: analysisLogs.length },
                { id: 'whatsapp', label: 'WhatsApp Messages', icon: Icons.whatsapp, count: whatsappMessages.length },
                { id: 'alerts', label: 'Alert Dispatch', icon: Icons.send, count: alertLogs.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-white border-b-2 border-red-500 bg-slate-800/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/30'
                  }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.count > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-slate-700 rounded-full">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="p-4 sm:p-6 h-96 overflow-y-auto">
              {/* Analysis Logs */}
              {activeTab === 'analysis' && (
                <div className="space-y-3">
                  {isAnalyzing && (
                    <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <svg className="animate-spin h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span className="text-sm text-blue-300">Gemini analyzing 10s audio segment...</span>
                    </div>
                  )}
                  {analysisLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                      {Icons.brain}
                      <p className="mt-2 text-sm">No analysis cycles yet</p>
                      <p className="text-xs">Start protection to begin voice monitoring</p>
                    </div>
                  ) : (
                    analysisLogs.map((log) => {
                      const colors = getThreatColor(log.threatLevel);
                      return (
                        <div key={log.id} className={`p-4 rounded-xl border ${colors.border} ${colors.bg}`}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-mono text-xs text-slate-500 flex items-center gap-1">
                              {Icons.clock} {log.timestamp}
                            </span>
                            <div className="flex items-center gap-2">
                              {log.category && (
                                <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-700/50 rounded-full text-slate-300">
                                  {log.category.toUpperCase()}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${colors.bg} ${colors.text}`}>
                                {log.emergencyDetected ? `${log.threatLevel}` : 'SECURE'}
                              </span>
                            </div>
                          </div>
                          <p className="text-sm mb-1 text-slate-200">
                            <span className="text-slate-400">Transcript:</span> "{log.transcript}"
                          </p>
                          <p className="text-xs text-slate-400">{log.reasoning}</p>
                          {log.confidence > 0 && (
                            <div className="mt-2 flex items-center gap-2">
                              <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full ${log.confidence > 0.7 ? 'bg-red-400' : log.confidence > 0.4 ? 'bg-yellow-400' : 'bg-green-400'}`}
                                  style={{ width: `${log.confidence * 100}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-mono text-slate-400">{(log.confidence * 100).toFixed(0)}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* WhatsApp Messages */}
              {activeTab === 'whatsapp' && (
                <div className="space-y-3">
                  {whatsappMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                      {Icons.whatsapp}
                      <p className="mt-2 text-sm">No WhatsApp messages yet</p>
                      <p className="text-xs">Messages will appear here when sent/received</p>
                    </div>
                  ) : (
                    whatsappMessages.map((msg) => (
                      <div key={msg.id} className={`p-4 rounded-xl border ${
                        msg.direction === 'outgoing' ? 'bg-green-500/5 border-green-500/20' : 'bg-blue-500/5 border-blue-500/20'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              msg.direction === 'outgoing' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                            }`}>
                              {msg.direction === 'outgoing' ? 'SENT' : 'RECEIVED'}
                            </span>
                            <span className="text-xs text-slate-400">{msg.from} → {msg.to}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                              msg.status === 'delivered' ? 'bg-green-500/20 text-green-400' :
                              msg.status === 'sent' ? 'bg-blue-500/20 text-blue-400' :
                              msg.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {msg.status === 'delivered' ? Icons.check : msg.status === 'failed' ? Icons.x : Icons.clock}
                              {msg.status.toUpperCase()}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{msg.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-200">{msg.message}</p>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Alert Dispatch Logs */}
              {activeTab === 'alerts' && (
                <div className="space-y-3">
                  {alertLogs.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500 py-12">
                      {Icons.send}
                      <p className="mt-2 text-sm">No alert dispatches yet</p>
                      <p className="text-xs">Alerts will be logged here when triggered</p>
                    </div>
                  ) : (
                    alertLogs.map((log) => (
                      <div key={log.id} className={`p-4 rounded-xl border ${
                        log.status === 'sent' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20'
                      }`}>
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            {log.type === 'whatsapp' ? Icons.whatsapp : Icons.send}
                            <span className="text-xs text-slate-400">{log.type.toUpperCase()}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full flex items-center gap-1 ${
                              log.status === 'sent' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {log.status === 'sent' ? Icons.check : Icons.x}
                              {log.status.toUpperCase()}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{log.timestamp}</span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-200">{log.message}</p>
                        {log.details && (
                          <pre className="mt-2 p-2 bg-slate-950/60 border border-slate-800 rounded-lg text-[10px] font-mono overflow-x-auto text-slate-400 max-h-16">
                            {log.details}
                          </pre>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
