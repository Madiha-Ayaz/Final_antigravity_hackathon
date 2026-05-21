'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function PWAInstaller() {
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('✅ Service Worker registered:', registration.scope);

            // Check for updates
            registration.addEventListener('updatefound', () => {
              const newWorker = registration.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'activated') {
                    console.log('🔄 New service worker activated');
                  }
                });
              }
            });
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }

    // Handle PWA install prompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show install banner after a delay
      setTimeout(() => setShowInstallBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Detect if app is installed
    window.addEventListener('appinstalled', () => {
      console.log('✅ PWA installed successfully');
      setIsInstalled(true);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    });

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Handle messages from service worker
    navigator.serviceWorker?.addEventListener('message', (event) => {
      if (event.data?.type === 'I_AM_SAFE') {
        // Trigger "I am safe" action
        window.dispatchEvent(new CustomEvent('pwa-safe'));
      }
      if (event.data?.type === 'RETRY_ALERT') {
        // Retry sending alerts
        window.dispatchEvent(new CustomEvent('pwa-retry-alert'));
      }
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to install prompt: ${outcome}`);

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Don't show again for this session
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (isInstalled || (typeof window !== 'undefined' && sessionStorage.getItem('pwa-install-dismissed'))) {
    return null;
  }

  return (
    <AnimatePresence>
      {showInstallBanner && deferredPrompt && (
        <motion.div
          id="pwa-install-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm"
        >
          <div className="bg-gradient-to-r from-red-600 to-orange-600 rounded-2xl p-4 shadow-2xl shadow-red-500/30 border border-red-400/20">
            <div className="flex items-start gap-3">
              <div className="text-3xl">🚨</div>
              <div className="flex-1">
                <h3 className="font-bold text-white text-sm">Install SilentSiren</h3>
                <p className="text-red-100 text-xs mt-1">
                  Install app for instant emergency access & offline monitoring
                </p>
                <div className="flex gap-2 mt-3">
                  <button
                    id="pwa-install-button"
                    onClick={handleInstall}
                    className="px-4 py-2 bg-white text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-colors"
                  >
                    Install Now
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 bg-red-700/50 text-white rounded-lg text-xs hover:bg-red-700 transition-colors"
                  >
                    Later
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
