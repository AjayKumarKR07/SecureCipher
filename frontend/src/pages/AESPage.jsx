import React, { useState } from 'react';
import { Shield, Key, FileText, Lock, Unlock, Cpu, AlertCircle, Info, Check } from 'lucide-react';

export default function AESPage() {
  const [activeTab, setActiveTab] = useState('encrypt');
  const [keySize, setKeySize] = useState('256');
  const [cipherMode, setCipherMode] = useState('GCM');
  const [inputText, setInputText] = useState('Confidential message requiring military-grade AES encryption.');
  const [notice, setNotice] = useState('');

  const handleAction = (e) => {
    e.preventDefault();
    setNotice(
      `Educational Foundation: ${activeTab === 'encrypt' ? 'Encryption' : 'Decryption'} pipeline triggered with AES-${keySize} in ${cipherMode} mode. The underlying cryptographic computation engine will be activated in the next development phase.`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/30 text-purple-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              AES Encryption (Advanced Encryption Standard)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            FIPS 197 Standard | Symmetric block cipher operating on 128-bit blocks
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            NIST Standard
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
            Symmetric 128/192/256
          </span>
        </div>
      </div>

      {/* Educational Foundation Notice Banner */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-200/90 leading-relaxed">
          <strong className="text-purple-300">Phase 1 Foundation Layout:</strong> This page establishes the interactive UI layout, parameter controls, and architecture for AES. Cryptographic transformations (SubBytes, ShiftRows, MixColumns, AddRoundKey) and backend cryptographic execution endpoints will be attached in Phase 2.
        </div>
      </div>

      {/* Interactive Layout Mockup */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Configuration & Execution Panel */}
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
          {/* Tabs: Encrypt / Decrypt */}
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => { setActiveTab('encrypt'); setNotice(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'encrypt'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Encrypt Data</span>
            </button>
            <button
              onClick={() => { setActiveTab('decrypt'); setNotice(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'decrypt'
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Decrypt Data</span>
            </button>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            {/* Parameters Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Key Length
                </label>
                <select
                  value={keySize}
                  onChange={(e) => setKeySize(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value="128">AES-128 (10 Rounds)</option>
                  <option value="192">AES-192 (12 Rounds)</option>
                  <option value="256">AES-256 (14 Rounds - Recommended)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Block Cipher Mode
                </label>
                <select
                  value={cipherMode}
                  onChange={(e) => setCipherMode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                >
                  <option value="GCM">GCM (Galois/Counter Mode - Authenticated)</option>
                  <option value="CBC">CBC (Cipher Block Chaining with PKCS#7)</option>
                  <option value="CTR">CTR (Counter Mode - Stream style)</option>
                </select>
              </div>
            </div>

            {/* Secret Key Input Mockup */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Secret Encryption Key (Passphrase or Hex)
              </label>
              <div className="relative">
                <input
                  type="password"
                  defaultValue="master-secret-key-super-secure"
                  placeholder="Enter or generate secret key"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-3 pr-24 py-2 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => alert('Key generator module will be linked during Phase 2 algorithm implementation.')}
                  className="absolute right-1.5 top-1.5 px-2 py-1 rounded bg-slate-800 text-[10px] text-purple-300 hover:bg-slate-700 font-mono"
                >
                  Generate
                </button>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Security Guarantee: Keys remain client/session bound and will never be stored in the database.
              </p>
            </div>

            {/* Payload Input */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                {activeTab === 'encrypt' ? 'Plaintext Payload' : 'Ciphertext (Base64 / Hex)'}
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                placeholder={activeTab === 'encrypt' ? 'Enter message to encrypt...' : 'Paste ciphertext...'}
              />
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-purple-950/40 transition-all flex items-center justify-center gap-2"
            >
              {activeTab === 'encrypt' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>Execute AES-{keySize} {activeTab === 'encrypt' ? 'Encryption' : 'Decryption'} (Preview)</span>
            </button>
          </form>

          {/* Action Feedback Callout */}
          {notice && (
            <div className="rounded-lg bg-blue-950/40 border border-blue-500/30 p-3 text-xs text-blue-200">
              {notice}
            </div>
          )}
        </div>

        {/* Algorithm Technical Specifications Panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>AES Architecture</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0"></span>
                <span><strong>Block Size:</strong> Fixed at 128 bits (16 bytes matrix)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0"></span>
                <span><strong>Key Sizes:</strong> 128 (10 rounds), 192 (12 rounds), 256 (14 rounds)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0"></span>
                <span><strong>Round Transformations:</strong> SubBytes, ShiftRows, MixColumns, AddRoundKey</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1 shrink-0"></span>
                <span><strong>Security:</strong> Quantum resistant against brute-force (AES-256 Grover search security 128-bit)</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-slate-800 bg-slate-900/40">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
              Implementation Roadmap
            </h4>
            <div className="space-y-2 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Frontend Layout Complete
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Parameter Specification Mapped
              </div>
              <div className="flex items-center gap-2 text-amber-300">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Phase 2: PyCryptodome / Cryptography Backend Hook
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
