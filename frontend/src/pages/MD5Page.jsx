import React, { useState } from 'react';
import { Fingerprint, AlertTriangle, Info, Cpu, Check, Copy } from 'lucide-react';

export default function MD5Page() {
  const [inputText, setInputText] = useState('Comparative integrity testing');
  const [notice, setNotice] = useState('');
  const [copied, setCopied] = useState(false);

  const mockMD5 = "5d41402abc4b2a76b9719d911017c592";

  const handleCompute = (e) => {
    e.preventDefault();
    setNotice(
      'Educational Foundation: MD5 legacy digest computation requested. MD5 is demonstrated for historical cryptanalysis and collision vulnerability comparison against SHA-256.'
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-amber-950/60 border border-amber-500/30 text-amber-400">
              <Fingerprint className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              MD5 Message Digest (Legacy)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            RFC 1321 | 128-bit hash function for educational cryptanalysis and legacy checksums
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30">
            Legacy / Insecure
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
            128-bit Digest
          </span>
        </div>
      </div>

      {/* Security Warning & Educational Notice */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300">Cryptographic Advisory:</strong> MD5 has suffered practical collision attacks (Wang et al., Stevens et al.) and must NOT be used for digital certificates or password hashing in modern systems. It is included in SecureCipher specifically for academic comparison with SHA-256.
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
          <form onSubmit={handleCompute} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Input Text or Data Stream
              </label>
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter text to generate MD5 hash..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold shadow-md transition-all"
            >
              Compute MD5 Digest (Educational Preview)
            </button>
          </form>

          {/* Digest Output */}
          <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>MD5 Checksum (32 Hex Characters):</span>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(mockMD5);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
            <div className="font-mono text-xs text-amber-300 bg-slate-950 p-2.5 rounded border border-slate-800 break-all select-all">
              {mockMD5}
            </div>
          </div>

          {notice && (
            <div className="rounded-lg bg-amber-950/40 border border-amber-500/30 p-3 text-xs text-amber-200">
              {notice}
            </div>
          )}
        </div>

        {/* Comparison Specs */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span>MD5 vs SHA-256 Comparison</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Digest Length:</span>
                <span className="text-white font-mono">MD5: 128 bits vs SHA-256: 256 bits</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Collision Resistance:</span>
                <span className="text-amber-300 font-semibold">MD5: Broken (&lt;2³² work factor)</span>
              </div>
              <div className="p-2.5 rounded bg-slate-900/70 border border-slate-800">
                <span className="text-slate-400 block text-[11px]">Primary Role:</span>
                <span className="text-slate-300">File corruption check (non-security contexts)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
