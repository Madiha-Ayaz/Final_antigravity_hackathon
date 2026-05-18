'use client';

import { useEffect, useState } from 'react';
import { detectBrowserCapabilities, isBrowserSupported } from '../lib/browserCompatibility';

interface CompatibilityBannerProps {
  onDismiss?: () => void;
}

export function CompatibilityBanner({ onDismiss }: CompatibilityBannerProps) {
  const [show, setShow] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const { supported, reason } = isBrowserSupported();
    const capabilities = detectBrowserCapabilities();

    if (!supported) {
      setMessage(reason || 'Browser not supported');
      setShow(true);
    } else if (capabilities.isMobile && !capabilities.speechRecognition) {
      setMessage('Speech recognition may not work on this mobile browser');
      setShow(true);
    }
  }, []);

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 p-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-yellow-800 font-medium">{message}</p>
        </div>
        <button
          onClick={() => {
            setShow(false);
            onDismiss?.();
          }}
          className="text-yellow-600 hover:text-yellow-800"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
