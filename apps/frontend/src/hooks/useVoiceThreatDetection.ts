'use client';

import { useState, useCallback, useRef } from 'react';
import axios from 'axios';

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  relationship: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address?: string;
}

interface ThreatResult {
  isThreat: boolean;
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  transcript: string;
  reasoning: string;
  emergencyType?: string;
  shouldTriggerSiren: boolean;
  shouldCallAmbulance: boolean;
}

interface CountdownData {
  countdownId: string;
  expiresAt: Date;
}

interface VoiceThreatState {
  isAnalyzing: boolean;
  threat: ThreatResult | null;
  countdown: CountdownData | null;
  sirenActive: boolean;
  error: string | null;
}

export function useVoiceThreatDetection() {
  const [state, setState] = useState<VoiceThreatState>({
    isAnalyzing: false,
    threat: null,
    countdown: null,
    sirenActive: false,
    error: null,
  });

  const audioRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  /**
   * Start recording audio for threat detection
   */
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      audioRecorderRef.current = mediaRecorder;

      return true;
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to access microphone',
      }));
      return false;
    }
  }, []);

  /**
   * Stop recording and analyze audio for threats
   */
  const stopRecordingAndAnalyze = useCallback(
    async (contacts: EmergencyContact[], location?: LocationData) => {
      if (!audioRecorderRef.current) {
        setState((prev) => ({
          ...prev,
          error: 'No active recording',
        }));
        return;
      }

      return new Promise<void>((resolve) => {
        audioRecorderRef.current!.onstop = async () => {
          setState((prev) => ({ ...prev, isAnalyzing: true, error: null }));

          try {
            // Create audio blob
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

            // Create form data
            const formData = new FormData();
            formData.append('audio', audioBlob, 'voice-recording.webm');
            formData.append('data', JSON.stringify({ contacts, location }));

            // Get auth token
            const token = localStorage.getItem('token') || localStorage.getItem('auth_token');

            // Send to backend for analysis
            const response = await axios.post(
              `${process.env.NEXT_PUBLIC_API_URL}/api/voice-threat/analyze`,
              formData,
              {
                headers: {
                  'Content-Type': 'multipart/form-data',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              }
            );

            if (response.data.success) {
              const threat: ThreatResult = {
                isThreat: response.data.isThreat,
                threatLevel: response.data.threatLevel,
                confidence: response.data.confidence,
                transcript: response.data.transcript,
                reasoning: response.data.reasoning,
                emergencyType: response.data.emergencyType,
                shouldTriggerSiren: response.data.shouldTriggerSiren,
                shouldCallAmbulance: response.data.shouldCallAmbulance,
              };

              console.log('🤖 Voice analysis result:', threat);

              setState((prev) => ({
                ...prev,
                isAnalyzing: false,
                threat,
                sirenActive: threat.shouldTriggerSiren,
              }));
            } else {
              setState((prev) => ({
                ...prev,
                isAnalyzing: false,
                error: response.data.error || 'Analysis failed',
              }));
            }
          } catch (error) {
            setState((prev) => ({
              ...prev,
              isAnalyzing: false,
              error: 'Failed to analyze voice',
            }));
          } finally {
            // Clean up
            audioChunksRef.current = [];
            resolve();
          }
        };

        audioRecorderRef.current!.stop();
        audioRecorderRef.current!.stream.getTracks().forEach((track) => track.stop());
      });
    },
    []
  );

  /**
   * Cancel emergency countdown (user is safe)
   */
  const cancelEmergency = useCallback(
    async (contacts: EmergencyContact[], location?: LocationData) => {
      if (!state.countdown) {
        return;
      }

      try {
        const response = await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}/api/voice-threat/cancel`,
          {
            countdownId: state.countdown.countdownId,
            contacts,
            location,
          },
          {
            withCredentials: true,
          }
        );

        if (response.data.success) {
          setState((prev) => ({
            ...prev,
            threat: null,
            countdown: null,
            sirenActive: false,
          }));
        }
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: 'Failed to cancel emergency',
        }));
      }
    },
    [state.countdown]
  );

  /**
   * Stop siren manually
   */
  const stopSiren = useCallback(async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/voice-threat/stop-siren`,
        {},
        {
          withCredentials: true,
        }
      );

      setState((prev) => ({
        ...prev,
        sirenActive: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: 'Failed to stop siren',
      }));
    }
  }, []);

  /**
   * Get current status
   */
  const getStatus = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/voice-threat/status`,
        {
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          sirenActive: response.data.data.sirenActive,
          countdown: response.data.data.activeCountdown
            ? { countdownId: response.data.data.activeCountdown, expiresAt: new Date() }
            : null,
        }));
      }
    } catch (error) {
      console.error('Failed to get status:', error);
    }
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      isAnalyzing: false,
      threat: null,
      countdown: null,
      sirenActive: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    startRecording,
    stopRecordingAndAnalyze,
    cancelEmergency,
    stopSiren,
    getStatus,
    reset,
  };
}
