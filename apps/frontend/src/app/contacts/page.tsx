'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  relationship: string;
  priority: number;
  notify_whatsapp: boolean;
  notify_sms: boolean;
  notify_call: boolean;
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    relationship: '',
    notifyWhatsapp: true,
    notifySms: true,
    notifyCall: false,
  });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      // Try Neon DB first
      const neonRes = await fetch(`${API_URL}/api/contacts-neon/list`);
      if (neonRes.ok) {
        const neonData = await neonRes.json();
        if (neonData.success && neonData.contacts) {
          setContacts(neonData.contacts);
          return;
        }
      }

      // Fallback to original
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/emergency-contacts/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (err) {
      console.error('Failed to load contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      name: formData.name,
      phoneNumber: formData.phoneNumber,
      relationship: formData.relationship,
      notifyWhatsapp: formData.notifyWhatsapp,
      notifySms: formData.notifySms,
      notifyCall: formData.notifyCall,
    };

    try {
      // Try Neon DB first
      const neonRes = await fetch(`${API_URL}/api/contacts-neon/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const neonData = await neonRes.json();

      if (neonData.success) {
        setSuccess(`"${formData.name}" saved to Neon DB!`);
        setFormData({ name: '', phoneNumber: '', relationship: '', notifyWhatsapp: true, notifySms: true, notifyCall: false });
        await loadContacts();
        setTimeout(() => setSuccess(''), 3000);
        return;
      }

      // Fallback
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/emergency-contacts/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success) {
        setSuccess(`"${formData.name}" added!`);
        setFormData({ name: '', phoneNumber: '', relationship: '', notifyWhatsapp: true, notifySms: true, notifyCall: false });
        await loadContacts();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to add contact');
      }
    } catch (err: any) {
      setError(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete ${name}?`)) return;
    try {
      // Try Neon DB first
      await fetch(`${API_URL}/api/contacts-neon/${id}`, { method: 'DELETE' });

      // Also try original
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      await fetch(`${API_URL}/api/emergency-contacts/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      await loadContacts();
    } catch (err) {
      console.error('Failed to delete:', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      <Navbar isAuthenticated={true} />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black gradient-text">
            Emergency Contacts
          </h1>
          <p className="text-slate-400 text-sm">
            Add contacts who will be alerted during emergencies
          </p>
        </div>

        {/* Add Contact Form */}
        <div className="card p-5 sm:p-6 animate-slide-up">
          <h2 className="text-lg font-bold text-red-400 mb-4">+ Add New Contact</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-300 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-500/20 border border-green-500/50 rounded-xl text-green-300 text-sm">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input"
                  placeholder="Ammi / Bhai / Friend"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="input"
                  placeholder="+923001234567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Relationship *</label>
              <input
                type="text"
                required
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                className="input"
                placeholder="Family / Friend / Colleague"
              />
            </div>

            {/* Notification toggles */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Alert Methods</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-green-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.notifyWhatsapp}
                    onChange={(e) => setFormData({ ...formData, notifyWhatsapp: e.target.checked })}
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm text-green-400 font-medium">WhatsApp</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-blue-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.notifySms}
                    onChange={(e) => setFormData({ ...formData, notifySms: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-blue-400 font-medium">SMS</span>
                </label>
                <label className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-600 rounded-xl cursor-pointer hover:border-purple-500/50 transition-colors">
                  <input
                    type="checkbox"
                    checked={formData.notifyCall}
                    onChange={(e) => setFormData({ ...formData, notifyCall: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded"
                  />
                  <span className="text-sm text-purple-400 font-medium">Voice Call</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full"
            >
              {saving ? 'Adding...' : 'Add Contact'}
            </button>
          </form>
        </div>

        {/* Contacts List */}
        <div className="space-y-3 stagger">
          <h2 className="text-lg font-bold text-slate-300">
            Your Contacts ({contacts.length})
          </h2>

          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : contacts.length === 0 ? (
            <div className="card p-8 text-center animate-fade-in">
              <svg className="w-12 h-12 mx-auto text-slate-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="text-slate-400 mb-4">No contacts yet. Add using the form above.</p>
              <Link href="/alert" className="btn-outline text-sm">
                Go to SAVE ME
              </Link>
            </div>
          ) : (
            contacts.map((contact, index) => (
              <div
                key={contact.id}
                className="card-hover p-4 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0" style={{ background: 'var(--crimson)' }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate">{contact.name}</h3>
                      <p className="text-sm text-slate-400 truncate">{contact.phone_number}</p>
                      <p className="text-xs text-slate-500">{contact.relationship}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex gap-1">
                      {contact.notify_whatsapp && (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#6ee7b7' }}>W</span>
                      )}
                      {contact.notify_sms && (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(220, 38, 38, 0.15)', color: '#fca5a5' }}>S</span>
                      )}
                      {contact.notify_call && (
                        <span className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: 'rgba(255, 255, 255, 0.1)', color: '#94a3b8' }}>C</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(contact.id, contact.name)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick link to alert page */}
        {contacts.length > 0 && (
          <div className="text-center animate-fade-in">
            <Link href="/alert" className="btn-danger">
              Go to SAVE ME
            </Link>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
