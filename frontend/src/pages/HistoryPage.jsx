import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, RefreshCw, Database, Terminal, Filter } from 'lucide-react';
import StatusBadge from '../components/StatusBadge';
import { fetchHistory } from '../services/api';

export default function HistoryPage({ dbHealth }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAlgo, setFilterAlgo] = useState('ALL');
  const [statusMessage, setStatusMessage] = useState('');

  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchHistory(50);
      setItems(data.items || []);
      setStatusMessage(data.message || '');
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const filteredItems = items.filter((item) => {
    if (filterAlgo === 'ALL') return true;
    return item.algorithm_name?.toUpperCase().includes(filterAlgo.toUpperCase());
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              Operation Audit History
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            Audit logging of cryptographic execution metadata in PostgreSQL
          </p>
        </div>

        <button
          onClick={loadHistory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-medium self-start sm:self-auto transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      {/* Security Guarantee Banner */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200/90 leading-relaxed">
          <strong className="text-emerald-300">Privacy & Security Guarantee:</strong> In compliance with security standards, the operation history database strictly records only execution audit metadata (Algorithm Name, Operation Type, Execution Duration, Status, Timestamp). Plaintext messages, file contents, passwords, private keys, and symmetric keys are <span className="underline font-semibold">never stored</span>.
        </div>
      </div>

      {/* Database Connectivity Status Notice */}
      <div className="glass-panel rounded-xl p-4 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-purple-400" />
          <div>
            <div className="text-xs font-semibold text-white">PostgreSQL Backend Connection</div>
            <div className="text-[11px] text-slate-400">
              Host: localhost:5432 | DB: securecipher_db | User: securecipher_user
            </div>
          </div>
        </div>
        <div>
          <StatusBadge
            status={dbHealth?.connected ? 'connected' : dbHealth?.status === 'unconfigured' ? 'unconfigured' : 'disconnected'}
            label={
              dbHealth?.connected
                ? 'Connected & Verified'
                : dbHealth?.status === 'unconfigured'
                ? 'Awaiting .env Config'
                : 'Disconnected'
            }
          />
        </div>
      </div>

      {/* Filters & Table */}
      <div className="glass-panel rounded-xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-medium text-slate-300">Filter Algorithm:</span>
            <select
              value={filterAlgo}
              onChange={(e) => setFilterAlgo(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Algorithms</option>
              <option value="AES">AES</option>
              <option value="RSA">RSA</option>
              <option value="DIFFIE-HELLMAN">Diffie-Hellman</option>
              <option value="SHA-256">SHA-256</option>
              <option value="MD5">MD5</option>
              <option value="DES">DES</option>
            </select>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            Showing {filteredItems.length} records
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500 animate-pulse">
            Querying PostgreSQL operation history...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-14 text-center">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-300">Audit Trail is Currently Empty</p>
            <p className="text-[11px] text-slate-500 max-w-sm mx-auto mt-1">
              {statusMessage || 'No cryptographic executions have been run yet. Once Phase 2 algorithm execution is active, execution durations and timestamps will be logged here.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-4">Algorithm</th>
                  <th className="py-3 px-4">Operation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-purple-400 font-semibold">#{item.id}</td>
                    <td className="py-3 px-4 font-medium text-white">{item.algorithm_name}</td>
                    <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{item.operation_type}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} label={item.status} size="xs" />
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">{item.execution_duration_ms} ms</td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {new Date(item.created_at).toISOString()}
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
