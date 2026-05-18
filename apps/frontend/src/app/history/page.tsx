'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '../../components';

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
  const [liveLocation, setLiveLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  // Get live GPS location
  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setLiveLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => console.error('GPS error:', error),
        { enableHighAccuracy: true, maximumAge: 0 }
      );

      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  // Fetch events from API
  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/emergency/history', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        setEvents(data.data?.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
      // Use mock data if API fails
      setEvents([
        {
          id: '1',
          timestamp: new Date().toISOString(),
          type: 'alert',
          threatLevel: 'HIGH',
          confidence: 95,
          location: liveLocation ? {
            latitude: liveLocation.latitude,
            longitude: liveLocation.longitude,
            address: 'Current Location',
          } : undefined,
          contactsNotified: 3,
          status: 'active',
          notes: 'Emergency detected via voice analysis',
          whatsappMessages: [
            { recipient: '+923343717260', status: 'delivered', timestamp: new Date().toISOString() },
            { recipient: '+923452508043', status: 'delivered', timestamp: new Date().toISOString() },
          ],
        },
      ]);
    }
  };

  const filteredEvents = filter === 'all' ? events : events.filter((e) => e.type === filter);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'danger';
      case 'false_alarm': return 'warning';
      case 'test': return 'secondary';
      default: return 'primary';
    }
  };

  const getThreatColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'text-danger-600';
      case 'HIGH': return 'text-danger-500';
      case 'MEDIUM': return 'text-warning-600';
      case 'LOW': return 'text-success-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <DashboardLayout userName="User">
      <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Event History</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              View emergency events with live GPS tracking
            </p>
          </div>
          <button className="btn-outline text-sm sm:text-base" onClick={fetchEvents}>
            🔄 Refresh
          </button>
        </div>

        {/* Live GPS Location Card */}
        {liveLocation && (
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-4 sm:p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <h2 className="text-lg sm:text-xl font-bold">📍 Live GPS Location</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Coordinates:</p>
                <p className="font-mono text-base sm:text-lg font-bold">
                  {liveLocation.latitude.toFixed(6)}, {liveLocation.longitude.toFixed(6)}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`https://www.google.com/maps?q=${liveLocation.latitude},${liveLocation.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center text-sm sm:text-base"
                >
                  🗺️ Open in Maps
                </a>
              </div>
            </div>

            {/* Embedded Google Map */}
            <div className="mt-4 rounded-lg overflow-hidden border-4 border-white/20">
              <iframe
                width="100%"
                height="300"
                frameBorder="0"
                style={{ border: 0 }}
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_API_KEY'}&q=${liveLocation.latitude},${liveLocation.longitude}&zoom=15`}
                allowFullScreen
              ></iframe>
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[
            { label: 'Total Events', value: events.length, icon: '📊', color: 'primary' },
            { label: 'Real Alerts', value: events.filter((e) => e.type === 'alert').length, icon: '🚨', color: 'danger' },
            { label: 'False Alarms', value: events.filter((e) => e.type === 'false_alarm').length, icon: '⚠️', color: 'warning' },
            { label: 'Tests', value: events.filter((e) => e.type === 'test').length, icon: '✓', color: 'success' },
          ].map((stat, index) => (
            <div key={index} className="card-hover p-3 sm:p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-xl sm:text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
                <div className="text-xl sm:text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="card p-3 sm:p-4">
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Filter:</span>
            {[
              { id: 'all', label: 'All' },
              { id: 'alert', label: 'Alerts' },
              { id: 'false_alarm', label: 'False' },
              { id: 'test', label: 'Tests' },
            ].map((filterOption) => (
              <button
                key={filterOption.id}
                onClick={() => setFilter(filterOption.id as any)}
                className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === filterOption.id
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-dark-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          {filteredEvents.length === 0 ? (
            <div className="card text-center py-8 sm:py-12">
              <div className="text-4xl sm:text-6xl mb-4">📭</div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No Events Found
              </h3>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                {filter === 'all' ? 'No emergency events recorded yet' : `No ${filter.replace('_', ' ')} events found`}
              </p>
            </div>
          ) : (
            filteredEvents.map((event) => (
              <div key={event.id} className="card-hover p-4 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl flex-shrink-0 ${
                      event.type === 'alert' ? 'bg-danger-100' : event.type === 'false_alarm' ? 'bg-warning-100' : 'bg-secondary-100'
                    }`}>
                      {event.type === 'alert' ? '🚨' : event.type === 'false_alarm' ? '⚠️' : '✓'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                          {event.type === 'alert' ? 'Emergency Alert' : event.type === 'false_alarm' ? 'False Alarm' : 'System Test'}
                        </h3>
                        <span className={`badge-${getTypeColor(event.type)} text-xs`}>
                          {event.type.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
                  <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Threat Level</div>
                    <div className={`text-sm sm:text-lg font-bold ${getThreatColor(event.threatLevel)}`}>
                      {event.threatLevel}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Confidence</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                      {event.confidence}%
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg col-span-2 sm:col-span-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Contacts Notified</div>
                    <div className="text-sm sm:text-lg font-bold text-gray-900 dark:text-white">
                      {event.contactsNotified}
                    </div>
                  </div>
                </div>

                {/* WhatsApp Messages */}
                {event.whatsappMessages && event.whatsappMessages.length > 0 && (
                  <div className="mb-4 p-3 sm:p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="text-xs sm:text-sm font-semibold text-green-800 dark:text-green-300 mb-2">
                      📱 WhatsApp Messages Sent
                    </h4>
                    <div className="space-y-2">
                      {event.whatsappMessages.map((msg, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-green-700 dark:text-green-400 font-medium">{msg.recipient}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            msg.status === 'delivered' ? 'bg-green-200 text-green-800' :
                            msg.status === 'sent' ? 'bg-blue-200 text-blue-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {msg.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Location with Map */}
                {event.location && (
                  <div className="mb-4">
                    <div className="p-3 sm:p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800 mb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                            📍 {event.location.address}
                          </div>
                          <div className="text-xs text-blue-700 dark:text-blue-300 font-mono">
                            {event.location.latitude.toFixed(6)}, {event.location.longitude.toFixed(6)}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedEvent(selectedEvent?.id === event.id ? null : event)}
                          className="btn-outline btn-sm text-xs sm:text-sm whitespace-nowrap"
                        >
                          {selectedEvent?.id === event.id ? 'Hide Map' : 'Show Map'}
                        </button>
                      </div>
                    </div>

                    {/* Embedded Map */}
                    {selectedEvent?.id === event.id && (
                      <div className="rounded-lg overflow-hidden border-2 border-blue-200 dark:border-blue-800">
                        <iframe
                          width="100%"
                          height="300"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'YOUR_API_KEY'}&q=${event.location.latitude},${event.location.longitude}&zoom=15`}
                          allowFullScreen
                        ></iframe>
                      </div>
                    )}
                  </div>
                )}

                {event.notes && (
                  <div className="p-3 bg-gray-50 dark:bg-dark-800 rounded-lg">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Notes</div>
                    <div className="text-xs sm:text-sm text-gray-900 dark:text-white">{event.notes}</div>
                  </div>
                )}

                {event.audioUrl && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700">
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
