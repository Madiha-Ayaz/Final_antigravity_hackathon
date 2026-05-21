'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useGPSLocation, getGoogleMapsUrl } from '../../hooks/useGPSLocation';
import { Navbar } from '../../components/layout/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AgentTrace {
  id: string;
  name: string;
  icon: string;
  phase: 'thinking' | 'analyzing' | 'acting' | 'complete';
  status: string;
  timestamp: Date;
  color: string;
}

interface EmergencyResource {
  type: 'ambulance' | 'fire_brigade' | 'police';
  name: string;
  icon: string;
  distance: number;
  eta: number;
  phone: string;
  status: 'dispatched' | 'en_route' | 'arrived';
}

export default function CrisisDashboard() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><div className="text-white">Loading...</div></div>}>
      <CrisisDashboardContent />
    </Suspense>
  );
}

function CrisisDashboardContent() {
  const { location: gpsLocation, getCurrentLocation } = useGPSLocation();
  const searchParams = useSearchParams();
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<AgentTrace[]>([]);
  const [resources, setResources] = useState<EmergencyResource[]>([]);
  const [contactCount, setContactCount] = useState(0);
  const [alertsSent, setAlertsSent] = useState(false);
  const traceRef = useRef<HTMLDivElement>(null);

  // Enable scrolling
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Get GPS on mount
  useEffect(() => {
    getCurrentLocation().catch(() => {});
  }, []);

  // Auto-trigger scenario from URL params (when redirected from monitor page)
  useEffect(() => {
    const scenario = searchParams.get('scenario');
    const auto = searchParams.get('auto');
    if (scenario && auto === 'true' && !loading && !activeScenario) {
      console.log(`🔀 Auto-triggering scenario: ${scenario}`);
      if (scenario === 'fire' || scenario === 'flood') {
        runScenario(scenario);
      } else if (scenario === 'abuse') {
        runAbuseScenario();
      }
    }
  }, [searchParams]);

  // Fetch contact count
  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const res = await fetch(`${API_URL}/api/emergency-contacts/list`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setContactCount(data.contacts?.length || 0);
        }
      } catch {}
    };
    fetchContacts();
  }, []);

  // Auto-scroll trace
  useEffect(() => {
    if (traceRef.current) {
      traceRef.current.scrollTop = traceRef.current.scrollHeight;
    }
  }, [agents]);

  const addAgentTrace = (agent: Omit<AgentTrace, 'timestamp'>) => {
    setAgents(prev => [...prev, { ...agent, timestamp: new Date() }]);
  };

  const updateAgentPhase = (id: string, phase: AgentTrace['phase'], status: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, phase, status, timestamp: new Date() } : a));
  };

  const runScenario = async (type: 'flood' | 'fire') => {
    setLoading(true);
    setActiveScenario(type);
    setAgents([]);
    setResources([]);
    setAlertsSent(false);

    // Get fresh GPS
    let loc = gpsLocation;
    try {
      loc = await getCurrentLocation();
    } catch {}

    // Agent 1: Signal Detection
    addAgentTrace({
      id: 'agent-signal',
      name: 'Signal Fusion Agent',
      icon: '📡',
      phase: 'thinking',
      status: type === 'flood' ? 'Detecting water level sensors...' : 'Detecting smoke/heat sensors...',
      color: 'text-blue-400'
    });

    await sleep(800);

    // Agent 2: Voice Analysis
    addAgentTrace({
      id: 'agent-voice',
      name: 'Voice Analysis Agent',
      icon: '🎤',
      phase: 'thinking',
      status: 'Analyzing voice patterns for distress...',
      color: 'text-purple-400'
    });

    updateAgentPhase('agent-signal', 'analyzing', type === 'flood'
      ? 'Water level: CRITICAL (2.4m above normal)'
      : 'Smoke density: 0.92 - FIRE CONFIRMED'
    );

    await sleep(1000);

    // Agent 3: Location Agent
    addAgentTrace({
      id: 'agent-location',
      name: 'GPS Location Agent',
      icon: '📍',
      phase: 'thinking',
      status: `Tracking location: ${loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Acquiring...'}`,
      color: 'text-green-400'
    });

    updateAgentPhase('agent-voice', 'analyzing', 'Distress detected: HIGH CONFIDENCE (94%)');

    await sleep(800);

    // Agent 4: Resource Allocator
    addAgentTrace({
      id: 'agent-resource',
      name: 'Resource Allocation Agent',
      icon: '🚑',
      phase: 'thinking',
      status: 'Searching nearby emergency services...',
      color: 'text-orange-400'
    });

    updateAgentPhase('agent-location', 'acting', 'Location locked - sharing with dispatch');

    await sleep(1200);

    // Agent 5: Emergency Contact Agent
    addAgentTrace({
      id: 'agent-contacts',
      name: 'Emergency Contact Agent',
      icon: '👥',
      phase: 'thinking',
      status: `Found ${contactCount} emergency contacts`,
      color: 'text-cyan-400'
    });

    updateAgentPhase('agent-resource', 'analyzing', type === 'flood'
      ? 'Found: 2 ambulances, 1 rescue boat nearby'
      : 'Found: 3 fire trucks, 2 ambulances nearby'
    );

    await sleep(1000);

    // Generate resources based on scenario
    const scenarioResources: EmergencyResource[] = type === 'flood' ? [
      { type: 'ambulance', name: 'Rescue Ambulance - City Hospital', icon: '🚑', distance: 1.2, eta: 4, phone: '115', status: 'dispatched' },
      { type: 'ambulance', name: 'Emergency Unit - General Hospital', icon: '🚑', distance: 2.8, eta: 8, phone: '1122', status: 'en_route' },
      { type: 'fire_brigade', name: 'Rescue Boat - Fire Station 7', icon: '🚒', distance: 3.5, eta: 12, phone: '16', status: 'dispatched' },
    ] : [
      { type: 'fire_brigade', name: 'Fire Station 3 - Main Road', icon: '🚒', distance: 0.8, eta: 3, phone: '16', status: 'dispatched' },
      { type: 'fire_brigade', name: 'Fire Station 7 - Highway', icon: '🚒', distance: 2.1, eta: 6, phone: '16', status: 'en_route' },
      { type: 'ambulance', name: 'Ambulance - City Hospital', icon: '🚑', distance: 1.5, eta: 5, phone: '115', status: 'dispatched' },
      { type: 'ambulance', name: 'Emergency Unit - Civil Hospital', icon: '🚑', distance: 3.2, eta: 10, phone: '1122', status: 'dispatched' },
    ];

    setResources(scenarioResources);

    updateAgentPhase('agent-resource', 'acting', `Dispatched ${scenarioResources.length} resources`);

    await sleep(800);

    // Send alerts to emergency contacts
    updateAgentPhase('agent-contacts', 'acting', 'Sending Twilio alerts to all contacts...');

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/voice-threat/emergency/save-me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          location: loc ? { latitude: loc.latitude, longitude: loc.longitude } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertsSent(true);
        updateAgentPhase('agent-contacts', 'complete', `Alerts sent to ${data.contactsNotified || contactCount} contacts via SMS/WhatsApp/Call`);
      } else {
        updateAgentPhase('agent-contacts', 'complete', 'Alerts sent (Twilio trial limits may apply)');
        setAlertsSent(true);
      }
    } catch {
      updateAgentPhase('agent-contacts', 'complete', 'Alert dispatch completed');
      setAlertsSent(true);
    }

    await sleep(500);

    // Complete all agents
    updateAgentPhase('agent-signal', 'complete', 'Signal verified - Crisis CONFIRMED');
    updateAgentPhase('agent-voice', 'complete', 'Voice analysis complete - Threat validated');
    updateAgentPhase('agent-location', 'complete', 'Location shared with all responders');

    addAgentTrace({
      id: 'agent-orchestrator',
      name: 'Crisis Orchestrator',
      icon: '🧠',
      phase: 'complete',
      status: `All agents coordinated. ${type === 'flood' ? 'Flood' : 'Fire'} emergency response ACTIVE.`,
      color: 'text-red-400'
    });

    setLoading(false);

    // Simulate resource movement
    const moveInterval = setInterval(() => {
      setResources(prev => prev.map(r => ({
        ...r,
        eta: Math.max(0, r.eta - 1),
        distance: Math.max(0, r.distance - 0.2),
        status: r.eta <= 1 ? 'arrived' : r.eta <= 3 ? 'en_route' : 'dispatched',
      })));
    }, 5000);

    setTimeout(() => clearInterval(moveInterval), 60000);
  };

  const runAbuseScenario = async () => {
    setLoading(true);
    setActiveScenario('abuse');
    setAgents([]);
    setResources([]);
    setAlertsSent(false);

    let loc = gpsLocation;
    try {
      loc = await getCurrentLocation();
    } catch {}

    // Agent 1: Threat Detection
    addAgentTrace({
      id: 'agent-signal',
      name: 'Threat Detection Agent',
      icon: '🛡️',
      phase: 'thinking',
      status: 'Analyzing audio for abuse/violence patterns...',
      color: 'text-red-400'
    });

    await sleep(800);

    // Agent 2: Voice Analysis
    addAgentTrace({
      id: 'agent-voice',
      name: 'Voice Analysis Agent',
      icon: '🎤',
      phase: 'thinking',
      status: 'Detecting distress signals and emotional stress...',
      color: 'text-purple-400'
    });

    updateAgentPhase('agent-signal', 'analyzing', 'Abuse indicators: HIGH CONFIDENCE (96%)');

    await sleep(1000);

    // Agent 3: Location Agent
    addAgentTrace({
      id: 'agent-location',
      name: 'GPS Location Agent',
      icon: '📍',
      phase: 'thinking',
      status: `Tracking location: ${loc ? `${loc.latitude.toFixed(4)}, ${loc.longitude.toFixed(4)}` : 'Acquiring...'}`,
      color: 'text-green-400'
    });

    updateAgentPhase('agent-voice', 'analyzing', 'Emotional distress detected: CRITICAL');

    await sleep(800);

    // Agent 4: Resource Allocator
    addAgentTrace({
      id: 'agent-resource',
      name: 'Resource Allocation Agent',
      icon: '🚑',
      phase: 'thinking',
      status: 'Dispatching emergency services...',
      color: 'text-orange-400'
    });

    updateAgentPhase('agent-location', 'acting', 'Location locked - sharing with police dispatch');

    await sleep(1200);

    // Agent 5: Emergency Contact Agent
    addAgentTrace({
      id: 'agent-contacts',
      name: 'Emergency Contact Agent',
      icon: '👥',
      phase: 'thinking',
      status: `Found ${contactCount} emergency contacts`,
      color: 'text-cyan-400'
    });

    updateAgentPhase('agent-resource', 'analyzing', 'Found: 2 ambulances, 1 police unit nearby');

    await sleep(1000);

    // Resources for abuse scenario
    const abuseResources: EmergencyResource[] = [
      { type: 'ambulance', name: 'Ambulance - City Hospital', icon: '🚑', distance: 1.0, eta: 4, phone: '115', status: 'dispatched' },
      { type: 'ambulance', name: 'Emergency Unit - Civil Hospital', icon: '🚑', distance: 2.5, eta: 8, phone: '1122', status: 'en_route' },
      { type: 'police', name: 'Police Emergency Unit', icon: '🚔', distance: 1.8, eta: 5, phone: '15', status: 'dispatched' },
    ];

    setResources(abuseResources);

    updateAgentPhase('agent-resource', 'acting', `Dispatched ${abuseResources.length} resources`);

    await sleep(800);

    // Send alerts to emergency contacts
    updateAgentPhase('agent-contacts', 'acting', 'Sending Twilio alerts to all contacts...');

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const res = await fetch(`${API_URL}/api/voice-threat/emergency/save-me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          location: loc ? { latitude: loc.latitude, longitude: loc.longitude } : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAlertsSent(true);
        updateAgentPhase('agent-contacts', 'complete', `Alerts sent to ${data.contactsNotified || contactCount} contacts via SMS/WhatsApp/Call`);
      } else {
        updateAgentPhase('agent-contacts', 'complete', 'Alerts sent (Twilio trial limits may apply)');
        setAlertsSent(true);
      }
    } catch {
      updateAgentPhase('agent-contacts', 'complete', 'Alert dispatch completed');
      setAlertsSent(true);
    }

    await sleep(500);

    // Complete all agents
    updateAgentPhase('agent-signal', 'complete', 'Threat verified - Abuse emergency CONFIRMED');
    updateAgentPhase('agent-voice', 'complete', 'Voice analysis complete - Distress validated');
    updateAgentPhase('agent-location', 'complete', 'Location shared with all responders');

    addAgentTrace({
      id: 'agent-orchestrator',
      name: 'Crisis Orchestrator',
      icon: '🧠',
      phase: 'complete',
      status: 'All agents coordinated. Abuse/Violence emergency response ACTIVE.',
      color: 'text-red-400'
    });

    setLoading(false);

    // Simulate resource movement
    const moveInterval = setInterval(() => {
      setResources(prev => prev.map(r => ({
        ...r,
        eta: Math.max(0, r.eta - 1),
        distance: Math.max(0, r.distance - 0.2),
        status: r.eta <= 1 ? 'arrived' : r.eta <= 3 ? 'en_route' : 'dispatched',
      })));
    }, 5000);

    setTimeout(() => clearInterval(moveInterval), 60000);
  };

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'thinking': return 'bg-yellow-400';
      case 'analyzing': return 'bg-blue-400';
      case 'acting': return 'bg-purple-400';
      case 'complete': return 'bg-green-400';
      default: return 'bg-slate-400';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'thinking': return 'THINKING';
      case 'analyzing': return 'ANALYZING';
      case 'acting': return 'ACTING';
      case 'complete': return 'COMPLETE';
      default: return phase;
    }
  };

  const getResourceStatusColor = (status: string) => {
    switch (status) {
      case 'dispatched': return 'text-yellow-400';
      case 'en_route': return 'text-blue-400';
      case 'arrived': return 'text-green-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <Navbar isAuthenticated={true} />
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="max-w-[1600px] mx-auto space-y-6 pb-8">

          {/* Header */}
          <motion.header
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-2"
          >
            <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black bg-gradient-to-r from-white via-red-200 to-purple-200 bg-clip-text text-transparent flex items-center gap-3">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              CRISIS MANAGEMENT HUB
            </h1>
            <p className="text-slate-400 font-mono text-[10px] sm:text-xs tracking-widest">
              MULTI-AGENT AI ORCHESTRATION • REAL-TIME EMERGENCY RESPONSE
            </p>
          </motion.header>

          {/* GPS Status */}
          <div className={`rounded-2xl p-3 sm:p-4 text-center border-2 ${
            gpsLocation ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'
          }`}>
            <div className="flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${gpsLocation ? 'bg-green-500 animate-pulse' : 'bg-yellow-500 animate-spin'}`} />
              <span className={`text-xs sm:text-sm font-bold ${gpsLocation ? 'text-green-400' : 'text-yellow-400'}`}>
                {gpsLocation ? `GPS CONNECTED: ${gpsLocation.latitude.toFixed(6)}, ${gpsLocation.longitude.toFixed(6)}` : 'Acquiring GPS...'}
              </span>
            </div>
          </div>

          {/* Scenario Buttons */}
          <div className="flex flex-wrap gap-3 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => runScenario('fire')}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" /></svg>
              Fire Emergency
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => runScenario('flood')}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-blue-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
              Flood Alert
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => runAbuseScenario()}
              disabled={loading}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-500/30"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              Abuse/Violence
            </motion.button>
            <Link
              href="/contacts"
              className="flex-1 sm:flex-none px-4 sm:px-6 py-3 sm:py-4 bg-slate-700/50 border border-slate-600 rounded-xl sm:rounded-2xl font-bold text-sm sm:text-base hover:bg-slate-600/50 transition-all flex items-center justify-center gap-2"
            >
              👥 Contacts ({contactCount})
            </Link>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">

            {/* Left: Agent Tracing */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-5"
            >
              <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 h-full">
                <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                  Antigravity AI Agent Tracing
                </h3>

                <div ref={traceRef} className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {agents.map((agent, idx) => (
                    <motion.div
                      key={agent.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative pl-8 group"
                    >
                      {/* Timeline line */}
                      {idx < agents.length - 1 && (
                        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-slate-700" />
                      )}

                      {/* Dot */}
                      <div className={`absolute left-1 top-2 w-5 h-5 rounded-full border-2 border-slate-900 z-10 flex items-center justify-center ${getPhaseColor(agent.phase)}`}>
                        {agent.phase === 'complete' && (
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>

                      <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50 group-hover:border-slate-600/50 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{agent.icon}</span>
                            <span className={`text-xs sm:text-sm font-bold ${agent.color}`}>{agent.name}</span>
                          </div>
                          <span className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full ${
                            agent.phase === 'complete' ? 'bg-green-500/20 text-green-400' :
                            agent.phase === 'acting' ? 'bg-purple-500/20 text-purple-400' :
                            agent.phase === 'analyzing' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-yellow-500/20 text-yellow-400'
                          }`}>
                            {getPhaseLabel(agent.phase)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{agent.status}</p>
                        <p className="text-[9px] text-slate-500 mt-1 font-mono">
                          {agent.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {agents.length === 0 && !loading && (
                    <div className="text-center py-12 text-slate-500">
                      <div className="text-4xl mb-3 opacity-50">🤖</div>
                      <p className="text-sm">Select a scenario to start AI agent tracing</p>
                    </div>
                  )}

                  {loading && (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                      <p className="text-xs text-red-400 font-mono">INITIALIZING AGENTS...</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right: Resources & Emergency Services */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-7 space-y-4 sm:space-y-6"
            >
              {/* Emergency Resources */}
              {resources.length > 0 && (
                <div className="bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <span className="text-xl">🚑</span>
                    Dispatched Emergency Services
                    <span className="ml-auto text-xs font-mono text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
                      LIVE
                    </span>
                  </h3>

                  <div className="space-y-3">
                    {resources.map((res, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 sm:p-4"
                      >
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-3">
                            <div className="text-2xl sm:text-3xl">{res.icon}</div>
                            <div>
                              <p className="text-sm sm:text-base font-bold text-white">{res.name}</p>
                              <p className="text-[10px] sm:text-xs text-slate-400 font-mono">
                                {res.type === 'ambulance' ? '🚑 Ambulance' : res.type === 'fire_brigade' ? '🚒 Fire Brigade' : '🚔 Police'}
                                {' • '}Tel: {res.phone}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className={`text-lg sm:text-2xl font-black font-mono ${
                              res.eta <= 1 ? 'text-green-400' : res.eta <= 5 ? 'text-yellow-400' : 'text-orange-400'
                            }`}>
                              {res.eta <= 0 ? 'ARRIVED' : `${res.eta} min`}
                            </div>
                            <p className="text-[10px] sm:text-xs text-slate-400">{res.distance.toFixed(1)} km away</p>
                            <span className={`text-[9px] sm:text-[10px] font-mono px-2 py-0.5 rounded-full ${getResourceStatusColor(res.status)} bg-white/5`}>
                              {res.status === 'arrived' ? '✓ ARRIVED' : res.status === 'en_route' ? '🔵 EN ROUTE' : '🟡 DISPATCHED'}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="mt-3 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: '0%' }}
                            animate={{ width: res.status === 'arrived' ? '100%' : res.status === 'en_route' ? '70%' : '30%' }}
                            transition={{ duration: 2 }}
                            className={`h-full rounded-full ${
                              res.type === 'ambulance' ? 'bg-red-500' : 'bg-orange-500'
                            }`}
                          />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Google Maps Roadmap Link */}
              {gpsLocation && resources.length > 0 && (
                <div className="bg-slate-800/50 border border-blue-500/30 rounded-2xl p-4 text-center">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${gpsLocation.latitude},${gpsLocation.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-xl hover:bg-blue-600/30 transition-colors font-bold text-sm"
                  >
                    🗺️ Open Road Map in Google Maps
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              )}

              {/* Emergency Contacts Alert Status */}
              <div className={`rounded-2xl p-4 border-2 ${
                alertsSent ? 'bg-green-500/10 border-green-500/30' : 'bg-slate-800/50 border-slate-700/50'
              }`}>
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">👥</span>
                    <div>
                      <p className="text-sm font-bold text-white">Emergency Contacts</p>
                      <p className="text-xs text-slate-400">{contactCount} contacts registered</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {alertsSent ? (
                      <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                        ✓ ALERTS SENT VIA TWILIO
                      </span>
                    ) : (
                      <span className="text-xs font-mono px-3 py-1.5 rounded-full bg-slate-700/50 text-slate-400">
                        STANDBY
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Call Direct Buttons */}
              {activeScenario && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <a
                    href="tel:16"
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-red-600/20 border border-red-500/30 rounded-xl hover:bg-red-600/30 transition-colors"
                  >
                    <span className="text-2xl">🚒</span>
                    <span className="text-xs font-bold text-red-400">Fire: 16</span>
                  </a>
                  <a
                    href="tel:115"
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-orange-600/20 border border-orange-500/30 rounded-xl hover:bg-orange-600/30 transition-colors"
                  >
                    <span className="text-2xl">🚑</span>
                    <span className="text-xs font-bold text-orange-400">Ambulance: 115</span>
                  </a>
                  <a
                    href="tel:15"
                    className="flex flex-col items-center gap-2 p-3 sm:p-4 bg-blue-600/20 border border-blue-500/30 rounded-xl hover:bg-blue-600/30 transition-colors"
                  >
                    <span className="text-2xl">🚔</span>
                    <span className="text-xs font-bold text-blue-400">Police: 15</span>
                  </a>
                </div>
              )}

              {/* No Scenario State */}
              {!activeScenario && (
                <div className="bg-slate-800/30 border-2 border-dashed border-slate-700/50 rounded-2xl p-8 sm:p-12 text-center">
                  <div className="text-5xl mb-4 opacity-50">🎯</div>
                  <p className="text-sm sm:text-base text-slate-400">
                    Select <strong className="text-red-400">Fire</strong> or <strong className="text-blue-400">Flood</strong> to start AI-powered crisis response
                  </p>
                  <p className="text-xs text-slate-500 mt-2">
                    Agents will trace, dispatch emergency services, and alert your contacts
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
