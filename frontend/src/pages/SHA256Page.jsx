import React, { useState } from 'react';
import { Hash, Copy, Check, Info, Cpu, Sparkles } from 'lucide-react';

export default function SHA256Page() {
  const [inputText, setInputText] = useState('SecureCipher College Mini-Project Cryptography');
  const [copied, setCopied] = useState(false);
  const [notice, setNotice] = useState('');

  // Sample static reference digest for educational layout
  const mockDigest = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

  const handleCompute = (e) => {
    e.preventDefault();
    setNotice(
      'Educational Foundation: SHA-256 compression pipeline triggered. The backend hashing service (FIPS 180-4) will return live digests across strings and files in Phase 2.'
    );
  };

  const copyDigest = () => {
    navigator.clipboard?.writeText(mockDigest);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
              <Hash className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              SHA-256 Cryptographic Hash Function
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            NIST FIPS 180-4 Standard | Deterministic 256-bit (32-byte) digital fingerprint
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            SHA-2 Family
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
            256-bit Output
          </span>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200/90 leading-relaxed">
          <strong className="text-emerald-300">Phase 1 Foundation Layout:</strong> Interactive hash generator layout is mapped below. The backend hashlib/cryptography service with multi-part stream hashing for large files will be connected in Phase 2.
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
          <form onSubmit={handleCompute} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Input String or Payload
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to generate SHA-256 hash digest..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Compute SHA-256 Digest (Preview)</span>
            </button>
          </form>

          {/* Digest Output Mockup */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>SHA-256 Checksum (Hexadecimal):</span>
              <button
                onClick={copyDigest}
                className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-emerald-300 bg-slate-950 p-2.5 rounded border border-slate-800 break-all select-all">
              {mockDigest}
            </div>
          </div>

          {notice && (
            <div className="rounded-lg bg-emerald-950/40 border border-emerald-500/30 p-3 text-xs text-emerald-200">
              {notice}
            </div>
          )}
        </div>

        {/* Specifications */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>SHA-256 Properties</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Digest Size:</strong> 256 bits (64 hexadecimal characters)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Block Size:</strong> 512-bit message blocks with 64 processing rounds</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Collision Resistance:</strong> No practical collision found in history</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Avalanche Effect:</strong> 1-bit input flip flips &gt;50% of digest bits</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
