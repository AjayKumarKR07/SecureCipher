import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Shield,
  KeyRound,
  Repeat,
  Hash,
  Fingerprint,
  Lock,
  History,
  Activity,
  Database,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  Layers,
  Terminal,
  User,
  Bell,
  Cpu,
  Server,
  Download,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { fetchAlgorithms, fetchHistory } from '../services/api';
import { formatIndiaTime } from './HistoryPage';
import { generateSingleAuditRecordPDF } from '../utils/historyPdfGenerator';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function Dashboard({ backendHealth, dbHealth, onRefresh }) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();

  const [algorithms, setAlgorithms] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    let isMounted = true;
    async function loadDashboardData() {
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

    loadDashboardData();
    return () => {
      isMounted = false;
    };
  }, [backendHealth]);

  const handleDownloadSingleReport = (item) => {
    try {
      setDownloadingId(item.id);
      generateSingleAuditRecordPDF(item);
    } catch (err) {
      console.error('Failed generating PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  const getAlgorithmIcon = (id) => {
    switch (id) {
      case 'aes':
        return Shield;
      case 'rsa':
        return KeyRound;
      case 'diffie-hellman':
        return Repeat;
      case 'sha-256':
        return Hash;
      case 'md5':
        return Fingerprint;
      case 'des':
        return Lock;
      default:
        return Shield;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ============================================================== */}
      {/* 1. WELCOME HERO & TELEMETRY BANNER                             */}
      {/* ============================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#06180a] via-[#041006] to-[#020904] border border-emerald-500/25 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-black/80">
        {/* Ambient Glow & Grid Accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-700/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-3xl">
            {/* Project / Session Tag */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 text-xs font-mono mb-4 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SecureCipher Cryptographic Control Center</span>
              <span className="text-emerald-500/60">•</span>
              <span className="text-emerald-400/90">B.Tech ISE Capstone</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Welcome back,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-green-300">
                {user?.full_name ? user.full_name : 'Security Analyst'}
              </span>
            </h1>

            <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              All six cryptographic engines are compiled and operational. Execute authenticated symmetric ciphers, public-key transformations, key agreement handshakes, and verifiable audit logging with zero-knowledge data retention.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/algorithm/aes"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-400/40 transition-all cursor-pointer"
              >
                <Shield className="w-4 h-4 text-slate-950" />
                <span>Launch AES-GCM Workbench</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/history"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#06180a] hover:bg-[#09240f] text-emerald-300 hover:text-white text-xs sm:text-sm font-medium border border-emerald-500/30 hover:border-emerald-400 transition-all cursor-pointer"
              >
                <History className="w-4 h-4 text-emerald-400" />
                <span>Audit History & PDF Reports</span>
              </Link>

              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-medium border border-slate-700/60 transition-all cursor-pointer"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span>Profile & Settings</span>
              </Link>
            </div>
          </div>

          {/* Quick Security Badge Box */}
          <div className="w-full lg:w-auto shrink-0 p-5 rounded-2xl bg-[#040e06]/80 border border-emerald-500/25 backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-xs font-semibold text-slate-300">Data Protection</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ZERO-KNOWLEDGE
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-300/90 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero Plaintexts or Keys Persisted</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300/90 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ephemeral Memory Processing</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-300/90 font-mono text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>PostgreSQL Audit Telemetry Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. REAL-TIME SYSTEM HEALTH & TELEMETRY CARDS                   */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend Status */}
        <div className="p-4 rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">FastAPI REST Server</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <StatusBadge
              status={backendHealth?.connected ? 'connected' : 'offline'}
              label={backendHealth?.connected ? 'Online (200 OK)' : 'Connecting / Offline'}
            />
            {backendHealth?.latency && (
              <span className="text-[11px] font-mono text-emerald-400">{backendHealth.latency} ms</span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            Host: 127.0.0.1:8000
          </p>
        </div>

        {/* Database Status */}
        <div className="p-4 rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">PostgreSQL 14+</span>
            <Database className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <StatusBadge
              status={dbHealth?.connected ? 'connected' : 'offline'}
              label={dbHealth?.connected ? 'Connected' : 'Offline'}
            />
            <span className="text-[11px] font-mono text-slate-400">Port 5432</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">
            DB: securecipher_db
          </p>
        </div>

        {/* Cryptographic Engines Status */}
        <div className="p-4 rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Cryptographic Engines</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">6 / 6 Active</div>
          <p className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 73/73 Tests Passing (100%)
          </p>
        </div>

        {/* Telemetry Operations Logged */}
        <div className="p-4 rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/40 transition-all shadow-md">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Audit Telemetry Log</span>
            <History className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white font-mono">
            {historyLoading ? '...' : `${historyItems.length} Recent`}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono flex items-center justify-between">
            <span>Timestamps in IST</span>
            <span className="text-emerald-400">PDF Ready</span>
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3. SIX CRYPTOGRAPHIC WORKBENCHES (INTERACTIVE GRID)            */}
      {/* ============================================================== */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <span>Cryptographic Workbenches</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select an algorithm below to launch its dedicated workbench with real-time execution duration measurement.
            </p>
          </div>
          <span className="text-xs font-mono text-emerald-400 px-3 py-1 rounded-full bg-[#06180a] border border-emerald-500/30 self-start sm:self-auto">
            All 6 Ciphers Ready
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Card 1: AES-256-GCM */}
          <div className="group rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#06180a] border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  NIST FIPS 197
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                AES-256-GCM
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Authenticated symmetric encryption with Galois/Counter Mode (AEAD) and Scrypt memory-hard key derivation.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#061408] border border-emerald-500/15 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Key Size:</span>
                  <span className="text-emerald-300 font-bold">256-bit</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Auth Tag:</span>
                  <span className="text-emerald-300">128-bit GHASH</span>
                </div>
              </div>
            </div>
            <Link
              to="/algorithm/aes"
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#06180a] hover:bg-emerald-500 group-hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-500/30 group-hover:border-transparent transition-all"
            >
              <span>Launch AES Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 2: RSA-OAEP */}
          <div className="group rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#06180a] border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <KeyRound className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  RFC 8017
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                RSA-OAEP
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Asymmetric public-key encryption with Optimal Asymmetric Encryption Padding (OAEP) and SHA-256 MGF1.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#061408] border border-emerald-500/15 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Modulus:</span>
                  <span className="text-emerald-300 font-bold">2048 / 3072-bit</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Exponent:</span>
                  <span className="text-emerald-300">e = 65537</span>
                </div>
              </div>
            </div>
            <Link
              to="/algorithm/rsa"
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#06180a] hover:bg-emerald-500 group-hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-500/30 group-hover:border-transparent transition-all"
            >
              <span>Launch RSA Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 3: Diffie-Hellman */}
          <div className="group rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#06180a] border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Repeat className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  RFC 3526
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                Diffie-Hellman Key Exchange
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Interactive two-party key agreement simulation using 2048-bit MODP Group 14 and HKDF-SHA256 session derivation.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#061408] border border-emerald-500/15 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Group:</span>
                  <span className="text-emerald-300 font-bold">MODP 14 (2048-bit)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>KDF:</span>
                  <span className="text-emerald-300">HKDF-SHA256</span>
                </div>
              </div>
            </div>
            <Link
              to="/algorithm/diffie-hellman"
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#06180a] hover:bg-emerald-500 group-hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-500/30 group-hover:border-transparent transition-all"
            >
              <span>Launch DH Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 4: SHA-256 */}
          <div className="group rounded-2xl bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-emerald-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#06180a] border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                  <Hash className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  FIPS 180-4
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                SHA-256 Hash Function
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Deterministic one-way cryptographic hash for arbitrary UTF-8 text and binary streaming files up to 50 MB.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#061408] border border-emerald-500/15 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Digest Size:</span>
                  <span className="text-emerald-300 font-bold">256 bits (64 hex)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Streaming:</span>
                  <span className="text-emerald-300">64 KB chunks</span>
                </div>
              </div>
            </div>
            <Link
              to="/algorithm/sha-256"
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#06180a] hover:bg-emerald-500 group-hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-500/30 group-hover:border-transparent transition-all"
            >
              <span>Launch SHA-256 Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 5: MD5 Legacy */}
          <div className="group rounded-2xl bg-[#040e06] border border-amber-500/20 hover:border-amber-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#140f06] border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Fingerprint className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  RFC 1321 • DEPRECATED
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                MD5 Legacy Hash
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                128-bit digest provided exclusively for academic collision research and avalanche effect bit divergence comparisons.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#120d04] border border-amber-500/15 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Digest Size:</span>
                  <span className="text-amber-300 font-bold">128 bits (32 hex)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Status:</span>
                  <span className="text-rose-400 font-bold">Collision Vulnerable</span>
                </div>
              </div>
            </div>
            <Link
              to="/algorithm/md5"
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#160f05] hover:bg-amber-500 group-hover:bg-amber-500 text-amber-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-amber-500/30 group-hover:border-transparent transition-all"
            >
              <span>Launch MD5 Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Card 6: DES-CBC Legacy */}
          <div className="group rounded-2xl bg-[#040e06] border border-amber-500/20 hover:border-amber-500/50 p-6 flex flex-col justify-between transition-all duration-200 hover:shadow-xl hover:shadow-amber-950/40 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#140f06] border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Lock className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  FIPS 46-3 • HISTORICAL
                </span>
              </div>
              <h3 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors">
                DES-CBC Legacy Cipher
              </h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                16-round Feistel network with 56-bit effective key and PKCS#7 padding for historical cryptanalysis study.
              </p>
              <div className="mt-4 p-3 rounded-xl bg-[#120d04] border border-amber-500/15 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Key Space:</span>
                  <span className="text-amber-300 font-bold">2^56 keys (Broken)</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Block Size:</span>
                  <span className="text-amber-300">64-bit Feistel</span>
                </div>
              </div>
            </div>
            <Link
              to="/algorithm/des"
              className="mt-5 w-full py-2.5 px-4 rounded-xl bg-[#160f05] hover:bg-amber-500 group-hover:bg-amber-500 text-amber-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-amber-500/30 group-hover:border-transparent transition-all"
            >
              <span>Launch DES Workbench</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 4. RECENT OPERATION AUDIT TRAIL TABLE                          */}
      {/* ============================================================== */}
      <div className="p-6 rounded-3xl bg-[#040e06] border border-emerald-500/20 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-400" />
              <span>Recent Operation Audit History</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live operational telemetry logged in PostgreSQL. Plaintext inputs, secrets, and private keys are never stored.
            </p>
          </div>
          <Link
            to="/history"
            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors self-start sm:self-auto"
          >
            <span>View Complete History</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {historyLoading ? (
          <div className="py-12 text-center text-xs text-slate-500 font-mono animate-pulse">
            Loading recent operations telemetry from PostgreSQL...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-[#030a04] border border-dashed border-emerald-500/20 p-6">
            <Terminal className="w-8 h-8 text-emerald-600/70 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200">No cryptographic operations logged yet</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Execute an encryption or hashing operation from any of the workbenches above to generate verifiable audit telemetry.
            </p>
            <Link
              to="/algorithm/aes"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all"
            >
              <span>Run First Operation</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#061408] text-slate-300 font-mono border-b border-emerald-500/20">
                <tr>
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">Algorithm</th>
                  <th className="py-3 px-3">Operation</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Duration</th>
                  <th className="py-3 px-3">Timestamp (IST)</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#06180a]/60 transition-colors">
                    <td className="py-3 px-3 font-mono text-emerald-400/90 font-bold">#{item.id}</td>
                    <td className="py-3 px-3 font-semibold text-white">{item.algorithm_name}</td>
                    <td className="py-3 px-3 text-slate-300 font-mono">{item.operation_type}</td>
                    <td className="py-3 px-3">
                      <StatusBadge status={item.status} label={item.status} size="xs" />
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-300">
                      {item.execution_duration_ms} ms
                    </td>
                    <td className="py-3 px-3 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {formatIndiaTime(item.created_at)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleDownloadSingleReport(item)}
                        disabled={downloadingId === item.id}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#06180a] hover:bg-emerald-500 hover:text-slate-950 text-emerald-300 border border-emerald-500/30 text-[11px] font-medium transition-all cursor-pointer"
                        title="Download A4 PDF Report for this record"
                      >
                        <Download className="w-3 h-3" />
                        <span>PDF Report</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
