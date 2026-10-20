import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Cpu,
  KeyRound,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Check if user came with a redirect intent
  const redirectPath = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Inline validation
    if (!email.trim()) {
      setError('Please provide your registered email address.');
      return;
    }
    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    const result = await login({
      email: email.trim(),
      password,
      rememberMe,
    });
    setLoading(false);

    if (result.success) {
      navigate(redirectPath, { replace: true });
    } else {
      setError(result.error || 'Authentication failed. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen bg-[#020603] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden font-sans">
      {/* Ambient Cyber Lighting & Perspective Grid */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-b from-emerald-500/12 via-emerald-600/5 to-transparent blur-[120px]" />
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-emerald-950/20 rounded-full blur-[100px]" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-emerald-900/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #10b981 1px, transparent 1px), linear-gradient(to bottom, #10b981 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      {/* Minimal Top Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-3 group focus:outline-none"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.35)] group-hover:shadow-[0_0_25px_rgba(34,197,94,0.5)] transition-all">
            <Shield className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              Secure<span className="text-emerald-400">Cipher</span>
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400/80">
              Cryptographic Suite
            </span>
          </div>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400/80 hover:text-emerald-300 transition-colors bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 px-3.5 py-1.5 rounded-full"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Home
        </Link>
      </header>

      {/* Main Login Container */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-10 flex items-center justify-center">
        <div className="w-full grid lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Visual Cyber Graphic (Hidden on mobile) */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-[2.5rem] bg-gradient-to-b from-emerald-950/20 to-[#040e06] border border-emerald-500/15 relative overflow-hidden h-[540px]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono tracking-wider uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Zero-Knowledge Auth
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug mb-3">
                Hardware-Grade Data Protection
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Experience robust cryptography with bcrypt salted credential isolation, JWT session tokens, and zero-knowledge memory handling.
              </p>
            </div>

            {/* Glowing Shield & Lock Visual Illustration */}
            <div className="relative my-auto flex items-center justify-center">
              <div className="w-44 h-44 rounded-full bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-[ping_4s_ease-in-out_infinite]" />
                <div className="w-28 h-28 rounded-full bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center shadow-[0_0_35px_rgba(34,197,94,0.25)]">
                  <Lock className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
                </div>
                {/* Orbital nodes */}
                <div className="absolute top-2 right-4 w-3 h-3 rounded-full bg-emerald-400/80 shadow-[0_0_8px_#34d399]" />
                <div className="absolute bottom-4 left-3 w-2 h-2 rounded-full bg-emerald-500/60" />
              </div>
            </div>

            {/* Bottom Trust Badges */}
            <div className="relative z-10 pt-4 border-t border-emerald-500/15 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                Bcrypt Salted
              </span>
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                256-bit JWT
              </span>
            </div>
          </div>

          {/* Right Column: Centered Login Card */}
          <div className="lg:col-span-7">
            <div className="p-5 sm:p-8 md:p-10 rounded-2xl sm:rounded-[2.5rem] bg-[#040e06]/90 backdrop-blur-xl border border-emerald-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="mb-6 sm:mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono tracking-wider uppercase mb-3">
                  <Sparkles className="w-3 h-3" />
                  Secure Access Gateway
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-slate-400 text-xs sm:text-sm mt-1.5">
                  Sign in to your SecureCipher account to access your cryptographic workspace.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-200">Authentication Error</p>
                    <p className="mt-0.5 text-rose-300/90">{error}</p>
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="analyst@securecipher.org"
                      className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-medium text-slate-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-slate-600 transition-all outline-none font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Remember Me */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-emerald-500/30 bg-[#030804] text-emerald-500 focus:ring-emerald-400/40 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-xs text-slate-400">Remember this device</span>
                  </label>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Registration Link */}
              <div className="mt-8 pt-6 border-t border-emerald-500/10 text-center">
                <p className="text-xs text-slate-400">
                  Don't have an account?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                  >
                    Create Account
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Minimal Footer */}
      <footer className="relative z-10 w-full py-6 text-center text-[11px] font-mono text-slate-600 border-t border-emerald-500/10">
        SecureCipher — Multi-Algorithm Cryptography & Secure Data Protection System
      </footer>
    </div>
  );
}
