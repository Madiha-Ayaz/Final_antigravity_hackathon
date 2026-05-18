'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TraceEvent {
  eventId: string;
  timestamp: string;
  eventType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  data: any;
}

interface DecisionNode {
  nodeId: string;
  timestamp: string;
  decision: string;
  reasoning: string;
  confidence: number;
}

interface ActionRecord {
  actionId: string;
  timestamp: string;
  action: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  duration?: number;
  error?: string;
}

interface TraceSession {
  traceId: string;
  sessionStart: string;
  sessionEnd?: string;
  events: TraceEvent[];
  decisionChain: DecisionNode[];
  actionHistory: ActionRecord[];
  summary?: {
    totalEvents: number;
    criticalEvents: number;
    averageConfidence: number;
    emergencyClassification?: string;
    finalDecision?: string;
    alertsSent: number;
    duration: number;
  };
}

export default function TraceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const traceId = params.traceId as string;

  const [trace, setTrace] = useState<TraceSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'timeline' | 'events' | 'decisions' | 'actions'>('timeline');

  useEffect(() => {
    fetchTrace();
  }, [traceId]);

  const fetchTrace = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3001/api/traces/${traceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (data.success) {
        setTrace(data.data);
      } else {
        setError('Failed to load trace');
      }
    } catch (err) {
      setError('Error fetching trace');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'LOW':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'AI_PROMPT':
        return '🤖';
      case 'AI_RESPONSE':
        return '💬';
      case 'CRISIS_DETECTION':
        return '🚨';
      case 'CONFIDENCE_SCORE':
        return '📊';
      case 'SIGNAL_FUSION':
        return '🔗';
      case 'EMERGENCY_CLASSIFICATION':
        return '⚠️';
      case 'FALLBACK_ACTION':
        return '🔄';
      case 'GPS_EVENT':
        return '📍';
      case 'ALERT_EXECUTION':
        return '📢';
      case 'EMERGENCY_RESPONSE':
        return '🚑';
      default:
        return '📝';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !trace) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error || 'Trace not found'}</p>
            <button
              onClick={() => router.push('/dashboard/traces')}
              className="mt-4 text-red-600 hover:text-red-800 underline"
            >
              ← Back to traces
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/traces')}
            className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to traces
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Trace Details
          </h1>
          <p className="text-gray-600 font-mono text-sm">{trace.traceId}</p>
        </div>

        {/* Summary Cards */}
        {trace.summary && (
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Total Events</div>
              <div className="text-2xl font-bold text-gray-900">{trace.summary.totalEvents}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Critical</div>
              <div className="text-2xl font-bold text-red-600">{trace.summary.criticalEvents}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Confidence</div>
              <div className="text-2xl font-bold text-green-600">
                {(trace.summary.averageConfidence * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Alerts Sent</div>
              <div className="text-2xl font-bold text-blue-600">{trace.summary.alertsSent}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Duration</div>
              <div className="text-2xl font-bold text-purple-600">
                {(trace.summary.duration / 1000).toFixed(2)}s
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-xs text-gray-600 mb-1">Classification</div>
              <div className="text-sm font-bold text-orange-600 truncate">
                {trace.summary.emergencyClassification || 'N/A'}
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {[
                { id: 'timeline', label: 'Timeline', icon: '📅' },
                { id: 'events', label: 'Events', icon: '📋' },
                { id: 'decisions', label: 'Decisions', icon: '🎯' },
                { id: 'actions', label: 'Actions', icon: '⚡' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-4">
                {[...trace.events, ...trace.decisionChain.map(d => ({ ...d, type: 'DECISION' })), ...trace.actionHistory.map(a => ({ ...a, type: 'ACTION' }))]
                  .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
                  .map((item: any, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                          item.severity ? getSeverityColor(item.severity) : 'bg-blue-100 text-blue-800'
                        }`}>
                          {item.eventType ? getEventIcon(item.eventType) : item.type === 'DECISION' ? '🎯' : '⚡'}
                        </div>
                        {idx < trace.events.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-200 mt-2"></div>
                        )}
                      </div>
                      <div className="flex-1 pb-8">
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="font-semibold text-gray-900">
                                {item.eventType || item.decision || item.action}
                              </div>
                              <div className="text-xs text-gray-500">
                                {new Date(item.timestamp).toLocaleString()}
                              </div>
                            </div>
                            {item.confidence !== undefined && (
                              <span className="text-sm font-medium text-green-600">
                                {(item.confidence * 100).toFixed(0)}% confidence
                              </span>
                            )}
                          </div>
                          {item.reasoning && (
                            <p className="text-sm text-gray-600 mt-2">{item.reasoning}</p>
                          )}
                          {item.data && (
                            <pre className="text-xs bg-white p-2 rounded mt-2 overflow-x-auto">
                              {JSON.stringify(item.data, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-3">
                {trace.events.map((event) => (
                  <div key={event.eventId} className={`border rounded-lg p-4 ${getSeverityColor(event.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getEventIcon(event.eventType)}</span>
                        <div>
                          <div className="font-semibold">{event.eventType}</div>
                          <div className="text-xs opacity-75">
                            {new Date(event.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs font-medium px-2 py-1 rounded bg-white bg-opacity-50">
                        {event.severity}
                      </span>
                    </div>
                    <pre className="text-xs bg-white bg-opacity-50 p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {/* Decisions Tab */}
            {activeTab === 'decisions' && (
              <div className="space-y-4">
                {trace.decisionChain.map((decision, idx) => (
                  <div key={decision.nodeId} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="text-sm text-blue-600 font-medium mb-1">
                          Decision #{idx + 1}
                        </div>
                        <div className="font-semibold text-gray-900 text-lg">
                          {decision.decision}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(decision.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {(decision.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-600">confidence</div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 mt-3 bg-white p-3 rounded">
                      {decision.reasoning}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <div className="space-y-3">
                {trace.actionHistory.map((action) => (
                  <div key={action.actionId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">{action.action}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(action.timestamp).toLocaleString()}
                        </div>
                        {action.duration && (
                          <div className="text-xs text-gray-600 mt-1">
                            Duration: {action.duration}ms
                          </div>
                        )}
                        {action.error && (
                          <div className="text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                            Error: {action.error}
                          </div>
                        )}
                      </div>
                      <span className={`px-3 py-1 rounded text-xs font-medium ${getStatusColor(action.status)}`}>
                        {action.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
