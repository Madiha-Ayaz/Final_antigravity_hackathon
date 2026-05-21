'use client';

import { useState, useEffect } from 'react';

import { useGPSLocation } from '@/hooks/useGPSLocation';

interface MessageEditorProps {
  onSend: (message: string, location?: { latitude: number; longitude: number }) => void;
  initialMessage?: string;
  autoSendDelay?: number; // in seconds
}

export default function EmergencyMessageEditor({
  onSend,
  initialMessage = '',
  autoSendDelay = 180, // 3 minutes default
}: MessageEditorProps) {
  const [message, setMessage] = useState(initialMessage);
  const [countdown, setCountdown] = useState(autoSendDelay);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { location, getCurrentLocation } = useGPSLocation();

  const handleAutoSend = async () => {
    setIsCountingDown(false);
    setIsSending(true);

    try {
      onSend(message, location || undefined);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (initialMessage) {
      setMessage(initialMessage);
      setIsCountingDown(true);
    }
  }, [initialMessage]);

  useEffect(() => {
    if (isCountingDown && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCountingDown && countdown === 0) {
      void handleAutoSend();
    }
  }, [countdown, isCountingDown, handleAutoSend]);

  useEffect(() => {
    // Get GPS location when component mounts
    getCurrentLocation().catch((err) => {
      console.error('Failed to get GPS location:', err);
    });
  }, [getCurrentLocation]);

  const handleManualSend = async () => {
    setIsCountingDown(false);
    setIsSending(true);

    try {
      onSend(message, location || undefined);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = () => {
    setIsCountingDown(false);
    setCountdown(autoSendDelay);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 sm:p-8 border-2 border-red-500/30">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
              <span className="text-2xl">🚨</span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Emergency Alert</h2>
              <p className="text-sm text-slate-400">Edit message before sending</p>
            </div>
          </div>

          {isCountingDown && (
            <div className="text-center">
              <div className="text-3xl font-mono font-bold text-red-400">
                {formatTime(countdown)}
              </div>
              <div className="text-xs text-slate-400">Auto-send</div>
            </div>
          )}
        </div>

        {/* Message Editor */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">Emergency Message</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full h-40 px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
            placeholder="Describe your emergency situation..."
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-500">{message.length} characters</span>
            {location && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
                GPS Location Attached
              </span>
            )}
          </div>
        </div>

        {/* Location Info */}
        {location && (
          <div className="mb-6 p-4 bg-slate-950/50 border border-slate-700 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-white mb-1">Your Location</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </p>
                {location.accuracy && (
                  <p className="text-xs text-slate-500 mt-1">
                    Accuracy: ±{Math.round(location.accuracy)}m
                  </p>
                )}
              </div>
              <a
                href={`https://www.google.com/maps?q=${location.latitude},${location.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                View Map
              </a>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isCountingDown && (
            <button
              onClick={handleCancel}
              className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition-colors"
            >
              Cancel Auto-Send
            </button>
          )}
          <button
            onClick={() => void handleManualSend()}
            disabled={isSending || !message.trim()}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-bold rounded-xl transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
          >
            {isSending ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Sending...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                Send Now to WhatsApp
              </>
            )}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-950/30 border border-blue-800/30 rounded-xl">
          <p className="text-xs text-blue-300 leading-relaxed">
            <strong>ℹ️ Note:</strong> This message will be sent to all your emergency contacts via
            WhatsApp.
            {isCountingDown &&
              ` It will be sent automatically in ${formatTime(countdown)} unless you cancel or send it manually.`}
          </p>
        </div>
      </div>
    </div>
  );
}
