import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Clock,
  RefreshCw,
  KeyRound,
  ArrowLeft,
  Check,
  X,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { requestOTP, verifyOTPAndRegister } = useAuth();

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Workflow Steps: 'input' -> 'verify_otp' -> 'success'
  const [step, setStep] = useState('input');

  // OTP State
  const [otp, setOtp] = useState('');
  const [devOtpNotice, setDevOtpNotice] = useState(null);
  const [missingConfig, setMissingConfig] = useState(null);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(300); // 5 minutes

  // UI State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Cooldown and Expiration Timers
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    let timer;
    if (step === 'verify_otp' && expiresIn > 0) {
      timer = setInterval(() => setExpiresIn((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, expiresIn]);

  // Password Strength Evaluation
  const hasMinLen = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>\-_+=~`]/.test(password);

  const criteriaMet = [hasMinLen, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  let strengthLabel = 'Weak';
  let strengthColor = 'bg-rose-500';
  let strengthPercent = '20%';

  if (criteriaMet === 5) {
    strengthLabel = 'Strong';
    strengthColor = 'bg-emerald-400';
    strengthPercent = '100%';
  } else if (criteriaMet >= 3) {
    strengthLabel = 'Good';
    strengthColor = 'bg-emerald-500';
    strengthPercent = '65%';
  } else if (criteriaMet >= 2) {
    strengthLabel = 'Fair';
    strengthColor = 'bg-amber-400';
    strengthPercent = '40%';
  }

  // Handle Step 1: Request OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please provide your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (criteriaMet < 5) {
      setError('Password does not satisfy all complexity requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (!acceptTerms) {
      setError('Please accept the Terms & Cryptographic Privacy Agreement.');
      return;
    }

    setLoading(true);
    const result = await requestOTP({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (result.success) {
      setStep('verify_otp');
      setCooldown(result.data.resend_cooldown_seconds || 60);
      setExpiresIn(result.data.expires_in_seconds || 300);

      if (!result.data.smtp_configured) {
        setMissingConfig(result.data.missing_config);
        setDevOtpNotice(result.data.dev_otp);
      } else {
        setMissingConfig(null);
        setDevOtpNotice(null);
      }
    } else {
      setError(result.error);
    }
  };

  // Handle Resend OTP
  const handleResendOTP = async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    const result = await requestOTP({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (result.success) {
      setCooldown(result.data.resend_cooldown_seconds || 60);
      setExpiresIn(result.data.expires_in_seconds || 300);
      if (!result.data.smtp_configured) {
        setDevOtpNotice(result.data.dev_otp);
      }
    } else {
      setError(result.error);
    }
  };

  // Handle Step 2: Verify OTP & Create Account
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    const result = await verifyOTPAndRegister({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      otp: otp.trim(),
    });
    setLoading(false);

    if (result.success) {
      setStep('success');
      setSuccessMsg('Account created and verified successfully!');
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 2000);
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#020603] text-slate-100 flex flex-col justify-between selection:bg-emerald-500/30 selection:text-emerald-300 relative overflow-hidden font-sans">
      {/* Ambient Lighting & Perspective Grid */}
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
          to="/login"
          className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400/80 hover:text-emerald-300 transition-colors bg-emerald-950/40 hover:bg-emerald-900/40 border border-emerald-500/20 px-3.5 py-1.5 rounded-full"
        >
          Already have an account? Sign In
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      {/* Main Registration Container */}
      <main className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-center">
        <div className="w-full grid lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Cryptographic Trust & Verification Features */}
          <div className="hidden lg:flex lg:col-span-5 flex-col justify-between p-8 rounded-[2.5rem] bg-gradient-to-b from-emerald-950/20 to-[#040e06] border border-emerald-500/15 relative overflow-hidden h-[640px]">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-mono tracking-wider uppercase mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Verified Identity Protocol
              </div>

              <h2 className="text-2xl font-bold text-white tracking-tight leading-snug mb-3">
                Join the Cryptographic Workbench
              </h2>
              <p className="text-slate-400 text-xs leading-relaxed">
                Create your verified analyst account to execute authenticated ciphers, save execution audits, and generate forensic PDF dossiers.
              </p>
            </div>

            {/* Visual Steps Indicator */}
            <div className="relative z-10 my-auto space-y-4">
              <div className={`p-4 rounded-2xl border transition-all ${step === 'input' ? 'bg-emerald-500/10 border-emerald-400/40 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${step === 'input' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    01
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Account Credentials</h4>
                    <p className="text-[11px] text-slate-400">Full name, email & bcrypt password</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${step === 'verify_otp' ? 'bg-emerald-500/10 border-emerald-400/40 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${step === 'verify_otp' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    02
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Email Verification (OTP)</h4>
                    <p className="text-[11px] text-slate-400">6-digit cryptographically verified code</p>
                  </div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border transition-all ${step === 'success' ? 'bg-emerald-500/10 border-emerald-400/40 text-white' : 'bg-slate-900/40 border-slate-800 text-slate-400'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold font-mono ${step === 'success' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
                    03
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold">Workspace Authorization</h4>
                    <p className="text-[11px] text-slate-400">Ready to explore AES, RSA, DH, SHA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Security Guarantee */}
            <div className="relative z-10 pt-4 border-t border-emerald-500/15 text-[11px] font-mono text-slate-400 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero plaintext password exposure. Salted rounds = 12.</span>
            </div>
          </div>

          {/* Right Column: Registration Card */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-[2.5rem] bg-[#040e06]/90 backdrop-blur-xl border border-emerald-500/20 shadow-[0_20px_60px_rgba(0,0,0,0.6)] relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Card Header */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-mono tracking-wider uppercase mb-3">
                  <Sparkles className="w-3 h-3" />
                  Account Registration
                </div>
                <h1 className="text-3xl font-extrabold text-white tracking-tight">
                  {step === 'verify_otp' ? 'Verify Your Email' : 'Create Your Account'}
                </h1>
                <p className="text-slate-400 text-sm mt-1.5">
                  {step === 'verify_otp'
                    ? `Enter the 6-digit verification code sent to ${email}`
                    : 'Join SecureCipher to explore cryptographic tools and security demonstrations.'}
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3 animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-200">Registration Error</p>
                    <p className="mt-0.5 text-rose-300/90">{error}</p>
                  </div>
                </div>
              )}

              {/* Success Banner */}
              {step === 'success' && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Account Created Successfully!</h3>
                  <p className="text-slate-300 text-xs">
                    Your email address has been verified. Redirecting you to the cryptographic workspace...
                  </p>
                  <div className="pt-2">
                    <Link
                      to="/algorithm/aes"
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:bg-emerald-400"
                    >
                      Enter Workspace Now
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* STEP 1: Registration Form */}
              {step === 'input' && (
                <form onSubmit={handleRequestOTP} className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Cipher Analyst"
                        className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
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
                        className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-600 transition-all outline-none"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-medium text-slate-300">
                        Password
                      </label>
                      {password && (
                        <span className="text-[11px] font-mono font-semibold text-slate-400">
                          Strength: <span className="text-emerald-400">{strengthLabel}</span>
                        </span>
                      )}
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
                        className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-600 transition-all outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Password Strength Bar */}
                    {password && (
                      <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full ${strengthColor} transition-all duration-300`}
                          style={{ width: strengthPercent }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full bg-[#030804] border border-emerald-500/20 focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/40 rounded-xl pl-10 pr-11 py-2.5 text-sm text-white placeholder-slate-600 transition-all outline-none font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Password Requirements Checklist */}
                  <div className="p-3 rounded-xl bg-[#030804] border border-emerald-500/15 space-y-1.5 text-[11px] font-mono">
                    <p className="text-slate-400 font-semibold mb-1 text-[10px] uppercase tracking-wider">
                      Security Policy Requirements:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className={`flex items-center gap-1.5 ${hasMinLen ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {hasMinLen ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                        <span>8+ Characters</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasUpper ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {hasUpper ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                        <span>Uppercase (A-Z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasLower ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {hasLower ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                        <span>Lowercase (a-z)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {hasNumber ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                        <span>Numeric Digit (0-9)</span>
                      </div>
                      <div className={`flex items-center gap-1.5 col-span-2 ${hasSpecial ? 'text-emerald-400' : 'text-slate-500'}`}>
                        {hasSpecial ? <Check className="w-3 h-3 text-emerald-400" /> : <X className="w-3 h-3 text-slate-600" />}
                        <span>Special Symbol (!@#$%^&*)</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms & Privacy */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        required
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                        className="w-4 h-4 mt-0.5 rounded border-emerald-500/30 bg-[#030804] text-emerald-500 focus:ring-emerald-400/40 focus:ring-offset-0 cursor-pointer"
                      />
                      <span className="text-xs text-slate-400 leading-snug">
                        I agree to the <span className="text-emerald-400">Cryptographic Privacy Policy</span> and understand that algorithms run ephemerally with zero key persistence.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-3 py-3 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Sending Verification Code...</span>
                      </>
                    ) : (
                      <>
                        <span>Continue to Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: Email OTP Verification */}
              {step === 'verify_otp' && (
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  {/* Unconfigured SMTP Diagnostic Notice (if email server is unconfigured) */}
                  {missingConfig && (
                    <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-semibold text-amber-300">
                        <Info className="w-4 h-4 shrink-0" />
                        <span>SMTP Email Delivery Unconfigured</span>
                      </div>
                      <p className="text-[11px] text-amber-200/80 leading-relaxed">
                        The backend does not have live SMTP credentials configured in <code className="bg-amber-950/60 px-1 py-0.5 rounded text-amber-300">backend/.env</code>.
                        Missing variables: <strong className="text-amber-100">{missingConfig.join(', ')}</strong>.
                      </p>
                      {devOtpNotice && (
                        <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between">
                          <span className="text-[11px] font-mono text-amber-400">
                            Development Verification Code:
                          </span>
                          <span className="text-base font-mono font-bold text-emerald-400 tracking-widest bg-slate-950 px-2.5 py-1 rounded border border-emerald-500/40">
                            {devOtpNotice}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-2">
                      Enter 6-Digit One-Time Password (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      autoFocus
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full bg-[#030804] border border-emerald-500/30 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/40 rounded-xl px-4 py-3.5 text-center text-2xl font-mono tracking-[0.5em] text-emerald-400 placeholder-slate-700 outline-none transition-all"
                    />
                  </div>

                  {/* Expiration and Cooldown Timers */}
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-400" />
                      Expires in: {Math.floor(expiresIn / 60)}:{(expiresIn % 60).toString().padStart(2, '0')}
                    </span>
                    <button
                      type="button"
                      disabled={cooldown > 0 || loading}
                      onClick={handleResendOTP}
                      className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 disabled:text-slate-600 disabled:cursor-not-allowed transition-colors"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                    </button>
                  </div>

                  {/* Buttons */}
                  <div className="space-y-3 pt-2">
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm tracking-wide shadow-[0_0_25px_rgba(34,197,94,0.35)] hover:shadow-[0_0_35px_rgba(34,197,94,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                          <span>Verifying & Creating Account...</span>
                        </>
                      ) : (
                        <>
                          <span>Verify & Create Account</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setStep('input')}
                      className="w-full py-2.5 text-xs font-mono text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      ← Edit Registration Details
                    </button>
                  </div>
                </form>
              )}

              {/* Bottom Login Link */}
              <div className="mt-8 pt-6 border-t border-emerald-500/10 text-center">
                <p className="text-xs text-slate-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors inline-flex items-center gap-1"
                  >
                    Sign In
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
