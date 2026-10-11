import React, { useState } from 'react';
import { Lock, Unlock, AlertTriangle, Info, Cpu, Check } from 'lucide-react';

export default function DESPage() {
  const [activeTab, setActiveTab] = useState('encrypt');
  const [desMode, setDesMode] = useState('CBC');
  const [notice, setNotice] = useState('');

  const handleAction = (e) => {
    e.preventDefault();
    setNotice(
      `Educational Foundation: DES ${activeTab} pipeline requested in ${desMode} mode. DES is implemented strictly as a historical pedagogical comparison to demonstrate Feistel networks and small key space vulnerabilities.`
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-orange-950/60 border border-orange-500/30 text-orange-400">
              <Lock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              DES (Data Encryption Standard)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            FIPS 46-3 Historical Block Cipher | 16-round Feistel Network with 56-bit key
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30">
            Deprecated (56-bit)
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-orange-950/40 text-orange-300 border border-orange-500/30">
            Feistel Cipher
          </span>
        </div>
      </div>

      {/* Warning */}
      <div className="rounded-xl border border-rose-500/40 bg-rose-950/20 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="text-xs text-rose-200/90 leading-relaxed">
          <strong className="text-rose-300">Historical Cryptographic Context:</strong> DES was standardized in 1977 but officially withdrawn by NIST in 2005. Its 56-bit key space (2⁵⁶ ≈ 7.2×10¹⁶ keys) can be brute-forced in hours by modern hardware. SecureCipher includes DES to demonstrate the historical evolution towards AES.
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
          <div className="flex rounded-lg bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => { setActiveTab('encrypt'); setNotice(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'encrypt' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Encrypt (DES)
            </button>
            <button
              onClick={() => { setActiveTab('decrypt'); setNotice(''); }}
              className={`flex-1 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'decrypt' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Decrypt (DES)
            </button>
          </div>

          <form onSubmit={handleAction} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Block Cipher Mode
              </label>
              <select
                value={desMode}
                onChange={(e) => setDesMode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              >
                <option value="CBC">CBC (Cipher Block Chaining)</option>
                <option value="ECB">ECB (Electronic Codebook - Educational Insecure)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                56-Bit Secret Key (8 characters / 64-bit with parity)
              </label>
              <input
                type="text"
                defaultValue="DESKEY56"
                maxLength={8}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Payload
              </label>
              <textarea
                rows={3}
                defaultValue="Historical Feistel block transformation test"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>Simulate DES {activeTab === 'encrypt' ? 'Encryption' : 'Decryption'} (Preview)</span>
            </button>
          </form>

          {notice && (
            <div className="rounded-lg bg-orange-950/40 border border-orange-500/30 p-3 text-xs text-orange-200">
              {notice}
            </div>
          )}
        </div>

        {/* Technical Anatomy */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-400" />
              <span>DES Structure</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span>
                <span><strong>Block Size:</strong> 64 bits (half-blocks L and R of 32 bits each)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span>
                <span><strong>Key Size:</strong> 56 bits effective (8 parity bits discarded)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span>
                <span><strong>Rounds:</strong> 16 Feistel rounds with 8 non-linear S-boxes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-1 shrink-0"></span>
                <span><strong>Evolution:</strong> Succeeded by 3DES (112/168 bits) and AES (128/256 bits)</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
