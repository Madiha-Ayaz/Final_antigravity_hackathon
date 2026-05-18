'use client';

import { useState, useEffect } from 'react';

interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  userId?: string;
  status: string;
  metadata?: any;
}

interface AbuseMetrics {
  totalIncidents: number;
  falseAlarms: number;
  validatedIncidents: number;
  falseAlarmRate: number;
  averageConfidence: number;
  suspiciousUsers: string[];
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'audit' | 'abuse' | 'community'>('audit');
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [abuseMetrics, setAbuseMetrics] = useState<AbuseMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'abuse') {
      fetchAbuseMetrics();
    }
  }, [activeTab]);

  const fetchAuditLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/audit/logs?limit=50', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAuditLogs(data.data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAbuseMetrics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/abuse/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setAbuseMetrics(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch abuse metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            🛡️ Admin Dashboard
          </h1>
          <p className="text-gray-600">
            Monitor audit logs, abuse reports, and community activity
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-lg mb-6">
          <div className="flex border-b overflow-x-auto">
            <button
              onClick={() => setActiveTab('audit')}
              className={`flex-1 min-w-[120px] py-4 px-6 font-semibold transition-colors ${
                activeTab === 'audit'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              📋 Audit Logs
            </button>
            <button
              onClick={() => setActiveTab('abuse')}
              className={`flex-1 min-w-[120px] py-4 px-6 font-semibold transition-colors ${
                activeTab === 'abuse'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              🚨 Abuse Reports
            </button>
            <button
              onClick={() => setActiveTab('community')}
              className={`flex-1 min-w-[120px] py-4 px-6 font-semibold transition-colors ${
                activeTab === 'community'
                  ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              👥 Community
            </button>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading...</p>
              </div>
            ) : (
              <>
                {/* Audit Logs Tab */}
                {activeTab === 'audit' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold text-gray-800">
                        Recent Audit Logs
                      </h2>
                      <button
                        onClick={fetchAuditLogs}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>

                    {auditLogs.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No audit logs found</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Timestamp
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Action
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                User ID
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Status
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {auditLogs.map((log) => (
                              <tr key={log.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {new Date(log.timestamp).toLocaleString()}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {log.action}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-500">
                                  {log.userId?.substring(0, 8)}...
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    log.status === 'success'
                                      ? 'bg-green-100 text-green-800'
                                      : log.status === 'failure'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* Abuse Metrics Tab */}
                {activeTab === 'abuse' && abuseMetrics && (
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-bold text-gray-800">
                        Abuse Metrics
                      </h2>
                      <button
                        onClick={fetchAbuseMetrics}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        🔄 Refresh
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                        <h3 className="text-sm font-medium text-blue-600 mb-2">
                          Total Incidents
                        </h3>
                        <p className="text-3xl font-bold text-blue-900">
                          {abuseMetrics.totalIncidents}
                        </p>
                      </div>

                      <div className="bg-red-50 p-6 rounded-lg border border-red-200">
                        <h3 className="text-sm font-medium text-red-600 mb-2">
                          False Alarms
                        </h3>
                        <p className="text-3xl font-bold text-red-900">
                          {abuseMetrics.falseAlarms}
                        </p>
                      </div>

                      <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                        <h3 className="text-sm font-medium text-green-600 mb-2">
                          Validated
                        </h3>
                        <p className="text-3xl font-bold text-green-900">
                          {abuseMetrics.validatedIncidents}
                        </p>
                      </div>

                      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                        <h3 className="text-sm font-medium text-yellow-600 mb-2">
                          False Alarm Rate
                        </h3>
                        <p className="text-3xl font-bold text-yellow-900">
                          {(abuseMetrics.falseAlarmRate * 100).toFixed(1)}%
                        </p>
                      </div>

                      <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                        <h3 className="text-sm font-medium text-purple-600 mb-2">
                          Avg Confidence
                        </h3>
                        <p className="text-3xl font-bold text-purple-900">
                          {(abuseMetrics.averageConfidence * 100).toFixed(0)}%
                        </p>
                      </div>

                      <div className="bg-orange-50 p-6 rounded-lg border border-orange-200">
                        <h3 className="text-sm font-medium text-orange-600 mb-2">
                          Suspicious Users
                        </h3>
                        <p className="text-3xl font-bold text-orange-900">
                          {abuseMetrics.suspiciousUsers.length}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Community Tab */}
                {activeTab === 'community' && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      Community features coming soon...
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
