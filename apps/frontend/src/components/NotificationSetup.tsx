'use client';

import { useFCM } from '../hooks/useFCM';
import { useEffect, useState } from 'react';

interface NotificationSetupProps {
  authToken: string | null;
  onTokenGenerated?: (token: string) => void;
}

export const NotificationSetup: React.FC<NotificationSetupProps> = ({
  authToken,
  onTokenGenerated,
}) => {
  const { token, permission, isSupported, isLoading, error, requestPermission } = useFCM({
    authToken,
    autoRequest: false,
  });

  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show prompt if notifications are supported but not granted
    if (isSupported && permission === 'default') {
      setShowPrompt(true);
    }
  }, [isSupported, permission]);

  useEffect(() => {
    if (token && onTokenGenerated) {
      onTokenGenerated(token);
    }
  }, [token, onTokenGenerated]);

  if (!isSupported) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          ⚠️ Push notifications are not supported in this browser.
        </p>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-sm text-red-800">
          🚫 Notification permission denied. Please enable notifications in your browser settings to
          receive emergency alerts.
        </p>
      </div>
    );
  }

  if (permission === 'granted' && token) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-sm text-green-800">
          ✅ Push notifications enabled! You'll receive emergency alerts.
        </p>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-2">
            <summary className="text-xs text-green-600 cursor-pointer">Show token</summary>
            <code className="text-xs text-green-700 break-all block mt-1">{token}</code>
          </details>
        )}
      </div>
    );
  }

  if (showPrompt && permission === 'default') {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🔔</span>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Enable Emergency Alerts</h3>
            <p className="text-sm text-blue-800 mb-3">
              Get instant notifications when emergencies are reported near you or when your help is
              needed for community validation.
            </p>
            <button
              onClick={requestPermission}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Enabling...' : 'Enable Notifications'}
            </button>
            <button
              onClick={() => setShowPrompt(false)}
              className="ml-2 text-blue-600 hover:text-blue-700 px-4 py-2 text-sm font-medium"
            >
              Maybe Later
            </button>
          </div>
        </div>
        {error && <p className="text-sm text-red-600 mt-2">Error: {error}</p>}
      </div>
    );
  }

  return null;
};
