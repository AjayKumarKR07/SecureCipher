import React, { useState } from 'react';
import {
  Fingerprint,
  AlertTriangle,
  Copy,
  Check,
  Cpu,
  Sparkles,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Scale,
  FileCheck,
  Flame,
  ShieldCheck,
} from 'lucide-react';
import { hashMD5Text, hashMD5File, compareMD5 } from '../services/api';

export default function MD5Page({ onOperationSuccess }) {
  // Tabs: 'text' | 'file' | 'compare'
  const [activeTab, setActiveTab] = useState('text');

  // Text Hashing State
  const [inputText, setInputText] = useState('Comparative integrity testing');
  const [textResult, setTextResult] = useState(null);
  const [textLoading, setTextLoading] = useState(false);
  const [textError, setTextError] = useState('');
  const [copiedKey, setCopiedKey] = useState('');

  // File Hashing State
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileExpectedHash, setFileExpectedHash] = useState('');
  const [fileResult, setFileResult] = useState(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState('');

  // Comparison State
  const [compareInputA, setCompareInputA] = useState('The quick brown fox jumps over the lazy dog.');
  const [compareInputB, setCompareInputB] = useState('The quick brown fox jumps over the lazy dog,');
  const [compareMode, setCompareMode] = useState('text_vs_text'); // 'text_vs_text' | 'text_vs_hash'
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareError, setCompareError] = useState('');

  // Clipboard helper
  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // 1. Text Hash Handler
  const handleHashText = async (e) => {
    if (e) e.preventDefault();
    setTextLoading(true);
    setTextError('');
    try {
      const res = await hashMD5Text(inputText);
      setTextResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setTextError(err.message || 'Failed to compute MD5 digest');
    } finally {
      setTextLoading(false);
    }
  };

  // Test vector presets for text
  const applyTextPreset = (presetText) => {
    setInputText(presetText);
    setTextResult(null);
    setTextError('');
  };

  // 2. File Hash Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileResult(null);
      setFileError('');
    }
  };

  const handleHashFile = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) {
      setFileError('Please select a file to hash.');
      return;
    }
    setFileLoading(true);
    setFileError('');
    try {
      const res = await hashMD5File(selectedFile);
      setFileResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setFileError(err.message || 'Failed to hash uploaded file');
    } finally {
      setFileLoading(false);
    }
  };

  // 3. Compare Handler
  const handleCompare = async (e) => {
    if (e) e.preventDefault();
    setCompareLoading(true);
    setCompareError('');
    try {
      const res = await compareMD5(compareInputA, compareInputB, compareMode);
      setCompareResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setCompareError(err.message || 'Failed to compare MD5 digests');
    } finally {
      setCompareLoading(false);
    }
  };

  const applyAvalanchePreset = () => {
    setCompareMode('text_vs_text');
    setCompareInputA('The quick brown fox jumps over the lazy dog.');
    setCompareInputB('The quick brown fox jumps over the lazy dog,');
    setCompareResult(null);
    setCompareError('');
  };

  // Helper formatting for file size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
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
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse-subtle"></span>
            RFC 1321 Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30">
            Insecure / Collisions Broken
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
            128-bit Output
          </span>
        </div>
      </div>

      {/* Security Warning & Cryptographic Advisory */}
      <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/90 leading-relaxed space-y-1">
          <div>
            <strong className="text-amber-300">Cryptographic Vulnerability Advisory:</strong> MD5 has suffered practical collision attacks (Wang et al., Stevens et al.) with collision finding complexity below 2³² operations.
          </div>
          <div className="text-[11px] text-amber-300/80">
            It must <strong>NOT</strong> be used for digital signatures, SSL/TLS certificates, or password hashing. SecureCipher provides MD5 exclusively for legacy checksum verification and comparative cryptanalysis alongside SHA-256.
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'text'
              ? 'border-amber-500 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Text Hashing</span>
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'file'
              ? 'border-amber-500 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>File Stream Checksum</span>
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'compare'
              ? 'border-amber-500 text-amber-300 bg-amber-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Integrity & Avalanche Comparison</span>
        </button>
      </div>

      {/* TAB 1: TEXT HASHING */}
      {activeTab === 'text' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">UTF-8 Text Payload</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-slate-400">RFC 1321 Presets:</span>
                <button
                  type="button"
                  onClick={() => applyTextPreset('')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  Empty String
                </button>
                <button
                  type="button"
                  onClick={() => applyTextPreset('a')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  "a"
                </button>
                <button
                  type="button"
                  onClick={() => applyTextPreset('abc')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  "abc"
                </button>
                <button
                  type="button"
                  onClick={() => applyTextPreset('message digest')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  "message digest"
                </button>
              </div>
            </div>

            <form onSubmit={handleHashText} className="space-y-4">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter UTF-8 text string to compute MD5 digest..."
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />

              <button
                type="submit"
                disabled={textLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {textLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Computing MD5 Digest...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compute MD5 Digest</span>
                  </>
                )}
              </button>
            </form>

            {textError && (
              <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{textError}</span>
              </div>
            )}

            {textResult && (
              <div className="p-4 rounded-lg bg-slate-900/90 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    MD5 Hex Digest (32 characters):
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {textResult.byte_length} bytes | {textResult.execution_duration_ms} ms
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(textResult.digest, 'text-digest')}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px]"
                    >
                      {copiedKey === 'text-digest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'text-digest' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="font-mono text-xs text-amber-300 bg-slate-950 p-3 rounded border border-slate-800 break-all select-all font-bold tracking-wider">
                  {textResult.digest}
                </div>

                {/* Byte Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono pt-1">
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Output Bits:</span>
                    <span className="text-amber-400 font-bold">128 bits</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Byte Length:</span>
                    <span className="text-amber-400 font-bold">16 bytes</span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded border border-slate-800">
                    <span className="text-slate-400 block">Hex Digits:</span>
                    <span className="text-amber-400 font-bold">32 nibbles</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Specifications */}
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
                <Cpu className="w-4 h-4 text-amber-400" />
                <span>MD5 Engine Specs</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                  <span><strong>Digest Size:</strong> 128 bits (16 bytes / 32 hex characters)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                  <span><strong>Block Size:</strong> 512-bit message blocks (64 rounds / 4 stages)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                  <span><strong>Standard:</strong> RFC 1321 (Ronald Rivest, 1991)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1 shrink-0"></span>
                  <span><strong>Primary Utility:</strong> File integrity in non-adversarial environments</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0"></span>
                  <span><strong>Collision Status:</strong> Severely compromised (&lt;2³² complexity)</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FILE STREAM HASHING */}
      {activeTab === 'file' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">Streamed File Integrity Checksum</h3>
                <p className="text-[11px] text-slate-400">
                  Files are streamed in 64 KB chunks directly through hashlib.md5 (O(1) memory footprint).
                </p>
              </div>
              <span className="text-[11px] font-mono text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800">
                Max 50 MB
              </span>
            </div>

            <form onSubmit={handleHashFile} className="space-y-4">
              {/* File Upload Drop Zone */}
              <div className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-6 text-center transition-colors bg-slate-900/40">
                <input
                  type="file"
                  id="md5-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="md5-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-amber-400" />
                  <span className="text-xs font-medium text-white">
                    {selectedFile ? selectedFile.name : 'Click to browse or drop file here'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)} | Ready to stream`
                      : 'Any file format supported (Software distributions, ISOs, Archives)'}
                  </span>
                </label>
              </div>

              {/* Optional Checksum Comparison Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Optional: Expected MD5 Checksum (for legacy file verification)
                </label>
                <input
                  type="text"
                  value={fileExpectedHash}
                  onChange={(e) => setFileExpectedHash(e.target.value.trim().toLowerCase())}
                  placeholder="Paste 32-hex character expected MD5 checksum to verify integrity..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={fileLoading || !selectedFile}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {fileLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Streaming and Hashing File...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Compute MD5 Checksum</span>
                  </>
                )}
              </button>
            </form>

            {fileError && (
              <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{fileError}</span>
              </div>
            )}

            {fileResult && (
              <div className="p-4 rounded-lg bg-slate-900/90 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-amber-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Computed File Digest:
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {formatBytes(fileResult.file_size_bytes)} | {fileResult.execution_duration_ms} ms
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(fileResult.digest, 'file-digest')}
                      className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-[11px]"
                    >
                      {copiedKey === 'file-digest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'file-digest' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="font-mono text-xs text-amber-300 bg-slate-950 p-3 rounded border border-slate-800 break-all select-all font-bold tracking-wider">
                  {fileResult.digest}
                </div>

                {/* Optional Checksum Match Banner */}
                {fileExpectedHash && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-center justify-between ${
                      fileResult.digest === fileExpectedHash
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                        : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {fileResult.digest === fileExpectedHash ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                      <span>
                        {fileResult.digest === fileExpectedHash
                          ? 'Integrity Verified: File matches expected MD5 checksum exactly!'
                          : 'Integrity Failure: File digest differs from expected checksum. The file may be corrupt or altered.'}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-[11px]">
                      {fileResult.digest === fileExpectedHash ? 'MATCH ✓' : 'MISMATCH ✗'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stream Architecture Card */}
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Chunk Stream Architecture</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Processes uploaded files iteratively in memory buffers of 65,536 bytes:
              </p>
              <div className="p-3 bg-slate-950 rounded border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-amber-400">hasher = hashlib.md5()</div>
                <div>while chunk := await file.read(65536):</div>
                <div className="pl-4 text-indigo-300">hasher.update(chunk)</div>
                <div className="text-amber-400">return hasher.hexdigest()</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Prevents memory bottlenecks when hashing large distribution packages or archives.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRITY & AVALANCHE COMPARISON */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-white">Dual-Payload Integrity & Avalanche Analyzer</h3>
                <p className="text-[11px] text-slate-400">
                  Calculates MD5 for two inputs and computes the exact bit-level Hamming distance across 128 bits.
                </p>
              </div>
              <button
                type="button"
                onClick={applyAvalanchePreset}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium flex items-center gap-1.5 shadow transition-all self-start sm:self-auto"
              >
                <Flame className="w-3.5 h-3.5 text-yellow-300" />
                <span>Load 1-Bit Flip Avalanche Test</span>
              </button>
            </div>

            <form onSubmit={handleCompare} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Input A */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">Input Payload A</label>
                  <textarea
                    rows={4}
                    value={compareInputA}
                    onChange={(e) => setCompareInputA(e.target.value)}
                    placeholder="Enter first string..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                {/* Input B */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      {compareMode === 'text_vs_hash' ? 'Expected 32-Hex Checksum B' : 'Input Payload B'}
                    </label>
                    <select
                      value={compareMode}
                      onChange={(e) => setCompareMode(e.target.value)}
                      className="bg-slate-950 border border-slate-700 rounded text-[11px] text-slate-300 px-2 py-0.5 focus:outline-none focus:border-amber-500"
                    >
                      <option value="text_vs_text">Compare Text vs Text</option>
                      <option value="text_vs_hash">Verify Text vs Checksum</option>
                    </select>
                  </div>
                  <textarea
                    rows={4}
                    value={compareInputB}
                    onChange={(e) => setCompareInputB(e.target.value)}
                    placeholder={
                      compareMode === 'text_vs_hash'
                        ? 'Paste 32-hex character checksum...'
                        : 'Enter second string...'
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={compareLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {compareLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Bit-Level Differences...</span>
                  </>
                ) : (
                  <>
                    <Scale className="w-4 h-4" />
                    <span>Compare Hashes & Compute Avalanche Effect</span>
                  </>
                )}
              </button>
            </form>

            {compareError && (
              <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{compareError}</span>
              </div>
            )}

            {compareResult && (
              <div className="space-y-4 pt-2">
                {/* Result Verdict Banner */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    compareResult.is_match
                      ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                      : 'bg-amber-950/40 border-amber-500/50 text-amber-300'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs">
                    {compareResult.is_match ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                    )}
                    <span>
                      {compareResult.is_match
                        ? 'Integrity Verified: Both inputs produce the exact same 128-bit MD5 digest!'
                        : `Integrity Mismatch: Digests differ by ${compareResult.hamming_distance_bits} bits (${compareResult.bit_difference_percentage}% avalanche bit flip).`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-slate-950 px-2.5 py-1 rounded border border-slate-800 font-bold">
                    {compareResult.is_match ? 'IDENTICAL MATCH ✓' : 'DIFFERENT DIGESTS ✗'}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Hamming Distance (Bits):</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {compareResult.hamming_distance_bits} / 128
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Avalanche Bit Flip:</span>
                    <span className="text-lg font-bold font-mono text-orange-400">
                      {compareResult.bit_difference_percentage}%
                    </span>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-400 text-[11px] block">Execution Duration:</span>
                    <span className="text-lg font-bold font-mono text-indigo-400">
                      {compareResult.execution_duration_ms} ms
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Digests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Digest A:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(compareResult.hash_a, 'comp-a')}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        {copiedKey === 'comp-a' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-slate-950 text-amber-300 break-all select-all font-bold">
                      {compareResult.hash_a}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Digest B:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(compareResult.hash_b, 'comp-b')}
                        className="text-amber-400 hover:text-amber-300"
                      >
                        {copiedKey === 'comp-b' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-slate-950 text-amber-300 break-all select-all font-bold">
                      {compareResult.hash_b}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational & Architectural Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Collision Vulnerability</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In 2004, Xiaoyun Wang demonstrated practical collision generation. Attackers can forge two distinct documents that produce the exact same MD5 digest in under one second on standard hardware.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <Cpu className="w-4 h-4 text-amber-400" />
            <span>MD5 vs SHA-256</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            MD5 outputs <strong>128 bits</strong> across 4 rounds of non-linear operations, whereas SHA-256 outputs <strong>256 bits</strong> across 64 rounds with 8 state variables, providing robust pre-image and collision resistance.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span>Audit & Privacy Policy</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Zero-Knowledge Storage:</strong> The PostgreSQL audit log only records operation type and latency. Raw input strings and uploaded file contents are <strong>never stored or logged</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
