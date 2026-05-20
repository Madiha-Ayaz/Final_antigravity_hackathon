'use client';

import Link from 'next/link';
import { Navbar } from '../components';

const Icons = {
  shield: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  mic: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>,
  brain: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  clock: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  alert: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  arrow: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
  check: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>,
  location: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  lock: <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
};

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      <Navbar />

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12 lg:pt-28 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10" style={{ background: 'rgba(220, 38, 38, 0.08)' }}>
              <span className="status-active"></span>
              <span className="text-xs font-medium text-red-400 uppercase tracking-wider">AI-Powered Detection</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight" style={{ color: '#f1f5f9' }}>
              Your Silent Guardian in{' '}
              <span className="gradient-text">Critical Moments</span>
            </h1>

            <p className="text-base lg:text-lg leading-relaxed" style={{ color: '#94a3b8' }}>
              Advanced AI listens for distress signals, analyzes emotional stress patterns, and automatically alerts your trusted contacts when you need help most.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/dashboard" className="btn-primary text-center flex items-center justify-center gap-2">
                Get Started {Icons.arrow}
              </Link>
              <Link href="/monitor" className="btn-outline text-center flex items-center justify-center gap-2">
                Start Monitoring {Icons.mic}
              </Link>
            </div>

            <div className="flex items-center gap-6 pt-2">
              <div className="flex items-center gap-2">
                <span style={{ color: '#10b981' }}>{Icons.check}</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Free to use</span>
              </div>
              <div className="flex items-center gap-2">
                <span style={{ color: '#10b981' }}>{Icons.check}</span>
                <span className="text-xs" style={{ color: '#94a3b8' }}>Privacy-first</span>
              </div>
            </div>
          </div>

          {/* Right Card */}
          <div className="animate-slide-up lg:animate-delay-200">
            <div className="card p-6 sm:p-8 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl opacity-10" style={{ background: '#dc2626' }}></div>

              <div className="relative space-y-5">
                {/* Status */}
                <div className="flex items-center gap-3 p-4 rounded-xl border border-white/5" style={{ background: 'rgba(16, 185, 129, 0.05)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
                    <span style={{ color: '#10b981' }}>{Icons.shield}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ color: '#f1f5f9' }}>Monitoring Active</div>
                    <div className="text-xs" style={{ color: '#94a3b8' }}>Listening for distress signals</div>
                  </div>
                  <span className="status-active"></span>
                </div>

                {/* AI Confidence */}
                <div className="p-4 rounded-xl border border-white/5" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium" style={{ color: '#94a3b8' }}>AI Confidence</span>
                    <span className="text-sm font-bold" style={{ color: '#dc2626' }}>98%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.06)' }}>
                    <div className="h-full rounded-full" style={{ width: '98%', background: '#dc2626' }}></div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: '24/7', label: 'Protection' },
                    { value: '<2s', label: 'Response' },
                    { value: '3', label: 'Contacts' },
                  ].map((stat, i) => (
                    <div key={i} className="p-3 rounded-lg text-center border border-white/5" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
                      <div className="text-xl font-black" style={{ color: '#f1f5f9' }}>{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-wider" style={{ color: '#94a3b8' }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black mb-3" style={{ color: '#f1f5f9' }}>
            How It Works
          </h2>
          <p className="text-sm sm:text-base max-w-xl mx-auto" style={{ color: '#94a3b8' }}>
            AI technology working silently to keep you safe
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 stagger">
          {[
            { icon: Icons.mic, title: 'Passive Listening', desc: 'Monitors audio for emergency wake phrases with minimal battery impact' },
            { icon: Icons.brain, title: 'AI Analysis', desc: 'Gemini AI analyzes emotional stress and distress patterns in real-time' },
            { icon: Icons.clock, title: 'Smart Countdown', desc: '10-second verification window to prevent false alarms' },
            { icon: Icons.alert, title: 'Instant Alert', desc: 'Notifies trusted contacts with GPS location automatically' },
          ].map((feature, index) => (
            <div key={index} className="card-hover p-5 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}>
                {feature.icon}
              </div>
              <h3 className="text-base font-bold mb-2" style={{ color: '#f1f5f9' }}>{feature.title}</h3>
              <p className="text-sm" style={{ color: '#94a3b8' }}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="card p-8 sm:p-10 lg:p-12">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            {[
              { value: '99.8%', label: 'Accuracy Rate', icon: Icons.shield },
              { value: '<2s', label: 'Response Time', icon: Icons.clock },
              { value: '24/7', label: 'Protection', icon: Icons.alert },
              { value: '100%', label: 'Privacy', icon: Icons.lock },
            ].map((stat, index) => (
              <div key={index} className="space-y-2 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex justify-center mb-2" style={{ color: '#dc2626' }}>{stat.icon}</div>
                <div className="text-2xl sm:text-3xl lg:text-4xl font-black gradient-text">{stat.value}</div>
                <div className="text-xs sm:text-sm font-medium" style={{ color: '#94a3b8' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24">
        <div className="rounded-2xl p-8 sm:p-10 lg:p-14 text-center relative overflow-hidden" style={{ background: '#dc2626' }}>
          <div className="absolute inset-0 opacity-10" style={{ background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.1) 50%)' }}></div>
          <div className="relative z-10 space-y-5">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white">Ready to Feel Safer?</h2>
            <p className="text-sm sm:text-base text-red-100 max-w-xl mx-auto">
              Join thousands who trust SilentSiren AI to protect them in critical moments
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link href="/dashboard" className="btn bg-white text-red-600 hover:bg-red-50 font-bold text-center">
                Start Free Trial
              </Link>
              <Link href="/contacts" className="btn border-2 border-white text-white hover:bg-white/10 text-center">
                Add Contacts
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-10 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dc2626' }}>
                <span className="text-white">{Icons.shield}</span>
              </div>
              <span className="text-lg font-black gradient-text">SilentSiren</span>
            </div>
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              AI-powered emergency response platform
            </p>
          </div>

          {[
            { title: 'Product', links: ['Features', 'How It Works', 'Security'] },
            { title: 'Company', links: ['About', 'Contact'] },
            { title: 'Legal', links: ['Privacy', 'Terms'] },
          ].map((column, index) => (
            <div key={index}>
              <h3 className="text-sm font-bold mb-3" style={{ color: '#f1f5f9' }}>{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link href="#" className="text-xs hover:text-red-400 transition-colors" style={{ color: '#94a3b8' }}>
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs" style={{ color: '#94a3b8' }}>
            &copy; 2026 SilentSiren AI. All rights reserved.
          </p>
          <div className="flex gap-4">
            {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
              <Link key={social} href="#" className="text-xs hover:text-red-400 transition-colors" style={{ color: '#94a3b8' }}>
                {social}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
