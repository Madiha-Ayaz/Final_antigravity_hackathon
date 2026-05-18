'use client';

import { useState } from 'react';

interface ContactFormWhatsAppProps {
  recipientNumber: string; // WhatsApp number to send form submissions
}

export default function ContactFormWhatsApp({ recipientNumber }: ContactFormWhatsAppProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatus('Sending...');

    try {
      const response = await fetch('/api/whatsapp/contact-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recipientNumber,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setStatus('✅ Message sent successfully via WhatsApp!');
        setFormData({ name: '', email: '', phone: '', message: '' });
      } else {
        setStatus('❌ Failed to send message');
      }
    } catch (error) {
      console.error('Failed to submit form:', error);
      setStatus('❌ Error sending message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800">
        📱 Contact Us
      </h2>
      <p className="text-gray-600 mb-6">
        Send us a message and we'll get back to you via WhatsApp!
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Name *
          </label>
          <input
            type="text"
            id="name"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Your name"
          />
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            id="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="your.email@example.com"
          />
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone (Optional)
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+92 300 1234567"
          />
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Message *
          </label>
          <textarea
            id="message"
            required
            rows={5}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Your message..."
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? '⏳ Sending...' : '📤 Send via WhatsApp'}
        </button>

        {/* Status Message */}
        {status && (
          <div className={`p-4 rounded-lg text-center font-medium ${
            status.includes('✅') ? 'bg-green-100 text-green-800' :
            status.includes('❌') ? 'bg-red-100 text-red-800' :
            'bg-blue-100 text-blue-800'
          }`}>
            {status}
          </div>
        )}
      </form>

      {/* Info Box */}
      <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700">
          💡 <strong>Note:</strong> Your message will be sent directly to our WhatsApp number.
          We'll respond as soon as possible!
        </p>
      </div>
    </div>
  );
}
