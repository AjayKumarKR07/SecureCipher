import React, { useState } from 'react';
import {
  KeyRound,
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
  ShieldCheck,
  Info,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { generateRSAKeys, encryptRSA, decryptRSA } from '../services/api';
import HowItWorksSection from '../components/HowItWorksSection';

export default function RSAPage({ onOperationSuccess }) {
  const [activeTab, setActiveTab] = useState('encrypt');

  // Key Generation State
  const [keyGenSize, setKeyGenSize] = useState('2048');
  const [keyGenLoading, setKeyGenLoading] = useState(false);
  const [keyGenError, setKeyGenError] = useState('');
  const [generatedKeys, setGeneratedKeys] = useState(null);

  // Encryption State
  const [encryptPlaintext, setEncryptPlaintext] = useState('Secret session key or sensitive contract hash to encrypt with RSA public key.');
  const [encryptPublicKey, setEncryptPublicKey] = useState('');
  const [encryptLoading, setEncryptLoading] = useState(false);
  const [encryptResult, setEncryptResult] = useState(null);
  const [encryptError, setEncryptError] = useState('');

  // Decryption State
  const [decryptCiphertext, setDecryptCiphertext] = useState('');
  const [decryptPrivateKey, setDecryptPrivateKey] = useState('');
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

  // Byte length of current plaintext
  const plaintextByteLength = new TextEncoder().encode(encryptPlaintext).length;
  const maxBytes2048 = 190;
  const maxBytes3072 = 318;

  // Handle Key Generation
  const handleGenerateKeys = async () => {
    setKeyGenError('');
    setKeyGenLoading(true);
    try {
      const data = await generateRSAKeys(parseInt(keyGenSize, 10));
      const normalizedKeys = {
        ...data,
        public_key: data.public_key_pem,
        private_key: data.private_key_pem,
      };
      setGeneratedKeys(normalizedKeys);
      // Auto-populate public and private keys
      setEncryptPublicKey(data.public_key_pem);
      setDecryptPrivateKey(data.private_key_pem);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setKeyGenError(err.message || 'Key generation failed.');
    } finally {
      setKeyGenLoading(false);
    }
  };

  // Handle Encryption
  const handleEncrypt = async (e) => {
    e.preventDefault();
    setEncryptError('');
    setEncryptResult(null);

    if (!encryptPlaintext.trim()) {
      setEncryptError('Plaintext payload cannot be empty.');
      return;
    }
    if (!encryptPublicKey.trim()) {
      setEncryptError('Recipient RSA Public Key (PEM format) is required.');
      return;
    }

    setEncryptLoading(true);
    try {
      const data = await encryptRSA(encryptPlaintext, encryptPublicKey.trim());
      setEncryptResult(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setEncryptError(err.message || 'RSA encryption failed. Verify your public key PEM and payload length.');
    } finally {
      setEncryptLoading(false);
    }
  };

  // Transfer Encrypted Ciphertext to Decrypt tab
  const handleTransferToDecrypt = () => {
    if (!encryptResult) return;
    setDecryptCiphertext(encryptResult.ciphertext);
    if (generatedKeys?.private_key) {
      setDecryptPrivateKey(generatedKeys.private_key);
    }
    setDecryptResult(null);
    setDecryptError('');
    setActiveTab('decrypt');
  };

  // Handle Decryption
  const handleDecrypt = async (e) => {
    e.preventDefault();
    setDecryptError('');
    setDecryptResult(null);

    if (!decryptCiphertext.trim()) {
      setDecryptError('RSA Ciphertext (Base64) is required.');
      return;
    }
    if (!decryptPrivateKey.trim()) {
      setDecryptError('RSA Private Key (PEM format) is required for decryption.');
      return;
    }

    setDecryptLoading(true);
    try {
      const data = await decryptRSA(decryptCiphertext.trim(), decryptPrivateKey.trim());
      setDecryptResult(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setDecryptError(err.message || 'Decryption failed. Please verify that the private key matches the public key used during encryption and the ciphertext is unmodified.');
    } finally {
      setDecryptLoading(false);
    }
  };



  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-[#04160d] border border-teal-500/30 text-teal-400">
              <KeyRound className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              RSA Public-Key Cryptosystem
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            NIST FIPS 186-5 & RFC 8017 | OAEP with SHA-256 & MGF1 | PEM PKCS#8 & SPKI
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle"></span>
            Engine Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#04160d] text-teal-300 border border-teal-500/30">
            OAEP-SHA256
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#06180a] text-emerald-300 border border-emerald-500/30">
            2048 / 3072-bit
          </span>
        </div>
      </div>

      {/* Real Key Generator Workbench */}
      <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-teal-400" />
              <span>Cryptographic Keypair Generator</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Generate genuine cryptographically secure RSA keypairs (e = 65537) via the FastAPI backend.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={keyGenSize}
              onChange={(e) => setKeyGenSize(e.target.value)}
              className="bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
            >
              <option value="2048">RSA-2048 (190 bytes max payload)</option>
              <option value="3072">RSA-3072 (318 bytes max payload)</option>
            </select>
            <button
              type="button"
              onClick={handleGenerateKeys}
              disabled={keyGenLoading}
              className="px-4 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-blue-950/50 flex items-center gap-1.5 transition-all"
            >
              {keyGenLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating Primes...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Generate Keypair</span>
                </>
              )}
            </button>
          </div>
        </div>

        {keyGenError && (
          <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{keyGenError}</span>
          </div>
        )}

        {generatedKeys && (
          <div className="mt-4 pt-4 border-t border-emerald-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>RSA-{generatedKeys.key_size} Keypair Generated Successfully</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#040e06] border border-emerald-500/20">
                {generatedKeys.execution_duration_ms} ms
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Public Key Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-teal-300 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> Public Key (SPKI PEM)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setEncryptPublicKey(generatedKeys.public_key)}
                      className="text-[11px] text-teal-400 hover:underline"
                    >
                      Use in Encrypt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedKeys.public_key, 'gen-pub')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'gen-pub' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'gen-pub' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={generatedKeys.public_key}
                  className="w-full bg-[#030a04] border border-emerald-500/20 rounded-lg p-2 font-mono text-[11px] text-emerald-200/90 select-all focus:outline-none"
                />
              </div>

              {/* Private Key Card */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-emerald-300 flex items-center gap-1">
                    <Unlock className="w-3.5 h-3.5" /> Private Key (PKCS#8 PEM)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDecryptPrivateKey(generatedKeys.private_key)}
                      className="text-[11px] text-emerald-400 hover:underline"
                    >
                      Use in Decrypt
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedKeys.private_key, 'gen-priv')}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'gen-priv' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'gen-priv' ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={4}
                  value={generatedKeys.private_key}
                  className="w-full bg-[#030a04] border border-emerald-500/20 rounded-lg p-2 font-mono text-[11px] text-emerald-200/90 select-all focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-emerald-500/20">
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Zero-Storage: Private keys exist only in client memory.</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Tabs & Mathematics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-5">
          {/* Tabs: Encrypt / Decrypt */}
          <div className="flex rounded-lg bg-[#040e06] p-1 border border-emerald-500/20">
            <button
              onClick={() => { setActiveTab('encrypt'); setEncryptError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'encrypt' ? 'bg-teal-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Public Key Encryption</span>
            </button>
            <button
              onClick={() => { setActiveTab('decrypt'); setDecryptError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'decrypt' ? 'bg-emerald-500 text-slate-950 font-bold shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Private Key Decryption</span>
            </button>
          </div>

          {/* TAB 1: ENCRYPTION */}
          {activeTab === 'encrypt' && (
            <form onSubmit={handleEncrypt} className="space-y-4">
              {/* Recipient Public Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Recipient Public Key (PEM)
                  </label>
                  {generatedKeys?.public_key && (
                    <button
                      type="button"
                      onClick={() => setEncryptPublicKey(generatedKeys.public_key)}
                      className="text-[11px] text-teal-400 hover:underline font-mono"
                    >
                      Paste Generated Public Key
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={encryptPublicKey}
                  onChange={(e) => setEncryptPublicKey(e.target.value)}
                  placeholder="-----BEGIN PUBLIC KEY-----&#10;MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...&#10;-----END PUBLIC KEY-----"
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
              </div>

              {/* Input Payload with Live Byte Counter */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Input Plaintext Payload
                  </label>
                  <span
                    className={`text-[11px] font-mono ${
                      plaintextByteLength > maxBytes3072
                        ? 'text-rose-400 font-bold'
                        : plaintextByteLength > maxBytes2048
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {plaintextByteLength} bytes / Max: {maxBytes2048}B (2048) or {maxBytes3072}B (3072)
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={encryptPlaintext}
                  onChange={(e) => setEncryptPlaintext(e.target.value)}
                  placeholder="Enter sensitive message or session key to encrypt..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
                />
                {plaintextByteLength > maxBytes2048 && (
                  <p className="mt-1 text-[11px] text-amber-300 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    <span>Payload is {plaintextByteLength} bytes. For RSA-2048 with OAEP-SHA256, maximum capacity is 190 bytes (requires RSA-3072 or hybrid AES encryption).</span>
                  </p>
                )}
              </div>

              {/* Encryption Error */}
              {encryptError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{encryptError}</span>
                </div>
              )}

              {/* Encrypt Submit Button */}
              <button
                type="submit"
                disabled={encryptLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-blue-950/40 transition-all flex items-center justify-center gap-2"
              >
                {encryptLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Encrypting via OAEP-SHA256...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Encrypt with RSA Public Key</span>
                  </>
                )}
              </button>

              {/* Encryption Output Card */}
              {encryptResult && (
                <div className="mt-5 space-y-3 p-4 rounded-xl bg-[#040e06]/90 border border-teal-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>RSA-{encryptResult.key_size} Ciphertext (OAEP-SHA256)</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      {encryptResult.execution_duration_ms} ms
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ciphertext (Base64 Encoded):</span>
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

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                    <button
                      type="button"
                      onClick={handleTransferToDecrypt}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <span>Transfer to Decrypt Tab</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(JSON.stringify(encryptResult, null, 2), 'json')}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-emerald-500/25 flex items-center gap-1.5 transition-colors"
                    >
                      {copiedKey === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'json' ? 'JSON Copied' : 'Copy Complete JSON'}</span>
                    </button>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: DECRYPTION */}
          {activeTab === 'decrypt' && (
            <form onSubmit={handleDecrypt} className="space-y-4">
              {/* Private Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    Recipient Private Key (PKCS#8 PEM)
                  </label>
                  {generatedKeys?.private_key && (
                    <button
                      type="button"
                      onClick={() => setDecryptPrivateKey(generatedKeys.private_key)}
                      className="text-[11px] text-emerald-400 hover:underline font-mono"
                    >
                      Paste Generated Private Key
                    </button>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={decryptPrivateKey}
                  onChange={(e) => setDecryptPrivateKey(e.target.value)}
                  placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ...&#10;-----END PRIVATE KEY-----"
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Ciphertext Input */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  RSA Ciphertext (Base64)
                </label>
                <textarea
                  rows={3}
                  value={decryptCiphertext}
                  onChange={(e) => setDecryptCiphertext(e.target.value)}
                  placeholder="Paste Base64 encoded RSA ciphertext..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Decryption Error */}
              {decryptError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{decryptError}</span>
                </div>
              )}

              {/* Decrypt Submit Button */}
              <button
                type="submit"
                disabled={decryptLoading}
                className="w-full py-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 transition-all flex items-center justify-center gap-2"
              >
                {decryptLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Inverting Modulus & Verifying OAEP...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Decrypt with RSA Private Key</span>
                  </>
                )}
              </button>

              {/* Decryption Output Card */}
              {decryptResult && (
                <div className="mt-5 space-y-3 p-4 rounded-xl bg-[#040e06]/90 border border-emerald-500/40">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Decryption Verified</span>
                    </span>
                    <span className="text-[11px] font-mono text-emerald-300 px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800">
                      {decryptResult.execution_duration_ms} ms
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Restored Plaintext:</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(decryptResult.plaintext, 'pt')}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                      >
                        {copiedKey === 'pt' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'pt' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="p-3 rounded bg-[#030a04] font-mono text-xs text-emerald-200 border border-emerald-500/20 break-all select-all">
                      {decryptResult.plaintext}
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Mathematics & Architectural Specifications */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span>RSA Mathematical Foundation</span>
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Prime Generation:</strong> Primes p and q randomly generated with high-entropy CSPRNG.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Modulus:</strong> n = p × q, φ(n) = (p - 1)(q - 1).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Public Exponent:</strong> e = 65537 (Fermat prime F₄, gcd(e, φ(n)) = 1).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Private Exponent:</strong> d ≡ e⁻¹ (mod φ(n)).</span>
              </li>
            </ul>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20">
            <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <span>OAEP Padding & Payload Limits</span>
            </h3>
            <div className="text-xs text-slate-300 space-y-2 leading-relaxed">
              <p>
                <strong>OAEP (RFC 8017):</strong> Uses SHA-256 and Mask Generation Function 1 (MGF1). OAEP adds randomized entropy to prevent Coppersmith and Bleichenbacher chosen-ciphertext attacks (IND-CCA2 secure).
              </p>
              <div className="p-2.5 rounded bg-[#040e06] border border-emerald-500/20 font-mono text-[11px] text-teal-300 space-y-1">
                <div>Max Payload = k - 2 × hLen - 2</div>
                <div className="text-slate-400">• RSA-2048: 256 - 64 - 2 = <strong>190 bytes</strong></div>
                <div className="text-slate-400">• RSA-3072: 384 - 64 - 2 = <strong>318 bytes</strong></div>
              </div>
              <p className="text-slate-400 text-[11px]">
                In enterprise cryptography, RSA is used in hybrid schemes to wrap symmetric keys (e.g., AES-256-GCM), which in turn encrypt bulk files.
              </p>
            </div>
          </div>

          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 bg-[#040e06]/40">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Security Architecture
            </h4>
            <div className="space-y-1.5 text-[11px] text-slate-400 font-mono">
              <div className="text-emerald-400">• Real Cryptography Engine Active</div>
              <div className="text-emerald-400">• Zero Plaintext Stored in DB</div>
              <div className="text-emerald-400">• Zero Private Keys Logged</div>
              <div className="text-emerald-400">• Audit History Tracks Metadata Only</div>
            </div>
          </div>
        </div>
      </div>

      {/* Educational "How It Works" Section */}
      <HowItWorksSection
        algorithmName="RSA-OAEP Public-Key Cryptosystem"
        subtitle="Asymmetric cryptosystem based on prime factorization with randomized OAEP-SHA256 padding for IND-CCA2 security."
        badge="NIST FIPS 186-5 & RFC 8017"
        themeColor="emerald"
        purpose="RSA is an asymmetric cryptosystem where encryption and decryption use mathematically linked, distinct keys. It is primarily used for secure key transport (wrapping symmetric keys like AES), digital certificates, and digital signatures. Anyone with the public key can encrypt data, but only the holder of the matching private key can reverse the mathematical trapdoor and decrypt it."
        diagramSteps={[
          { title: '1. Plaintext + Public Key', subtitle: 'Short message (<= 190B) + SPKI PEM', icon: FileText },
          { title: '2. OAEP Padding (SHA-256)', subtitle: 'Random Seed + MGF1 Masking', icon: ShieldCheck },
          { title: '3. Modular Exponentiation', subtitle: 'c = m^e mod n (e = 65537)', icon: Cpu },
          { title: '4. Private Key Decrypt', subtitle: 'm = c^d mod n -> Original Plaintext', icon: KeyRound },
        ]}
        workflowSteps={[
          {
            title: 'Keypair Generation',
            tag: 'Primes p & q',
            description: 'The recipient generates two large random primes p and q. The modulus n = p * q is computed along with public exponent e = 65537 and private exponent d = e^-1 mod phi(n).',
          },
          {
            title: 'Key Distribution',
            tag: 'PEM Format',
            description: 'The public key is published in SubjectPublicKeyInfo (SPKI) PEM format. The private key (PKCS#8 PEM) is kept strictly secret by the recipient.',
          },
          {
            title: 'Plaintext Byte Limit Check',
            tag: '190B / 318B',
            description: 'The message length is verified against the OAEP limit: max 190 bytes for RSA-2048, or 318 bytes for RSA-3072. Oversized messages are rejected.',
          },
          {
            title: 'OAEP-SHA256 Padding',
            tag: 'RFC 8017',
            description: 'A fresh random 32-byte seed is generated. The Mask Generation Function (MGF1 with SHA-256) masks both the seed and data block to achieve IND-CCA2 security.',
          },
          {
            title: 'Modular Encryption',
            tag: 'c = m^e mod n',
            description: 'The padded integer block is raised to power e modulo n. The resulting 256-byte (for 2048-bit) binary ciphertext is encoded into Base64.',
          },
          {
            title: 'Private Key Inversion & Verification',
            tag: 'm = c^d mod n',
            description: 'The recipient raises ciphertext to power d modulo n. OAEP unpadding verifies the structural delimiters and hash label before releasing plaintext.',
          },
        ]}
        concepts={[
          {
            term: 'Public Key (n, e)',
            badge: 'Encryption Key',
            definition: 'Freely distributed key used by anyone to encrypt messages intended for the owner. It cannot decrypt messages.',
          },
          {
            term: 'Private Key (n, d)',
            badge: 'Decryption Key',
            definition: 'Confidential key held solely by the recipient. Used to decrypt ciphertexts and create digital signatures.',
          },
          {
            term: 'OAEP Padding',
            badge: 'MGF1-SHA256',
            definition: 'Optimal Asymmetric Encryption Padding. A Feistel-like padding scheme using SHA-256 and MGF1 to prevent chosen-ciphertext attacks.',
          },
          {
            term: 'Payload Limit (k - 2hLen - 2)',
            badge: 'Modulus Bound',
            definition: 'RSA can only encrypt blocks smaller than the modulus. RSA-2048 holds max 190 bytes; RSA-3072 holds max 318 bytes.',
          },
          {
            term: 'PEM & Base64',
            badge: 'Key Encoding',
            definition: 'Privacy-Enhanced Mail format. Wraps Base64-encoded ASN.1 DER binary keys between header and footer dashed text markers.',
          },
          {
            term: 'Encryption vs Digital Signatures',
            badge: 'Role Reversal',
            definition: 'Encryption uses the recipient public key to protect confidentiality. Signatures use the sender private key to prove authenticity.',
          },
        ]}
        example={{
          title: 'Symmetric Session Key Encapsulation',
          inputs: [
            { label: 'Plaintext', value: '"AES-256-Key: 9f8a3c...7e (32 bytes)"' },
            { label: 'Public Key', value: '2048-bit SPKI PEM' },
          ],
          process: 'OAEP pads 32-byte AES key with random seed into 256-byte block. Modulus n computes c = m^65537 mod n.',
          outputs: [
            { label: 'Ciphertext', value: '256 bytes Base64 string' },
            { label: 'Decrypted', value: 'Original 32-byte AES Key' },
          ],
          note: 'Notice: In real-world protocols (TLS/PGP), RSA is used to encrypt small symmetric keys (hybrid encryption), while AES encrypts large files.',
        }}
        securityNotes={[
          {
            type: 'benefit',
            title: 'Zero Shared Secret Pre-Agreement',
            description: 'Allows secure communication without requiring sender and recipient to share a pre-existing password or secret key.',
          },
          {
            type: 'benefit',
            title: 'IND-CCA2 Security via OAEP',
            description: 'OAEP padding prevents Coppersmith, Bleichenbacher padding oracle, and chosen-ciphertext attacks.',
          },
          {
            type: 'warning',
            title: 'Short Message Restriction',
            description: 'RSA cannot encrypt large files directly. It is designed to encrypt small payloads (<= 190 bytes for RSA-2048) or wrap symmetric keys.',
          },
          {
            type: 'warning',
            title: 'Private Key Protection',
            description: 'If an adversary compromises the private key, all historical and future messages encrypted with the matching public key can be decrypted.',
          },
        ]}
        keyTakeaway="RSA-OAEP is designed for short secrets like symmetric session keys, relying on prime factorization to let anyone encrypt while only the private key owner can decrypt."
      />
    </div>
  );
}
