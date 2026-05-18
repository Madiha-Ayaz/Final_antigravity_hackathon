import { useRef, useCallback, useEffect } from 'react';

interface AudioBufferConfig {
  maxDuration: number;
  sampleRate: number;
  channels: number;
}

const DEFAULT_CONFIG: AudioBufferConfig = {
  maxDuration: 15,
  sampleRate: 16000,
  channels: 1,
};

export function useRollingAudioBuffer(config: Partial<AudioBufferConfig> = {}) {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const maxSamples = fullConfig.maxDuration * fullConfig.sampleRate;

  const bufferRef = useRef<Float32Array[]>([]);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(
    async (stream: MediaStream) => {
      try {
        const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm';

        const recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 16000,
        });

        chunksRef.current = [];

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);

            if (chunksRef.current.length > fullConfig.maxDuration) {
              chunksRef.current.shift();
            }
          }
        };

        recorder.start(1000);
        recorderRef.current = recorder;
      } catch (error) {
        console.error('Failed to start recording:', error);
        throw error;
      }
    },
    [fullConfig.maxDuration]
  );

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
      recorderRef.current = null;
    }
  }, []);

  const getBufferedAudio = useCallback(async (): Promise<Blob | null> => {
    if (chunksRef.current.length === 0) {
      return null;
    }

    const mimeType = recorderRef.current?.mimeType || 'audio/webm';
    return new Blob(chunksRef.current, { type: mimeType });
  }, []);

  const getBufferedAudioAsArrayBuffer = useCallback(async (): Promise<ArrayBuffer | null> => {
    const blob = await getBufferedAudio();
    if (!blob) return null;

    return await blob.arrayBuffer();
  }, [getBufferedAudio]);

  const clearBuffer = useCallback(() => {
    chunksRef.current = [];
    bufferRef.current = [];
  }, []);

  const getBufferDuration = useCallback((): number => {
    return chunksRef.current.length;
  }, []);

  useEffect(() => {
    return () => {
      stopRecording();
      clearBuffer();
    };
  }, [stopRecording, clearBuffer]);

  return {
    startRecording,
    stopRecording,
    getBufferedAudio,
    getBufferedAudioAsArrayBuffer,
    clearBuffer,
    getBufferDuration,
  };
}
