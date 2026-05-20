import { useState, useCallback, useRef, useEffect } from 'react';

export type EmergencyCategory = 'fire' | 'flood' | 'accident' | 'abuse' | 'medical' | 'general';

interface WakePhraseDetection {
  phrase: string;
  confidence: number;
  timestamp: Date;
  category: EmergencyCategory;
}

interface WakePhraseState {
  isDetecting: boolean;
  lastDetection: WakePhraseDetection | null;
  detectionCount: number;
}

const DETECTION_THRESHOLD = 0.6;
const COOLDOWN_MS = 2000;

// Centralized category mapping — matches backend/src/prompts/index.ts
function classifyPhrase(phrase: string): EmergencyCategory {
  const p = phrase.toLowerCase();
  if (p.includes('fire') || p.includes('burning') || p.includes('smoke')) return 'fire';
  if (p.includes('flood') || p.includes('water') || p.includes('drowning')) return 'flood';
  if (p.includes('accident') || p.includes('crash') || p.includes('collision')) return 'accident';
  if (p.includes('abuse') || p.includes('hitting') || p.includes('violence') || p.includes('stop')) return 'abuse';
  if (p.includes('ambulance') || p.includes('heart') || p.includes('breathe') || p.includes('chest') || p.includes('collapse')) return 'medical';
  return 'general';
}

// Wake phrases — must match what UI shows
// Centralized: matches backend/src/prompts/index.ts
const WAKE_PHRASES = [
  // General emergency
  'help me',
  'save me',
  'emergency',
  'call police',
  'someone help',
  'i need help',
  // Fire
  'fire',
  'there is a fire',
  'building is on fire',
  'fire fire',
  'burning',
  'smoke',
  // Flood
  'flood',
  'there is a flood',
  'water is rising',
  'drowning',
  'water',
  // Accident
  'accident',
  'car accident',
  'road accident',
  'there has been an accident',
  'crash',
  'collision',
  // Abuse
  'abuse',
  'someone is hitting me',
  'domestic violence',
  'stop hitting',
  'help me please',
  // Medical
  'call ambulance',
  'heart attack',
  'cant breathe',
  'chest pain',
  'collapse',
  // Fire brigade
  'call fire brigade',
];

export function useWakePhraseDetection() {
  const [state, setState] = useState<WakePhraseState>({
    isDetecting: false,
    lastDetection: null,
    detectionCount: 0,
  });

  const lastDetectionTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isDetectingRef = useRef<boolean>(false);

  // Create SpeechRecognition ONCE on mount
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
        // Check all alternatives, not just result[0]
        for (let alt = 0; alt < result.length; alt++) {
          const transcript = result[alt].transcript.toLowerCase().trim();
          const confidence = result[alt].confidence;

          console.log(`🎤 Speech [alt=${alt}, conf=${confidence.toFixed(2)}]: "${transcript}"`);

          for (const wakePhrase of WAKE_PHRASES) {
            if (transcript.includes(wakePhrase) && confidence >= DETECTION_THRESHOLD) {
              console.log(`✅ WAKE PHRASE DETECTED: "${wakePhrase}" (confidence: ${confidence.toFixed(2)})`);
              lastDetectionTimeRef.current = now;

              const detection: WakePhraseDetection = {
                phrase: wakePhrase,
                confidence,
                timestamp: new Date(),
                category: classifyPhrase(wakePhrase),
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
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
    };

    recognition.onend = () => {
      // Use ref to avoid stale closure
      if (isDetectingRef.current) {
        try {
          recognition.start();
        } catch (error) {
          console.error('Failed to restart recognition:', error);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isDetectingRef.current = false;
      try {
        recognition.stop();
      } catch {}
    };
  }, []); // Empty deps — create once

  const startDetection = useCallback(() => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not initialized');
      return;
    }

    try {
      recognitionRef.current.start();
      isDetectingRef.current = true;
      setState((prev) => ({ ...prev, isDetecting: true }));
      console.log('🎤 Wake phrase detection started');
    } catch (error) {
      console.error('Failed to start wake phrase detection:', error);
    }
  }, []);

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
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
    isDetectingRef.current = false;
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
