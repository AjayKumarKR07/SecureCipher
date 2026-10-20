import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  RefreshCw,
  Database,
  Activity,
  Menu,
  User,
  LogOut,
  Bell,
  Settings,
  Lock,
  ChevronDown,
} from 'lucide-react';
import StatusBadge from './StatusBadge';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

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
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-emerald-500/15 bg-[#030804]/90 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#06180a] focus:outline-none focus:ring-1 focus:ring-emerald-400/40 min-w-[38px] min-h-[38px] flex items-center justify-center cursor-pointer shrink-0"
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu className="w-5 h-5 text-emerald-400" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2 group min-w-0">
          <div className="relative w-8 h-8 rounded-xl bg-[#06180a] border border-emerald-500/40 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/40 group-hover:border-emerald-400 transition-all shrink-0">
            <div className="w-full h-full bg-[#030a04] rounded-[9px] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping opacity-75" />
          </div>
          <span className="font-extrabold tracking-tight text-white text-sm sm:text-base flex items-center gap-0.5 truncate">
            Secure<span className="text-emerald-400">Cipher</span>
          </span>
          <span className="hidden md:inline-block ml-1 text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-bold shrink-0">
            Dashboard
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Backend Status Telemetry */}
        <div className="hidden sm:flex items-center gap-2 bg-[#06180a]/80 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs font-mono">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400">API:</span>
          <StatusBadge
            status={backendHealth?.connected ? 'connected' : 'offline'}
            label={backendHealth?.connected ? `Live (${backendHealth?.latency || 0}ms)` : 'Offline'}
            size="xs"
          />
        </div>

        {/* Database Status Telemetry */}
        <div className="hidden md:flex items-center gap-2 bg-[#06180a]/80 px-3 py-1.5 rounded-xl border border-emerald-500/20 text-xs font-mono">
          <Database className="w-3.5 h-3.5 text-teal-400" />
          <span className="text-slate-400">PostgreSQL:</span>
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
          className="p-2 sm:p-2.5 rounded-xl bg-[#06180a] border border-emerald-500/25 text-emerald-300 hover:text-white hover:border-emerald-400/50 transition-colors disabled:opacity-50 cursor-pointer min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
        </button>

        {/* Notifications Icon */}
        <Link
          to="/profile"
          title="Notifications & Activity"
          className="relative p-2 sm:p-2.5 rounded-xl bg-[#06180a] border border-emerald-500/25 text-emerald-300 hover:text-white hover:border-emerald-400/50 transition-colors min-w-[36px] min-h-[36px] flex items-center justify-center"
        >
          <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse border-2 border-black" />
          )}
        </Link>

        {/* User Account Dropdown Menu */}
        {user ? (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 bg-[#06180a] hover:bg-[#08220e] border border-emerald-500/30 hover:border-emerald-400 px-2 sm:pl-3 sm:pr-2 py-1.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm min-h-[36px]"
              aria-label="User Account Menu"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-700 flex items-center justify-center text-[10px] font-bold text-slate-950 shrink-0">
                {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline text-emerald-300 font-semibold truncate max-w-[90px]">
                {user.full_name.split(' ')[0]}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-emerald-400/70 transition-transform ${profileDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Dropdown Card */}
            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#040e06] border border-emerald-500/30 shadow-2xl p-2 z-50 text-xs space-y-1 backdrop-blur-xl animate-in fade-in zoom-in-95">
                {/* User Header */}
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
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#06180a] transition-colors"
                >
                  <User className="w-4 h-4 text-emerald-400" />
                  <span>Account Settings</span>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#06180a] transition-colors"
                >
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>Change Password</span>
                </Link>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-[#06180a] transition-colors"
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
                      navigate('/');
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
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06180a] border border-emerald-500/40 text-xs font-semibold text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
          >
            <User className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        )}

        {/* GitHub Link */}
        <a
          href="https://github.com/AjayKumarKR07/SecureCipher"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#06180a] border border-emerald-500/25 text-xs text-emerald-300 hover:text-white hover:border-emerald-400/50 transition-colors"
        >
          <GithubIcon className="w-3.5 h-3.5 text-emerald-400" />
          <span>GitHub</span>
        </a>
      </div>
    </header>
  );
}
