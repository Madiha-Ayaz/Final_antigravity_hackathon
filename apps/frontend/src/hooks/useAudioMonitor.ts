import { useState, useEffect, useCallback, useRef } from 'react';

interface AudioConfig {
  sampleRate: number;
  channels: number;
  bufferDuration: number;
}

interface AudioState {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  audioLevel: number;
}

const DEFAULT_CONFIG: AudioConfig = {
  sampleRate: 16000,
  channels: 1,
  bufferDuration: 15,
};

export function useAudioMonitor(config: Partial<AudioConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };

  const [state, setState] = useState<AudioState>({
    isListening: false,
    isSupported: false,
    error: null,
    audioLevel: 0,
  });

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioBufferRef = useRef<Float32Array[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const isSupported =
      typeof window !== 'undefined' &&
      'AudioContext' in window &&
      'mediaDevices' in navigator &&
      'getUserMedia' in navigator.mediaDevices;

    setState((prev) => ({ ...prev, isSupported }));

    return () => {
      stopListening();
    };
  }, []);

  const startListening = useCallback(async () => {
    if (!state.isSupported) {
      setState((prev) => ({
        ...prev,
        error: 'Audio monitoring not supported in this browser',
      }));
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: fullConfig.sampleRate,
          channelCount: fullConfig.channels,
        },
      });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass({ sampleRate: fullConfig.sampleRate });
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);

      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      mediaStreamRef.current = stream;

      setState((prev) => ({
        ...prev,
        isListening: true,
        error: null,
      }));

      monitorAudioLevel();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to access microphone';
      setState((prev) => ({
        ...prev,
        error: errorMessage,
        isListening: false,
      }));
    }
  }, [state.isSupported, fullConfig.sampleRate, fullConfig.channels]);

  const stopListening = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    audioBufferRef.current = [];

    setState((prev) => ({
      ...prev,
      isListening: false,
      audioLevel: 0,
    }));
  }, []);

  const monitorAudioLevel = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const normalized = (dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / dataArray.length);
    const audioLevel = Math.min(100, Math.floor(rms * 100));

    setState((prev) => ({ ...prev, audioLevel }));

    animationFrameRef.current = requestAnimationFrame(monitorAudioLevel);
  }, []);

  const getAudioBuffer = useCallback((): Float32Array[] => {
    return [...audioBufferRef.current];
  }, []);

  const clearAudioBuffer = useCallback(() => {
    audioBufferRef.current = [];
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    getAudioBuffer,
    clearAudioBuffer,
  };
}
