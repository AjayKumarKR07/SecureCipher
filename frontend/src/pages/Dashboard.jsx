import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Repeat,
  Hash,
  Fingerprint,
  Activity,
  Database,
  ArrowRight,
  ExternalLink,
  Eye,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Menu,
  X,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  ArrowUpRight,
  User,
  LogOut,
  Bell,
  ChevronDown,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { fetchAlgorithms, fetchHistory } from '../services/api';
import { formatIndiaTime } from './HistoryPage';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Dashboard({ backendHealth, dbHealth, onRefresh }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [algorithms, setAlgorithms] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState('encryption');

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const algosData = await fetchAlgorithms();
        if (isMounted) {
          setAlgorithms(algosData.algorithms || []);
        }
      } catch (err) {
        console.error('Failed loading algorithms:', err);
      }

      try {
        const histData = await fetchHistory(5);
        if (isMounted) {
          setHistoryItems(histData.items || []);
          setHistoryLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setHistoryLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [backendHealth]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#030704] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      {/* ============================================================== */}
      {/* 1. MINIMAL CYBER NAVBAR (Matching Reference Styling)           */}
      {/* ============================================================== */}
      <header className="sticky top-0 z-50 bg-[#030704]/85 backdrop-blur-md border-b border-emerald-500/15 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo & Brand Wordmark */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9 rounded-xl bg-[#061408] border border-emerald-500/40 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:border-emerald-400 transition-all">
              <div className="w-full h-full bg-[#040d05] rounded-[9px] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold tracking-tight text-white text-lg flex items-center gap-1">
                Secure<span className="text-emerald-400">Cipher</span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-500/70">
                Cryptography System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-[#061208]/80 border border-emerald-500/20 px-3 py-1.5 rounded-full shadow-inner shadow-black/40">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('algorithms')}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-colors"
            >
              Algorithms
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-colors"
            >
              How It Works
            </button>
            <Link
              to="/about"
              className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-colors"
            >
              About
            </Link>
            <Link
              to="/history"
              className="px-4 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/50 transition-colors"
            >
              Audit History
            </Link>
          </nav>

          {/* Right Action: Launch Workspace, Telemetry & Authentication */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-2 bg-[#061408] border border-emerald-500/25 px-2.5 py-1.5 rounded-lg text-xs font-mono text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{backendHealth?.connected ? 'Live Telemetry' : 'Connecting'}</span>
            </div>


            {/* Notifications Button */}
            <Link
              to="/profile"
              title="Notifications & Activity"
              className="relative p-2 rounded-full bg-[#061408] border border-emerald-500/25 text-slate-300 hover:text-white hover:border-emerald-400/50 transition-colors"
            >
              <Bell className="w-3.5 h-3.5 text-emerald-400/90" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen((p) => !p)}
                  className="flex items-center gap-2 bg-[#061408] border border-emerald-500/30 hover:border-emerald-400 pl-3 pr-2 py-1.5 rounded-full text-xs transition-all cursor-pointer"
                >
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-slate-950">
                    {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                  </div>
                  <span className="text-emerald-300 font-medium truncate max-w-[90px]">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/70 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {profileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#040e06] border border-emerald-500/30 shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl">
                    <div className="p-3 rounded-xl bg-[#06180a] border border-emerald-500/20 mb-2">
                      <p className="font-bold text-white text-sm truncate">{user.full_name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      <span className="inline-block mt-2 text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Verified Analyst
                      </span>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-950/40 transition-colors"
                    >
                      <User className="w-4 h-4 text-emerald-400" />
                      <span>Account Settings</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-950/40 transition-colors"
                    >
                      <Lock className="w-4 h-4 text-emerald-400" />
                      <span>Change Password</span>
                    </Link>

                    <Link
                      to="/profile"
                      onClick={() => setProfileDropdownOpen(false)}
                      className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-emerald-950/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <Bell className="w-4 h-4 text-emerald-400" />
                        <span>Notifications</span>
                      </div>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300">
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <div className="border-t border-emerald-500/15 pt-1 mt-1">
                      <button
                        onClick={() => {
                          logout();
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5">
                <Link
                  to="/login"
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/50 border border-emerald-500/20 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1.5 rounded-full text-xs font-medium text-slate-300 hover:text-white hover:bg-emerald-950/40 transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              to="/algorithm/aes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0a2310] hover:bg-[#0d2f16] border border-emerald-400/50 hover:border-emerald-300 text-emerald-300 hover:text-white text-xs font-semibold shadow-md shadow-emerald-950/50 hover:shadow-emerald-900/50 transition-all group"
            >
              <span>Launch Workspace</span>
              <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {/* Mobile menu trigger */}
          <button
            onClick={() => setMobileMenuOpen((p) => !p)}
            className="md:hidden p-2 rounded-lg bg-[#061408] border border-emerald-500/30 text-emerald-300"
            aria-label="Toggle Navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile menu drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-emerald-500/20 bg-[#040c06] px-4 py-4 space-y-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#081a0b] hover:text-white"
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection('algorithms')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#081a0b] hover:text-white"
            >
              Algorithms
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#081a0b] hover:text-white"
            >
              How It Works
            </button>
            <Link
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#081a0b] hover:text-white"
            >
              Audit History
            </Link>
            <Link
              to="/about"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-left py-2 px-3 rounded-lg text-sm font-medium text-slate-300 hover:bg-[#081a0b] hover:text-white"
            >
              About
            </Link>

            {user ? (
              <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-[#081a0b] border border-emerald-500/20 text-xs">
                <span className="text-emerald-300 font-medium">Signed in as {user.full_name}</span>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-400 hover:text-rose-300 font-mono text-xs flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 px-3 rounded-lg border border-emerald-500/30 text-emerald-300 hover:bg-emerald-950/40 text-xs font-semibold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center py-2 px-3 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 text-white text-xs font-semibold"
                >
                  Register
                </Link>
              </div>
            )}

            <Link
              to="/algorithm/aes"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center mt-3 py-2 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-bold shadow-lg"
            >
              Launch Workspace
            </Link>
          </div>
        )}
      </header>

      {/* ============================================================== */}
      {/* 2. HERO SECTION (Matching Reference Centered Composition)      */}
      {/* ============================================================== */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-16 lg:pb-24 max-w-7xl mx-auto w-full">
        {/* Large Rounded Container matching the reference design */}
        <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[2.5rem] bg-gradient-to-b from-[#061609] via-[#040e06] to-[#020703] border border-emerald-500/25 p-8 sm:p-14 lg:p-20 text-center shadow-2xl shadow-black/80">
          {/* Subtle Ambient Horizon Beam & Radial Light */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-gradient-to-b from-emerald-500/20 via-emerald-600/5 to-transparent blur-3xl opacity-70" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent animate-horizon" />
            {/* Cyber Perspective Grid Lines */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(34,197,94,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(34,197,94,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
            {/* Project Subtitle Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#081e0c]/90 border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-6 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Multi-Algorithm Cryptography & Secure Data Protection System</span>
            </div>

            {/* Hero Headline with Decorative Neon-Green Symbol */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.15] mb-6 max-w-3xl">
              Secure Your Data.{' '}
              <span className="inline-flex items-center justify-center align-middle mx-1.5 my-1">
                <span className="p-1.5 sm:p-2 rounded-full bg-emerald-950/80 border border-emerald-400/60 shadow-lg shadow-emerald-500/20 inline-flex items-center justify-center">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 animate-pulse" />
                </span>
              </span>{' '}
              Understand Every Algorithm.
            </h1>

            {/* Hero Supporting Paragraph */}
            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mb-8 font-normal">
              Explore modern encryption, public-key cryptography, secure key exchange, and cryptographic hashing through interactive demonstrations designed to make cybersecurity easier to understand.
            </p>

            {/* Primary & Secondary Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3.5 sm:gap-4 mb-12 sm:mb-16">
              <button
                onClick={() => scrollToSection('algorithms')}
                className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <span>Explore Algorithms</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </button>

              <button
                onClick={() => scrollToSection('how-it-works')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#061609] hover:bg-[#09220e] text-emerald-300 hover:text-white text-sm font-medium border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer"
              >
                <span>How It Works</span>
              </button>
            </div>

            {/* Bottom Minimalist Highlights Dock (Matching Reference Bottom Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-3xl text-left">
              <div className="p-3.5 sm:p-4 rounded-xl bg-[#040e06]/70 border border-emerald-500/20 backdrop-blur-xs flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 mt-0.5">[ 01 ]</span>
                <div>
                  <h4 className="text-xs font-bold text-white m-0">6 Cryptographic Primitives</h4>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5 leading-snug">
                    AES-GCM, RSA-OAEP, DH, SHA-256, MD5, and DES.
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-[#040e06]/70 border border-emerald-500/20 backdrop-blur-xs flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 mt-0.5">[ 02 ]</span>
                <div>
                  <h4 className="text-xs font-bold text-white m-0">Zero-Knowledge Isolation</h4>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5 leading-snug">
                    Ephemeral in-memory execution; no secrets logged.
                  </p>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-[#040e06]/70 border border-emerald-500/20 backdrop-blur-xs flex items-start gap-3">
                <span className="text-xs font-mono font-bold text-emerald-400 shrink-0 mt-0.5">[ 03 ]</span>
                <div>
                  <h4 className="text-xs font-bold text-white m-0">PostgreSQL Audit Trail</h4>
                  <p className="text-[11px] text-slate-400 m-0 mt-0.5 leading-snug">
                    Execution telemetry benchmarks with PDF dossiers.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 3. MAIN VISUAL GRID — SIX CRYPTOGRAPHIC ALGORITHMS (BENTO)    */}
      {/* ============================================================== */}
      <section id="algorithms" className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-7xl mx-auto w-full">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-emerald-500/15">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
              <span>[ CRYPTOGRAPHIC SUITE ]</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight m-0">
              Six Algorithmic Engines
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mt-1 m-0">
              Interactive cybersecurity workbenches illustrating authenticated symmetric ciphers, asymmetric trapdoors, key exchange, secure hashing, and historical cryptanalysis.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-mono text-emerald-400/80">6 Primitives Live</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
          </div>
        </div>

        {/* Bento Grid Architecture (Matching Reference Visual Panels) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-6">
          {/* -------------------------------------------------------- */}
          {/* CARD 1: AES-256-GCM (Top-Left Large Featured Panel)      */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-7 rounded-2xl bg-gradient-to-b from-[#08180c] via-[#051008] to-[#030904] border border-emerald-500/20 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/40 transition-all">
            {/* Visual: Glowing Neon Green X-Beam Laser Ray (from Reference Top-Left) */}
            <div className="absolute right-0 top-0 w-80 h-80 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                <defs>
                  <radialGradient id="beamGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4ade80" stopOpacity="0.8" />
                    <stop offset="40%" stopColor="#22c55e" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#051008" stopOpacity="0" />
                  </radialGradient>
                  <linearGradient id="laserLine" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#040d05" stopOpacity="0" />
                    <stop offset="50%" stopColor="#86efac" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#040d05" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="laserLineReverse" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#040d05" stopOpacity="0" />
                    <stop offset="50%" stopColor="#4ade80" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#040d05" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Diagonal Crossing Beams */}
                <line x1="10" y1="20" x2="190" y2="180" stroke="url(#laserLine)" strokeWidth="1.5" />
                <line x1="190" y1="20" x2="10" y2="180" stroke="url(#laserLineReverse)" strokeWidth="1.5" />
                {/* Central Glowing Intersection Star */}
                <circle cx="100" cy="100" r="30" fill="url(#beamGlow)" />
                <circle cx="100" cy="100" r="4" fill="#ffffff" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  [ 01 · SYMMETRIC AEAD ]
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  NIST FIPS 197
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5 flex items-center gap-2">
                <span>AES-256-GCM</span>
              </h3>
              <p className="text-xs sm:text-sm font-medium text-emerald-300/90 mb-3">
                Authenticated Symmetric Encryption
              </p>
              <p className="text-xs text-slate-300 leading-relaxed max-w-md mb-6">
                Gold standard in data protection. Combines Counter (CTR) mode encryption with a Galois GHASH 128-bit authentication tag, driven by Scrypt key derivation and unique 96-bit nonces.
              </p>

              {/* Specs pill */}
              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#040e06] border border-emerald-500/20 text-slate-300">
                  256-bit Key
                </span>
                <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#040e06] border border-emerald-500/20 text-slate-300">
                  Scrypt KDF
                </span>
                <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#040e06] border border-emerald-500/20 text-slate-300">
                  128-bit Tag
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <Link
                to="/algorithm/aes"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition-colors group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Algorithm</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
              <span className="text-[11px] font-mono text-emerald-500/60">Live Interactive Workbench</span>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CARD 2: RSA-OAEP (Top-Right Medium Panel)                */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-5 rounded-2xl bg-gradient-to-b from-[#08180c] via-[#051008] to-[#030904] border border-emerald-500/20 p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/40 transition-all">
            {/* Visual: Glowing Optical Orb (from Reference Top-Right Sphere) */}
            <div className="absolute right-3 top-3 w-40 h-40 pointer-events-none opacity-85 group-hover:scale-105 transition-transform">
              <div className="w-full h-full relative flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-emerald-600 to-green-300 shadow-[0_0_35px_rgba(74,222,128,0.4)] animate-orb" />
                <div className="absolute inset-0 rounded-full border border-emerald-400/30 animate-ping opacity-25" />
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  [ 02 · ASYMMETRIC TRAPDOOR ]
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  RFC 8017
                </span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1.5">
                RSA-OAEP
              </h3>
              <p className="text-xs sm:text-sm font-medium text-emerald-300/90 mb-3">
                Public-Key Encryption & Private Decryption
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Asymmetric cryptosystem built on prime factorization complexity. Uses Optimal Asymmetric Encryption Padding (OAEP) with SHA-256 and MGF1 to resist chosen-ciphertext attacks.
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#040e06] border border-emerald-500/20 text-slate-300">
                  2048 & 3072-bit Modulus
                </span>
                <span className="text-[11px] font-mono px-2 py-1 rounded bg-[#040e06] border border-emerald-500/20 text-slate-300">
                  MGF1 Masking
                </span>
              </div>
            </div>

            <div className="relative z-10 pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <Link
                to="/algorithm/rsa"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition-colors group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Algorithm</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
              <span className="text-[11px] font-mono text-emerald-500/60">Key Pair Engine</span>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CARD 3: DIFFIE-HELLMAN (Bottom-Left Tall Panel)          */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-[#08180c] via-[#051008] to-[#030904] border border-emerald-500/20 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/40 transition-all">
            {/* Visual: Hyperbolic Hourglass Optical Curve (from Reference Bottom-Left) */}
            <div className="absolute top-2 right-2 w-32 h-44 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity">
              <svg viewBox="0 0 100 160" className="w-full h-full">
                <path
                  d="M10,10 Q50,80 10,150 M90,10 Q50,80 90,150"
                  stroke="#4ade80"
                  strokeWidth="1.5"
                  fill="none"
                />
                <circle cx="50" cy="80" r="5" fill="#22c55e" />
                <line x1="50" y1="10" x2="50" y2="150" stroke="#22c55e" strokeWidth="0.5" strokeDasharray="3 3" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  [ 03 · KEY AGREEMENT ]
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  RFC 3526
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                Diffie–Hellman (DH)
              </h3>
              <p className="text-xs font-medium text-emerald-300/90 mb-2.5">
                Shared-Key Agreement Handshake
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Exchange public values across untrusted channels to independently compute matching shared secrets. Hardened with RFC 3526 MODP Group 14 and HKDF session key derivation.
              </p>

              <div className="p-2.5 rounded-lg bg-[#040e06] border border-emerald-500/20 text-[11px] font-mono text-slate-300 space-y-1 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Modulus:</span>
                  <span className="text-emerald-300">2048-bit MODP</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Generator:</span>
                  <span className="text-emerald-300">g = 2</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-emerald-500/15">
              <Link
                to="/algorithm/diffie-hellman"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition-colors group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Algorithm</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CARD 4: SHA-256 (Center Cyber Eye/Shield Panel)          */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-[#08180c] via-[#051008] to-[#030904] border border-emerald-500/20 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/40 transition-all">
            {/* Visual: Glowing Security Eye / Padlock Center (from Reference Center Panel) */}
            <div className="w-full py-4 flex items-center justify-center relative">
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Outer eye/shield concentric rings */}
                <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-spin-slow" />
                <div className="absolute inset-2 rounded-full border border-emerald-400/20 border-dashed" />
                <div className="w-12 h-12 rounded-xl bg-[#061e0b] border border-emerald-400/60 shadow-[0_0_20px_rgba(74,222,128,0.4)] flex items-center justify-center">
                  <Lock className="w-6 h-6 text-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase tracking-wider">
                  [ 04 · CRYPTO HASH ]
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
                  NIST FIPS 180-4
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                SHA-256
              </h3>
              <p className="text-xs font-medium text-emerald-300/90 mb-2.5">
                Deterministic 256-Bit Message Digest
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                One-way cryptographic hash with 64 compression rounds over 512-bit message blocks. Produces irreversible 32-byte digests featuring intense avalanche properties.
              </p>

              <div className="p-2.5 rounded-lg bg-[#040e06] border border-emerald-500/20 text-[11px] font-mono text-slate-300 space-y-1 mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-400">Digest Size:</span>
                  <span className="text-emerald-300">256 bits (32 B)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Collision State:</span>
                  <span className="text-emerald-300">Secure (0 Collisions)</span>
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-emerald-500/15">
              <Link
                to="/algorithm/sha-256"
                className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-300 hover:text-white transition-colors group-hover:translate-x-1 transition-transform"
              >
                <span>Explore Algorithm</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* -------------------------------------------------------- */}
          {/* CARD 5 & 6: MD5 & DES-CBC (Bottom-Right Orbital Panel)   */}
          {/* -------------------------------------------------------- */}
          <div className="md:col-span-4 rounded-2xl bg-gradient-to-b from-[#08180c] via-[#051008] to-[#030904] border border-emerald-500/20 p-6 flex flex-col justify-between relative overflow-hidden group hover:border-emerald-400/40 transition-all">
            {/* Visual: Dual Orbital Rings with Spheres (from Reference Bottom-Right Panel) */}
            <div className="absolute top-2 right-2 w-32 h-32 pointer-events-none opacity-45 group-hover:opacity-75 transition-opacity">
              <svg viewBox="0 0 120 120" className="w-full h-full">
                <circle cx="60" cy="60" r="45" fill="none" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 4" className="animate-spin-slow origin-center" />
                <circle cx="60" cy="60" r="25" fill="none" stroke="#4ade80" strokeWidth="1.2" className="animate-spin-reverse origin-center" />
                <circle cx="60" cy="15" r="4" fill="#4ade80" />
                <circle cx="60" cy="35" r="3" fill="#86efac" />
              </svg>
            </div>

            <div className="relative z-10">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-[11px] font-mono text-amber-400 font-semibold uppercase tracking-wider">
                  [ 05 & 06 · LEGACY ANALYSIS ]
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300">
                  Educational
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">
                MD5 & DES-CBC
              </h3>
              <p className="text-xs font-medium text-amber-300/90 mb-2.5">
                Legacy Cryptanalysis Demonstrations
              </p>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                Historical algorithms provided strictly for vulnerability study. Compare broken collision resistance in MD5 and brute-force key search in 56-bit DES.
              </p>

              {/* Warning badges */}
              <div className="space-y-2 mb-6">
                <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[10px] font-mono text-amber-200">
                  <strong>MD5 (RFC 1321):</strong> Collision vulnerable; broken by Wang et al.
                </div>
                <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[10px] font-mono text-rose-200">
                  <strong>DES (FIPS 46-3):</strong> 56-bit key space exhausted in hours.
                </div>
              </div>
            </div>

            <div className="relative z-10 pt-3 border-t border-emerald-500/15 flex items-center justify-between gap-2">
              <Link
                to="/algorithm/md5"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-300 hover:text-white transition-colors"
              >
                <span>MD5 Demo</span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
              </Link>
              <span className="text-slate-600">|</span>
              <Link
                to="/algorithm/des"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-300 hover:text-white transition-colors"
              >
                <span>DES Demo</span>
                <ArrowRight className="w-3 h-3 text-rose-400" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* 4. HOW IT WORKS SECTION (Interactive Cryptographic Workflows) */}
      {/* ============================================================== */}
      <section id="how-it-works" className="px-4 sm:px-6 lg:px-8 py-12 lg:py-16 max-w-7xl mx-auto w-full">
        <div className="rounded-[2rem] bg-gradient-to-b from-[#06180c] via-[#040e06] to-[#020603] border border-emerald-500/25 p-6 sm:p-12 relative overflow-hidden shadow-2xl">
          <div className="max-w-3xl mb-8">
            <div className="inline-flex items-center gap-2 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-1">
              <span>[ HOW IT WORKS ]</span>
            </div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight m-0">
              Core Cryptographic Mechanisms
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-2 leading-relaxed">
              Understand the clear mathematical distinctions between symmetric authenticated encryption, asymmetric trapdoor permutations, key agreement handshakes, and one-way hashing.
            </p>
          </div>

          {/* Workflow Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 p-1 rounded-xl bg-[#030904] border border-emerald-500/20 max-w-xl">
            <button
              onClick={() => setActiveWorkflowTab('encryption')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeWorkflowTab === 'encryption'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              1. Encryption
            </button>
            <button
              onClick={() => setActiveWorkflowTab('key-exchange')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeWorkflowTab === 'key-exchange'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Key Exchange
            </button>
            <button
              onClick={() => setActiveWorkflowTab('hashing')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeWorkflowTab === 'hashing'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              3. Hashing
            </button>
          </div>

          {/* Tab 1: Encryption & Decryption Workflow */}
          {activeWorkflowTab === 'encryption' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 1 · INGESTION</span>
                  <h4 className="text-sm font-bold text-white m-0">Plaintext Input</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    User inputs raw message string and password passphrase into memory buffer.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 2 · DERIVATION</span>
                  <h4 className="text-sm font-bold text-white m-0">Scrypt KDF & Nonce</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    16-byte random salt and 12-byte nonce generated via CSPRNG; 256-bit key derived.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 3 · CIPHER</span>
                  <h4 className="text-sm font-bold text-white m-0">AES-GCM / RSA-OAEP</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Counter mode encrypts stream; 128-bit GHASH authentication tag is computed.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 4 · EMISSION</span>
                  <h4 className="text-sm font-bold text-white m-0">Authenticated Ciphertext</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Ciphertext, nonce, and tag Base64 packaged; ephemeral memory securely wiped.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#051308] border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Confidentiality & Integrity Guarantee:</strong> AES-256-GCM is an Authenticated Encryption with Associated Data (AEAD) cipher. Decryption strictly verifies the 128-bit authentication tag before releasing plaintext; any bit-flipping immediately triggers verification failure.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Key Exchange Workflow */}
          {activeWorkflowTab === 'key-exchange' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 1 · PARAMETERS</span>
                  <h4 className="text-sm font-bold text-white m-0">MODP Group 14</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    RFC 3526 vetted 2048-bit prime modulus <em>p</em> and generator <em>g = 2</em> initialized.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 2 · EXPONENTS</span>
                  <h4 className="text-sm font-bold text-white m-0">Private Generation</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Alice generates private <em>a</em>, Bob generates private <em>b</em> via CSPRNG.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 3 · EXCHANGE</span>
                  <h4 className="text-sm font-bold text-white m-0">Public Component Swap</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Public values <em>A = g^a mod p</em> and <em>B = g^b mod p</em> exchanged over public channel.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 4 · AGREEMENT</span>
                  <h4 className="text-sm font-bold text-white m-0">HKDF Shared Key</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Both compute <em>S = B^a = A^b mod p</em>; HKDF derives clean 256-bit session key.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-xs text-amber-200 leading-relaxed flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Security & MITM Notice:</strong> Unauthenticated Diffie-Hellman establishes a shared secret over an insecure channel, but provides no identity verification. In production systems, digital certificates (e.g. X.509 in TLS 1.3) are required to prevent Man-in-the-Middle (MITM) attacks.
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: One-Way Hashing Workflow */}
          {activeWorkflowTab === 'hashing' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 1 · INGESTION</span>
                  <h4 className="text-sm font-bold text-white m-0">Arbitrary Payload</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Ingests text string or binary file byte stream without size restrictions.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 2 · PADDING</span>
                  <h4 className="text-sm font-bold text-white m-0">512-bit Block Formatting</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Appends single 1-bit, zero-padding bits, and 64-bit message length field.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 3 · COMPRESSION</span>
                  <h4 className="text-sm font-bold text-white m-0">64 Iterative Rounds</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Non-linear functions (Ch, Maj), rotations, and constants mutate internal state.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-[#040e06] border border-emerald-500/20 space-y-2">
                  <span className="text-[11px] font-mono text-emerald-400 font-bold block">STEP 4 · DIGEST</span>
                  <h4 className="text-sm font-bold text-white m-0">Fixed 256-bit Digest</h4>
                  <p className="text-xs text-slate-400 m-0 leading-relaxed">
                    Emits deterministic 64-character hexadecimal digest; input cannot be reversed.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#051308] border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white">Hashing is One-Way:</strong> Hashing is NOT encryption. There is no secret key, and the original input cannot be decrypted from the hash. Modifying even 1 bit of input radically alters over 50% of the output bits (Avalanche Effect).
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 5. TELEMETRY & POSTGRESQL AUDIT TRAIL PREVIEW                  */}
      {/* ============================================================== */}
      <section className="px-4 sm:px-6 lg:px-8 py-12 max-w-7xl mx-auto w-full">
        <div className="rounded-2xl bg-gradient-to-b from-[#061408] to-[#030904] border border-emerald-500/20 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-emerald-500/15">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-emerald-400" />
                <h3 className="text-base sm:text-lg font-bold text-white m-0">
                  Live PostgreSQL Execution Audit Trail
                </h3>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Synchronized audit metadata recorded by FastAPI backend services in Indian Standard Time (IST).
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link
                to="/history"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 hover:text-white text-xs font-semibold transition-all"
              >
                <span>Full Audit History</span>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            <div className="p-3 rounded-xl bg-[#040d05] border border-emerald-500/15">
              <span className="text-[10px] font-mono text-slate-400 block">FastAPI Server</span>
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {backendHealth?.connected ? `Live (${backendHealth?.latency || 0} ms)` : 'Connecting'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#040d05] border border-emerald-500/15">
              <span className="text-[10px] font-mono text-slate-400 block">PostgreSQL DB</span>
              <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {dbHealth?.connected ? 'Connected' : 'Standalone'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#040d05] border border-emerald-500/15">
              <span className="text-[10px] font-mono text-slate-400 block">Primacy Timezone</span>
              <span className="text-xs font-bold text-slate-200 mt-0.5 block">
                IST (UTC+05:30)
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#040d05] border border-emerald-500/15">
              <span className="text-[10px] font-mono text-slate-400 block">Zero-Knowledge</span>
              <span className="text-xs font-bold text-emerald-300 mt-0.5 block">
                100% Verified
              </span>
            </div>
          </div>

          {/* Mini Table */}
          {historyLoading ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono animate-pulse">
              Querying PostgreSQL execution trail...
            </div>
          ) : historyItems.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500 font-mono">
              Audit trail is currently empty. Run any algorithm above to benchmark performance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#030904] text-slate-400 font-mono border-b border-emerald-500/15">
                  <tr>
                    <th className="py-2.5 px-3">Audit ID</th>
                    <th className="py-2.5 px-3">Algorithm</th>
                    <th className="py-2.5 px-3">Operation</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Duration</th>
                    <th className="py-2.5 px-3">Timestamp (IST)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {historyItems.slice(0, 5).map((item) => (
                    <tr key={item.id} className="hover:bg-emerald-950/20 transition-colors">
                      <td className="py-2.5 px-3 font-mono text-emerald-400 font-semibold">#{item.id}</td>
                      <td className="py-2.5 px-3 font-medium text-white">{item.algorithm_name}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300 text-[11px]">{item.operation_type}</td>
                      <td className="py-2.5 px-3">
                        <StatusBadge status={item.status} label={item.status} size="xs" />
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">{item.execution_duration_ms} ms</td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        {formatIndiaTime(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================== */}
      {/* 6. MINIMAL CYBER FOOTER                                        */}
      {/* ============================================================== */}
      <footer className="border-t border-emerald-500/15 py-10 px-4 sm:px-6 lg:px-8 bg-[#020503] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start">
            <span className="font-bold text-white tracking-tight flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Secure<span className="text-emerald-400">Cipher</span>
            </span>
            <span className="text-xs text-slate-400 mt-1">
              Multi-Algorithm Cryptography & Secure Data Protection System
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono text-slate-400">
            <Link to="/algorithm/aes" className="hover:text-emerald-300 transition-colors">AES-GCM</Link>
            <Link to="/algorithm/rsa" className="hover:text-emerald-300 transition-colors">RSA-OAEP</Link>
            <Link to="/algorithm/diffie-hellman" className="hover:text-emerald-300 transition-colors">Diffie-Hellman</Link>
            <Link to="/algorithm/sha-256" className="hover:text-emerald-300 transition-colors">SHA-256</Link>
            <Link to="/algorithm/md5" className="hover:text-emerald-300 transition-colors">MD5</Link>
            <Link to="/algorithm/des" className="hover:text-emerald-300 transition-colors">DES</Link>
            <span className="text-slate-600">|</span>
            <Link to="/history" className="hover:text-emerald-300 transition-colors">History</Link>
            <Link to="/about" className="hover:text-emerald-300 transition-colors">About</Link>
          </div>

          <div className="text-xs font-mono text-slate-400 text-center sm:text-right">
            College Mini-Project | React + FastAPI + PostgreSQL
          </div>
        </div>
      </footer>
    </div>
  );
}
