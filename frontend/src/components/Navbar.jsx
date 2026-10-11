import React from 'react';
import { ShieldCheck, RefreshCw, Database, Activity, Menu } from 'lucide-react';
import StatusBadge from './StatusBadge';

const GithubIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
  </svg>
);


export default function Navbar({
  backendHealth,
  dbHealth,
  onRefresh,
  isRefreshing,
  onToggleSidebar,
}) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-800 bg-[#0B0F19]/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 p-0.5 shadow-lg shadow-purple-900/30 flex items-center justify-center">
            <div className="w-full h-full bg-slate-950 rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <div>
            <span className="font-bold tracking-tight text-white text-base">
              Secure<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">Cipher</span>
            </span>
            <span className="hidden sm:inline-block ml-2 text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300">
              Mini-Project
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        {/* Backend Status Telemetry */}
        <div className="hidden sm:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-xs text-slate-400">API:</span>
          <StatusBadge
            status={backendHealth?.connected ? 'connected' : 'offline'}
            label={backendHealth?.connected ? `Live (${backendHealth?.latency || 0}ms)` : 'Offline'}
            size="xs"
          />
        </div>

        {/* Database Status Telemetry */}
        <div className="hidden md:flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
          <Database className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs text-slate-400">PostgreSQL:</span>
          <StatusBadge
            status={dbHealth?.connected ? 'connected' : dbHealth?.status === 'unconfigured' ? 'unconfigured' : 'disconnected'}
            label={
              dbHealth?.connected
                ? `Connected (${dbHealth.database || 'securecipher_db'})`
                : dbHealth?.status === 'unconfigured'
                ? 'Unconfigured (.env)'
                : 'Disconnected'
            }
            size="xs"
          />
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh Backend & Database Health"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-purple-400' : ''}`} />
        </button>

        {/* GitHub Link */}
        <a
          href="https://github.com/AjayKumarKR07/SecureCipher"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white hover:border-purple-500/40 transition-colors"
        >
          <GithubIcon className="w-3.5 h-3.5 text-slate-400" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}
