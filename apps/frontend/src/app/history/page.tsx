'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components';
import { useGPSLocation } from '../../hooks/useGPSLocation';

interface EmergencyEvent {
  id: string;
  timestamp: string;
  type: 'alert' | 'false_alarm' | 'test';
  threatLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  location?: {
    latitude: number;
    longitude: number;
    address: string;
  };
  audioUrl?: string;
  contactsNotified: number;
  status: 'resolved' | 'active' | 'cancelled';
  notes?: string;
  whatsappMessages?: Array<{
    recipient: string;
    status: 'sent' | 'delivered' | 'failed';
    timestamp: string;
  }>;
}

export default function HistoryPage() {
  const [filter, setFilter] = useState<'all' | 'alert' | 'false_alarm' | 'test'>('all');
  const [events, setEvents] = useState<EmergencyEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EmergencyEvent | null>(null);
  const { location: liveLocation, getCurrentLocation, error: gpsError } = useGPSLocation();
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'connected' | 'denied' | 'error'>(
    'loading'
  );

  // Get live GPS location
  useEffect(() => {
    const initGPS = async () => {
      try {
        setGpsStatus('loading');
        await getCurrentLocation();
        setGpsStatus('connected');
      } catch (err: any) {
        console.error('GPS error:', err);
        if (err?.code === 1) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('error');
        }
      }
    };
    initGPS();
  }, []);

  // Fetch events from Neon DB
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Try Neon DB first
      const neonRes = await fetch(`${API_URL}/api/neon/emergency-events?limit=50`);
      if (neonRes.ok) {
        const neonData = await neonRes.json();
        if (neonData.success && neonData.data?.length > 0) {
          const mappedEvents: EmergencyEvent[] = neonData.data.map((e: any) => ({
            id: String(e.id),
            timestamp: e.created_at,
            type: e.event_type === 'manual' ? 'alert' : e.event_type,
            threatLevel: e.threat_level || 'LOW',
            confidence: e.confidence ? Math.round(e.confidence * 100) : 0,
            location:
              e.latitude && e.longitude
                ? {
                    latitude: parseFloat(e.latitude),
                    longitude: parseFloat(e.longitude),
                    address: e.address || 'GPS Location',
                  }
                : undefined,
            contactsNotified: e.contacts_notified || 0,
            status: e.status || 'resolved',
            notes: e.transcript || e.reasoning,
          }));
          setEvents(mappedEvents);
          return;
        }
      }

      // Try voice alerts
      const voiceRes = await fetch(`${API_URL}/api/voice-threat/history`);
      if (voiceRes.ok) {
        const voiceData = await voiceRes.json();
        if (voiceData.success && voiceData.alerts?.length > 0) {
          const mappedEvents: EmergencyEvent[] = voiceData.alerts.map((a: any) => ({
            id: String(a.id),
            timestamp: a.created_at,
            type: 'alert',
            threatLevel: a.threat_level || 'LOW',
            confidence: a.confidence ? Math.round(a.confidence * 100) : 0,
            location:
              a.latitude && a.longitude
                ? {
                    latitude: parseFloat(a.latitude),
                    longitude: parseFloat(a.longitude),
                    address: 'GPS Location',
                  }
                : undefined,
            contactsNotified: a.whatsapp_sent ? 1 : 0,
            status: 'resolved',
            notes: a.transcript || a.reasoning,
          }));
          setEvents(mappedEvents);
          return;
        }
      }

      // Fallback to mock data
      loadMockData();
    } catch (error) {
      console.error('Failed to fetch events:', error);
      loadMockData();
    }
  };

  const loadMockData = () => {
    const mockEvents: EmergencyEvent[] = [
      {
        id: '1',
        timestamp: new Date().toISOString(),
        type: 'alert',
        threatLevel: 'HIGH',
        confidence: 95,
        location: liveLocation
          ? {
              latitude: liveLocation.latitude,
              longitude: liveLocation.longitude,
              address: 'Current Location',
            }
          : {
              latitude: 33.6844,
              longitude: 73.0479,
              address: 'Islamabad, Pakistan',
            },
        contactsNotified: 3,
        status: 'active',
        notes: 'Emergency detected via voice analysis',
        whatsappMessages: [
          { recipient: '+923343717260', status: 'delivered', timestamp: new Date().toISOString() },
          { recipient: '+923452508043', status: 'delivered', timestamp: new Date().toISOString() },
        ],
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        type: 'test',
        threatLevel: 'LOW',
        confidence: 100,
        location: {
          latitude: 33.6844,
          longitude: 73.0479,
          address: 'Test Location',
        },
        contactsNotified: 0,
        status: 'resolved',
        notes: 'System test - all clear',
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        type: 'false_alarm',
        threatLevel: 'MEDIUM',
        confidence: 45,
        contactsNotified: 1,
        status: 'cancelled',
        notes: 'False alarm - no actual emergency',
      },
    ];
    setEvents(mockEvents);
  };

  const filteredEvents = filter === 'all' ? events : events.filter((e) => e.type === filter);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'false_alarm':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'test':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'text-red-500';
      case 'HIGH':
        return 'text-red-400';
      case 'MEDIUM':
        return 'text-yellow-400';
      case 'LOW':
        return 'text-green-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-red-500/20 text-red-400';
      case 'resolved':
        return 'bg-green-500/20 text-green-400';
      case 'cancelled':
        return 'bg-slate-500/20 text-slate-400';
      default:
        return 'bg-slate-500/20 text-slate-400';
    }
  };

  return (
    <DashboardLayout userName="User">
      <div className="space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white">Event History</h1>
            <p className="text-sm text-slate-400 mt-1">
              View emergency events with live GPS tracking
            </p>
          </div>
          <button
            onClick={fetchEvents}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <span>🔄</span> Refresh
          </button>
        </div>

        {/* Live GPS Location Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-4 sm:p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div
              className={`w-3 h-3 rounded-full ${
                gpsStatus === 'connected'
                  ? 'bg-green-400 animate-pulse'
                  : gpsStatus === 'loading'
                    ? 'bg-yellow-400 animate-spin'
                    : 'bg-red-400'
              }`}
            />
            <h2 className="text-lg sm:text-xl font-bold">
              {gpsStatus === 'connected'
                ? '📍 Live GPS Location'
                : gpsStatus === 'loading'
                  ? '⏳ Connecting GPS...'
                  : gpsStatus === 'denied'
                    ? '🚫 GPS Permission Denied'
                    : '⚠️ GPS Error'}
            </h2>
          </div>

          {liveLocation ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-90 mb-1">Coordinates:</p>
                  <p className="font-mono text-base sm:text-lg font-bold">
                    {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <p className="text-sm opacity-90 mb-1">Accuracy:</p>
                  <p className="font-mono text-base sm:text-lg font-bold">
                    {liveLocation.accuracy ? `±${liveLocation.accuracy.toFixed(0)}m` : 'N/A'}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 transition-colors text-center text-sm"
                >
                  🗺️ Open in Google Maps
                </a>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${liveLocation.latitude},${liveLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-white/20 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/30 transition-colors text-center text-sm"
                >
                  🧭 Get Directions
                </a>
              </div>

              {/* Map Preview */}
              <div className="rounded-xl overflow-hidden border-2 border-white/20">
                <iframe
                  width="100%"
                  height="250"
                  frameBorder="0"
                  style={{ border: 0 }}
                  src={`https://maps.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}&z=15&output=embed`}
                  allowFullScreen
                  loading="lazy"
                />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-lg">
                {gpsStatus === 'denied'
                  ? 'Please allow location access in your browser settings'
                  : gpsStatus === 'loading'
                    ? 'Acquiring GPS signal...'
                    : 'Unable to get location. Using default.'}
              </p>
              {gpsStatus === 'denied' && (
                <button
                  onClick={() => getCurrentLocation()}
                  className="mt-4 px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            {
              label: 'Total Events',
              value: events.length,
              icon: '📊',
              color: 'from-blue-600 to-cyan-600',
            },
            {
              label: 'Real Alerts',
              value: events.filter((e) => e.type === 'alert').length,
              icon: '🚨',
              color: 'from-red-600 to-orange-600',
            },
            {
              label: 'False Alarms',
              value: events.filter((e) => e.type === 'false_alarm').length,
              icon: '⚠️',
              color: 'from-yellow-600 to-amber-600',
            },
            {
              label: 'Tests',
              value: events.filter((e) => e.type === 'test').length,
              icon: '✓',
              color: 'from-green-600 to-emerald-600',
            },
          ].map((stat, index) => (
            <div
              key={index}
              className={`bg-gradient-to-br ${stat.color} rounded-2xl p-4 text-white`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-90 mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-black">{stat.value}</p>
                </div>
                <span className="text-2xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <span className="text-sm font-medium text-slate-400 whitespace-nowrap">Filter:</span>
            {[
              { id: 'all', label: 'All', icon: '📋' },
              { id: 'alert', label: 'Alerts', icon: '🚨' },
              { id: 'false_alarm', label: 'False', icon: '⚠️' },
              { id: 'test', label: 'Tests', icon: '✓' },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${
                  filter === filterOption.id
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg shadow-red-500/20'
                    : 'bg-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <span>{filterOption.icon}</span>
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl text-center py-12">
              <div className="text-6xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-white mb-2">No Events Found</h3>
              <p className="text-slate-400">
                {filter === 'all'
                  ? 'No emergency events recorded yet'
                  : `No ${filter.replace('_', ' ')} events found`}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 sm:p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                        event.type === 'alert'
                          ? 'bg-red-500/20'
                          : event.type === 'false_alarm'
                            ? 'bg-yellow-500/20'
                            : 'bg-blue-500/20'
                      }`}
                    >
                      {event.type === 'alert' ? '🚨' : event.type === 'false_alarm' ? '⚠️' : '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-lg font-semibold text-white">
                          {event.type === 'alert'
                            ? 'Emergency Alert'
                            : event.type === 'false_alarm'
                              ? 'False Alarm'
                              : 'System Test'}
                        </h3>
                        <span
                          className={`px-2 py-0.5 text-xs font-medium rounded-full border ${getTypeColor(event.type)}`}
                        >
                          {event.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="p-3 bg-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">Threat</div>
                    <div className={`text-lg font-bold ${getThreatColor(event.threatLevel)}`}>
                      {event.threatLevel}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">Confidence</div>
                    <div className="text-lg font-bold text-white">{event.confidence}%</div>
                  </div>
                  <div className="p-3 bg-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">Notified</div>
                    <div className="text-lg font-bold text-white">{event.contactsNotified}</div>
                  </div>
                </div>

                {/* WhatsApp Messages */}
                {event.whatsappMessages && event.whatsappMessages.length > 0 && (
                  <div className="mb-4 p-4 bg-green-500/10 rounded-xl border border-green-500/20">
                    <h4 className="text-sm font-semibold text-green-400 mb-2">📱 Messages Sent</h4>
                    <div className="space-y-2">
                      {event.whatsappMessages.map((msg, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-green-300 font-mono">{msg.recipient}</span>
                          <span
                            className={`px-2 py-1 rounded-lg text-xs font-medium ${
                              msg.status === 'delivered'
                                ? 'bg-green-500/20 text-green-400'
                                : msg.status === 'sent'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {msg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location */}
                {event.location && (
                  <div className="mb-4">
                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-blue-400 mb-1">
                            📍 {event.location.address}
                          </div>
                          <div className="text-xs text-blue-300 font-mono">
                            {event.location.latitude.toFixed(6)},{' '}
                            {event.location.longitude.toFixed(6)}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setSelectedEvent(selectedEvent?.id === event.id ? null : event)
                            }
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
                          >
                            {selectedEvent?.id === event.id ? 'Hide' : 'Map'}
                          </button>
                          <a
                            href={`https://www.google.com/maps?q=${event.location.latitude},${event.location.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
                          >
                            Open
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Embedded Map */}
                    {selectedEvent?.id === event.id && (
                      <div className="rounded-xl overflow-hidden border-2 border-blue-500/20">
                        <iframe
                          width="100%"
                          height="250"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://maps.google.com/maps?q=${event.location.latitude},${event.location.longitude}&z=15&output=embed`}
                          allowFullScreen
                          loading="lazy"
                        />
                      </div>
                    )}
                  </div>
                )}

                {event.notes && (
                  <div className="p-3 bg-slate-700/50 rounded-xl">
                    <div className="text-xs text-slate-400 mb-1">Notes</div>
                    <div className="text-sm text-white">{event.notes}</div>
                  </div>
                )}

                {event.audioUrl && (
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <audio controls src={event.audioUrl} className="w-full" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
