'use client';

import { useState } from 'react';

import { emergencyCallService } from '@/services/emergencyCall.service';

import { EmergencyAudioPlayer } from './EmergencyAudioPlayer';

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  carrier?: string;
  relationship: string;
}

interface FreeEmergencySystemProps {
  contacts: EmergencyContact[];
  location: string;
  audioUrl: string;
  onComplete?: () => void;
}

export function FreeEmergencySystem({
  contacts,
  location,
  audioUrl,
  onComplete,
}: FreeEmergencySystemProps) {
  const [isTriggering, setIsTriggering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentContact, setCurrentContact] = useState<string>('');

  const triggerEmergency = async () => {
    setIsTriggering(true);
    setProgress(0);

    const locationUrl = `https://maps.google.com/?q=${location}`;
    const message = `🚨 EMERGENCY ALERT!

User needs help NOW!

Location: ${locationUrl}

Voice Recording: ${audioUrl}

Time: ${new Date().toLocaleString()}

This is an automated emergency alert from SilentSiren.`;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      setCurrentContact(contact.name);
      setProgress(((i + 1) / contacts.length) * 100);

      // 1. WhatsApp (free)
      emergencyCallService.sendWhatsAppMessage(contact.phoneNumber, message);
      await delay(2000);

      // 2. SMS (free)
      emergencyCallService.sendEmergencySMS(contact.phoneNumber, message);
      await delay(2000);

      // 3. Call first contact only
      if (i === 0) {
        emergencyCallService.makeEmergencyCall(contact.phoneNumber, audioUrl);
      }

      await delay(3000);
    }

    setIsTriggering(false);
    setProgress(100);
    setCurrentContact('');
    onComplete?.();
  };

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  return (
    <div className="space-y-4">
      {/* Audio Player */}
      <EmergencyAudioPlayer audioUrl={audioUrl} autoPlay={false} />

      {/* Emergency Contacts */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
        <h3 className="font-bold text-lg mb-3">📱 Emergency Contacts ({contacts.length})</h3>
        <div className="space-y-2">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div>
                <p className="font-semibold">{contact.name}</p>
                <p className="text-sm text-gray-600">{contact.phoneNumber}</p>
                <p className="text-xs text-gray-500">{contact.relationship}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    emergencyCallService.sendWhatsAppMessage(
                      contact.phoneNumber,
                      'Emergency test message'
                    )
                  }
                  className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                >
                  WhatsApp
                </button>
                <button
                  onClick={() =>
                    emergencyCallService.sendEmergencySMS(
                      contact.phoneNumber,
                      'Emergency test message'
                    )
                  }
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                >
                  SMS
                </button>
                <button
                  onClick={() => emergencyCallService.makeEmergencyCall(contact.phoneNumber)}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                >
                  Call
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger Button */}
      <button
        onClick={() => void triggerEmergency()}
        disabled={isTriggering}
        className={`w-full py-4 rounded-lg font-bold text-white text-lg transition-all ${
          isTriggering
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-red-600 hover:bg-red-700 animate-pulse'
        }`}
      >
        {isTriggering ? (
          <span>🚨 Triggering Emergency... {Math.round(progress)}%</span>
        ) : (
          <span>🚨 TRIGGER EMERGENCY ALERT</span>
        )}
      </button>

      {/* Progress */}
      {isTriggering && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 border-4 border-yellow-600 border-t-transparent rounded-full animate-spin" />
            <div>
              <p className="font-semibold text-yellow-900">Contacting: {currentContact}</p>
              <p className="text-sm text-yellow-700">Sending WhatsApp, SMS, and making call...</p>
            </div>
          </div>
          <div className="w-full bg-yellow-200 rounded-full h-2">
            <div
              className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">ℹ️ How It Works (FREE)</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>✅ WhatsApp: Opens your WhatsApp with pre-filled message</li>
          <li>✅ SMS: Opens your SMS app with pre-filled message</li>
          <li>✅ Call: Opens your phone dialer to call first contact</li>
          <li>✅ Voice Recording: Shared via link in messages</li>
          <li>✅ GPS Location: Shared via Google Maps link</li>
          <li>💰 Cost: Completely FREE (uses your phone)</li>
        </ul>
      </div>
    </div>
  );
}
