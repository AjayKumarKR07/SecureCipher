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
    <div className="rounded-2xl p-6 flex flex-col justify-between bg-[#040e06] border border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-xl hover:shadow-emerald-950/40 relative overflow-hidden group transition-all duration-200">
      {/* Decorative gradient corner glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-emerald-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none transition-all group-hover:from-emerald-500/20" />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-[#06180a] border border-emerald-500/40 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shadow-md">
            <IconComponent className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full border bg-emerald-950/60 text-emerald-300 border-emerald-500/30">
            {algorithm.category}
          </span>
        </div>

        <h3 className="text-base font-bold text-white tracking-tight mb-1 group-hover:text-emerald-300 transition-colors">
          {algorithm.name}
        </h3>

        <p className="text-xs text-slate-400 mb-4 line-clamp-2 leading-relaxed">
          {algorithm.purpose}
        </p>

        <div className="bg-[#061408] rounded-xl p-3 mb-4 border border-emerald-500/15 text-[11px] font-mono space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span>Key / Block:</span>
            <span className="text-emerald-300 font-bold">{algorithm.key_size_info}</span>
          </div>
          <div className="flex items-center justify-between text-slate-400">
            <span>Spec Status:</span>
            {algorithm.id === 'aes' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active (GCM)
              </span>
            ) : algorithm.id === 'rsa' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active (OAEP)
              </span>
            ) : algorithm.id === 'diffie-hellman' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active (MODP)
              </span>
            ) : algorithm.id === 'sha-256' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active (SHA-256)
              </span>
            ) : algorithm.id === 'md5' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                MD5 Legacy
              </span>
            ) : algorithm.id === 'des' ? (
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                DES Feistel
              </span>
            ) : (
              <span className="text-emerald-400 font-medium">Ready</span>
            )}
          </div>
        </div>
      </div>

      <Link
        to={algorithm.workbench_path}
        className="w-full py-2.5 px-4 rounded-xl bg-[#06180a] hover:bg-emerald-500 group-hover:bg-emerald-500 text-emerald-300 hover:text-slate-950 group-hover:text-slate-950 font-semibold text-xs flex items-center justify-center gap-2 border border-emerald-500/30 group-hover:border-transparent transition-all cursor-pointer shadow-sm"
      >
        <span>Launch Workbench</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
