'use client';

import { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
  userName?: string;
}

export function DashboardLayout({ children, userName }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#0f172a' }}>
      <Navbar isAuthenticated userName={userName} />

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - hidden on mobile, slide-in on toggle */}
      <div
        className={`
        ${
          isMobile
            ? `fixed left-0 top-16 h-[calc(100vh-4rem)] z-50 transform transition-transform duration-300 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'fixed left-0 top-16 h-[calc(100vh-4rem)] z-40'
        }
      `}
      >
        <Sidebar
          isCollapsed={!isMobile && false}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          isMobile={isMobile}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <main
        className={`
        pt-4 pb-20 lg:pb-8 transition-all duration-300
        ${isMobile ? 'ml-0' : 'ml-64'}
      `}
      >
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileBottomNav />}

      {/* Mobile menu button */}
      {isMobile && !sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed bottom-20 left-4 z-50 w-12 h-12 bg-gradient-to-r from-red-600 to-orange-600 rounded-full flex items-center justify-center shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
        >
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
