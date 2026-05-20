'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn, useSession } from 'next-auth/react';

const Icons = {
  shield: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
  mail: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  lock: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  eye: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  eyeOff: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  arrow: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>,
};

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [formData, setFormData] = useState({ email: '', password: '', remember: false });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError('');
    try {
      await signIn('google', { callbackUrl: '/dashboard' });
    } catch {
      setError('Google sign-in failed. Please try again.');
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setTimeout(() => {
      setIsLoading(false);
      router.push('/dashboard');
    }, 1500);
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
        <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: '#0f172a' }}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-5" style={{ background: '#dc2626' }} />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-5" style={{ background: '#dc2626' }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-10 group">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all" style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}>
            <span className="text-white">{Icons.shield}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              SilentSiren
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider -mt-1">AI EMERGENCY</p>
          </div>
        </Link>

        {/* Login Card */}
        <div className="card p-8 animate-fade-in">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>Welcome Back</h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>Sign in to access your emergency protection dashboard</p>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl border border-red-500/30" style={{ background: 'rgba(220, 38, 38, 0.1)' }}>
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 mb-6 rounded-xl border font-semibold text-sm transition-all hover:border-red-500/50 hover:shadow-lg hover:shadow-red-500/10 disabled:opacity-50"
            style={{ background: '#1e293b', borderColor: 'rgba(255,255,255,0.1)', color: '#f1f5f9' }}
          >
            {isGoogleLoading ? (
              <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {isGoogleLoading ? 'Connecting...' : 'Continue with Google'}
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 text-slate-500" style={{ background: '#1e293b' }}>or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: '#94a3b8' }}>Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{Icons.mail}</span>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium" style={{ color: '#94a3b8' }}>Password</label>
                <Link href="/forgot-password" className="text-xs text-red-400 hover:text-red-300 transition-colors">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">{Icons.lock}</span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-11 pr-11 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9' }}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                className="w-4 h-4 rounded accent-red-500"
                checked={formData.remember}
                onChange={(e) => setFormData({ ...formData, remember: e.target.checked })}
              />
              <label htmlFor="remember" className="text-sm" style={{ color: '#94a3b8' }}>
                Remember me for 30 days
              </label>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50"
              style={{ background: '#dc2626', boxShadow: '0 4px 14px rgba(220, 38, 38, 0.3)' }}
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In {Icons.arrow}
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-sm" style={{ color: '#94a3b8' }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="font-semibold text-red-400 hover:text-red-300 transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          By signing in, you agree to our{' '}
          <Link href="/terms" className="underline hover:text-slate-400 transition-colors">Terms</Link>
          {' '}and{' '}
          <Link href="/privacy" className="underline hover:text-slate-400 transition-colors">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}
