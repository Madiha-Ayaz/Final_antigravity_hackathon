import { useState, useCallback, useRef, useEffect } from 'react';
import { WAKE_PHRASES } from '@silentsiren/shared-types';

interface WakePhraseDetection {
  phrase: string;
  confidence: number;
  timestamp: Date;
}

interface WakePhraseState {
  isDetecting: boolean;
  lastDetection: WakePhraseDetection | null;
  detectionCount: number;
}

const DETECTION_THRESHOLD = 0.7;
const COOLDOWN_MS = 2000;

export function useWakePhraseDetection() {
  const [state, setState] = useState<WakePhraseState>({
    isDetecting: false,
    lastDetection: null,
    detectionCount: 0,
  });

  const lastDetectionTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    recognition.maxAlternatives = 3;

    recognition.onresult = (event: any) => {
      const now = Date.now();
      if (now - lastDetectionTimeRef.current < COOLDOWN_MS) {
        return;
      }

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript.toLowerCase().trim();
        const confidence = result[0].confidence;

        for (const wakePhrase of WAKE_PHRASES) {
          if (transcript.includes(wakePhrase) && confidence >= DETECTION_THRESHOLD) {
            lastDetectionTimeRef.current = now;

            const detection: WakePhraseDetection = {
              phrase: wakePhrase,
              confidence,
              timestamp: new Date(),
            };

            setState((prev) => ({
              ...prev,
              lastDetection: detection,
              detectionCount: prev.detectionCount + 1,
            }));

            return;
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        return;
      }
      setState((prev) => ({ ...prev, isDetecting: false }));
    };

    recognition.onend = () => {
      if (state.isDetecting) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (error) {
          console.error('Error stopping recognition:', error);
        }
      }
    };
  }, [state.isDetecting]);

  const startDetection = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    try {
      recognitionRef.current.start();
      setState((prev) => ({ ...prev, isDetecting: true }));
    } catch (error) {
      console.error('Failed to start wake phrase detection:', error);
    }
  }, []);

  const stopDetection = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (error) {
        console.error('Error stopping detection:', error);
      }
    }
    setState((prev) => ({ ...prev, isDetecting: false }));
  }, []);

  const resetDetection = useCallback(() => {
    setState({
      isDetecting: false,
      lastDetection: null,
      detectionCount: 0,
    });
    lastDetectionTimeRef.current = 0;
  }, []);

  return {
    ...state,
    startDetection,
    stopDetection,
    resetDetection,
  };
}
