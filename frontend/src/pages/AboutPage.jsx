import React, { useState } from 'react';
import {
  Info, Shield, Layers, Database, Server, Code2, Terminal,
  CheckCircle2, Lock, Key, Hash, ArrowRight, GitBranch,
  Eye, EyeOff, Cpu, Globe, ShieldCheck, AlertTriangle,
  Zap, RefreshCw, FileText, Users, Activity, BookOpen,
} from 'lucide-react';

const WORKFLOW_STEPS = [
  {
    step: '01',
    icon: Users,
    color: 'emerald',
    title: 'User Authentication',
    desc: 'Users register and log in via JWT-secured endpoints. Passwords are hashed with bcrypt (cost factor 12) before storage — the raw password never persists anywhere in the system.',
  },
  {
    step: '02',
    icon: Globe,
    color: 'teal',
    title: 'Select Algorithm & Input',
    desc: 'From the dashboard, users choose a cryptographic workbench (AES, DES, RSA, Diffie-Hellman, SHA-256, MD5) and provide their plaintext, passphrase, or key material via the browser UI.',
  },
  {
    step: '03',
    icon: Zap,
    color: 'emerald',
    title: 'Secure API Execution',
    desc: 'The React frontend sends the request over HTTP to the FastAPI backend. The backend executes the cryptographic operation entirely in-memory using Python\'s standard library (cryptography, hashlib). No data is logged.',
  },
  {
    step: '04',
    icon: EyeOff,
    color: 'teal',
    title: 'Zero-Knowledge Response',
    desc: 'The result (ciphertext, hash digest, public key, etc.) is returned to the browser. The backend immediately discards all sensitive inputs from memory — plaintext, keys, and passphrases are never written to disk or database.',
  },
  {
    step: '05',
    icon: Activity,
    color: 'emerald',
    title: 'Audit Metadata Logged',
    desc: 'PostgreSQL stores only non-sensitive operational metadata: Algorithm Name, Operation Type, Execution Duration (ms), Status, and Timestamp. This creates a clean audit trail with zero information leakage.',
  },
  {
    step: '06',
    icon: FileText,
    color: 'teal',
    title: 'History & Reporting',
    desc: 'Users can review their operation audit history, filter by algorithm, download PDF reports of individual records or full audit trails, and delete specific records or clear all history permanently.',
  },
];

const ALGORITHMS = [
  {
    name: 'AES-256-GCM',
    category: 'Symmetric Encryption',
    color: 'emerald',
    icon: Shield,
    keySize: '128 / 192 / 256-bit',
    mode: 'CBC / GCM',
    strength: 'Military Grade',
    desc: 'Advanced Encryption Standard in Galois/Counter Mode provides authenticated encryption — simultaneously encrypting and verifying data integrity. Industry standard used by TLS 1.3, AWS, and government classified systems.',
    operations: ['Encrypt Text', 'Decrypt Text', 'Encrypt File', 'Decrypt File'],
  },
  {
    name: 'DES',
    category: 'Legacy Symmetric',
    color: 'amber',
    icon: AlertTriangle,
    keySize: '56-bit',
    mode: 'CBC (Feistel)',
    strength: 'Deprecated',
    desc: 'Data Encryption Standard — a 56-bit Feistel cipher deprecated by NIST in 2005. Included for historical comparison and vulnerability demonstration. Breakable by brute-force in hours with modern hardware.',
    operations: ['Encrypt Text', 'Decrypt Text'],
  },
  {
    name: 'RSA',
    category: 'Asymmetric Encryption',
    color: 'teal',
    icon: Key,
    keySize: '2048 / 4096-bit',
    mode: 'OAEP / PSS',
    strength: 'Enterprise Grade',
    desc: 'Rivest–Shamir–Adleman public-key cryptosystem. Generates mathematically linked key pairs. OAEP padding for encryption, PSS for digital signatures. Powers HTTPS, S/MIME, and PKI infrastructure globally.',
    operations: ['Generate Key Pair', 'Encrypt', 'Decrypt', 'Sign', 'Verify'],
  },
  {
    name: 'Diffie-Hellman',
    category: 'Key Exchange',
    color: 'indigo',
    icon: GitBranch,
    keySize: '2048-bit (DH params)',
    mode: 'FFDHE / ECDH',
    strength: 'Forward Secrecy',
    desc: 'Allows two parties to establish a shared secret over an insecure channel without transmitting the secret itself. Foundation of forward secrecy in TLS. Even if long-term keys are compromised, past sessions remain secure.',
    operations: ['Generate Parameters', 'Derive Shared Secret'],
  },
  {
    name: 'SHA-256',
    category: 'Cryptographic Hash',
    color: 'emerald',
    icon: Hash,
    keySize: 'N/A (keyless)',
    mode: 'Merkle–Damgård',
    strength: 'NIST Standard',
    desc: 'Secure Hash Algorithm 256-bit — part of SHA-2 family standardized by NIST. One-way deterministic function producing a 32-byte digest. Used in Bitcoin, SSL certificates, file integrity verification, and digital signatures.',
    operations: ['Hash Text', 'Hash File', 'Verify Hash'],
  },
  {
    name: 'MD5',
    category: 'Legacy Hash',
    color: 'rose',
    icon: AlertTriangle,
    keySize: 'N/A (keyless)',
    mode: 'Merkle–Damgård',
    strength: 'Cryptographically Broken',
    desc: 'Message Digest 5 — a 128-bit hash function with known collision vulnerabilities since 2004. Included for educational comparison only. MD5 collisions can be computed in seconds; never use for security-critical applications.',
    operations: ['Hash Text', 'Hash File'],
  },
];

const SECURITY_PRINCIPLES = [
  { icon: EyeOff, title: 'Zero Plaintext Persistence', desc: 'Sensitive inputs exist only in volatile RAM during execution. The database never stores plaintext, keys, or passphrases.', color: 'emerald' },
  { icon: ShieldCheck, title: 'Zero Key Leakage', desc: 'Cryptographic keys and derived secrets are discarded immediately after the operation completes. No session caching of key material.', color: 'teal' },
  { icon: Lock, title: 'JWT Authentication', desc: 'All dashboard routes are protected by signed JWT tokens. Unauthenticated requests are rejected before reaching any cryptographic logic.', color: 'emerald' },
  { icon: Database, title: 'Audit-Only Persistence', desc: 'PostgreSQL stores only timing metadata and algorithm identifiers — information with zero cryptographic sensitivity.', color: 'teal' },
  { icon: Cpu, title: 'In-Memory Execution', desc: 'All cryptographic primitives execute in Python standard library with no external cloud calls. Your data never leaves your machine.', color: 'emerald' },
  { icon: RefreshCw, title: 'Real-Time Audit Trail', desc: 'Every operation is timestamped and logged with execution duration for security forensics and performance benchmarking.', color: 'teal' },
];

const colorMap = {
  emerald: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-400', badge: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30' },
  teal:    { border: 'border-teal-500/30',    bg: 'bg-teal-500/10',    text: 'text-teal-400',    badge: 'bg-teal-900/50 text-teal-300 border-teal-500/30' },
  amber:   { border: 'border-amber-500/30',   bg: 'bg-amber-500/10',   text: 'text-amber-400',   badge: 'bg-amber-900/50 text-amber-300 border-amber-500/30' },
  indigo:  { border: 'border-indigo-500/30',  bg: 'bg-indigo-500/10',  text: 'text-indigo-400',  badge: 'bg-indigo-900/50 text-indigo-300 border-indigo-500/30' },
  rose:    { border: 'border-rose-500/30',    bg: 'bg-rose-500/10',    text: 'text-rose-400',    badge: 'bg-rose-900/50 text-rose-300 border-rose-500/30' },
};

export default function AboutPage() {
  const [expandedAlgo, setExpandedAlgo] = useState(null);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="border-b border-emerald-500/20 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="p-2 rounded-lg bg-[#06180a] border border-emerald-500/30 text-emerald-400">
            <Info className="w-5 h-5" />
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
            About SecureCipher
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 m-0">
          Multi-Algorithm Cryptography and Secure Data Protection Platform
        </p>
      </div>

      {/* ── Platform Overview ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-4">
        <h2 className="text-lg font-bold text-white m-0">Platform Overview</h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed m-0">
          <strong>SecureCipher</strong> is a full-stack cryptographic workbench that brings enterprise-grade
          security primitives into a single, unified platform. It enables hands-on exploration of six
          cryptographic algorithms — from modern AES-256-GCM and RSA-4096 to historically significant
          DES and MD5 — with a strict <span className="text-emerald-400 font-semibold">zero-knowledge
          persistence principle</span>: sensitive data exists only in volatile memory during execution
          and is never written to disk or database.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {[
            { icon: Shield, color: 'emerald', title: 'Symmetric Protection', desc: 'AES-256-GCM (authenticated encryption) vs. legacy DES (56-bit Feistel). Real-time encryption, decryption, and file processing.' },
            { icon: Lock,   color: 'teal',    title: 'Asymmetric & Exchange', desc: 'RSA-4096 public-key cryptography and Diffie-Hellman key exchange with forward secrecy guarantees.' },
            { icon: Hash,   color: 'emerald', title: 'Integrity Verification', desc: 'NIST SHA-256 for production hashing vs. MD5 collision demonstration for security awareness.' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className={`p-3.5 rounded-lg bg-[#040e06]/80 border ${colorMap[color].border}`}>
              <h3 className={`text-xs font-bold ${colorMap[color].text} mb-1 flex items-center gap-1.5 m-0`}>
                <Icon className="w-4 h-4" />{title}
              </h3>
              <p className="text-[11px] text-slate-400 m-0">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── How It Works – Workflow Steps ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white m-0">How It Works — End-to-End Workflow</h2>
          <p className="text-xs text-slate-400 mt-1 m-0">
            Six stages from user login to audit-logged cryptographic result
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKFLOW_STEPS.map(({ step, icon: Icon, color, title, desc }) => (
            <div key={step} className={`flex gap-4 p-4 rounded-xl border ${colorMap[color].border} bg-[#040e06]/60`}>
              <div className="flex-shrink-0 flex flex-col items-center gap-1">
                <span className={`text-[10px] font-black font-mono ${colorMap[color].text}`}>{step}</span>
                <span className={`p-2 rounded-lg ${colorMap[color].bg} border ${colorMap[color].border} ${colorMap[color].text}`}>
                  <Icon className="w-4 h-4" />
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white m-0 mb-1">{title}</h3>
                <p className="text-[11px] text-slate-400 leading-relaxed m-0">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Data Flow Diagram */}
        <div className="mt-2 p-4 rounded-xl bg-[#030a04] border border-emerald-500/20">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono mb-3 m-0">
            Request Data Flow
          </h3>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            {[
              { label: 'Browser UI', color: 'text-white bg-[#06180a] border-emerald-500/40' },
              { arrow: true },
              { label: 'React State', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30' },
              { arrow: true },
              { label: 'fetch() API', color: 'text-teal-300 bg-teal-950/40 border-teal-500/30' },
              { arrow: true },
              { label: 'FastAPI Router', color: 'text-white bg-[#06180a] border-emerald-500/40' },
              { arrow: true },
              { label: 'Python Crypto Engine', color: 'text-emerald-300 bg-emerald-950/40 border-emerald-500/30' },
              { arrow: true },
              { label: 'RAM (volatile)', color: 'text-amber-300 bg-amber-950/40 border-amber-500/30' },
              { arrow: true },
              { label: 'Response → Browser', color: 'text-teal-300 bg-teal-950/40 border-teal-500/30' },
            ].map((item, i) =>
              item.arrow
                ? <ArrowRight key={i} className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                : <span key={i} className={`px-2 py-1 rounded border ${item.color}`}>{item.label}</span>
            )}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-500">
            <EyeOff className="w-3 h-3 text-rose-400" />
            <span>Plaintext, keys, and passphrases are <span className="text-rose-400 font-semibold">discarded from RAM</span> immediately after execution — never written to PostgreSQL</span>
          </div>
        </div>
      </div>

      {/* ── Algorithm Reference Cards ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-white m-0">Supported Algorithms — Technical Reference</h2>
          <p className="text-xs text-slate-400 mt-1 m-0">Click any algorithm card to expand details</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ALGORITHMS.map((algo) => {
            const c = colorMap[algo.color];
            const Icon = algo.icon;
            const isOpen = expandedAlgo === algo.name;
            return (
              <div
                key={algo.name}
                onClick={() => setExpandedAlgo(isOpen ? null : algo.name)}
                className={`rounded-xl border ${c.border} bg-[#040e06]/60 cursor-pointer transition-all hover:bg-[#040e06]/90`}
              >
                <div className="p-4 flex items-start gap-3">
                  <span className={`p-2 rounded-lg ${c.bg} border ${c.border} ${c.text} flex-shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-sm font-bold ${c.text}`}>{algo.name}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${c.badge}`}>
                        {algo.strength}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{algo.category}</div>
                    <div className="flex gap-3 mt-1.5 text-[10px] font-mono text-slate-500">
                      <span>Key: <span className="text-slate-300">{algo.keySize}</span></span>
                      <span>Mode: <span className="text-slate-300">{algo.mode}</span></span>
                    </div>
                  </div>
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 border-t border-slate-700/40 pt-3 space-y-3">
                    <p className="text-[11px] text-slate-300 leading-relaxed m-0">{algo.desc}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {algo.operations.map((op) => (
                        <span key={op} className={`text-[10px] px-2 py-0.5 rounded font-mono border ${c.badge}`}>{op}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Security Principles ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-4">
        <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          Security Design Principles
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {SECURITY_PRINCIPLES.map(({ icon: Icon, title, desc, color }) => {
            const c = colorMap[color];
            return (
              <div key={title} className={`p-4 rounded-xl border ${c.border} bg-[#040e06]/60 space-y-2`}>
                <span className={`flex items-center gap-2 ${c.text} font-bold text-xs`}>
                  <Icon className="w-4 h-4" />{title}
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed m-0">{desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Technology Stack ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-4">
        <h2 className="text-lg font-bold text-white m-0">Full-Stack Architecture & Technology Stack</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Frontend */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono m-0">Frontend Client Layer</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {[
                ['React 18 / 19', 'Component Framework'],
                ['Vite', 'Build Tool & Dev Server'],
                ['Tailwind CSS', 'Dark Cyber Design System'],
                ['React Router v7', 'Client-Side SPA Routing'],
                ['Lucide React', 'Icon System'],
                ['jsPDF', 'Client-Side PDF Generation'],
              ].map(([tech, role]) => (
                <li key={tech} className="flex items-center justify-between p-2 rounded bg-[#040e06]/60 border border-emerald-500/20">
                  <span className="font-semibold text-white">{tech}</span>
                  <span className="font-mono text-emerald-300 text-[11px]">{role}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Backend */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-teal-400 uppercase tracking-wider font-mono m-0">Backend & Persistence Layer</h3>
            <ul className="space-y-2 text-xs text-slate-300">
              {[
                ['FastAPI', 'Async Python REST API'],
                ['Uvicorn', 'ASGI Web Server'],
                ['SQLAlchemy 2.x', 'Declarative ORM'],
                ['Psycopg 3', 'PostgreSQL Driver'],
                ['PostgreSQL 15+', 'Relational DB'],
                ['Python cryptography', 'Crypto Primitives'],
              ].map(([tech, role]) => (
                <li key={tech} className="flex items-center justify-between p-2 rounded bg-[#040e06]/60 border border-teal-500/20">
                  <span className="font-semibold text-white">{tech}</span>
                  <span className="font-mono text-teal-300 text-[11px]">{role}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── REST API Endpoints ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-4">
        <h2 className="text-lg font-bold text-white m-0 flex items-center gap-2">
          <Server className="w-5 h-5 text-teal-400" />
          REST API Endpoint Reference
        </h2>
        <div className="overflow-x-auto rounded-lg border border-emerald-500/20">
          <table className="w-full text-xs font-mono">
            <thead className="bg-[#030a04] text-slate-400 border-b border-emerald-500/20">
              <tr>
                <th className="py-2 px-4 text-left">Method</th>
                <th className="py-2 px-4 text-left">Endpoint</th>
                <th className="py-2 px-4 text-left">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {[
                ['POST', '/api/auth/register',        'Register new user account'],
                ['POST', '/api/auth/login',           'Authenticate and receive JWT'],
                ['POST', '/api/aes/encrypt',          'AES-256-GCM text encryption'],
                ['POST', '/api/aes/decrypt',          'AES-256-GCM text decryption'],
                ['POST', '/api/des/encrypt',          'DES-CBC text encryption'],
                ['POST', '/api/des/decrypt',          'DES-CBC text decryption'],
                ['POST', '/api/rsa/generate-keys',    'Generate RSA key pair'],
                ['POST', '/api/rsa/encrypt',          'RSA-OAEP encryption'],
                ['POST', '/api/rsa/sign',             'RSA-PSS digital signature'],
                ['POST', '/api/dh/generate-params',   'Generate DH parameters'],
                ['POST', '/api/dh/derive-secret',     'Derive shared DH secret'],
                ['POST', '/api/sha256/hash-text',     'SHA-256 text hashing'],
                ['POST', '/api/md5/hash-text',        'MD5 text hashing'],
                ['GET',  '/api/history',              'Fetch audit history (max 100)'],
                ['DELETE','/api/history',             'Clear all audit records'],
                ['DELETE','/api/history/{id}',        'Delete single audit record'],
                ['GET',  '/api/health',               'API & database health check'],
              ].map(([method, path, desc]) => (
                <tr key={path} className="hover:bg-slate-800/20">
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      method === 'GET' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-950/40' :
                      method === 'POST' ? 'text-teal-300 border-teal-500/30 bg-teal-950/40' :
                      'text-rose-300 border-rose-500/30 bg-rose-950/40'
                    }`}>{method}</span>
                  </td>
                  <td className="py-2 px-4 text-slate-200">{path}</td>
                  <td className="py-2 px-4 text-slate-400 font-sans">{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PostgreSQL Setup ── */}
      <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 m-0">
          <Database className="w-5 h-5 text-emerald-400" />
          Local PostgreSQL Setup Guide
        </h2>
        <p className="text-xs text-slate-300 leading-relaxed m-0">
          To connect SecureCipher to a local PostgreSQL instance on Windows, run the following SQL commands and configure the <code className="text-emerald-400 bg-[#030a04] px-1 rounded">backend/.env</code> file:
        </p>
        <div className="bg-[#030a04] p-4 rounded-lg border border-emerald-500/20 space-y-3 font-mono text-xs">
          <div className="text-slate-400"># 1. Open psql as the postgres administrator</div>
          <div className="text-emerald-300 bg-black/60 p-2 rounded">psql -U postgres</div>
          <div className="text-slate-400"># 2. Execute SQL setup script</div>
          <div className="text-emerald-300 bg-black/60 p-2.5 rounded space-y-1">
            <div>CREATE USER securecipher_user WITH PASSWORD 'YourStrongPasswordHere';</div>
            <div>CREATE DATABASE securecipher_db OWNER securecipher_user;</div>
            <div>GRANT ALL PRIVILEGES ON DATABASE securecipher_db TO securecipher_user;</div>
          </div>
          <div className="text-slate-400"># 3. Add to backend/.env</div>
          <div className="text-teal-300 bg-black/60 p-2 rounded break-all">
            DATABASE_URL="postgresql+psycopg://securecipher_user:YourStrongPasswordHere@localhost:5432/securecipher_db"
          </div>
          <div className="text-slate-400"># 4. Initialize database tables</div>
          <div className="text-emerald-300 bg-black/60 p-2 rounded">python -m app.db.init_db</div>
          <div className="text-slate-400"># 5. Start the backend server</div>
          <div className="text-emerald-300 bg-black/60 p-2 rounded">uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload</div>
        </div>
      </div>

    </div>
  );
}
