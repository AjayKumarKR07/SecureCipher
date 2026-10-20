import React, { useState } from 'react';
import {
  Shield,
  Lock,
  Unlock,
  Key,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  Cpu,
  ArrowRight,
  RefreshCw,
  Sparkles,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { encryptAES, decryptAES } from '../services/api';
import HowItWorksSection from '../components/HowItWorksSection';

export default function AESPage({ onOperationSuccess }) {
  const [activeTab, setActiveTab] = useState('encrypt');

  // Encryption states
  const [encryptPlaintext, setEncryptPlaintext] = useState('Confidential message requiring AES-256-GCM authenticated encryption.');
  const [encryptPassphrase, setEncryptPassphrase] = useState('MyStrongPassphrase#2026');
  const [encryptLoading, setEncryptLoading] = useState(false);
  const [encryptResult, setEncryptResult] = useState(null);
  const [encryptError, setEncryptError] = useState('');

  // Decryption states
  const [decryptPassphrase, setDecryptPassphrase] = useState('');
  const [decryptNonce, setDecryptNonce] = useState('');
  const [decryptSalt, setDecryptSalt] = useState('');
  const [decryptCiphertext, setDecryptCiphertext] = useState('');
  const [decryptTag, setDecryptTag] = useState('');
  const [decryptLoading, setDecryptLoading] = useState(false);
  const [decryptResult, setDecryptResult] = useState(null);
  const [decryptError, setDecryptError] = useState('');

  // Clipboard copy tracker
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateRandomPassphrase = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let res = '';
    const array = new Uint8Array(20);
    window.crypto.getRandomValues(array);
    for (let i = 0; i < 20; i++) {
      res += chars[array[i] % chars.length];
    }
    setEncryptPassphrase(res);
  };

  const handleEncrypt = async (e) => {
    e.preventDefault();
    setEncryptError('');
    setEncryptResult(null);

    if (!encryptPlaintext.trim()) {
      setEncryptError('Plaintext cannot be empty.');
      return;
    }
    if (!encryptPassphrase.trim()) {
      setEncryptError('Passphrase cannot be empty.');
      return;
    }

    setEncryptLoading(true);
    try {
      const data = await encryptAES(encryptPlaintext, encryptPassphrase);
      setEncryptResult(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setEncryptError(err.message || 'Encryption failed. Please check inputs.');
    } finally {
      setEncryptLoading(false);
    }
  };

  const handleTransferToDecrypt = () => {
    if (!encryptResult) return;
    setDecryptPassphrase(encryptPassphrase);
    setDecryptNonce(encryptResult.nonce);
    setDecryptSalt(encryptResult.salt);
    setDecryptCiphertext(encryptResult.ciphertext);
    setDecryptTag(encryptResult.tag);
    setDecryptResult(null);
    setDecryptError('');
    setActiveTab('decrypt');
  };

  const handleDecrypt = async (e) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptResult(null);

    if (!decryptPassphrase.trim()) {
      setDecryptError('Passphrase is required for decryption.');
      return;
    }
    if (!decryptCiphertext.trim()) {
      setDecryptError('Ciphertext is required.');
      return;
    }
    if (!decryptNonce.trim()) {
      setDecryptError('12-byte Nonce is required.');
      return;
    }
    if (!decryptSalt.trim()) {
      setDecryptError('16-byte KDF Salt is required.');
      return;
    }
    if (!decryptTag.trim()) {
      setDecryptError('16-byte Authentication Tag is required.');
      return;
    }

    setDecryptLoading(true);
    try {
      const data = await decryptAES({
        passphrase: decryptPassphrase,
        nonce: decryptNonce.trim(),
        salt: decryptSalt.trim(),
        ciphertext: decryptCiphertext.trim(),
        tag: decryptTag.trim(),
      });
      setDecryptResult(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setDecryptError(err.message || 'Decryption failed.');
    } finally {
      setDecryptLoading(false);
    }
  };

  const handlePasteJSON = () => {
    navigator.clipboard?.readText().then((clipText) => {
      try {
        const parsed = JSON.parse(clipText);
        if (parsed.ciphertext && parsed.nonce && parsed.salt && parsed.tag) {
          setDecryptNonce(parsed.nonce);
          setDecryptSalt(parsed.salt);
          setDecryptCiphertext(parsed.ciphertext);
          setDecryptTag(parsed.tag);
          setDecryptError('');
        } else {
          setDecryptError('Clipboard content is not a valid SecureCipher AES JSON payload.');
        }
      } catch (e) {
        setDecryptError('Unable to parse JSON from clipboard. Please paste values manually.');
      }
    }).catch(() => {
      setDecryptError('Clipboard permission denied. Please paste values manually.');
    });
  };



  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-[#06180a] border border-emerald-500/30 text-emerald-400">
              <Shield className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              AES-256-GCM Authenticated Encryption
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            NIST FIPS 197 & SP 800-38D | 256-bit Key with Scrypt KDF & 12-byte Nonce
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle"></span>
            Engine Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#06180a] text-emerald-300 border border-emerald-500/30">
            AEAD Authenticated
          </span>
        </div>
      </div>

      {/* Main Configuration & Interactive Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-5">
          {/* Tabs: Encrypt / Decrypt */}
          <div className="flex flex-col sm:flex-row rounded-lg bg-[#040e06] p-1 border border-emerald-500/20 gap-1 sm:gap-0">
            <button
              onClick={() => { setActiveTab('encrypt'); setEncryptError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-md transition-all min-h-[38px] cursor-pointer ${
                activeTab === 'encrypt'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Encrypt Text</span>
            </button>
            <button
              onClick={() => { setActiveTab('decrypt'); setDecryptError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold rounded-md transition-all min-h-[38px] cursor-pointer ${
                activeTab === 'decrypt'
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Decrypt & Verify</span>
            </button>
          </div>

          {/* TAB 1: ENCRYPT */}
          {activeTab === 'encrypt' && (
            <form onSubmit={handleEncrypt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Plaintext Payload
                </label>
                <textarea
                  rows={4}
                  value={encryptPlaintext}
                  onChange={(e) => setEncryptPlaintext(e.target.value)}
                  placeholder="Enter message to encrypt..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Encryption Passphrase
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassphrase}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-mono flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Generate Strong Passphrase</span>
                  </button>
                </div>
                <input
                  type="text"
                  value={encryptPassphrase}
                  onChange={(e) => setEncryptPassphrase(e.target.value)}
                  placeholder="Enter secret passphrase..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  Key Derivation: Scrypt (N=16384, r=8, p=1) derives a 256-bit key using a fresh 16-byte salt.
                </p>
              </div>

              {encryptError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{encryptError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={encryptLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {encryptLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Deriving Key & Encrypting...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Encrypt with AES-256-GCM</span>
                  </>
                )}
              </button>

              {/* Encryption Result Output */}
              {encryptResult && (
                <div className="mt-5 space-y-3 p-4 rounded-xl bg-[#040e06]/90 border border-emerald-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Encrypted Output (AEAD)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-[#06180a] border border-emerald-800">
                      {encryptResult.execution_duration_ms} ms
                    </span>
                  </div>

                  {/* Ciphertext */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ciphertext (Base64):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(encryptResult.ciphertext, 'ct')}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {copiedKey === 'ct' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'ct' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-2.5 rounded bg-[#030a04] font-mono text-xs text-emerald-200 border border-emerald-500/20 break-all select-all">
                      {encryptResult.ciphertext}
                    </div>
                  </div>

                  {/* Authentication Tag & Nonce */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Auth Tag (16 bytes Base64):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(encryptResult.tag, 'tag')}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {copiedKey === 'tag' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-2 rounded bg-[#030a04] font-mono text-[11px] text-emerald-300 border border-emerald-500/20 break-all select-all">
                        {encryptResult.tag}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Nonce (12 bytes Base64):</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(encryptResult.nonce, 'nonce')}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {copiedKey === 'nonce' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="p-2 rounded bg-[#030a04] font-mono text-[11px] text-teal-300 border border-emerald-500/20 break-all select-all">
                        {encryptResult.nonce}
                      </div>
                    </div>
                  </div>

                  {/* Salt */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Scrypt Salt (16 bytes Base64):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(encryptResult.salt, 'salt')}
                        className="text-emerald-400 hover:text-emerald-300"
                      >
                        {copiedKey === 'salt' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-[#030a04] font-mono text-[11px] text-slate-300 border border-emerald-500/20 break-all select-all">
                      {encryptResult.salt}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-emerald-500/20">
                    <button
                      type="button"
                      onClick={handleTransferToDecrypt}
                      className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                    >
                      <span>Transfer to Decrypt Tab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(encryptResult, null, 2), 'json')}
                      className="w-full sm:w-auto justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-emerald-500/25 flex items-center gap-1.5 transition-colors min-h-[38px] cursor-pointer"
                    >
                      {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'json' ? 'JSON Copied' : 'Copy Complete JSON'}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: DECRYPT */}
          {activeTab === 'decrypt' && (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <span className="text-xs text-slate-400">Provide parameters or paste JSON payload:</span>
                <button
                  type="button"
                  onClick={handlePasteJSON}
                  className="text-[11px] text-teal-400 hover:text-teal-300 font-mono flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Auto-Fill from Clipboard JSON</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Passphrase
                </label>
                <input
                  type="password"
                  value={decryptPassphrase}
                  onChange={(e) => setDecryptPassphrase(e.target.value)}
                  placeholder="Enter passphrase used during encryption..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ciphertext (Base64)
                </label>
                <textarea
                  rows={3}
                  value={decryptCiphertext}
                  onChange={(e) => setDecryptCiphertext(e.target.value)}
                  placeholder="Paste Base64 ciphertext..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Nonce (12B Base64)
                  </label>
                  <input
                    type="text"
                    value={decryptNonce}
                    onChange={(e) => setDecryptNonce(e.target.value)}
                    placeholder="12-byte Nonce"
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Salt (16B Base64)
                  </label>
                  <input
                    type="text"
                    value={decryptSalt}
                    onChange={(e) => setDecryptSalt(e.target.value)}
                    placeholder="16-byte Salt"
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Auth Tag (16B Base64)
                  </label>
                  <input
                    type="text"
                    value={decryptTag}
                    onChange={(e) => setDecryptTag(e.target.value)}
                    placeholder="16-byte Tag"
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                  />
                </div>
              </div>

              {decryptError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{decryptError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={decryptLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-semibold shadow-lg shadow-blue-950/40 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {decryptLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying Tag & Decrypting...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Authenticate & Decrypt Payload</span>
                  </>
                )}
              </button>

              {/* Decrypted Plaintext Output */}
              {decryptResult && (
                <div className="mt-5 space-y-3 p-4 rounded-xl bg-[#040e06]/90 border border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Authentication Tag Verified (Integrity Confirmed)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      {decryptResult.execution_duration_ms} ms
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Original Plaintext:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(decryptResult.plaintext, 'decrypted')}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {copiedKey === 'decrypted' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'decrypted' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded-lg bg-[#030a04] font-mono text-xs text-white border border-emerald-500/20 whitespace-pre-wrap select-all">
                      {decryptResult.plaintext}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Algorithm Technical Specifications Panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>AES-256-GCM Architecture</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Cipher:</strong> Rijndael 128-bit block cipher with 14 rounds for 256-bit key</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>AEAD Mode:</strong> Galois/Counter Mode (GCM) providing simultaneous confidentiality and message integrity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Key Derivation:</strong> Scrypt KDF with 16-byte salt, N=16384, r=8, p=1</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Nonce Uniqueness:</strong> 12 random bytes per encryption. Nonces are never reused</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Authentication:</strong> 128-bit GMAC authentication tag verifies ciphertext integrity prior to release</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 bg-[#040e06]/40">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Security Architecture
            </h4>
            <div className="space-y-2 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Zero Key Persistence in DB
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Plaintext Never Stored or Logged
              </div>
              <div className="flex items-center gap-2 text-emerald-400">
                <Check className="w-3.5 h-3.5" /> Real-Time Audit Metadata Logged
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational "How It Works" Section */}
      <HowItWorksSection
        algorithmName="AES-256-GCM (Authenticated Encryption)"
        subtitle="Symmetric authenticated cipher combining high-speed counter mode encryption with GMAC integrity verification."
        badge="NIST FIPS 197 & SP 800-38D"
        themeColor="emerald"
        purpose="AES-256-GCM provides simultaneous confidentiality and message integrity. It is used as the global standard for securing data in transit (TLS 1.3, HTTPS, SSH) and data at rest (database encryption, cloud storage disks). Because it is an AEAD (Authenticated Encryption with Associated Data) cipher, it guarantees that any unauthorized alteration of the encrypted message is detected immediately."
        diagramSteps={[
          { title: '1. User Input', subtitle: 'Plaintext + Passphrase', icon: FileText },
          { title: '2. Scrypt KDF', subtitle: 'Stretches Passphrase + 16B Salt', icon: Key },
          { title: '3. AES-GCM Engine', subtitle: 'CTR Encryption + Fresh 12B Nonce', icon: Cpu },
          { title: '4. AEAD Output', subtitle: 'Ciphertext + 16B Tag (Base64)', icon: ShieldCheck },
        ]}
        workflowSteps={[
          {
            title: 'Passphrase & Salt Ingestion',
            tag: 'Step 1',
            description: 'The user provides plaintext and a secret passphrase. The system generates a cryptographically fresh 16-byte random salt using os.urandom(16) to defeat precomputed rainbow tables.',
          },
          {
            title: 'Scrypt Key Derivation (KDF)',
            tag: 'Step 2',
            description: 'Scrypt (N=16384, r=8, p=1) expands the low-entropy passphrase into a uniformly distributed 256-bit (32-byte) binary symmetric key through memory-hard computations.',
          },
          {
            title: 'Fresh Nonce Generation',
            tag: 'Step 3',
            description: 'A fresh 12-byte (96-bit) random nonce (Number Used Once) is generated. In GCM mode, reusing a nonce with the same key breaks authentication completely, so fresh nonces are strictly enforced.',
          },
          {
            title: 'Galois/Counter Mode (GCM) Encryption',
            tag: 'Step 4',
            description: 'AES-256 encrypts incrementing counter blocks derived from the nonce. The plaintext is XORed with the keystream to produce the ciphertext.',
          },
          {
            title: 'Galois MAC (GMAC) Tag Generation',
            tag: 'Step 5',
            description: 'GCM computes an algebraic 128-bit (16-byte) authentication tag over the ciphertext and nonce in the Galois field GF(2^128). This tag acts as an unforgeable cryptographic seal.',
          },
          {
            title: 'Base64 Serialization & Verification',
            tag: 'Step 6',
            description: 'The binary ciphertext, tag, nonce, and salt are converted into safe ASCII Base64 strings. During decryption, the tag is verified before any plaintext is released.',
          },
        ]}
        concepts={[
          {
            term: 'Symmetric Encryption',
            badge: '256-bit Key',
            definition: 'Uses the exact same secret key for both encryption and decryption. Both sender and receiver must protect this key.',
          },
          {
            term: 'Scrypt KDF',
            badge: 'Memory-Hard',
            definition: 'A password-stretching algorithm requiring 16 MB of sequential RAM access, rendering GPU/ASIC brute-force cracking cost-prohibitive.',
          },
          {
            term: 'Random Salt (16 Bytes)',
            badge: '128-bit Entropy',
            definition: 'Random bytes mixed into the passphrase during KDF execution so identical passwords produce completely unique keys.',
          },
          {
            term: 'Nonce (12 Bytes)',
            badge: 'Must Never Repeat',
            definition: 'Number Used Once. Initializes the GCM counter. Reusing a nonce with the same key fatally compromises GCM authenticity.',
          },
          {
            term: 'Authentication Tag (16B)',
            badge: 'GMAC Integrity Seal',
            definition: 'A 128-bit cryptographic checksum. Any change to a single bit of ciphertext or nonce causes tag verification to fail.',
          },
          {
            term: 'Base64 Encoding',
            badge: 'Data Representation',
            definition: 'Translates raw binary bytes into printable ASCII characters for safe JSON transport. Base64 is an encoding format, NOT encryption.',
          },
        ]}
        example={{
          title: 'Encrypted Message Demonstration',
          inputs: [
            { label: 'Plaintext', value: '"Confidential Research Data"' },
            { label: 'Passphrase', value: '"MySecretPass#2026"' },
          ],
          process: 'Scrypt stretches passphrase with 16B salt into a 256-bit key. AES-GCM encrypts with a fresh 12B nonce and computes a 16B GMAC tag.',
          outputs: [
            { label: 'Ciphertext (B64)', value: '"7kLm9Qx...pZ=="' },
            { label: 'Tag (B64)', value: '"a1B2c3...9w=="' },
            { label: 'Nonce (B64)', value: '"x9Y2k...1A=="' },
          ],
          note: 'Notice: If even a single character in the ciphertext is altered by an adversary, the backend traps InvalidTag and immediately rejects decryption.',
        }}
        securityNotes={[
          {
            type: 'benefit',
            title: 'AEAD Integrity Protection',
            description: 'Unlike older modes (CBC/ECB), GCM detects bit-flipping and ciphertext tampering instantly before releasing plaintext.',
          },
          {
            type: 'benefit',
            title: 'Hardware Acceleration',
            description: 'Modern CPUs execute AES instructions (AES-NI) in hardware at multiple gigabytes per second with constant-time execution.',
          },
          {
            type: 'warning',
            title: 'Nonce Reuse Catastrophe',
            description: 'Reusing a nonce with the same key in GCM destroys authenticity and leaks plaintext XOR differentials.',
          },
          {
            type: 'warning',
            title: 'Authentication Failure Behavior',
            description: 'If the passphrase is wrong or 1 bit of ciphertext is modified, the backend safely returns a 400 error without leaking partial plaintext.',
          },
        ]}
        keyTakeaway="AES-256-GCM guarantees that if your ciphertext is altered by even one bit, the authentication tag fails and the message is instantly rejected."
      />
    </div>
  );
}
