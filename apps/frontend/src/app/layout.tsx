import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { PWAInstaller } from '@/components/PWAInstaller';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'SilentSiren AI - Emergency Response Platform',
  description: 'AI-powered emergency detection and response system with voice monitoring',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SilentSiren',
  },
  formatDetection: {
    telephone: true,
  },
  openGraph: {
    type: 'website',
    siteName: 'SilentSiren AI',
    title: 'SilentSiren AI - Emergency Response',
    description: 'AI-powered emergency detection with voice monitoring',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0f172a" />
      </head>
      <body className={`${inter.className} bg-slate-950 text-white antialiased`}>
        <Providers>
          {children}
          <PWAInstaller />
        </Providers>
      </body>
    </html>
  );
}
