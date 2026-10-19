import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Shield,
  KeyRound,
  Repeat,
  Hash,
  Fingerprint,
  Lock,
  History,
  Info,
  X,
  ShieldCheck,
  User,
  FileCheck,
  PenLine,
  BarChart3,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { type: 'header', label: 'Symmetric & Asymmetric' },
  { name: 'AES Encryption', path: '/algorithm/aes', icon: Shield },
  { name: 'AES File Crypto', path: '/algorithm/aes-file', icon: FileCheck },
  { name: 'RSA Encryption', path: '/algorithm/rsa', icon: KeyRound },
  { name: 'RSA-PSS Signatures', path: '/algorithm/rsa-pss', icon: PenLine },
  { name: 'Diffie-Hellman', path: '/algorithm/diffie-hellman', icon: Repeat },
  { type: 'header', label: 'Hashing & Legacy' },
  { name: 'SHA-256 Hash', path: '/algorithm/sha-256', icon: Hash },
  { name: 'MD5 Legacy Hash', path: '/algorithm/md5', icon: Fingerprint },
  { name: 'DES Legacy Cipher', path: '/algorithm/des', icon: Lock },
  { type: 'header', label: 'Audit & Info' },
  { name: 'Security & Analytics', path: '/analytics', icon: BarChart3 },
  { name: 'Operation History', path: '/history', icon: History },
  { name: 'Profile & Settings', path: '/profile', icon: User },
  { name: 'About & Roadmap', path: '/about', icon: Info },
];

export default function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#030804] border-r border-emerald-500/15 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-emerald-500/15 px-5 flex items-center justify-between bg-[#040e06]/60">
          <div className="flex items-center gap-2.5">
            <div className="relative w-8 h-8 rounded-xl bg-[#06180a] border border-emerald-500/40 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <div className="w-full h-full bg-[#030a04] rounded-[9px] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
            </div>
            <div>
              <h1 className="text-sm font-extrabold tracking-tight text-white m-0 flex items-center gap-1">
                Secure<span className="text-emerald-400">Cipher</span>
              </h1>
              <p className="text-[10px] text-emerald-500/70 font-mono m-0">Enterprise Security Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#06180a]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item, index) => {
            if (item.type === 'header') {
              return (
                <div
                  key={`header-${index}`}
                  className="pt-4 pb-1 px-3 text-[10px] font-bold tracking-wider text-emerald-500/60 uppercase font-mono"
                >
                  {item.label}
                </div>
              );
            }

            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#06180a] text-emerald-300 border border-emerald-500/40 shadow-md shadow-emerald-950/60 font-semibold'
                      : 'text-slate-400 hover:text-emerald-300 hover:bg-[#06180a]/40 border border-transparent'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-emerald-500/15 bg-[#020603]">
          <div className="p-3 rounded-xl bg-[#040e06] border border-emerald-500/20">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">Architecture:</span>
              <span className="text-emerald-300 font-mono font-medium">FastAPI + Vite</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Security:</span>
              <span className="text-emerald-400 font-mono text-[10px] uppercase">Zero-Knowledge</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
