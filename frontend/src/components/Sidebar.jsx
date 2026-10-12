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
  Server,
  User,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { type: 'header', label: 'Symmetric & Asymmetric' },
  { name: 'AES Encryption', path: '/algorithm/aes', icon: Shield },
  { name: 'RSA Encryption', path: '/algorithm/rsa', icon: KeyRound },
  { name: 'Diffie-Hellman', path: '/algorithm/diffie-hellman', icon: Repeat },
  { type: 'header', label: 'Hashing & Legacy' },
  { name: 'SHA-256 Hash', path: '/algorithm/sha-256', icon: Hash },
  { name: 'MD5 Legacy Hash', path: '/algorithm/md5', icon: Fingerprint },
  { name: 'DES Legacy Cipher', path: '/algorithm/des', icon: Lock },
  { type: 'header', label: 'Audit & Info' },
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
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#0D121F] border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 border-b border-slate-800 px-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
              <Server className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white m-0">SecureCipher</h1>
              <p className="text-[10px] text-slate-400 font-mono m-0">College Mini-Project</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
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
                  className="pt-4 pb-1 px-3 text-[10px] font-semibold tracking-wider text-slate-400 uppercase font-mono"
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
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-purple-900/40 text-purple-200 border border-purple-500/40 shadow-sm shadow-purple-950'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
                    <span>{item.name}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Footer info box */}
        <div className="p-4 border-t border-slate-800 bg-[#0B0F19]/60">
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800/80">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-slate-400">Architecture:</span>
              <span className="text-purple-300 font-mono font-medium">FastAPI + Vite</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Version:</span>
              <span className="text-blue-300 font-mono">v0.1.0 Foundation</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
