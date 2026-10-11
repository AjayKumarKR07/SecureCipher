import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, KeyRound, Repeat, Hash, Fingerprint, Lock, ArrowRight } from 'lucide-react';

const iconMap = {
  aes: Shield,
  rsa: KeyRound,
  'diffie-hellman': Repeat,
  'sha-256': Hash,
  md5: Fingerprint,
  des: Lock,
};

export default function AlgorithmCard({ algorithm }) {
  const IconComponent = iconMap[algorithm.id] || Shield;

  const isLegacy = algorithm.id === 'md5' || algorithm.id === 'des';

  return (
    <div className="glass-panel glass-card-hover rounded-xl p-5 flex flex-col justify-between border border-slate-800 hover:border-purple-500/40 relative overflow-hidden group">
      {/* Decorative gradient corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-purple-600/10 via-blue-500/5 to-transparent rounded-bl-full pointer-events-none transition-all group-hover:from-purple-600/20" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-700/60 text-purple-400 group-hover:text-purple-300 group-hover:border-purple-500/40 transition-colors">
            <IconComponent className="w-5 h-5" />
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
              isLegacy
                ? 'bg-amber-950/40 text-amber-300 border-amber-600/30'
                : 'bg-indigo-950/40 text-indigo-300 border-indigo-600/30'
            }`}
          >
            {algorithm.category}
          </span>
        </div>

        <h3 className="text-base font-semibold text-white tracking-tight mb-1 group-hover:text-purple-200 transition-colors">
          {algorithm.name}
        </h3>

        <p className="text-xs text-slate-400 mb-3 line-clamp-2">
          {algorithm.purpose}
        </p>

        <div className="bg-slate-900/60 rounded-lg p-2.5 mb-4 border border-slate-800/80">
          <div className="text-[11px] text-slate-400 flex items-center justify-between mb-1">
            <span className="text-slate-400">Key / Block:</span>
            <span className="font-mono text-purple-300 font-medium">{algorithm.key_size_info}</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-slate-400">Spec Status:</span>
            {algorithm.id === 'aes' ? (
              <span className="text-emerald-400 font-medium font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle"></span>
                Active (GCM)
              </span>
            ) : (
              <span className="text-blue-400 font-medium">Layout Ready</span>
            )}
          </div>

        </div>

        <ul className="space-y-1 mb-4">
          {algorithm.features.slice(0, 2).map((feat, idx) => (
            <li key={idx} className="text-xs text-slate-400 flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-purple-400"></span>
              <span className="truncate">{feat}</span>
            </li>
          ))}
        </ul>
      </div>

      <Link
        to={`/algorithm/${algorithm.id}`}
        className="mt-2 inline-flex items-center justify-between w-full px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-purple-600 hover:text-white rounded-lg border border-slate-700/80 hover:border-purple-500 transition-all group/btn"
      >
        <span>Explore Architecture</span>
        <ArrowRight className="w-3.5 h-3.5 transform group-hover/btn:translate-x-0.5 transition-transform" />
      </Link>
    </div>
  );
}
