import React, { useState } from 'react';
import { KeyRound, Lock, Unlock, Key, Cpu, Info, Check, ShieldCheck } from 'lucide-react';

export default function RSAPage() {
  const [activeTab, setActiveTab] = useState('encrypt');
  const [keyLength, setKeyLength] = useState('2048');
  const [padding, setPadding] = useState('OAEP');
  const [notice, setNotice] = useState('');

  const handleAction = (e) => {
    e.preventDefault();
    setNotice(
      `Educational Foundation: RSA-${keyLength} with ${padding} padding selected. Asymmetric mathematical key pair calculation and cryptographic execution will be integrated in Phase 2.`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-blue-950/60 border border-blue-500/30 text-blue-400">
              <KeyRound className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              RSA Public-Key Cryptosystem
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            Asymmetric encryption, digital signatures, and secure key encapsulation
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-blue-950/40 text-blue-300 border border-blue-500/30">
            Asymmetric (p · q)
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
            2048 / 4096-bit
          </span>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="rounded-xl border border-blue-500/30 bg-blue-950/20 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-200/90 leading-relaxed">
          <strong className="text-blue-300">Phase 1 Foundation Layout:</strong> This page presents the RSA key management layout, public/private parameter inputs, and digital signature interface. The integer factorization math and prime number generator will be activated in Phase 2.
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
          {/* Tabs */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => { setActiveTab('encrypt'); setNotice(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'encrypt' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Public Key Encryption
            </button>
            <button
              onClick={() => { setActiveTab('decrypt'); setNotice(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'decrypt' ? 'bg-purple-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Private Key Decryption
            </button>
            <button
              onClick={() => { setActiveTab('sign'); setNotice(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'sign' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Digital Signature
            </button>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Key Modulus Length
                </label>
                <select
                  value={keyLength}
                  onChange={(e) => setKeyLength(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="2048">2048 bits (Industry Standard)</option>
                  <option value="3072">3072 bits (High Security)</option>
                  <option value="4096">4096 bits (Maximum Security)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Padding Scheme
                </label>
                <select
                  value={padding}
                  onChange={(e) => setPadding(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="OAEP">OAEP (Optimal Asymmetric Encryption Padding)</option>
                  <option value="PKCS1v15">PKCS#1 v1.5 (Legacy)</option>
                  <option value="PSS">PSS (Probabilistic Signature Scheme)</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300">
                  {activeTab === 'encrypt' ? 'Recipient Public Key (PEM)' : 'Private Key (PEM)'}
                </label>
                <button
                  type="button"
                  onClick={() => alert('Asymmetric key pair generation will run in Phase 2 via backend cryptosystem.')}
                  className="text-[11px] text-blue-400 hover:underline font-mono"
                >
                  Generate Keypair Demo
                </button>
              </div>
              <textarea
                rows={3}
                defaultValue="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3...&#10;-----END PUBLIC KEY-----"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Input Payload
              </label>
              <textarea
                rows={3}
                defaultValue="Secret session key or sensitive contract hash to encrypt with RSA public key."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-950/40 transition-all flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Simulate RSA-{keyLength} Operation</span>
            </button>
          </form>

          {notice && (
            <div className="rounded-lg bg-blue-950/40 border border-blue-500/30 p-3 text-xs text-blue-200">
              {notice}
            </div>
          )}
        </div>

        {/* Math & Specs */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-400" />
              <span>RSA Mathematics</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                <span><strong>Prime Generation:</strong> Select two large primes p and q</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                <span><strong>Modulus:</strong> n = p × q, Euler's totient φ(n) = (p-1)(q-1)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                <span><strong>Public Exponent:</strong> e = 65537 (standard coprime)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1 shrink-0"></span>
                <span><strong>Private Exponent:</strong> d ≡ e⁻¹ (mod φ(n))</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-slate-900/40">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Implementation Roadmap
            </h4>
            <div className="space-y-2 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Frontend Layout Ready
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> PKCS PEM Layout Ready
              </div>
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Phase 2: RSA Engine Hook
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
