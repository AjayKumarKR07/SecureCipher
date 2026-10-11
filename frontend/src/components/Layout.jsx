import React, { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function Layout({
  children,
  backendHealth,
  dbHealth,
  onRefresh,
  isRefreshing,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col">
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

        <footer className="border-t border-slate-800/80 py-4 px-6 text-center text-xs text-slate-400 bg-[#0B0F19]">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>SecureCipher – Multi-Algorithm Cryptography & Secure Data Protection System</span>
            <span className="font-mono text-[11px] text-slate-400">
              College Mini-Project | React + FastAPI + PostgreSQL
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
