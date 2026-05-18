'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface TraceSummary {
  traceId: string;
  sessionStart: string;
  sessionEnd?: string;
  summary?: {
    totalEvents: number;
    criticalEvents: number;
    averageConfidence: number;
    emergencyClassification?: string;
    emergencyType?: string;
    finalDecision?: string;
    alertsSent: number;
    duration: number;
  };
  filename: string;
  createdAt: string;
}

interface TraceStats {
  totalTraces: number;
  totalEvents: number;
  totalCriticalEvents: number;
  totalAlerts: number;
  averageConfidence: number;
  averageDuration: number;
}

export default function TracesPage() {
  const router = useRouter();
  const [traces, setTraces] = useState<TraceSummary[]>([]);
  const [stats, setStats] = useState<TraceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTraces();
    fetchStats();
  }, []);

  const fetchTraces = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/traces?limit=20', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTraces(data.data.traces);
      } else {
        setError('Failed to load traces');
      }
    } catch (err) {
      setError('Error fetching traces');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3001/api/traces/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const viewTrace = (traceId: string) => {
    router.push(`/dashboard/traces/${traceId}`);
  };

  const getEmergencyTypeColor = (type?: string) => {
    switch (type) {
      case 'ROBBERY':
        return 'bg-red-100 text-red-800';
      case 'MEDICAL':
        return 'bg-blue-100 text-blue-800';
      case 'ACCIDENT':
        return 'bg-orange-100 text-orange-800';
      case 'HARASSMENT':
        return 'bg-purple-100 text-purple-800';
      case 'ASSAULT':
        return 'bg-red-100 text-red-800';
      case 'FIRE':
        return 'bg-red-100 text-red-800';
      case 'FALSE_ALARM':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (criticalEvents: number, totalEvents: number) => {
    const ratio = criticalEvents / totalEvents;
    if (ratio > 0.5) return 'text-red-600 bg-red-50';
    if (ratio > 0.2) return 'text-orange-600 bg-orange-50';
    return 'text-green-600 bg-green-50';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence > 0.8) return 'text-green-600 bg-green-50';
    if (confidence > 0.5) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔬 Antigravity Trace System
          </h1>
          <p className="text-gray-600">
            Complete emergency detection and response tracing
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Traces</div>
              <div className="text-3xl font-bold text-gray-900">
                {stats.totalTraces}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Total Events</div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.totalEvents}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Critical Events</div>
              <div className="text-3xl font-bold text-red-600">
                {stats.totalCriticalEvents}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm text-gray-600 mb-1">Avg Confidence</div>
              <div className="text-3xl font-bold text-green-600">
                {(stats.averageConfidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Traces List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">
              Recent Traces
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {traces.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-500">
                No traces found. Trigger an emergency to create a trace.
              </div>
            ) : (
              traces.map((trace) => (
                <div
                  key={trace.traceId}
                  onClick={() => viewTrace(trace.traceId)}
                  className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-sm text-gray-600">
                          {trace.traceId.slice(0, 8)}...
                        </span>
                        {trace.summary?.emergencyType && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getEmergencyTypeColor(
                              trace.summary.emergencyType
                            )}`}
                          >
                            {trace.summary.emergencyType.replace('_', ' ')}
                          </span>
                        )}
                        {trace.summary && (
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(
                              trace.summary.criticalEvents,
                              trace.summary.totalEvents
                            )}`}
                          >
                            {trace.summary.criticalEvents} Critical
                          </span>
                        )}
                        {trace.summary?.emergencyClassification && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-purple-50 text-purple-600">
                            {trace.summary.emergencyClassification}
                          </span>
                        )}
                      </div>

                      {trace.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Events:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {trace.summary.totalEvents}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Alerts:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {trace.summary.alertsSent}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Confidence:</span>
                            <span
                              className={`ml-2 font-medium ${
                                trace.summary.averageConfidence > 0.8
                                  ? 'text-green-600'
                                  : trace.summary.averageConfidence > 0.5
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {(trace.summary.averageConfidence * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 font-medium text-gray-900">
                              {(trace.summary.duration / 1000).toFixed(2)}s
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500">Decision:</span>
                            <span className="ml-2 font-medium text-gray-900 truncate">
                              {trace.summary.finalDecision || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="mt-2 text-xs text-gray-500">
                        Started: {new Date(trace.sessionStart).toLocaleString()}
                        {trace.sessionEnd && (
                          <span className="ml-4">
                            Ended: {new Date(trace.sessionEnd).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="ml-4">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            📊 Trace System Features
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Emergency type classification (ROBBERY, MEDICAL, ACCIDENT, etc.)</li>
            <li>✅ Complete AI prompt and response logging</li>
            <li>✅ Crisis detection with confidence scoring</li>
            <li>✅ Signal fusion from multiple sources</li>
            <li>✅ Alert retry with exponential backoff</li>
            <li>✅ Automatic fallback (SMS → WhatsApp → Voice)</li>
            <li>✅ Mobile actions (siren, recording, fullscreen)</li>
            <li>✅ Decision chain and action history</li>
            <li>✅ Timeline view with severity indicators</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
