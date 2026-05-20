'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AgentLog {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  reasoning: string;
  result: any;
}

export default function AgentLogsViewer() {
  const [logs, setLogs] = useState<AgentLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    fetchLogs();
    fetchStats();

    // Auto-refresh every 5 seconds
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 5000);

    return () => clearInterval(interval);
  }, [filter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const url = filter === 'all'
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/agent-logs/logs?limit=50`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/agent-logs/logs?agent=${filter}&limit=50`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setLogs(data.logs);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/agent-logs/stats`);
      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getAgentColor = (agent: string) => {
    const colors: Record<string, string> = {
      'AudioAnalysisAgent': 'from-blue-500 to-cyan-500',
      'VerificationAgent': 'from-purple-500 to-pink-500',
      'DispatchAgent': 'from-red-500 to-orange-500',
      'CommunityValidationAgent': 'from-green-500 to-emerald-500',
      'SignalFusionAgent': 'from-yellow-500 to-amber-500',
      'CrisisVerificationAgent': 'from-indigo-500 to-violet-500',
    };
    return colors[agent] || 'from-gray-500 to-slate-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent mb-2">
            🤖 Agent Activity Monitor
          </h1>
          <p className="text-slate-400 text-sm sm:text-base">
            Real-time logging and tracing of all AI agent operations
          </p>
        </motion.div>

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Logs</div>
              <div className="text-3xl font-bold text-white">{stats.totalLogs}</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Active Agents</div>
              <div className="text-3xl font-bold text-emerald-400">{Object.keys(stats.agentCounts || {}).length}</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Actions</div>
              <div className="text-3xl font-bold text-blue-400">{Object.keys(stats.actionCounts || {}).length}</div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-4 backdrop-blur-sm">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Status</div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-lg font-bold text-emerald-400">LIVE</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'AudioAnalysisAgent', 'VerificationAgent', 'DispatchAgent', 'CommunityValidationAgent'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                filter === f
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-slate-800/40 text-slate-400 hover:bg-slate-700/40'
              }`}
            >
              {f === 'all' ? 'All Agents' : f.replace('Agent', '')}
            </button>
          ))}
        </div>

        {/* Logs List */}
        <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 sm:p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              Activity Stream
            </h2>
            {loading && (
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                Refreshing...
              </div>
            )}
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            <AnimatePresence mode="popLayout">
              {logs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-12 text-slate-500"
                >
                  <div className="text-4xl mb-2">📊</div>
                  <p>No agent logs yet. Start an emergency scenario to see activity.</p>
                </motion.div>
              ) : (
                logs.map((log, index) => (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-950/50 border border-slate-800/50 rounded-xl p-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-10 h-10 bg-gradient-to-br ${getAgentColor(log.agent)} rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                          {log.agent.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate">{log.agent}</h3>
                          <p className="text-xs text-slate-400">{log.action}</p>
                        </div>
                      </div>
                      <div className="text-xs text-slate-500 font-mono whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{log.reasoning}</p>
                    {log.result && (
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-400 hover:text-blue-300">View Result</summary>
                        <pre className="mt-2 p-2 bg-slate-950/80 border border-slate-800 rounded text-slate-400 overflow-x-auto">
                          {JSON.stringify(log.result, null, 2)}
                        </pre>
                      </details>
                    )}
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
