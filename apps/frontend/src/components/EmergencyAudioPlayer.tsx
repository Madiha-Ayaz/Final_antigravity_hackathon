'use client';

import { useEffect, useRef, useState } from 'react';

interface EmergencyAudioPlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  showDownload?: boolean;
}

export function EmergencyAudioPlayer({
  audioUrl,
  autoPlay = true,
  showDownload = true,
}: EmergencyAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    if (autoPlay && audioRef.current) {
      audioRef.current.play().catch((error) => {
        console.error('Auto-play failed:', error);
      });
      setIsPlaying(true);
    }
  }, [audioUrl, autoPlay]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, []);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const downloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `emergency-voice-${Date.now()}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
          <span className="text-2xl">🎤</span>
        </div>
        <div>
          <h3 className="text-red-900 font-bold text-lg">Emergency Voice Recording</h3>
          <p className="text-red-700 text-sm">Analyzed by Gemini AI</p>
        </div>
      </div>

      <audio ref={audioRef} src={audioUrl} preload="auto" className="hidden" />

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="w-full bg-red-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-red-700 mt-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={togglePlayPause}
          className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold transition-colors flex items-center justify-center gap-2"
        >
          {isPlaying ? (
            <>
              <span className="text-xl">⏸️</span>
              <span>Pause</span>
            </>
          ) : (
            <>
              <span className="text-xl">▶️</span>
              <span>Play</span>
            </>
          )}
        </button>

        {showDownload && (
          <button
            onClick={downloadAudio}
            className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span className="text-xl">📥</span>
            <span>Download</span>
          </button>
        )}
      </div>

      <p className="text-xs text-gray-600 mt-3 text-center">
        This voice was recorded and analyzed for emergency threat detection
      </p>
    </div>
  );
}
