import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldAlert,
  Server,
  Database,
  Cpu,
  History,
  Info,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Terminal,
} from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import AlgorithmCard from '../components/AlgorithmCard';
import { fetchAlgorithms, fetchHistory } from '../services/api';

export default function Dashboard({ backendHealth, dbHealth, onRefresh }) {
  const [algorithms, setAlgorithms] = useState([]);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [dbStatusMsg, setDbStatusMsg] = useState('');

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
          setDbStatusMsg(histData.message || '');
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

  return (
    <div className="space-y-8">
      {/* Hero / Overview Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 border border-slate-800 bg-gradient-to-r from-slate-900/90 via-[#11162B]/80 to-purple-950/30">
        <div className="max-w-3xl relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/80 border border-purple-500/30 text-purple-300 text-xs font-mono mb-4">
            <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
            College Mini-Project Foundation | v0.1.0
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Multi-Algorithm Cryptography & Secure Data Protection System
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-6">
            <strong className="text-purple-300">SecureCipher</strong> provides a unified cybersecurity platform exploring symmetric encryption, asymmetric key pairs, key agreement handshakes, and hashing paradigms. Designed with security-by-design standards: zero key persistence, zero plaintext logging, and modular architecture.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              to="/algorithm/aes"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs sm:text-sm font-semibold shadow-md shadow-purple-950/50 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Explore Algorithms</span>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium border border-slate-700 transition-all"
            >
              <Info className="w-4 h-4" />
              <span>System Specs</span>
            </Link>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Real-Time System Health Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Backend Status */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">FastAPI Backend</span>
            <Server className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <StatusBadge
              status={backendHealth?.connected ? 'connected' : 'offline'}
              label={backendHealth?.connected ? 'Online (200 OK)' : 'Offline / Starting'}
            />
            {backendHealth?.latency && (
              <span className="text-[11px] font-mono text-slate-400">{backendHealth.latency} ms</span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            Uvicorn Port: 8000
          </p>
        </div>

        {/* PostgreSQL Status */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">PostgreSQL Database</span>
            <Database className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline justify-between">
            <StatusBadge
              status={dbHealth?.connected ? 'connected' : dbHealth?.status === 'unconfigured' ? 'unconfigured' : 'disconnected'}
              label={
                dbHealth?.connected
                  ? 'Connected'
                  : dbHealth?.status === 'unconfigured'
                  ? 'Awaiting .env'
                  : 'Unreachable'
              }
            />
            {dbHealth?.latency_ms && (
              <span className="text-[11px] font-mono text-slate-400">{dbHealth.latency_ms} ms</span>
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono truncate">
            {dbHealth?.database ? `DB: ${dbHealth.database}` : 'localhost:5432 / securecipher_db'}
          </p>
        </div>

        {/* Cryptography Registry */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Algorithms Suite</span>
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white">6 Registered</div>
          <p className="mt-2 text-[11px] text-slate-400 font-mono">
            Symmetric, Asymmetric, Hash
          </p>
        </div>

        {/* Privacy & Audit Status */}
        <div className="glass-panel rounded-xl p-4 border border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Operation Audit</span>
            <History className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">{historyItems.length} Logged</div>
          <p className="mt-2 text-[11px] text-emerald-400 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Zero Secret Storage
          </p>
        </div>
      </div>

      {/* PostgreSQL Configuration Helper Callout (if disconnected or unconfigured) */}
      {!dbHealth?.connected && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-amber-200">
                PostgreSQL Status Notice
              </h4>
              <p className="text-xs text-amber-300/80 mt-1">
                The backend is running, but database connectivity is awaiting configuration.
                {dbHealth?.message ? ` (${dbHealth.message})` : ''}
              </p>
              <div className="mt-2 font-mono text-[11px] text-amber-200/90 bg-black/40 p-2 rounded border border-amber-900/50">
                DATABASE_URL="postgresql+psycopg://securecipher_user:your_password@localhost:5432/securecipher_db"
              </div>
            </div>
          </div>
          <Link
            to="/about"
            className="shrink-0 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-colors"
          >
            View DB Setup Guide
          </Link>
        </div>
      )}

      {/* Six Algorithms Section */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Cryptographic Algorithms</h2>
            <p className="text-xs text-slate-400">
              Six foundational ciphers, key agreements, and cryptographic hash functions.
            </p>
          </div>
          <span className="text-xs font-mono text-purple-400 px-2.5 py-1 rounded bg-purple-950/40 border border-purple-800/40 self-start sm:self-auto">
            Engine Status: All 6 Algorithms Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {algorithms.map((algo) => (
            <AlgorithmCard key={algo.id} algorithm={algo} />
          ))}
        </div>
      </div>

      {/* Recent Operation History Section */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" />
              <span>Recent Operation History</span>
            </h3>
            <p className="text-xs text-slate-400">
              Audit logs of cryptographic executions. Plaintext payloads and keys are strictly omitted.
            </p>
          </div>
          <Link
            to="/history"
            className="text-xs text-purple-400 hover:text-purple-300 inline-flex items-center gap-1 font-medium"
          >
            <span>Full History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {historyLoading ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">
            Loading recent operations telemetry...
          </div>
        ) : historyItems.length === 0 ? (
          <div className="py-10 text-center rounded-lg bg-slate-900/50 border border-dashed border-slate-800">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-300">No operations recorded yet</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto mt-1">
              Cryptographic operations executed from the upcoming algorithm modules will record execution time, algorithm name, and status here.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[11px] text-slate-400 font-mono">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span>Schema: ID, Algorithm, OpType, Status, Duration, Timestamp</span>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-2 px-3">ID</th>
                  <th className="py-2 px-3">Algorithm</th>
                  <th className="py-2 px-3">Operation</th>
                  <th className="py-2 px-3">Status</th>
                  <th className="py-2 px-3">Duration</th>
                  <th className="py-2 px-3">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {historyItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-mono text-slate-400">#{item.id}</td>
                    <td className="py-2.5 px-3 font-semibold text-white">{item.algorithm_name}</td>
                    <td className="py-2.5 px-3 text-slate-300">{item.operation_type}</td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={item.status} label={item.status} size="xs" />
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-400">{item.execution_duration_ms} ms</td>
                    <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Project Scope & Architecture Card */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800">
        <h3 className="text-base font-bold text-white mb-2">Project Architecture & Security Principles</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-purple-300 mb-1">1. Zero Key Persistence</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              No secret keys, initialization vectors (IVs), or private keys are ever stored in the PostgreSQL database or persistent caches.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-blue-300 mb-1">2. Decoupled Architecture</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              FastAPI backend provides RESTful endpoints with SQLAlchemy 2.x and Psycopg 3, completely decoupled from the React frontend.
            </p>
          </div>
          <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <h4 className="font-semibold text-emerald-300 mb-1">3. Educational & Comparative</h4>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Includes both modern ciphers (AES, RSA, SHA-256) and historical reference algorithms (DES, MD5) for rigorous cryptanalysis comparison.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
