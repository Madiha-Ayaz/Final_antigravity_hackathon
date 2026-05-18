'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavbarProps {
  isAuthenticated?: boolean;
  userName?: string;
}

interface NavLink {
  href: string;
  label: string;
  icon?: string;
}

export function Navbar({ isAuthenticated = false, userName }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  const publicLinks: NavLink[] = [
    { href: '/', label: 'Home' },
    { href: '/features', label: 'Features' },
    { href: '/about', label: 'About' },
  ];

  const authenticatedLinks: NavLink[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/monitor', label: 'Monitor', icon: '🎤' },
    { href: '/history', label: 'History', icon: '📜' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  const links = isAuthenticated ? authenticatedLinks : publicLinks;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200/50 dark:border-dark-700/50">
      <div className="section-container">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href={isAuthenticated ? '/dashboard' : '/'}
            className="flex items-center space-x-3 group"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-glow transition-all duration-300">
              <span className="text-white text-xl font-bold">🚨</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-xl font-bold gradient-text">SilentSiren</span>
              <span className="text-xs text-gray-500 dark:text-gray-400 block -mt-1">
                AI Emergency Response
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive(link.href)
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                }`}
              >
                {'icon' in link && <span className="mr-2">{link.icon}</span>}
                {link.label}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <>
                <button className="relative p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  <span className="absolute top-1 right-1 w-2 h-2 bg-primary-600 rounded-full"></span>
                </button>
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 dark:bg-dark-800 rounded-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {userName || 'User'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-ghost btn-sm">
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary btn-sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-dark-700 animate-slide-in-down">
            <div className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-800'
                  }`}
                >
                  {'icon' in link && <span className="mr-2">{link.icon}</span>}
                  {link.label}
                </Link>
              ))}
            </div>
            {!isAuthenticated && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-dark-700 space-y-2">
                <Link
                  href="/login"
                  className="block btn-outline w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="block btn-primary w-full text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
