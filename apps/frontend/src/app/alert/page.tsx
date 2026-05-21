'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useGPSLocation, getGoogleMapsUrl } from '../../hooks/useGPSLocation';
import { Navbar } from '../../components/layout/Navbar';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface AlertResult {
  contactId: string;
  name: string;
  phone: string;
  sms: { success: boolean; messageId?: string; error?: string };
  whatsapp: { success: boolean; messageId?: string; error?: string };
  call: { success: boolean; callId?: string; error?: string };
}

export default function AlertPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <AlertPageContent />
    </Suspense>
  );
}

function AlertPageContent() {
  const router = useRouter();
  const {
    location: gpsLocation,
    error: gpsError,
    loading: gpsLoading,
    getCurrentLocation,
    watchLocation,
    clearWatch,
  } = useGPSLocation();
  const searchParams = useSearchParams();
  const [isAlertActive, setIsAlertActive] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState<AlertResult[]>([]);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(180);
  const [sirenActive, setSirenActive] = useState(false);
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'loading' | 'connected' | 'error' | 'denied'>(
    'loading'
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Enable scrolling on this page
  useEffect(() => {
    document.body.style.overflow = 'auto';
    document.documentElement.style.overflow = 'auto';
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  // Start real GPS tracking on mount
  useEffect(() => {
    const startGPS = async () => {
      try {
        setGpsStatus('loading');
        await getCurrentLocation();
        setGpsStatus('connected');

        // Start continuous tracking
        const id = watchLocation((loc) => {
          console.log('📍 GPS updated:', loc.latitude, loc.longitude, `accuracy: ${loc.accuracy}m`);
        });
        if (id) watchIdRef.current = id;
      } catch (err: any) {
        console.error('GPS error:', err);
        if (err.code === 1) {
          setGpsStatus('denied');
        } else {
          setGpsStatus('error');
        }
      }
    };

    startGPS();

    // Cleanup watch on unmount
    return () => {
      if (watchIdRef.current) {
        clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Update GPS status when location changes
  useEffect(() => {
    if (gpsLocation) {
      setGpsStatus('connected');
    }
    if (gpsError) {
      if (gpsError.code === 1) {
        setGpsStatus('denied');
      } else {
        setGpsStatus('error');
      }
    }
  }, [gpsLocation, gpsError]);

  // Auto-trigger from URL params (when redirected from monitor page)
  useEffect(() => {
    const auto = searchParams.get('auto');
    if (auto === 'true' && !isAlertActive) {
      console.log('🔀 Auto-triggering SAVE ME from redirect');
      setTimeout(() => {
        handleSaveMe();
      }, 1000);
    }
  }, [searchParams]);

  // Fetch contacts count
  useEffect(() => {
    const fetchContactCount = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
        const res = await fetch(`${API_URL}/api/emergency-contacts/list`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (res.ok) {
          const data = await res.json();
          setContactCount(data.contacts?.length || 0);
        }
      } catch {
        setContactCount(0);
      }
    };
    fetchContactCount();
  }, []);

  // Countdown timer
  useEffect(() => {
    if (isAlertActive && countdown > 0) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAlertActive, countdown]);

  const startSiren = () => {
    try {
      const ctx = new AudioContext();
      audioContextRef.current = ctx;

      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(600, ctx.currentTime);
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      oscillator.start();

      oscillatorRef.current = oscillator;
      gainRef.current = gainNode;
      setSirenActive(true);

      let freq = 600;
      let direction = 1;
      intervalRef.current = setInterval(() => {
        freq += direction * 20;
        if (freq >= 1200) direction = -1;
        if (freq <= 600) direction = 1;
        oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      }, 30);
    } catch (err) {
      console.error('Failed to start siren:', err);
    }
  };

  const stopSiren = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (oscillatorRef.current) {
      try {
        oscillatorRef.current.stop();
      } catch {}
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {}
    }
    setSirenActive(false);
  };

  const handleSaveMe = async () => {
    setIsSending(true);
    setError('');
    setResults([]);
    setIsAlertActive(true);
    setCountdown(180);
    startSiren();

    // Get fresh GPS location
    let currentLocation = gpsLocation;
    try {
      currentLocation = await getCurrentLocation();
    } catch {
      console.log('Using last known GPS location');
    }

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      const payload = {
        location: currentLocation
          ? { latitude: currentLocation.latitude, longitude: currentLocation.longitude }
          : undefined,
      };

      console.log('🆘 SAVE ME - Sending alerts with GPS:', currentLocation);

      const res = await fetch(`${API_URL}/api/voice-threat/emergency/save-me`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (data.success) {
        setResults(data.results || []);
        console.log('✅ Save Me alerts sent:', data);
        stopSiren();

        setTimeout(() => {
          setIsAlertActive(false);
          setResults([]);
          setCountdown(180);
        }, 10000);
      } else {
        setError(data.message || 'Failed to send alerts');
        stopSiren();
        setIsAlertActive(false);
      }
    } catch (err: any) {
      setError(`Connection error: ${err.message}. Is backend running?`);
      stopSiren();
      setIsAlertActive(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleCancel = async () => {
    stopSiren();
    setIsAlertActive(false);
    setCountdown(180);

    try {
      const token = localStorage.getItem('token') || localStorage.getItem('auth_token');
      await fetch(`${API_URL}/api/voice-threat/emergency/confirm-safe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({}),
      });
    } catch (err) {
      console.error('Failed to send safe message:', err);
    }

    router.push('/dashboard');
  };

  const getGpsStatusColor = () => {
    switch (gpsStatus) {
      case 'connected':
        return 'text-green-400';
      case 'loading':
        return 'text-yellow-400';
      case 'error':
        return 'text-orange-400';
      case 'denied':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getGpsStatusText = () => {
    switch (gpsStatus) {
      case 'connected':
        return 'GPS CONNECTED';
      case 'loading':
        return 'Acquiring GPS...';
      case 'error':
        return 'GPS Error - Retry';
      case 'denied':
        return 'GPS Denied - Enable in browser';
      default:
        return 'GPS Unknown';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900">
      <Navbar isAuthenticated={true} />
      <div className="p-4 sm:p-6 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6 pb-8">
          {/* Header */}
          <div className="text-center space-y-3 pt-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-5xl sm:text-6xl md:text-7xl"
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </motion.div>
            <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-orange-400 to-red-400">
              EMERGENCY ALERT
            </h1>
            <p className="text-red-300 text-sm sm:text-base font-medium px-4">
              Press the button below to send instant alerts to all your emergency contacts
            </p>
          </div>

          {/* GPS Status - Real Connection */}
          <div
            className={`bg-slate-800/50 backdrop-blur-sm border-2 rounded-2xl p-3 sm:p-4 text-center transition-colors ${
              gpsStatus === 'connected'
                ? 'border-green-500/50'
                : gpsStatus === 'loading'
                  ? 'border-yellow-500/50'
                  : 'border-red-500/50'
            }`}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  gpsStatus === 'connected'
                    ? 'bg-green-500 animate-pulse'
                    : gpsStatus === 'loading'
                      ? 'bg-yellow-500 animate-spin'
                      : 'bg-red-500'
                }`}
              />
              <span
                className={`text-xs sm:text-sm font-bold uppercase tracking-wider ${getGpsStatusColor()}`}
              >
                {getGpsStatusText()}
              </span>
            </div>

            {gpsLocation ? (
              <div className="space-y-1">
                <div className="font-mono text-sm sm:text-base md:text-lg font-bold text-orange-400">
                  📍 {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                </div>
                {gpsLocation.accuracy && (
                  <div className="text-xs text-slate-400">
                    Accuracy: ±{Math.round(gpsLocation.accuracy)}m
                  </div>
                )}
                <a
                  href={getGoogleMapsUrl(gpsLocation.latitude, gpsLocation.longitude)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-xs text-blue-400 hover:text-blue-300 underline"
                >
                  Open in Google Maps
                </a>
              </div>
            ) : gpsStatus === 'denied' ? (
              <div className="space-y-2">
                <p className="text-red-300 text-xs sm:text-sm">
                  GPS access denied. Please enable location in browser settings.
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-1.5 bg-red-500/20 border border-red-500/50 text-red-300 text-xs rounded-lg hover:bg-red-500/30"
                >
                  Retry GPS
                </button>
              </div>
            ) : gpsStatus === 'error' ? (
              <div className="space-y-2">
                <p className="text-orange-300 text-xs sm:text-sm">
                  Could not get GPS location. Retrying...
                </p>
                <button
                  onClick={async () => {
                    setGpsStatus('loading');
                    try {
                      await getCurrentLocation();
                      setGpsStatus('connected');
                    } catch {
                      setGpsStatus('error');
                    }
                  }}
                  className="px-4 py-1.5 bg-orange-500/20 border border-orange-500/50 text-orange-300 text-xs rounded-lg hover:bg-orange-500/30"
                >
                  Retry GPS
                </button>
              </div>
            ) : (
              <div className="text-yellow-300 text-xs sm:text-sm">
                <div className="w-5 h-5 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Getting your location...
              </div>
            )}
          </div>

          {/* No Contacts Warning */}
          {contactCount !== null && contactCount === 0 && !isAlertActive && (
            <div className="bg-yellow-500/10 border-2 border-yellow-500/40 rounded-2xl p-4 text-center space-y-3">
              <div className="text-3xl">⚠️</div>
              <p className="text-yellow-300 font-bold text-lg">Koi emergency contact nahi hai!</p>
              <p className="text-yellow-400/80 text-sm">
                Pehle contacts add karo taake alert bheji ja sake.
              </p>
              <Link
                href="/contacts"
                className="inline-block px-6 py-2.5 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 font-bold rounded-xl hover:bg-yellow-500/30 transition-colors"
              >
                👥 Add Contacts Now
              </Link>
            </div>
          )}

          {/* Contacts OK indicator */}
          {contactCount !== null && contactCount > 0 && !isAlertActive && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-3 text-center flex items-center justify-center gap-2 flex-wrap">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs sm:text-sm font-medium">
                {contactCount} contact{contactCount > 1 ? 's' : ''} ready
              </span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-orange-400 text-xs sm:text-sm font-medium">
                Twilio SMS + WhatsApp + Call
              </span>
            </div>
          )}

          {/* SAVE ME Button */}
          {!isAlertActive && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleSaveMe}
              disabled={isSending}
              className="w-full py-6 sm:py-8 md:py-10 bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white text-2xl sm:text-3xl md:text-5xl font-black rounded-2xl sm:rounded-3xl shadow-2xl shadow-red-500/50 hover:from-red-700 hover:to-red-900 transition-all border-4 border-red-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSending ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                  SENDING...
                </span>
              ) : (
                'SAVE ME'
              )}
            </motion.button>
          )}

          {/* Active Emergency UI */}
          <AnimatePresence>
            {isAlertActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Siren & Countdown */}
                <div className="bg-red-950/50 backdrop-blur-sm border-2 border-red-500/50 rounded-2xl p-4 sm:p-6 text-center space-y-3 sm:space-y-4">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 15, -15, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-4xl sm:text-6xl"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                      />
                    </svg>
                  </motion.div>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-red-400 animate-pulse">
                    ALERT ACTIVE
                  </h2>

                  <div className="bg-yellow-950/50 border border-yellow-500/50 rounded-xl p-3 sm:p-4">
                    <div className="text-xs sm:text-sm text-yellow-300 mb-1 font-semibold">
                      Auto-cancel in:
                    </div>
                    <div className="text-3xl sm:text-4xl font-black text-yellow-400 font-mono">
                      {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                    </div>
                  </div>

                  {/* GPS location during alert */}
                  {gpsLocation && (
                    <div className="bg-green-950/30 border border-green-500/30 rounded-xl p-2 text-xs text-green-300">
                      📍 GPS: {gpsLocation.latitude.toFixed(6)}, {gpsLocation.longitude.toFixed(6)}
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-2 text-red-300 text-xs sm:text-sm font-semibold">
                    <div
                      className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${sirenActive ? 'bg-red-500 animate-ping' : 'bg-slate-600'}`}
                    />
                    {sirenActive ? 'SIREN ACTIVE' : 'SIREN OFF'}
                  </div>
                </div>

                {/* Alert Results */}
                {results.length > 0 && (
                  <div className="bg-slate-800/50 backdrop-blur-sm border border-green-500/30 rounded-2xl p-3 sm:p-4 space-y-3">
                    <h3 className="text-base sm:text-lg font-bold text-green-400 flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Alerts Sent to {results.length} Contact{results.length > 1 ? 's' : ''}
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {results.map((r, i) => (
                        <div key={i} className="bg-slate-900/50 rounded-xl p-2 sm:p-3 space-y-2">
                          <div className="font-bold text-white text-xs sm:text-sm">
                            {r.name} ({r.phone})
                          </div>
                          <div className="grid grid-cols-3 gap-1 sm:gap-2 text-[10px] sm:text-xs">
                            <div
                              className={`text-center p-1.5 sm:p-2 rounded-lg ${r.sms.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                              <div className="font-bold">SMS</div>
                              <div>{r.sms.success ? '✓ Sent' : '✗ Failed'}</div>
                              {!r.sms.success && r.sms.error && (
                                <div
                                  className="text-[9px] text-red-300/70 mt-0.5 truncate"
                                  title={r.sms.error}
                                >
                                  {r.sms.error.includes('limit')
                                    ? 'Daily limit'
                                    : r.sms.error.includes('unverified')
                                      ? 'Unverified'
                                      : 'Error'}
                                </div>
                              )}
                            </div>
                            <div
                              className={`text-center p-1.5 sm:p-2 rounded-lg ${r.whatsapp.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                              <div className="font-bold">WhatsApp</div>
                              <div>{r.whatsapp.success ? '✓ Sent' : '✗ Failed'}</div>
                              {!r.whatsapp.success && r.whatsapp.error && (
                                <div
                                  className="text-[9px] text-red-300/70 mt-0.5 truncate"
                                  title={r.whatsapp.error}
                                >
                                  {r.whatsapp.error.includes('limit') ? 'Daily limit' : 'Error'}
                                </div>
                              )}
                            </div>
                            <div
                              className={`text-center p-1.5 sm:p-2 rounded-lg ${r.call.success ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
                            >
                              <div className="font-bold">Call</div>
                              <div>{r.call.success ? '✓ Ringing' : '✗ Failed'}</div>
                              {!r.call.success && r.call.error && (
                                <div
                                  className="text-[9px] text-red-300/70 mt-0.5 truncate"
                                  title={r.call.error}
                                >
                                  {r.call.error.includes('unverified') ? 'Unverified' : 'Error'}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="text-[10px] sm:text-xs text-yellow-400/80 text-center pt-2 border-t border-slate-700/50">
                      Twilio Trial: SMS daily limit reached. Calls work for verified numbers.
                    </div>
                  </div>
                )}

                {/* Cancel Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleCancel}
                  className="w-full py-4 sm:py-5 md:py-6 bg-gradient-to-r from-white to-gray-100 text-red-950 text-lg sm:text-xl md:text-2xl font-black rounded-xl sm:rounded-2xl hover:from-gray-100 hover:to-white transition-all shadow-2xl border-4 border-white/20"
                >
                  🔐 I&apos;M SAFE — CANCEL ALERT
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="bg-red-500/20 border-2 border-red-500/50 rounded-2xl p-3 sm:p-4 text-red-300 font-semibold text-xs sm:text-sm text-center">
              ❌ {error}
            </div>
          )}

          {/* Info */}
          {!isAlertActive && (
            <div className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-3 sm:p-4 space-y-2 text-xs sm:text-sm text-slate-400">
              <p className="font-semibold text-slate-300">How it works:</p>
              <ul className="space-y-1 list-disc list-inside">
                <li>
                  Press <strong className="text-red-400">SAVE ME</strong> to trigger emergency
                  alerts
                </li>
                <li>
                  Your <strong className="text-green-400">real GPS location</strong> is sent with
                  alerts
                </li>
                <li>
                  SMS, WhatsApp, and Voice Call via{' '}
                  <strong className="text-orange-400">Twilio</strong>
                </li>
                <li>A loud siren will play on your device</li>
                <li>
                  Press <strong className="text-white">I&apos;M SAFE</strong> to cancel and go to
                  Dashboard
                </li>
              </ul>
              <div className="pt-2 border-t border-slate-700/50">
                <Link
                  href="/contacts"
                  className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  👥 Manage Emergency Contacts →
                </Link>
              </div>
            </div>
          )}

          <div className="h-8 sm:h-12"></div>
        </div>
      </div>
    </div>
  );
}
