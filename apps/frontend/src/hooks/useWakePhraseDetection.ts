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
  error: string | null;
}

const DETECTION_THRESHOLD = 0.6;
const COOLDOWN_MS = 2000;
const MOBILE_RESTART_DELAY = 300;

// Detect if running as installed PWA on mobile (safe for SSR)
function isMobilePWA(): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true;
  return isMobile || isStandalone;
}

// Centralized category mapping — matches backend/src/prompts/index.ts
function classifyPhrase(phrase: string): EmergencyCategory {
  const p = phrase.toLowerCase();
  if (p.includes('fire') || p.includes('burning') || p.includes('smoke')) return 'fire';
  if (p.includes('flood') || p.includes('water') || p.includes('drowning')) return 'flood';
  if (p.includes('accident') || p.includes('crash') || p.includes('collision')) return 'accident';
  if (p.includes('abuse') || p.includes('hitting') || p.includes('violence') || p.includes('stop'))
    return 'abuse';
  if (
    p.includes('ambulance') ||
    p.includes('heart') ||
    p.includes('breathe') ||
    p.includes('chest') ||
    p.includes('collapse')
  )
    return 'medical';
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
    error: null,
  });

  const lastDetectionTimeRef = useRef<number>(0);
  const recognitionRef = useRef<any>(null);
  const isDetectingRef = useRef<boolean>(false);
  const restartCountRef = useRef<number>(0);
  const maxRestarts = isMobilePWA() ? 10 : 5;

  // Create SpeechRecognition ONCE on mount
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser');
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition not supported. Use Chrome or Edge.',
      }));
      return;
    }

    const recognition = new SpeechRecognition();

    // Mobile PWA: use slightly different settings for reliability
    if (isMobilePWA()) {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
    } else {
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 3;
    }

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
              console.log(
                `✅ WAKE PHRASE DETECTED: "${wakePhrase}" (confidence: ${confidence.toFixed(2)})`
              );
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
                error: null,
              }));

              return;
            }
          }
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);

      // On mobile, 'not-allowed' means mic permission denied
      if (event.error === 'not-allowed') {
        setState((prev) => ({
          ...prev,
          error: 'Microphone permission denied. Please allow microphone access.',
        }));
        isDetectingRef.current = false;
        return;
      }

      // 'network' error common on mobile — restart after delay
      if (event.error === 'network') {
        setState((prev) => ({
          ...prev,
          error: 'Network error. Speech recognition needs internet.',
        }));
        return;
      }

      // These errors are non-fatal, just continue
      if (event.error === 'no-speech' || event.error === 'aborted') {
        return;
      }
    };

    recognition.onend = () => {
      // Auto-restart if still detecting — with mobile retry logic
      if (isDetectingRef.current) {
        restartCountRef.current++;

        if (restartCountRef.current > maxRestarts) {
          console.warn('Speech recognition restart limit reached');
          setState((prev) => ({
            ...prev,
            error: 'Speech recognition stopped. Tap "Start" to restart.',
          }));
          isDetectingRef.current = false;
          setState((prev) => ({ ...prev, isDetecting: false }));
          return;
        }

        // Mobile needs a small delay before restart
        const delay = isMobilePWA() ? MOBILE_RESTART_DELAY : 100;
        setTimeout(() => {
          if (isDetectingRef.current) {
            try {
              recognition.start();
              console.log('🎤 Speech recognition restarted (attempt', restartCountRef.current, ')');
            } catch (error) {
              console.error('Failed to restart recognition:', error);
              // On mobile, try creating a new instance
              if (isMobilePWA()) {
                isDetectingRef.current = false;
                setState((prev) => ({ ...prev, isDetecting: false }));
              }
            }
          }
        }, delay);
      }
    };

    recognition.onspeechstart = () => {
      console.log('🎤 Speech detected, listening...');
    };

    recognitionRef.current = recognition;
    console.log('🎤 SpeechRecognition initialized, mobile:', isMobilePWA());

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
      setState((prev) => ({
        ...prev,
        error: 'Speech recognition not available in this browser.',
      }));
      return;
    }

    // Reset restart counter
    restartCountRef.current = 0;

    try {
      recognitionRef.current.start();
      isDetectingRef.current = true;
      setState((prev) => ({ ...prev, isDetecting: true, error: null }));
      console.log('🎤 Wake phrase detection started');
    } catch (error: any) {
      // If already started, stop and restart
      if (error.message?.includes('already started')) {
        try {
          recognitionRef.current.stop();
          setTimeout(() => {
            try {
              recognitionRef.current?.start();
              isDetectingRef.current = true;
              setState((prev) => ({ ...prev, isDetecting: true, error: null }));
            } catch {}
          }, 200);
        } catch {}
      } else {
        console.error('Failed to start wake phrase detection:', error);
        setState((prev) => ({
          ...prev,
          error: `Failed to start: ${error.message}`,
        }));
      }
    }
  }, []);

  const stopDetection = useCallback(() => {
    isDetectingRef.current = false;
    restartCountRef.current = 0;
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
    restartCountRef.current = 0;
    setState({
      isDetecting: false,
      lastDetection: null,
      detectionCount: 0,
      error: null,
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
