'use client';

import { useState } from 'react';
import { useVoiceThreatDetectionWithFeedback } from '@/hooks/useVoiceThreatDetectionWithFeedback';
import { FreeEmergencySystem } from '@/components/FreeEmergencySystem';
import { CarrierSelector } from '@/components/CarrierSelector';

interface EmergencyContact {
  name: string;
  phoneNumber: string;
  carrier?: string;
  relationship: string;
}

export default function FreeEmergencyPage() {
  const {
    isRecording,
    isAnalyzing,
    threatDetected,
    threatData,
    alertActive,
    startRecording,
    stopRecording,
  } = useVoiceThreatDetectionWithFeedback();

  const [contacts, setContacts] = useState<EmergencyContact[]>([
    {
      name: 'Emergency Contact 1',
      phoneNumber: '+923001234567',
      carrier: 'jazz',
      relationship: 'Family',
    },
  ]);

  const [newContact, setNewContact] = useState<EmergencyContact>({
    name: '',
    phoneNumber: '',
    carrier: '',
    relationship: '',
  });

  const [showAddForm, setShowAddForm] = useState(false);

  const addContact = () => {
    if (newContact.name && newContact.phoneNumber && newContact.carrier) {
      setContacts([...contacts, newContact]);
      setNewContact({ name: '', phoneNumber: '', carrier: '', relationship: '' });
      setShowAddForm(false);
    }
  };

  const removeContact = (index: number) => {
    setContacts(contacts.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-3xl">🆓</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Free Emergency Alert System</h1>
              <p className="text-gray-600">
                No Twilio, No Cost - Uses Your Phone's Native Features
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl mb-1">📱</p>
              <p className="font-semibold text-green-900">Free SMS</p>
              <p className="text-xs text-green-700">Via Email Gateway</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-2xl mb-1">📞</p>
              <p className="font-semibold text-blue-900">Free Calls</p>
              <p className="text-xs text-blue-700">Native Phone Dialer</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
              <p className="text-2xl mb-1">💬</p>
              <p className="font-semibold text-purple-900">Free WhatsApp</p>
              <p className="text-xs text-purple-700">wa.me Links</p>
            </div>
          </div>
        </div>

        {/* Voice Recording */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">🎤 Voice Threat Detection</h2>

          <div className="flex flex-col items-center space-y-4">
            {/* Status */}
            <div className="text-center">
              {isRecording && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600 font-semibold">Recording...</span>
                </div>
              )}
              {isAnalyzing && (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full animate-spin border-2 border-blue-500 border-t-transparent"></div>
                  <span className="text-blue-600 font-semibold">Analyzing with Gemini AI...</span>
                </div>
              )}
              {!isRecording && !isAnalyzing && (
                <span className="text-gray-500">Ready to record</span>
              )}
            </div>

            {/* Record Button */}
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={isAnalyzing}
              className={`
                w-32 h-32 rounded-full font-bold text-white text-lg
                transition-all duration-200 transform hover:scale-105 shadow-lg
                ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                    : 'bg-blue-500 hover:bg-blue-600'
                }
                ${isAnalyzing ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {isRecording ? '⏹️ Stop' : '🎤 Record'}
            </button>
          </div>

          {/* Threat Detection Result */}
          {threatDetected && threatData && (
            <div className="mt-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
              <h3 className="text-xl font-bold text-yellow-900 mb-3">⚠️ Threat Detected!</h3>
              <div className="space-y-2 text-sm">
                <p>
                  <strong>Type:</strong> {threatData.emergencyType}
                </p>
                <p>
                  <strong>Level:</strong> {threatData.threatLevel}
                </p>
                <p>
                  <strong>Confidence:</strong> {(threatData.confidence * 100).toFixed(1)}%
                </p>
                <p>
                  <strong>Reasoning:</strong> {threatData.reasoning}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Emergency Contacts Management */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">📋 Emergency Contacts</h2>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              {showAddForm ? '✕ Cancel' : '+ Add Contact'}
            </button>
          </div>

          {/* Add Contact Form */}
          {showAddForm && (
            <div className="bg-gray-50 rounded-lg p-4 mb-4 space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={newContact.name}
                onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="tel"
                placeholder="Phone Number (e.g., +923001234567)"
                value={newContact.phoneNumber}
                onChange={(e) => setNewContact({ ...newContact, phoneNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <CarrierSelector
                value={newContact.carrier}
                onChange={(carrier) => setNewContact({ ...newContact, carrier })}
                required
              />
              <input
                type="text"
                placeholder="Relationship (e.g., Family, Friend)"
                value={newContact.relationship}
                onChange={(e) => setNewContact({ ...newContact, relationship: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addContact}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
              >
                ✓ Add Contact
              </button>
            </div>
          )}

          {/* Contacts List */}
          <div className="space-y-3">
            {contacts.map((contact, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div>
                  <p className="font-semibold text-gray-900">{contact.name}</p>
                  <p className="text-sm text-gray-600">{contact.phoneNumber}</p>
                  <div className="flex gap-2 mt-1">
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {contact.carrier}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {contact.relationship}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removeContact(index)}
                  className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold"
                >
                  Remove
                </button>
              </div>
            ))}

            {contacts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-4xl mb-2">📭</p>
                <p>No emergency contacts added yet</p>
                <p className="text-sm">Click "Add Contact" to get started</p>
              </div>
            )}
          </div>
        </div>

        {/* Free Emergency System */}
        {threatDetected && threatData && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">🚨 Emergency Alert System</h2>
            <FreeEmergencySystem
              contacts={contacts}
              location="40.7128,-74.0060"
              audioUrl={threatData.audioUrl || 'https://example.com/audio.wav'}
              onComplete={() => {
                alert('Emergency alerts sent to all contacts!');
              }}
            />
          </div>
        )}

        {/* Info Section */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-xl font-bold mb-3">💡 How It Works</h3>
          <div className="space-y-2 text-sm">
            <p>
              ✅ <strong>Step 1:</strong> Record your voice
            </p>
            <p>
              ✅ <strong>Step 2:</strong> Gemini AI analyzes for threats
            </p>
            <p>
              ✅ <strong>Step 3:</strong> If threat detected, trigger emergency
            </p>
            <p>
              ✅ <strong>Step 4:</strong> Free SMS sent via email gateway
            </p>
            <p>
              ✅ <strong>Step 5:</strong> WhatsApp opens with pre-filled message
            </p>
            <p>
              ✅ <strong>Step 6:</strong> Phone dialer opens to call first contact
            </p>
            <p>
              ✅ <strong>Step 7:</strong> Voice recording shared via link
            </p>
            <p className="mt-4 pt-4 border-t border-white/30">
              💰 <strong>Total Cost:</strong> ₹0 (Completely FREE!)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
