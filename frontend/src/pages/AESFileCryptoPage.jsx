import React, { useState, useRef } from 'react';
import {
  Shield,
  FileCheck,
  FileText,
  Lock,
  Unlock,
  Key,
  UploadCloud,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Database,
  Layers,
  FileCode,
  ShieldAlert,
  ShieldCheck,
  HardDrive,
  Cpu,
  Trash2,
} from 'lucide-react';
import { encryptAESFile, decryptAESFile } from '../services/api';

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  if (!bytes) return '—';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function AESFileCryptoPage({ onOperationSuccess }) {
  const [activeTab, setActiveTab] = useState('encrypt');

  // Encrypt states
  const [encryptFile, setEncryptFile] = useState(null);
  const [encryptPassphrase, setEncryptPassphrase] = useState('');
  const [showEncryptPass, setShowEncryptPass] = useState(false);
  const [encryptLoading, setEncryptLoading] = useState(false);
  const [encryptResult, setEncryptResult] = useState(null);
  const [encryptError, setEncryptError] = useState('');
  const encryptFileInputRef = useRef(null);

  // Decrypt states
  const [decryptFile, setDecryptFile] = useState(null);
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [showDecryptPass, setShowDecryptPass] = useState(false);
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptResult, setDecryptResult] = useState(null);
  const [decryptError, setDecryptError] = useState('');
  const decryptFileInputRef = useRef(null);

  // Generate strong random passphrase
  const generateRandomPassphrase = (target) => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=';
    let res = '';
    const array = new Uint8Array(24);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 24; i++) {
      res += chars[array[i] % chars.length];
    }
    if (target === 'encrypt') {
      setEncryptPassphrase(res);
      setShowEncryptPass(true);
    } else {
      setDecryptPassphrase(res);
      setShowDecryptPass(true);
    }
  };

  // Encrypt File Handler
  const handleEncryptFile = async (e) => {
    e.preventDefault();
    setEncryptError('');
    setEncryptResult(null);

    if (!encryptFile) {
      setEncryptError('Please select a local file to encrypt.');
      return;
    }
    if (!encryptPassphrase.trim()) {
      setEncryptError('Please enter a secret passphrase for key derivation.');
      return;
    }
    if (encryptFile.size > 50 * 1024 * 1024) {
      setEncryptError('Selected file exceeds the maximum allowed size of 50 MB.');
      return;
    }

    setEncryptLoading(true);
    try {
      const result = await encryptAESFile(encryptFile, encryptPassphrase);
      setEncryptResult(result);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setEncryptError(err.message || 'File encryption failed. Please verify inputs.');
    } finally {
      setEncryptLoading(false);
    }
  };

  // Decrypt File Handler
  const handleDecryptFile = async (e) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptResult(null);

    if (!decryptFile) {
      setDecryptError('Please select a .scipher encrypted file to decrypt.');
      return;
    }
    if (!decryptPassphrase.trim()) {
      setDecryptError('Please enter the passphrase used during encryption.');
      return;
    }

    setDecryptLoading(true);
    try {
      const result = await decryptAESFile(decryptFile, decryptPassphrase);
      setDecryptResult(result);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setDecryptError(err.message || 'Decryption failed: invalid passphrase or corrupted file.');
    } finally {
      setDecryptLoading(false);
    }
  };

  // Trigger file download helper
  const triggerDownload = (blob, filename) => {
    if (!blob) return;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Transfer Encrypted output directly to Decrypt tab for instant verification
  const handleTransferToDecrypt = () => {
    if (!encryptResult) return;
    // Create File from blob
    const file = new File([encryptResult.blob], encryptResult.filename, {
      type: 'application/octet-stream',
    });
    setDecryptFile(file);
    setDecryptPassphrase(encryptPassphrase);
    setDecryptResult(null);
    setDecryptError('');
    setActiveTab('decrypt');
  };

  const handleResetEncrypt = () => {
    setEncryptFile(null);
    setEncryptPassphrase('');
    setEncryptResult(null);
    setEncryptError('');
    if (encryptFileInputRef.current) encryptFileInputRef.current.value = '';
  };

  const handleResetDecrypt = () => {
    setDecryptFile(null);
    setDecryptPassphrase('');
    setDecryptResult(null);
    setDecryptError('');
    if (decryptFileInputRef.current) decryptFileInputRef.current.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 border border-emerald-500/20 bg-gradient-to-br from-[#041006]/90 via-[#030904]/90 to-[#020503]/90 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-400">
                <FileCheck className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-mono tracking-wider uppercase text-emerald-400 font-bold bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                FIPS 197 & NIST SP 800-38D
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight m-0">
              AES-256-GCM File Cryptography
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl m-0 leading-relaxed">
              Authenticated military-grade file encryption and decryption. Packages arbitrary binaries into a versioned <code className="text-emerald-300 font-mono text-xs">.scipher</code> container with Scrypt key derivation, 96-bit unique nonces, and cryptographic AAD header binding.
            </p>
          </div>
          <div className="flex items-center gap-3 self-end sm:self-auto">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Container Format</div>
              <div className="text-xs font-bold text-emerald-300">SCENC01 (v1)</div>
            </div>
          </div>
        </div>

        {/* Global Security Notice */}
        <div className="mt-6 p-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-200/90 leading-relaxed">
            <span className="font-bold text-amber-300">Zero-Recovery Warning:</span> AES-256-GCM authenticated encryption enforces absolute cryptographic integrity. If you lose or forget the passphrase, your encrypted file <span className="underline font-semibold">cannot be recovered</span>. The 16-byte authentication tag guarantees tamper detection; tampered or damaged files will be permanently rejected.
          </div>
        </div>
      </div>

      {/* ── Mode Selection Tabs ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 border-b border-emerald-500/20 pb-3">
        <button
          onClick={() => setActiveTab('encrypt')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
            activeTab === 'encrypt'
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shadow-lg shadow-emerald-950/50'
              : 'text-slate-400 hover:text-white hover:bg-[#06180a]/60 border border-transparent'
          }`}
        >
          <Lock className="w-4 h-4 text-emerald-400" />
          Encrypt File (.scipher)
        </button>
        <button
          onClick={() => setActiveTab('decrypt')}
          className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all min-h-[40px] cursor-pointer ${
            activeTab === 'decrypt'
              ? 'bg-teal-950/80 text-teal-300 border border-teal-500/40 shadow-lg shadow-teal-950/50'
              : 'text-slate-400 hover:text-white hover:bg-[#06180a]/60 border border-transparent'
          }`}
        >
          <Unlock className="w-4 h-4 text-teal-400" />
          Decrypt & Verify (.scipher)
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── ENCRYPT TAB ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'encrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Encryption Form */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-emerald-500/20 bg-[#040e06]/70 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 m-0">
              <Lock className="w-4 h-4 text-emerald-400" />
              File Encryption Workspace
            </h2>

            <form onSubmit={handleEncryptFile} className="space-y-4">
              {/* File Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  1. Select Local File to Encrypt
                </label>
                <div
                  onClick={() => encryptFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    encryptFile
                      ? 'border-emerald-500/60 bg-emerald-950/20'
                      : 'border-slate-700/60 hover:border-emerald-500/40 bg-[#030a04]/60'
                  }`}
                >
                  <input
                    ref={encryptFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setEncryptFile(e.target.files[0]);
                        setEncryptResult(null);
                        setEncryptError('');
                      }
                    }}
                  />
                  {encryptFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="p-2.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                          <FileText className="w-5 h-5 flex-shrink-0" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{encryptFile.name}</div>
                          <div className="text-[11px] font-mono text-emerald-400 mt-0.5">
                            {formatBytes(encryptFile.size)} • {encryptFile.type || 'Binary Stream'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetEncrypt();
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <UploadCloud className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                      <div className="text-xs font-semibold text-slate-200">
                        Click or drag a file to encrypt
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Arbitrary binary formats supported (PDF, ZIP, DOCX, PNG, EXE, etc.) • Max 50 MB
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Passphrase Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    2. Secret Encryption Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={() => generateRandomPassphrase('encrypt')}
                    className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    Generate Strong Key
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showEncryptPass ? 'text' : 'password'}
                    value={encryptPassphrase}
                    onChange={(e) => setEncryptPassphrase(e.target.value)}
                    placeholder="Enter a cryptographically strong passphrase..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#030a04] border border-slate-700/80 text-white placeholder-slate-500 text-xs font-mono focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEncryptPass(!showEncryptPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showEncryptPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1 font-mono">
                  AES-256 key is derived via Scrypt (N=16384, r=8, p=1) using a fresh 128-bit random salt.
                </p>
              </div>

              {/* Error Message */}
              {encryptError && (
                <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{encryptError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={encryptLoading || !encryptFile || !encryptPassphrase.trim()}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {encryptLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Deriving Key & Encrypting...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Encrypt & Package Container
                    </>
                  )}
                </button>
                {(encryptFile || encryptPassphrase || encryptResult) && (
                  <button
                    type="button"
                    onClick={handleResetEncrypt}
                    className="px-4 py-3 rounded-xl border border-slate-700/80 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Encryption Result & Summary */}
          <div className="lg:col-span-5 space-y-5">
            {encryptResult ? (
              <div className="glass-panel rounded-2xl p-6 border border-emerald-500/40 bg-emerald-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    File Encrypted Successfully
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                    {encryptResult.executionDurationMs} ms
                  </span>
                </div>

                <div className="bg-[#030a04] p-4 rounded-xl border border-emerald-500/20 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Original Name:</span>
                    <span className="text-white font-medium truncate max-w-[180px]" title={encryptResult.originalFilename}>
                      {encryptResult.originalFilename}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Encrypted File:</span>
                    <span className="text-emerald-300 font-semibold truncate max-w-[180px]" title={encryptResult.filename}>
                      {encryptResult.filename}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Original Size:</span>
                    <span className="text-slate-200">{formatBytes(encryptResult.originalSize)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Encrypted Container Size:</span>
                    <span className="text-emerald-300">{formatBytes(encryptResult.size)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-800 pt-2">
                    <span>Header Bound AAD:</span>
                    <span className="text-emerald-400 text-[11px]">SCENC01 Verified</span>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={() => triggerDownload(encryptResult.blob, encryptResult.filename)}
                    className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-emerald-400 hover:bg-emerald-300 text-black flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/60 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Encrypted File ({formatBytes(encryptResult.size)})
                  </button>

                  <button
                    onClick={handleTransferToDecrypt}
                    className="w-full py-2.5 px-4 rounded-xl font-semibold text-xs border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-300 hover:bg-emerald-950/40 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Test Decrypt Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 border border-emerald-500/15 bg-[#040e06]/50 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono m-0 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  Container Specification (SCENC01)
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong className="text-slate-200">Authenticated Metadata (AAD):</strong> Original filename and size are cryptographically bound to the GCM tag. Modification corrupts verification.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong className="text-slate-200">Fresh Nonce Guarantee:</strong> A distinct 12-byte cryptographically random nonce is generated per file operation.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span><strong className="text-slate-200">Zero In-Database Leakage:</strong> Plaintext bytes, keys, and passphrases are never written to disk or audit logs.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ── DECRYPT TAB ── */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {activeTab === 'decrypt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Decryption Form */}
          <div className="lg:col-span-7 glass-panel rounded-2xl p-6 border border-teal-500/20 bg-[#040e06]/70 space-y-5">
            <h2 className="text-base font-bold text-white flex items-center gap-2 m-0">
              <Unlock className="w-4 h-4 text-teal-400" />
              File Decryption & Authentication
            </h2>

            <form onSubmit={handleDecryptFile} className="space-y-4">
              {/* File Drop Area */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  1. Select Encrypted File (.scipher)
                </label>
                <div
                  onClick={() => decryptFileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    decryptFile
                      ? 'border-teal-500/60 bg-teal-950/20'
                      : 'border-slate-700/60 hover:border-teal-500/40 bg-[#030a04]/60'
                  }`}
                >
                  <input
                    ref={decryptFileInputRef}
                    type="file"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setDecryptFile(e.target.files[0]);
                        setDecryptResult(null);
                        setDecryptError('');
                      }
                    }}
                  />
                  {decryptFile ? (
                    <div className="flex items-center justify-between gap-3 text-left">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="p-2.5 rounded-lg bg-teal-950/80 border border-teal-500/40 text-teal-400">
                          <FileCode className="w-5 h-5 flex-shrink-0" />
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{decryptFile.name}</div>
                          <div className="text-[11px] font-mono text-teal-400 mt-0.5">
                            {formatBytes(decryptFile.size)} • SecureCipher Encrypted Container
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleResetDecrypt();
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2 py-2">
                      <UploadCloud className="w-8 h-8 text-teal-400 mx-auto opacity-80" />
                      <div className="text-xs font-semibold text-slate-200">
                        Click or drag a .scipher container to decrypt
                      </div>
                      <div className="text-[11px] font-mono text-slate-500">
                        Requires authentic SCENC01 header and valid passphrase
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Passphrase Input */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono">
                  2. Decryption Passphrase
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <Key className="w-4 h-4" />
                  </div>
                  <input
                    type={showDecryptPass ? 'text' : 'password'}
                    value={decryptPassphrase}
                    onChange={(e) => setDecryptPassphrase(e.target.value)}
                    placeholder="Enter the passphrase used to encrypt this file..."
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#030a04] border border-slate-700/80 text-white placeholder-slate-500 text-xs font-mono focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowDecryptPass(!showDecryptPass)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  >
                    {showDecryptPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {decryptError && (
                <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">Authentication / Decryption Failed</div>
                    <div className="text-[11px] text-rose-200/80 mt-0.5">{decryptError}</div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={decryptLoading || !decryptFile || !decryptPassphrase.trim()}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-teal-500 hover:bg-teal-400 disabled:bg-slate-800 disabled:text-slate-500 text-black flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-950/50 cursor-pointer disabled:cursor-not-allowed"
                >
                  {decryptLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Authenticating Tag & Decrypting...
                    </>
                  ) : (
                    <>
                      <Unlock className="w-4 h-4" />
                      Authenticate & Recover Original File
                    </>
                  )}
                </button>
                {(decryptFile || decryptPassphrase || decryptResult) && (
                  <button
                    type="button"
                    onClick={handleResetDecrypt}
                    className="px-4 py-3 rounded-xl border border-slate-700/80 hover:border-slate-600 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Decryption Result */}
          <div className="lg:col-span-5 space-y-5">
            {decryptResult ? (
              <div className="glass-panel rounded-2xl p-6 border border-teal-500/40 bg-teal-950/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-teal-300 uppercase tracking-wider font-mono">
                    <CheckCircle2 className="w-4 h-4 text-teal-400" />
                    Authentication Verified
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-950 border border-teal-500/40 text-teal-300">
                    {decryptResult.executionDurationMs} ms
                  </span>
                </div>

                <div className="bg-[#030a04] p-4 rounded-xl border border-teal-500/20 space-y-2.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Recovered Filename:</span>
                    <span className="text-white font-semibold truncate max-w-[180px]" title={decryptResult.filename}>
                      {decryptResult.filename}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Recovered File Size:</span>
                    <span className="text-teal-300 font-semibold">{formatBytes(decryptResult.size)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Container Processed:</span>
                    <span className="text-slate-300">{formatBytes(decryptResult.containerSize)}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 border-t border-slate-800 pt-2">
                    <span>Authentication Tag:</span>
                    <span className="text-teal-400 text-[11px]">128-bit GCM Valid</span>
                  </div>
                </div>

                <button
                  onClick={() => triggerDownload(decryptResult.blob, decryptResult.filename)}
                  className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-teal-400 hover:bg-teal-300 text-black flex items-center justify-center gap-2 transition-all shadow-md shadow-teal-950/60 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Recovered File ({formatBytes(decryptResult.size)})
                </button>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl p-6 border border-teal-500/15 bg-[#040e06]/50 space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono m-0 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  Cryptographic Integrity Checks
                </h3>
                <ul className="space-y-2.5 text-xs text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <span><strong className="text-slate-200">GCM Tag Verification:</strong> The 128-bit authentication tag guarantees that not a single bit of ciphertext was altered.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <span><strong className="text-slate-200">Filename Restoration:</strong> Safely strips directory traversal characters before restoring the original filename.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-teal-400 font-bold">•</span>
                    <span><strong className="text-slate-200">Zero Partial Output:</strong> If verification fails, no partial or unauthenticated data is ever returned.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Technical Container Layout Card ── */}
      <div className="glass-panel rounded-2xl p-6 border border-emerald-500/20 bg-[#040e06]/60 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 m-0">
          <Layers className="w-4 h-4 text-emerald-400" />
          Technical Binary Container Specification (SCENC01)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 rounded-xl bg-[#030a04] border border-emerald-500/20 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Bytes 0–7</div>
            <div className="text-emerald-400 font-bold">Magic Header</div>
            <div className="text-[11px] text-slate-400">b"SCENC01\0" (8B)</div>
          </div>
          <div className="p-3 rounded-xl bg-[#030a04] border border-emerald-500/20 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Bytes 8–11</div>
            <div className="text-emerald-400 font-bold">Header Length</div>
            <div className="text-[11px] text-slate-400">Big-endian uint32</div>
          </div>
          <div className="p-3 rounded-xl bg-[#030a04] border border-emerald-500/20 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Header Block</div>
            <div className="text-emerald-400 font-bold">JSON Metadata</div>
            <div className="text-[11px] text-slate-400">Salt, Nonce, KDF, Name</div>
          </div>
          <div className="p-3 rounded-xl bg-[#030a04] border border-emerald-500/20 space-y-1">
            <div className="text-[10px] text-slate-500 uppercase">Payload</div>
            <div className="text-emerald-400 font-bold">Ciphertext + Tag</div>
            <div className="text-[11px] text-slate-400">AES-256-GCM + 16B Tag</div>
          </div>
        </div>
      </div>
    </div>
  );
}
