'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '../../components';
import LiveMap from '../../components/LiveMap';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface Contact {
  id: string;
  name: string;
  phone_number: string;
  relationship: string;
  notify_whatsapp: boolean;
  notify_sms: boolean;
  notify_call: boolean;
}

export default function DashboardPage() {
  const [isMonitoring, setIsMonitoring] = useState(true);
  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    const fetchContacts = async () => {
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

        // Fallback
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const res = await fetch(`${API_URL}/api/emergency-contacts/list`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setContacts(data.contacts || []);
        }
      } catch (err) {
        console.error('Failed to fetch contacts:', err);
      }
    };
    fetchContacts();
  }, []);

  const stats = [
    {
      label: 'Monitoring Status',
      value: isMonitoring ? 'Active' : 'Inactive',
      icon: '🛡️',
      color: isMonitoring ? 'success' : 'danger',
      trend: null,
    },
    {
      label: 'Total Alerts',
      value: '0',
      icon: '🚨',
      color: 'primary',
      trend: null,
    },
    {
      label: 'False Alarms',
      value: '0',
      icon: '✓',
      color: 'warning',
      trend: null,
    },
    {
      label: 'Trusted Contacts',
      value: String(contacts.length),
      icon: '👥',
      color: 'secondary',
      trend: null,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: 'system',
      title: 'Monitoring Started',
      description: 'Voice detection activated successfully',
      timestamp: '2 hours ago',
      icon: '✓',
      color: 'success',
    },
    {
      id: 2,
      type: 'contact',
      title: 'Contact Added',
      description: 'John Doe added as trusted contact',
      timestamp: '1 day ago',
      icon: '👤',
      color: 'secondary',
    },
    {
      id: 3,
      type: 'settings',
      title: 'Settings Updated',
      description: 'Emergency preferences configured',
      timestamp: '2 days ago',
      icon: '⚙️',
      color: 'primary',
    },
  ];

  return (
    <DashboardLayout userName="User">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">
              Welcome back! Here's your emergency protection overview.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/settings" className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Settings
            </Link>
            <Link href="/contacts" className="px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl hover:from-red-500 hover:to-orange-500 transition-all text-sm font-medium flex items-center gap-2 shadow-lg shadow-red-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Contact
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Monitoring', value: isMonitoring ? 'Active' : 'Off', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            ) },
            { label: 'Total Alerts', value: '0', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
            ) },
            { label: 'False Alarms', value: '0', icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            ) },
            { label: 'Contacts', value: String(contacts.length), icon: (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
            ), href: '/contacts' },
          ].map((stat, index) => {
            const card = (
              <div key={index} className={`card p-4 ${stat.href ? 'cursor-pointer' : ''}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#94a3b8' }}>{stat.label}</p>
                    <p className="text-2xl sm:text-3xl font-black" style={{ color: '#f1f5f9' }}>{stat.value}</p>
                  </div>
                  <span style={{ color: '#dc2626' }}>{stat.icon}</span>
                </div>
              </div>
            );

            if (stat.href) {
              return <Link key={index} href={stat.href}>{card}</Link>;
            }
            return card;
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Live Map & Status */}
          <div className="lg:col-span-2 card p-4 sm:p-6 space-y-4 sm:space-y-6 overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Live Location Tracking
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">Real-time GPS synchronization</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className={`px-3 py-1 rounded-full text-xs font-bold ${isMonitoring ? 'badge-success' : 'badge-danger'}`}>
                  {isMonitoring ? 'PROTECTION ON' : 'PROTECTION OFF'}
                </div>
                <a href="/crisis" className="btn-primary text-sm flex items-center gap-2">
                  <span className="status-danger"></span>
                  Crisis Hub
                </a>
                <button
                  onClick={() => setIsMonitoring(!isMonitoring)}
                  className={isMonitoring ? 'btn-outline text-sm' : 'btn-primary text-sm'}
                >
                  {isMonitoring ? 'Stop' : 'Start'}
                </button>
              </div>
            </div>

            <div className="relative">
              <LiveMap
                height="350px"
                onLocationUpdate={(lat, lng) => setCurrentLocation({lat, lng})}
                emergencyMode={false}
              />

              {!isMonitoring && (
                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                  <div className="text-center p-6 bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 max-w-xs">
                    <div className="text-4xl mb-3">🛡️</div>
                    <h3 className="text-lg font-bold text-white">Monitoring Paused</h3>
                    <p className="text-sm text-slate-400 mb-4">Emergency detection is currently disabled.</p>
                    <button onClick={() => setIsMonitoring(true)} className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold">
                      Resume Protection
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Signal', value: 'Strong' },
                { label: 'Accuracy', value: '± 5m' },
                { label: 'Status', value: 'Encrypted' },
                { label: 'Battery', value: '84%' },
              ].map((item, i) => (
                <div key={i} className="p-3 rounded-xl border border-white/5" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div className="text-[10px] uppercase font-bold mb-1" style={{ color: '#94a3b8' }}>{item.label}</div>
                  <div className="text-sm font-bold" style={{ color: '#f1f5f9' }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Trusted Contacts List */}
          <div className="card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>Trusted Contacts</h2>
              <Link href="/contacts" className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#dc2626' }}>
                Manage
              </Link>
            </div>

            {contacts.length === 0 ? (
              <div className="text-center py-6">
                <svg className="w-10 h-10 mx-auto mb-3" style={{ color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <p className="text-sm mb-3" style={{ color: '#94a3b8' }}>No contacts yet</p>
                <Link href="/contacts" className="btn-primary text-sm">
                  + Add Contact
                </Link>
              </div>
            ) : (
              <div className="space-y-2 stagger">
                {contacts.slice(0, 5).map((contact, i) => (
                  <Link
                    key={contact.id}
                    href="/contacts"
                    className="flex items-center gap-3 p-3 rounded-xl border border-white/5 hover:border-red-500/20 transition-all animate-fade-in"
                    style={{ background: 'rgba(255, 255, 255, 0.02)', animationDelay: `${i * 50}ms` }}
                  >
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: '#dc2626' }}>
                      {contact.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate" style={{ color: '#f1f5f9' }}>{contact.name}</div>
                      <div className="text-xs truncate" style={{ color: '#94a3b8' }}>{contact.phone_number}</div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {contact.notify_whatsapp && (
                        <span className="badge-success text-[9px] px-1.5 py-0.5">W</span>
                      )}
                      {contact.notify_sms && (
                        <span className="badge-danger text-[9px] px-1.5 py-0.5">S</span>
                      )}
                      {contact.notify_call && (
                        <span className="badge text-[9px] px-1.5 py-0.5" style={{ background: 'rgba(255,255,255,0.1)', color: '#94a3b8' }}>C</span>
                      )}
                    </div>
                  </Link>
                ))}

                <Link href="/contacts" className="block text-center py-2 text-sm hover:opacity-80 transition-opacity" style={{ color: '#dc2626' }}>
                  + Add More Contacts
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <h2 className="text-lg font-bold" style={{ color: '#f1f5f9' }}>Recent Activity</h2>
            <button className="text-sm hover:opacity-80 transition-opacity" style={{ color: '#dc2626' }}>
              View All
            </button>
          </div>

          <div className="space-y-2 stagger">
            {recentActivity.map((activity, i) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-xl border border-white/5 hover:border-red-500/20 transition-all animate-fade-in"
                style={{ background: 'rgba(255, 255, 255, 0.02)', animationDelay: `${i * 50}ms` }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm" style={{ color: '#f1f5f9' }}>{activity.title}</h3>
                  <p className="text-xs" style={{ color: '#94a3b8' }}>{activity.description}</p>
                </div>
                <div className="text-xs whitespace-nowrap" style={{ color: '#475569' }}>
                  {activity.timestamp}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
