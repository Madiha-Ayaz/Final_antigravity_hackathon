'use client';

import Link from 'next/link';
import { Navbar } from '../components';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary-50 dark:from-dark-950 dark:via-dark-900 dark:to-dark-800">
      <Navbar />

      {/* Hero Section */}
      <section className="section-container pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-fade-in">
            <div className="inline-flex items-center px-4 py-2 bg-primary-50 dark:bg-primary-900/20 rounded-full">
              <span className="w-2 h-2 bg-primary-600 rounded-full animate-pulse mr-2"></span>
              <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                AI-Powered Emergency Detection
              </span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 dark:text-white leading-tight">
              Your Silent Guardian in <span className="gradient-text">Critical Moments</span>
            </h1>

            <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed">
              Advanced AI listens passively for distress signals, analyzes emotional stress
              patterns, and automatically alerts your trusted contacts when you need help most.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/signup"
                className="btn-primary btn-lg text-center shadow-lg hover:shadow-glow"
              >
                Get Started Free
                <svg
                  className="w-5 h-5 ml-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link href="/demo" className="btn-outline btn-lg text-center">
                Watch Demo
                <svg
                  className="w-5 h-5 ml-2 inline"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </Link>
            </div>

            <div className="flex items-center space-x-8 pt-4">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  No subscription required
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Privacy-first design
                </span>
              </div>
            </div>
          </div>

          <div className="relative animate-fade-in animate-delay-200">
            <div className="relative glass rounded-2xl p-8 shadow-2xl">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full blur-3xl opacity-20 animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-secondary-500 to-primary-500 rounded-full blur-3xl opacity-20 animate-pulse-slow animate-delay-500"></div>

              <div className="relative space-y-6">
                <div className="flex items-center justify-between p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-success-200 dark:border-success-800">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-success-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-success-900 dark:text-success-100">
                        Monitoring Active
                      </div>
                      <div className="text-xs text-success-700 dark:text-success-300">
                        Listening for distress signals
                      </div>
                    </div>
                  </div>
                  <div className="w-3 h-3 bg-success-500 rounded-full animate-pulse"></div>
                </div>

                <div className="p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      AI Confidence
                    </span>
                    <span className="text-sm font-bold text-primary-600 dark:text-primary-400">
                      98%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full animate-shimmer"
                      style={{ width: '98%', backgroundSize: '200% 100%' }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">24/7</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Protection</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">&lt;2s</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Response</div>
                  </div>
                  <div className="p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700 text-center">
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">3</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Contacts</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="section-container py-20 lg:py-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Advanced AI technology working silently in the background to keep you safe
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            {
              icon: '🎤',
              title: 'Passive Listening',
              description:
                'Continuously monitors audio for emergency wake phrases with minimal battery impact',
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: '🧠',
              title: 'AI Analysis',
              description:
                'Gemini AI analyzes emotional stress, panic signals, and distress patterns in real-time',
              color: 'from-purple-500 to-pink-500',
            },
            {
              icon: '⏱️',
              title: 'Smart Countdown',
              description:
                '10-second verification window with biometric authentication to prevent false alarms',
              color: 'from-orange-500 to-red-500',
            },
            {
              icon: '📱',
              title: 'Instant Alert',
              description:
                'Automatically notifies trusted contacts with GPS location and audio evidence',
              color: 'from-green-500 to-emerald-500',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="card-hover animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div
                className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-lg`}
              >
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="section-container py-20 lg:py-32">
        <div className="glass rounded-3xl p-12 lg:p-16">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { value: '99.8%', label: 'Accuracy Rate', icon: '🎯' },
              { value: '<2s', label: 'Response Time', icon: '⚡' },
              { value: '24/7', label: 'Protection', icon: '🛡️' },
              { value: '100%', label: 'Privacy', icon: '🔒' },
            ].map((stat, index) => (
              <div key={index} className="space-y-2">
                <div className="text-4xl mb-2">{stat.icon}</div>
                <div className="text-4xl lg:text-5xl font-bold gradient-text">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-container py-20 lg:py-32">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 to-secondary-600 p-12 lg:p-16 text-center shadow-2xl">
          <div className="absolute inset-0 bg-shimmer opacity-10"></div>
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl lg:text-5xl font-bold text-white">Ready to Feel Safer?</h2>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Join thousands who trust SilentSiren AI to protect them in critical moments
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/signup"
                className="btn-lg bg-white text-primary-600 hover:bg-gray-100 shadow-xl"
              >
                Start Free Trial
              </Link>
              <Link
                href="/contact"
                className="btn-lg border-2 border-white text-white hover:bg-white/10"
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="section-container py-12 border-t border-gray-200 dark:border-dark-700">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">🚨</span>
              </div>
              <span className="text-lg font-bold gradient-text">SilentSiren</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered emergency response platform protecting lives 24/7
            </p>
          </div>

          {[
            {
              title: 'Product',
              links: ['Features', 'How It Works', 'Pricing', 'Security'],
            },
            {
              title: 'Company',
              links: ['About', 'Blog', 'Careers', 'Contact'],
            },
            {
              title: 'Legal',
              links: ['Privacy', 'Terms', 'Cookies', 'Licenses'],
            },
          ].map((column, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <Link
                      href="#"
                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-gray-200 dark:border-dark-700 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            © 2026 SilentSiren AI. All rights reserved.
          </p>
          <div className="flex space-x-6">
            {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
              <Link
                key={social}
                href="#"
                className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                <span className="text-sm">{social}</span>
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
