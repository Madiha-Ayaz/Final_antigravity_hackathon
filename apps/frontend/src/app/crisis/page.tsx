'use client';

import React, { useState, useEffect } from 'react';
import SeverityPanel from '@/components/crisis/SeverityPanel';
import TraceTimeline from '@/components/crisis/TraceTimeline';
import ResourceCards from '@/components/crisis/ResourceCards';
import LiveMap from '@/components/LiveMap';

export default function CrisisDashboard() {
  const [activeIncident, setActiveIncident] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [scenario, setScenario] = useState('none');

  const runScenario = async (type: string) => {
    setLoading(true);
    setScenario(type);
    try {
      const res = await fetch(`http://localhost:3001/api/crisis/scenario/${type}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      const data = await res.json();
      setActiveIncident(data);
    } catch (err) {
      console.error('Failed to run scenario', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#05070a] text-white p-8 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-4xl font-black bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent">
            CRISIS MANAGEMENT
          </h1>
          <p className="text-white/40 font-mono text-sm tracking-widest mt-1">
            ANTIGRAVITY MULTI-AGENT CONTROL SYSTEM
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex gap-4">
          <button 
            onClick={() => runScenario('fire')}
            disabled={loading}
            className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            🔥 Fire Scenario
          </button>
          <button 
            onClick={() => runScenario('flood')}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            🌊 Flood Scenario
          </button>
          <button 
            onClick={() => runScenario('false_alarm')}
            disabled={loading}
            className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-bold hover:bg-white hover:text-black transition-all disabled:opacity-50"
          >
            🛡️ False Alarm Test
          </button>
        </div>
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-8 h-[calc(100vh-200px)]">
        
        {/* Left Column: Severity & Resources */}
        <div className="col-span-3 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
          {activeIncident && !activeIncident.success ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-3xl p-6 text-red-200">
              <h4 className="text-sm font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                <span>🚨</span> Workflow Stopped
              </h4>
              <p className="text-xs leading-relaxed opacity-80 mb-3">
                {activeIncident.reason === 'unverified' 
                  ? 'Multi-agent signal fusion determined the incoming triggers were inconsistent or fell below the verification threshold.' 
                  : `Critical system error: ${activeIncident.error || 'Unknown workflow exception'}`}
              </p>
              <div className="bg-black/30 rounded-xl p-3 font-mono text-[10px] text-red-400 border border-red-500/10">
                STATUS: {activeIncident.reason === 'unverified' ? 'UNVERIFIED' : 'FAILED'}
              </div>
            </div>
          ) : null}

          {activeIncident && activeIncident.success ? (
            <>
              <SeverityPanel 
                level={activeIncident.impact?.severity || 'Medium'}
                confidence={activeIncident.impact?.confidenceScore || 0.8}
                radius={activeIncident.impact?.affectedRadiusKm || 1}
                duration={activeIncident.impact?.predictedDurationHours || 4}
              />
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                <ResourceCards resources={activeIncident.allocation || []} />
              </div>

              <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl p-6">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3">Simulation Insight</h4>
                <p className="text-sm text-indigo-100/80 leading-relaxed">
                  The AI predicts a <span className="font-bold text-white">{activeIncident.simulation?.responseImprovementPercent || 0}%</span> improvement in response time with current allocation.
                </p>
              </div>
            </>
          ) : !activeIncident ? (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-3xl p-12 text-center text-white/20 italic">
              <p>Select a scenario to start real-time crisis orchestration.</p>
            </div>
          ) : null}
        </div>

        {/* Middle Column: Map */}
        <div className="col-span-6 rounded-3xl overflow-hidden border border-white/10 relative">
          <LiveMap 
            center={activeIncident?.impact?.location || { lat: 31.5204, lng: 74.3587 }} 
            zoom={activeIncident ? 14 : 12}
          />
          {loading && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-mono text-sm tracking-widest animate-pulse">ORCHESTRATING AGENTS...</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: AI Trace */}
        <div className="col-span-3 h-full">
          <TraceTimeline steps={activeIncident?.trace || []} />
        </div>

      </div>
    </div>
  );
}
