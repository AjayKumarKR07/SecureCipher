import React, { useState } from 'react';
import {
  Hash,
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
  ShieldCheck,
  Scale,
  FileCheck,
  Flame,
  Layers,
} from 'lucide-react';
import { hashSHA256Text, hashSHA256File, compareSHA256 } from '../services/api';
import HowItWorksSection from '../components/HowItWorksSection';

export default function SHA256Page({ onOperationSuccess }) {
  // Tabs: 'text' | 'file' | 'compare'
  const [activeTab, setActiveTab] = useState('text');

  // Text Hashing State
  const [inputText, setInputText] = useState('SecureCipher College Mini-Project Cryptography');
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
      const res = await hashSHA256Text(inputText);
      setTextResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setTextError(err.message || 'Failed to compute SHA-256 digest');
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
      const res = await hashSHA256File(selectedFile);
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
      const res = await compareSHA256(compareInputA, compareInputB, compareMode);
      setCompareResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setCompareError(err.message || 'Failed to compare SHA-256 digests');
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
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
            NIST FIPS 180-4 Standard | Deterministic 256-bit (64-hex character) digital fingerprint
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle"></span>
            FIPS 180-4 Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#06180a] text-emerald-300 border border-emerald-500/30">
            256-bit Output
          </span>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex border-b border-emerald-500/20 gap-2">
        <button
          onClick={() => setActiveTab('text')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'text'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#040e06]/40'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Text Hashing</span>
        </button>
        <button
          onClick={() => setActiveTab('file')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'file'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#040e06]/40'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          <span>File Stream Hashing</span>
        </button>
        <button
          onClick={() => setActiveTab('compare')}
          className={`px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all ${
            activeTab === 'compare'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#040e06]/40'
          }`}
        >
          <Scale className="w-3.5 h-3.5" />
          <span>Integrity & Avalanche Comparison</span>
        </button>
      </div>

      {/* TAB 1: TEXT HASHING */}
      {activeTab === 'text' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">UTF-8 Text Payload</span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-400">NIST Presets:</span>
                <button
                  type="button"
                  onClick={() => applyTextPreset('')}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  Empty String
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
                  onClick={() =>
                    applyTextPreset('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq')
                  }
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 font-mono transition-colors"
                >
                  Long Pattern
                </button>
              </div>
            </div>

            <form onSubmit={handleHashText} className="space-y-4">
              <textarea
                rows={4}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Enter UTF-8 text string to compute SHA-256 digest..."
                className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />

              <button
                type="submit"
                disabled={textLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {textLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Computing SHA-256 Digest...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Compute SHA-256 Digest</span>
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
              <div className="p-4 rounded-lg bg-[#040e06]/90 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    SHA-256 Hex Digest (64 characters):
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400">
                      {textResult.byte_length} bytes | {textResult.execution_duration_ms} ms
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(textResult.digest, 'text-digest')}
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px]"
                    >
                      {copiedKey === 'text-digest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'text-digest' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="font-mono text-xs text-emerald-300 bg-[#030a04] p-3 rounded border border-emerald-500/20 break-all select-all font-bold tracking-wider">
                  {textResult.digest}
                </div>

                {/* Byte Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-mono pt-1">
                  <div className="bg-[#030a04] p-2 rounded border border-emerald-500/20">
                    <span className="text-slate-400 block">Output Bits:</span>
                    <span className="text-emerald-400 font-bold">256 bits</span>
                  </div>
                  <div className="bg-[#030a04] p-2 rounded border border-emerald-500/20">
                    <span className="text-slate-400 block">Byte Length:</span>
                    <span className="text-emerald-400 font-bold">32 bytes</span>
                  </div>
                  <div className="bg-[#030a04] p-2 rounded border border-emerald-500/20">
                    <span className="text-slate-400 block">Hex Digits:</span>
                    <span className="text-emerald-400 font-bold">64 nibbles</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Side Specifications */}
          <div className="space-y-4">
            <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
                <Cpu className="w-4 h-4 text-emerald-400" />
                <span>SHA-256 Engine Specs</span>
              </h3>
              <ul className="space-y-2 text-xs text-slate-300">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                  <span><strong>Digest Size:</strong> 256 bits (32 bytes / 64 hex characters)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                  <span><strong>Block Size:</strong> 512-bit message blocks (64 rounds)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                  <span><strong>Standard:</strong> NIST FIPS 180-4 standard</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                  <span><strong>Pre-image Security:</strong> 256 bits (unfeasible to invert)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                  <span><strong>Collision Security:</strong> 128 bits against birthday attacks</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FILE STREAM HASHING */}
      {activeTab === 'file' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-semibold text-white">Streamed File Integrity Checksum</h3>
                <p className="text-[11px] text-slate-400">
                  Files are streamed in 64 KB chunks directly through hashlib.sha256 (O(1) memory footprint).
                </p>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded border border-emerald-800">
                Max 50 MB
              </span>
            </div>

            <form onSubmit={handleHashFile} className="space-y-4">
              {/* File Upload Drop Zone */}
              <div className="border-2 border-dashed border-emerald-500/25 hover:border-emerald-500/60 rounded-xl p-6 text-center transition-colors bg-[#040e06]/40">
                <input
                  type="file"
                  id="sha256-file-input"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <label
                  htmlFor="sha256-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="w-8 h-8 text-emerald-400" />
                  <span className="text-xs font-medium text-white">
                    {selectedFile ? selectedFile.name : 'Click to browse or drop file here'}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {selectedFile
                      ? `${formatBytes(selectedFile.size)} | Ready to stream`
                      : 'Any file format supported (Binary, Images, Executables, Documents)'}
                  </span>
                </label>
              </div>

              {/* Optional Checksum Comparison Input */}
              <div>
                <label className="block text-[11px] font-medium text-slate-300 mb-1">
                  Optional: Expected SHA-256 Checksum (for automatic verification)
                </label>
                <input
                  type="text"
                  value={fileExpectedHash}
                  onChange={(e) => setFileExpectedHash(e.target.value.trim().toLowerCase())}
                  placeholder="Paste 64-hex character expected checksum to verify integrity..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={fileLoading || !selectedFile}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
              >
                {fileLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Streaming and Hashing File...</span>
                  </>
                ) : (
                  <>
                    <FileCheck className="w-4 h-4" />
                    <span>Compute File Checksum</span>
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
              <div className="p-4 rounded-lg bg-[#040e06]/90 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span className="text-emerald-300 font-bold flex items-center gap-1.5">
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
                      className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px]"
                    >
                      {copiedKey === 'file-digest' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'file-digest' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="font-mono text-xs text-emerald-300 bg-[#030a04] p-3 rounded border border-emerald-500/20 break-all select-all font-bold tracking-wider">
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
                          ? 'Integrity Verified: File matches expected checksum exactly!'
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
            <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
              <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Chunk Stream Architecture</span>
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Rather than buffering entire gigabyte files into server RAM, the backend processes bytes iteratively:
              </p>
              <div className="p-3 bg-[#030a04] rounded border border-emerald-500/20 font-mono text-[11px] text-slate-300 space-y-1">
                <div className="text-emerald-400">hasher = hashlib.sha256()</div>
                <div>while chunk := await file.read(65536):</div>
                <div className="pl-4 text-emerald-300">hasher.update(chunk)</div>
                <div className="text-emerald-400">return hasher.hexdigest()</div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Guarantees $O(1)$ memory consumption and preserves server stability under concurrent uploads.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: INTEGRITY & AVALANCHE COMPARISON */}
      {activeTab === 'compare' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-semibold text-white">Dual-Payload Integrity & Avalanche Analyzer</h3>
                <p className="text-[11px] text-slate-400">
                  Calculates SHA-256 for two inputs and computes the exact bit-level Hamming distance.
                </p>
              </div>
              <button
                type="button"
                onClick={applyAvalanchePreset}
                className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-white text-xs font-medium flex items-center gap-1.5 shadow transition-all self-start sm:self-auto"
              >
                <Flame className="w-3.5 h-3.5 text-amber-400" />
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
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                {/* Input B */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">
                      {compareMode === 'text_vs_hash' ? 'Expected 64-Hex Checksum B' : 'Input Payload B'}
                    </label>
                    <select
                      value={compareMode}
                      onChange={(e) => setCompareMode(e.target.value)}
                      className="bg-[#030a04] border border-emerald-500/25 rounded text-[11px] text-slate-300 px-2 py-0.5 focus:outline-none focus:border-emerald-500"
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
                        ? 'Paste 64-hex character checksum...'
                        : 'Enter second string...'
                    }
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={compareLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
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
                        ? 'Integrity Verified: Both inputs produce the exact same 256-bit SHA-256 digest!'
                        : `Integrity Mismatch: Digests differ by ${compareResult.hamming_distance_bits} bits (${compareResult.bit_difference_percentage}% avalanche bit flip).`}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono bg-[#030a04] px-2.5 py-1 rounded border border-emerald-500/20 font-bold">
                    {compareResult.is_match ? 'IDENTICAL MATCH ✓' : 'DIFFERENT DIGESTS ✗'}
                  </span>
                </div>

                {/* Metrics Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-[#040e06] rounded-lg border border-emerald-500/20">
                    <span className="text-slate-400 text-[11px] block">Hamming Distance (Bits):</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {compareResult.hamming_distance_bits} / 256
                    </span>
                  </div>
                  <div className="p-3 bg-[#040e06] rounded-lg border border-emerald-500/20">
                    <span className="text-slate-400 text-[11px] block">Avalanche Bit Flip:</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {compareResult.bit_difference_percentage}%
                    </span>
                  </div>
                  <div className="p-3 bg-[#040e06] rounded-lg border border-emerald-500/20">
                    <span className="text-slate-400 text-[11px] block">Execution Duration:</span>
                    <span className="text-lg font-bold font-mono text-emerald-400">
                      {compareResult.execution_duration_ms} ms
                    </span>
                  </div>
                </div>

                {/* Side-by-Side Digests */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="p-3 rounded-lg bg-[#040e06] border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Digest A:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(compareResult.hash_a, 'comp-a')}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        {copiedKey === 'comp-a' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-[#030a04] text-emerald-300 break-all select-all font-bold">
                      {compareResult.hash_a}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#040e06] border border-emerald-500/20 space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Digest B:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(compareResult.hash_b, 'comp-b')}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        {copiedKey === 'comp-b' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-[#030a04] text-emerald-300 break-all select-all font-bold">
                      {compareResult.hash_b}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Educational "How It Works" Section */}
      <HowItWorksSection
        algorithmName="SHA-256 (Secure Hash Algorithm 256-bit)"
        subtitle="Cryptographic one-way hash function generating deterministic 256-bit digests for integrity verification and digital signatures."
        badge="NIST FIPS 180-4 Standard"
        themeColor="emerald"
        purpose="SHA-256 computes a fixed-size 256-bit (32-byte) digital fingerprint of arbitrary data. It is primarily used for software download integrity verification, git commit checksums, digital signatures, blockchain proof-of-work, and TLS handshakes. Because it is computationally infeasible to invert or find collisions, any accidental corruption or deliberate tampering changes the digest completely."
        diagramSteps={[
          { title: '1. Input Payload', subtitle: 'UTF-8 String or 64KB Chunk Stream', icon: FileText },
          { title: '2. 512-bit Padding', subtitle: 'Bit 1 + Zeroes + 64-bit Length', icon: Layers },
          { title: '3. Compression Core', subtitle: '64 Iterative Rounds (Ch, Maj, \u03A3, \u03C3)', icon: Cpu },
          { title: '4. 256-bit Hex Digest', subtitle: 'Fixed 64 Lowercase Hex Chars', icon: Hash },
        ]}
        workflowSteps={[
          {
            title: 'Input Ingestion & Stream Buffering',
            tag: 'Step 1',
            description: 'The user enters UTF-8 text or uploads a binary file (up to 50 MB). For files, SecureCipher streams the data in 64 KB memory chunks using hashlib.sha256() to maintain constant O(1) server memory.',
          },
          {
            title: 'Merkle-Damgård Message Padding',
            tag: 'Step 2',
            description: 'The payload is padded so its total bit length becomes congruent to 448 mod 512. A single "1" bit is appended, followed by zero bits, and finally the original 64-bit length is attached in big-endian format.',
          },
          {
            title: 'Initial Hash Values & 64 Compression Rounds',
            tag: 'Step 3',
            description: 'Eight 32-bit working state variables (H0\u2013H7) initialized from fractional parts of square roots of prime numbers are processed through 64 rounds of bitwise logic (Choice, Majority, rotations, and constants K_t).',
          },
          {
            title: 'Digest Generation & 64-Hex Representation',
            tag: 'Step 4',
            description: 'The updated state variables are concatenated to form the final 256-bit (32-byte) digest. The application formats this raw binary digest into standard lowercase 64-character hexadecimal for human-readable display.',
          },
        ]}
        concepts={[
          {
            term: 'One-Way Hash Function',
            explanation: 'A mathematical algorithm that easily converts input data into a fixed-length string, but is computationally impossible to invert back to the original message.',
          },
          {
            term: '256-Bit Digest & 64 Hex Digits',
            explanation: 'Regardless of whether input is a 3-letter word or a 50 MB ISO file, the resulting digest is always exactly 256 bits (32 bytes), rendered as 64 hexadecimal characters.',
          },
          {
            term: 'Chunked File Streaming',
            explanation: 'Processing large files by reading 65,536-byte chunks incrementally. This prevents memory exhaustion and server crashes during large uploads.',
          },
          {
            term: 'Strict Avalanche Effect',
            explanation: 'Flipping even a single bit in the input causes approximately 50% of the output bits to change unpredictably, preventing similarity matching attacks.',
          },
          {
            term: 'Pre-image & Collision Resistance',
            explanation: 'Pre-image resistance means you cannot recover input from a hash. Collision resistance means you cannot find two different inputs that produce identical hashes.',
          },
          {
            term: 'Hashing vs. Encryption',
            explanation: 'Encryption is two-way and reversible using a secret key. Hashing is one-way and mathematically irreversible\u2014there is no decryption key.',
          },
        ]}
        example={{
          scenario: 'Verifying Text Checksum & Avalanche Effect',
          input: 'Input A: "SecureCipher 2026" vs Input B: "securecipher 2026"',
          process: 'Both inputs are padded and compressed through 64 rounds of SHA-256 independently, showing extreme output divergence despite having identical semantic meaning.',
          output: 'Digest A: 014a48ff98e0... (64 hex) \u2260 Digest B: 8fbc14589201... (64 hex) \u2192 129 out of 256 bits changed (50.4% Hamming distance).',
        }}
        securityNotes={{
          benefits: [
            'Collision-resistant: No known collision attacks exist against the full 64-round SHA-256 algorithm.',
            'Deterministic and verifiable: Anyone calculating SHA-256 on the identical file will receive the exact same 64-hex digest.',
            'Complies with NIST FIPS 180-4 and accepted globally across cryptographic protocols.',
          ],
          limitations: [
            'Hashing does not provide confidentiality: Anyone with access to the original plaintext can verify if it matches a given digest.',
            'Vulnerable to length-extension attacks if used directly as a MAC; use HMAC-SHA256 for message authentication.',
            'Raw SHA-256 is fast on GPUs; never use raw SHA-256 for passwords without memory-hard stretching (use Scrypt or Argon2).',
          ],
        }}
        keyTakeaway="SHA-256 is an irreversible one-way cryptographic hash function that produces a unique 64-character digital fingerprint to verify data integrity."
      />

      {/* Educational & Architectural Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Merkle-Damgård Structure</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            SHA-256 divides messages into <strong>512-bit blocks</strong> padded with length encoding. Each block is compressed across 64 iterative rounds utilizing modular additions and bitwise rotations.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <Flame className="w-4 h-4 text-amber-400" />
            <span>Strict Avalanche Effect</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            A fundamental cryptographic guarantee: flipping even a <strong>single bit</strong> in the input message causes approximately <strong>50% of the output digest bits</strong> to change unpredictably.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit & Privacy Policy</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Zero-Knowledge Storage:</strong> The backend PostgreSQL audit log only records operation status and latency. Raw input strings and uploaded file contents are <strong>never stored or logged</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
