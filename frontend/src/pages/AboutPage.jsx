import React from 'react';
import { Info, Shield, Layers, Database, Server, Code2, Terminal, CheckCircle2, Lock } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
            <Info className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
            About SecureCipher
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 m-0">
          College Mini-Project: Multi-Algorithm Cryptography and Secure Data Protection System
        </p>
      </div>

      {/* Overview Card */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white m-0">Project Purpose & Academic Scope</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
          <strong>SecureCipher</strong> is engineered as a full-stack cryptographic laboratory designed to bridge the gap between theoretical cryptography and real-world implementation. The system compares modern enterprise-grade security primitives against historical and legacy algorithms, emphasizing security-by-design standards: zero plaintext persistence, zero key leakage, and end-to-end audit tracking.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-bold text-purple-300 mb-1 flex items-center gap-1.5 m-0">
              <Shield className="w-4 h-4 text-purple-400" />
              Symmetric Protection
            </h3>
            <p className="text-[11px] text-slate-400 m-0">
              Comparative analysis of modern AES (128/192/256-bit with CBC/GCM modes) vs. legacy DES (56-bit Feistel network).
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5 m-0">
              <Lock className="w-4 h-4 text-blue-400" />
              Asymmetric & Exchange
            </h3>
            <p className="text-[11px] text-slate-400 m-0">
              Public-key infrastructure via RSA (2048/4096-bit OAEP/PSS) alongside Diffie-Hellman forward-secrecy key agreement.
            </p>
          </div>

          <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
            <h3 className="text-xs font-bold text-emerald-300 mb-1 flex items-center gap-1.5 m-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Integrity Verification
            </h3>
            <p className="text-[11px] text-slate-400 m-0">
              Cryptographic integrity validation using NIST SHA-256 vs. historical MD5 collision vulnerability studies.
            </p>
          </div>
        </div>
      </div>

      {/* Technology Stack Specifications */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white m-0">Full-Stack Architecture & Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend Stack */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono m-0">
              Frontend Client Layer
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">React 18 / 19</span>
                <span className="font-mono text-purple-300 text-[11px]">Component Framework</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">Vite</span>
                <span className="font-mono text-purple-300 text-[11px]">Build Tool & Dev Server</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">Tailwind CSS</span>
                <span className="font-mono text-purple-300 text-[11px]">Dark Navy Design System</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">React Router v7</span>
                <span className="font-mono text-purple-300 text-[11px]">Client-Side Routing</span>
              </li>
            </ul>
          </div>

          {/* Backend Stack */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider font-mono m-0">
              Backend & Persistence Layer
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">FastAPI</span>
                <span className="font-mono text-blue-300 text-[11px]">Asynchronous Python REST API</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">Uvicorn</span>
                <span className="font-mono text-blue-300 text-[11px]">ASGI Web Server</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">SQLAlchemy 2.x</span>
                <span className="font-mono text-blue-300 text-[11px]">Modern Declarative ORM</span>
              </li>
              <li className="flex items-center justify-between p-2 rounded bg-slate-900/60 border border-slate-800">
                <span className="font-semibold text-white">Psycopg 3 & PostgreSQL</span>
                <span className="font-mono text-blue-300 text-[11px]">Relational Persistence</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* PostgreSQL Local Setup Guide */}
      <div className="glass-panel rounded-xl p-6 border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
          <Database className="w-5 h-5 text-purple-400" />
          <span>Local PostgreSQL Windows Setup Instructions</span>
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed m-0">
          To connect the local Windows PostgreSQL instance to SecureCipher, create the designated database user and database:
        </p>

        <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
          <div className="text-slate-400"># 1. Open psql as the postgres administrator</div>
          <div className="text-purple-300 bg-black/60 p-2 rounded">
            psql -U postgres
          </div>

          <div className="text-slate-400"># 2. Execute SQL setup script</div>
          <div className="text-emerald-300 bg-black/60 p-2.5 rounded space-y-1">
            <div>CREATE USER securecipher_user WITH PASSWORD 'YourStrongPasswordHere';</div>
            <div>CREATE DATABASE securecipher_db OWNER securecipher_user;</div>
            <div>GRANT ALL PRIVILEGES ON DATABASE securecipher_db TO securecipher_user;</div>
          </div>

          <div className="text-slate-400"># 3. Create backend/.env with your chosen password</div>
          <div className="text-blue-300 bg-black/60 p-2 rounded break-all">
            DATABASE_URL="postgresql+psycopg://securecipher_user:YourStrongPasswordHere@localhost:5432/securecipher_db"
          </div>

          <div className="text-slate-400"># 4. Initialize database tables</div>
          <div className="text-purple-300 bg-black/60 p-2 rounded">
            python -m app.db.init_db
          </div>
        </div>
      </div>
    </div>
  );
}
