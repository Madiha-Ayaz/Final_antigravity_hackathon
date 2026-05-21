'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const Icons = {
  shield: (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    </svg>
  ),
  user: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  ),
  mail: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  ),
  phone: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
      />
    </svg>
  ),
  lock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
      />
    </svg>
  ),
  eye: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
    </svg>
  ),
  eyeOff: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    </svg>
  ),
  arrow: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  ),
  check: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
};

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    agreeToTerms: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8)
      newErrors.password = 'Password must be at least 8 characters';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to the terms';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      router.push('/onboarding');
    }, 1500);
  };

  const inputStyle = {
    background: '#0f172a',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#f1f5f9',
  };

  const inputErrorStyle = {
    background: '#0f172a',
    border: '1px solid rgba(220, 38, 38, 0.5)',
    color: '#f1f5f9',
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: '#0f172a' }}
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -left-40 w-80 h-80 rounded-full blur-3xl opacity-5"
          style={{ background: '#dc2626' }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-80 h-80 rounded-full blur-3xl opacity-5"
          style={{ background: '#dc2626' }}
        />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/30 group-hover:shadow-red-500/50 transition-all"
            style={{ background: 'linear-gradient(135deg, #dc2626, #b91c1c)' }}
          >
            <span className="text-white">{Icons.shield}</span>
          </div>
          <div>
            <h1 className="text-2xl font-black bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              SilentSiren
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider -mt-1">
              AI EMERGENCY
            </p>
          </div>
        </Link>

        {/* Signup Card */}
        <div className="card p-8 animate-fade-in">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold mb-2" style={{ color: '#f1f5f9' }}>
              Create Account
            </h2>
            <p className="text-sm" style={{ color: '#94a3b8' }}>
              Start protecting yourself with AI-powered emergency response
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Full Name
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {Icons.user}
                </span>
                <input
                  type="text"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={errors.name ? inputErrorStyle : inputStyle}
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              {errors.name && <p className="mt-1 text-xs text-red-400">{errors.name}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Email Address
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {Icons.mail}
                </span>
                <input
                  type="email"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={errors.email ? inputErrorStyle : inputStyle}
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Phone Number
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {Icons.phone}
                </span>
                <input
                  type="tel"
                  required
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={errors.phone ? inputErrorStyle : inputStyle}
                  placeholder="+92 300 1234567"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              {errors.phone && <p className="mt-1 text-xs text-red-400">{errors.phone}</p>}
              <p className="mt-1 text-xs text-slate-600">Used for emergency alerts</p>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {Icons.lock}
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={errors.password ? inputErrorStyle : inputStyle}
                  placeholder="Min 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#94a3b8' }}>
                Confirm Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                  {Icons.lock}
                </span>
                <input
                  type={showConfirm ? 'text' : 'password'}
                  required
                  className="w-full pl-11 pr-11 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-red-500/50"
                  style={errors.confirmPassword ? inputErrorStyle : inputStyle}
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showConfirm ? Icons.eyeOff : Icons.eye}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-400">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Terms */}
            <div>
              <div className="flex items-start gap-2">
                <input
                  id="agreeToTerms"
                  type="checkbox"
                  className="w-4 h-4 mt-0.5 rounded accent-red-500"
                  checked={formData.agreeToTerms}
                  onChange={(e) => setFormData({ ...formData, agreeToTerms: e.target.checked })}
                />
                <label htmlFor="agreeToTerms" className="text-sm" style={{ color: '#94a3b8' }}>
                  I agree to the{' '}
                  <Link href="/terms" className="text-red-400 hover:text-red-300 transition-colors">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link
                    href="/privacy"
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="mt-1 text-xs text-red-400">{errors.agreeToTerms}</p>
              )}
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
                  Creating account...
                </>
              ) : (
                <>Create Account {Icons.arrow}</>
              )}
            </button>
          </form>

          {/* Features */}
          <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="grid grid-cols-2 gap-3">
              {[
                'AI-powered detection',
                'Instant alerts',
                'GPS location sharing',
                'Free to use',
              ].map((feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 text-xs"
                  style={{ color: '#94a3b8' }}
                >
                  <span className="text-green-400">{Icons.check}</span>
                  {feature}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-6 text-center text-sm" style={{ color: '#94a3b8' }}>
            Already have an account?{' '}
            <Link
              href="/login"
              className="font-semibold text-red-400 hover:text-red-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
