import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

export default function Layout({
  children,
  backendHealth,
  dbHealth,
  onRefresh,
  isRefreshing,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  // Full-screen cyber experience for login/register, or for public landing page when unauthenticated
  const isCyberPage =
    ['/login', '/register'].includes(location.pathname) ||
    (location.pathname === '/' && !user);

  if (isCyberPage) {
    return (
      <div className="min-h-screen bg-[#030704] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030704] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <Navbar
          backendHealth={backendHealth}
          dbHealth={dbHealth}
          onRefresh={onRefresh}
          isRefreshing={isRefreshing}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>

        <footer className="border-t border-emerald-500/15 py-4 px-6 text-center text-xs text-slate-400 bg-[#030704]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span className="text-slate-400">SecureCipher – Multi-Algorithm Cryptography & Secure Data Protection System</span>
            <span className="font-mono text-[11px] text-emerald-400/80">
              B.Tech ISE Capstone | React 19 + FastAPI + PostgreSQL
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
