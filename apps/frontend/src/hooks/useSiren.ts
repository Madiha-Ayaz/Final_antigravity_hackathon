import { useRef, useCallback } from 'react';

export function useSiren() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<any>(null);

  const startSiren = useCallback(async () => {
    if (audioCtxRef.current) return; // Already running

    try {
      // Create audio context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // Mobile browsers suspend AudioContext until user gesture — resume it
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create oscillator and gain node
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // start frequency

      // Connect nodes
      osc.connect(gain);
      gain.connect(ctx.destination);

      // Initial settings — use 0.8 volume for mobile audibility
      gain.gain.setValueAtTime(0.8, ctx.currentTime);

      // Start oscillator
      osc.start(0);

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;

      // Siren sweep effect: cycle frequency between 600Hz and 1200Hz
      let rising = true;
      let freq = 600;

      intervalRef.current = setInterval(() => {
        if (!oscillatorRef.current || !audioCtxRef.current) return;

        if (rising) {
          freq += 50;
          if (freq >= 1200) rising = false;
        } else {
          freq -= 50;
          if (freq <= 600) rising = true;
        }

        oscillatorRef.current.frequency.setValueAtTime(freq, audioCtxRef.current.currentTime);
      }, 30); // update every 30ms

      console.log('🚨 Siren started (AudioContext state:', ctx.state, ')');
    } catch (error) {
      console.error('Failed to start siren:', error);
    }
  }, []);

  const stopSiren = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      } catch (e) {
        console.error('Error stopping oscillator:', e);
      }
      oscillatorRef.current = null;
    }

    if (gainNodeRef.current) {
      gainNodeRef.current.disconnect();
      gainNodeRef.current = null;
    }

    if (audioCtxRef.current) {
      try {
        audioCtxRef.current.close();
      } catch (e) {
        console.error('Error closing AudioContext:', e);
      }
      audioCtxRef.current = null;
    }
  }, []);

  return {
    startSiren,
    stopSiren,
  };
}
