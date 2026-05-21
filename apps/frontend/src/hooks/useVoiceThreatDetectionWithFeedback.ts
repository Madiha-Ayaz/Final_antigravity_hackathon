'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import axios from 'axios';
import { sirenService } from '@/services/siren.service';

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  relationship: string;
  carrier?: string;
}

interface ThreatData {
  isThreat: boolean;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  transcript: string;
  reasoning: string;
  emergencyType?: string;
  audioUrl?: string;
}

interface AlertData {
  alertId: string;
  threatLevel: string;
  emergencyType: string;
  confidence: number;
  reasoning: string;
  expiresAt: Date;
}

export function useVoiceThreatDetectionWithFeedback() {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [threatDetected, setThreatDetected] = useState(false);
  const [threatData, setThreatData] = useState<ThreatData | null>(null);
  const [alertActive, setAlertActive] = useState(false);
  const [alertData, setAlertData] = useState<AlertData | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to record');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Update status message
  const updateStatus = useCallback((message: string) => {
    setStatusMessage(message);
    console.log('📊 Status:', message);
  }, []);

  // Start recording
  const startRecording = useCallback(async () => {
    try {
      updateStatus('🎤 Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      updateStatus('🎤 Recording started - Speak now!');
      sirenService.playBeep(); // Play beep to indicate start

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);
    } catch (err) {
      const errorMsg = 'Failed to access microphone. Please allow microphone permission.';
      setError(errorMsg);
      updateStatus('❌ ' + errorMsg);
      console.error('Recording error:', err);
    }
  }, [updateStatus]);

  // Stop recording and analyze
  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;

    updateStatus('⏹️ Stopping recording...');
    sirenService.playBeep(); // Play beep to indicate stop

    return new Promise<void>((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        setIsRecording(false);
        updateStatus('📦 Processing audio...');

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        console.log('📦 Audio blob size:', audioBlob.size, 'bytes');

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((track) => track.stop());

        // Analyze audio
        await analyzeAudio(audioBlob);
        resolve();
      };

      mediaRecorder.stop();
    });
  }, [updateStatus]);

  // Analyze audio with Gemini AI
  const analyzeAudio = useCallback(
    async (audioBlob: Blob) => {
      try {
        setIsAnalyzing(true);
        updateStatus('🤖 Sending to Gemini AI for analysis...');

        const formData = new FormData();
        formData.append('audio', audioBlob);

        console.log('📤 Sending audio to API...');

        const response = await axios.post('/api/voice-threat/analyze', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        console.log('📥 Analysis result:', response.data);

        const result: ThreatData = response.data;
        setThreatData(result);

        if (result.isThreat) {
          updateStatus(`⚠️ THREAT DETECTED: ${result.emergencyType} (${result.threatLevel})`);
          setThreatDetected(true);

          // Play siren
          console.log('🚨 Playing siren...');
          sirenService.playSiren();

          // Show notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚨 THREAT DETECTED!', {
              body: `${result.emergencyType} - ${result.threatLevel} level`,
              icon: '/icon.svg',
              requireInteraction: true,
            });
          }

          // AUTO-TRIGGER EMERGENCY ALERT (don't wait for manual button click)
          console.log('🚨 Auto-triggering emergency alert...');
          setTimeout(() => {
            triggerEmergencyInternal(result);
          }, 1000); // 1 second delay to show threat info first
        } else {
          updateStatus('✅ No threat detected - You are safe');
          setThreatDetected(false);
        }

        setIsAnalyzing(false);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to analyze audio';
        setError(errorMsg);
        updateStatus('❌ ' + errorMsg);
        setIsAnalyzing(false);
        console.error('Analysis error:', err);
      }
    },
    [updateStatus]
  );

  // Internal function to trigger emergency (can be called with data directly)
  const triggerEmergencyInternal = useCallback(
    async (data: ThreatData) => {
      try {
        updateStatus('🚨 Triggering emergency alert...');

        const response = await axios.post('/api/voice-threat/emergency/trigger', {
          sessionId: data.audioUrl || 'unknown',
          location: {
            latitude: 0,
            longitude: 0,
            accuracy: 0,
          },
        });

        const alert = response.data;
        setAlertData({
          alertId: alert.alertId,
          threatLevel: data.threatLevel,
          emergencyType: data.emergencyType || 'UNKNOWN',
          confidence: data.confidence,
          reasoning: data.reasoning,
          expiresAt: new Date(alert.expiresAt),
        });
        setAlertActive(true);
        setTimeRemaining(120);

        updateStatus('⏱️ 2-minute countdown started');

        // Start countdown
        countdownIntervalRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
              }
              updateStatus('🚨 Emergency activated - Alerts sent!');
              sendEmergencyAlerts(alert.alertId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } catch (err: any) {
        const errorMsg = err.response?.data?.message || 'Failed to trigger emergency';
        setError(errorMsg);
        updateStatus('❌ ' + errorMsg);
        console.error('Emergency trigger error:', err);
      }
    },
    [updateStatus]
  );

  // Trigger emergency alert (public function)
  const triggerEmergency = useCallback(async () => {
    if (!threatData) return;
    await triggerEmergencyInternal(threatData);
  }, [threatData, triggerEmergencyInternal]);

  // Confirm safe
  const confirmSafe = useCallback(async () => {
    if (!alertData) return;

    try {
      updateStatus('✅ Confirming safety...');

      await axios.post('/api/voice-threat/emergency/confirm-safe', {
        alertId: alertData.alertId,
      });

      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      sirenService.stopSiren();
      setAlertActive(false);
      setThreatDetected(false);
      updateStatus('✅ Safety confirmed - Alert cancelled');

      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('✅ Safety Confirmed', {
          body: 'Emergency alert has been cancelled',
          icon: '/icon.svg',
        });
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to confirm safety';
      setError(errorMsg);
      updateStatus('❌ ' + errorMsg);
      console.error('Confirm safe error:', err);
    }
  }, [alertData, updateStatus]);

  // Cancel alert
  const cancelAlert = useCallback(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    sirenService.stopSiren();
    setAlertActive(false);
    setThreatDetected(false);
    updateStatus('🔇 Alert cancelled');
  }, [updateStatus]);

  // Test siren
  const testSiren = useCallback(() => {
    updateStatus('🔊 Testing siren...');
    sirenService.testSiren();
    setTimeout(() => {
      updateStatus('✅ Siren test complete');
    }, 2000);
  }, [updateStatus]);

  // Send emergency alerts (SMS, WhatsApp, Calls)
  const sendEmergencyAlerts = useCallback(
    async (alertId: string) => {
      try {
        console.log('📱 Sending emergency alerts...');
        updateStatus('📱 Sending emergency alerts to contacts...');

        // Get user's location
        let location = { latitude: 0, longitude: 0 };
        if ('geolocation' in navigator) {
          try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };
            console.log('📍 Location obtained:', location);
          } catch (err) {
            console.warn('⚠️ Could not get location:', err);
          }
        }

        // Send alerts via API
        const response = await axios.post('/api/voice-threat/emergency/send-alerts', {
          alertId,
          location,
        });

        console.log('✅ Alerts sent:', response.data);
        updateStatus('✅ Emergency alerts sent to all contacts!');

        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 Emergency Alerts Sent', {
            body: 'All emergency contacts have been notified',
            icon: '/icon.svg',
          });
        }
      } catch (err: any) {
        console.error('❌ Failed to send alerts:', err);
        updateStatus('⚠️ Some alerts may have failed to send');
      }
    },
    [updateStatus]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
      sirenService.stopSiren();
    };
  }, []);

  return {
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
  };
}
