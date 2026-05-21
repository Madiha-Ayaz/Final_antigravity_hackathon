'use client';

import { useState, useEffect } from 'react';
import VoiceWhatsAppAlert from '@/components/VoiceWhatsAppAlert';
import ContactFormWhatsApp from '@/components/ContactFormWhatsApp';

export default function WhatsAppTestPage() {
  const [activeTab, setActiveTab] = useState<'voice' | 'contact'>('voice');
  const [serviceStatus, setServiceStatus] = useState<any>(null);

  useEffect(() => {
    checkServiceStatus();
  }, []);

  const checkServiceStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/whatsapp/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      setServiceStatus(data.data);
    } catch (error) {
      console.error('Failed to check service status:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            📱 WhatsApp Integration Test
          </h1>
          <p className="text-lg text-gray-600">Test voice alerts and contact form with WhatsApp</p>
        </div>

        {/* Service Status */}
        {serviceStatus && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              serviceStatus.configured
                ? 'bg-green-100 border border-green-300'
                : 'bg-red-100 border border-red-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-800">
                  {serviceStatus.configured ? '✅ Service Active' : '❌ Service Inactive'}
                </h3>
                <p className="text-sm text-gray-600">Provider: {serviceStatus.service}</p>
              </div>
              <button
                onClick={checkServiceStatus}
                className="px-4 py-2 bg-white rounded-lg shadow hover:shadow-md transition-shadow text-sm font-medium"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('voice')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'voice'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              🎤 Voice Alert System
            </button>
            <button
              onClick={() => setActiveTab('contact')}
              className={`flex-1 py-4 px-6 font-semibold transition-colors ${
                activeTab === 'contact'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              📝 Contact Form
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'voice' ? (
              <VoiceWhatsAppAlert
                onSend={(audioBlob, transcript) => {
                  console.log('Voice alert sent:', transcript);
                }}
              />
            ) : (
              <ContactFormWhatsApp recipientNumber="+923452508043" />
            )}
          </div>
        </div>

        {/* Features List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">🎤 Voice Alert Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Record voice with browser
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                AI analysis with Gemini
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Auto-detect emergencies
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Send to all emergency contacts
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Include audio recording
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">📝 Contact Form Features</h3>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Direct WhatsApp delivery
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Formatted messages
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Email validation
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Instant delivery
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Delivery confirmation
              </li>
            </ul>
          </div>
        </div>

        {/* API Documentation */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">📚 API Endpoints</h3>
          <div className="space-y-3 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-blue-600">POST /api/whatsapp/send</code>
              <p className="text-gray-600 mt-1">Send text message</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-blue-600">POST /api/whatsapp/send-voice</code>
              <p className="text-gray-600 mt-1">Send voice message</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-blue-600">POST /api/whatsapp/emergency-alert</code>
              <p className="text-gray-600 mt-1">Send emergency to all contacts</p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <code className="text-blue-600">POST /api/whatsapp/contact-form</code>
              <p className="text-gray-600 mt-1">Send contact form submission</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
