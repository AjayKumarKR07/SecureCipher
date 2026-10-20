import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  AlertTriangle,
  Cpu,
  Copy,
  Check,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  ShieldCheck,
  Scale,
  Hash,
  AlertCircle,
  CheckCircle2,
  FileText,
  Layers,
  Key,
} from 'lucide-react';
import { encryptDES, decryptDES } from '../services/api';
import HowItWorksSection from '../components/HowItWorksSection';

export default function DESPage({ onOperationSuccess }) {
  const [activeTab, setActiveTab] = useState('encrypt');

  // Encryption State
  const [encPlaintext, setEncPlaintext] = useState('Historical Feistel block transformation test');
  const [encKey, setEncKey] = useState('DESKEY56');
  const [encResult, setEncResult] = useState(null);
  const [encLoading, setEncLoading] = useState(false);
  const [encError, setEncError] = useState('');

  // Decryption State
  const [decCiphertext, setDecCiphertext] = useState('');
  const [decIv, setDecIv] = useState('');
  const [decKey, setDecKey] = useState('DESKEY56');
  const [decResult, setDecResult] = useState(null);
  const [decLoading, setDecLoading] = useState(false);
  const [decError, setDecError] = useState('');

  // Clipboard copy state
  const [copiedKey, setCopiedKey] = useState('');

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(''), 2000);
  };

  // 1. Encryption Handler
  const handleEncrypt = async (e) => {
    if (e) e.preventDefault();
    if (encKey.length !== 8) {
      setEncError('DES key must be exactly 8 ASCII characters (64-bit with 56 effective bits).');
      return;
    }
    setEncLoading(true);
    setEncError('');
    try {
      const res = await encryptDES(encPlaintext, encKey);
      setEncResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setEncError(err.message || 'DES encryption failed');
    } finally {
      setEncLoading(false);
    }
  };

  // 2. Decryption Handler
  const handleDecrypt = async (e) => {
    if (e) e.preventDefault();
    if (decKey.length !== 8) {
      setDecError('DES key must be exactly 8 ASCII characters (64-bit with 56 effective bits).');
      return;
    }
    setDecLoading(true);
    setDecError('');
    try {
      const res = await decryptDES(decCiphertext, decKey, decIv);
      setDecResult(res);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setDecError(err.message || 'DES decryption failed');
    } finally {
      setDecLoading(false);
    }
  };

  // Quick transfer from encrypt to decrypt
  const handleTransferToDecrypt = () => {
    if (encResult) {
      setDecCiphertext(encResult.ciphertext);
      setDecIv(encResult.iv);
      setDecKey(encKey);
      setActiveTab('decrypt');
      setDecResult(null);
      setDecError('');
    }
  };



  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-[#06180a] border border-emerald-500/40 text-emerald-400">
              <Lock className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              DES (Data Encryption Standard)
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            FIPS 46-3 Legacy Feistel Cipher | 64-bit blocks with 56-bit key in CBC mode
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse-subtle"></span>
            EDUCATIONAL ONLY
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
            Withdrawn 2005
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#06180a] text-emerald-300 border border-emerald-500/30">
            56-bit Key Space
          </span>
        </div>
      </div>

      {/* Prominent Educational Warning */}
      <div className="rounded-xl border border-emerald-500/30 bg-[#040e06] p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed space-y-1">
          <div>
            <strong className="text-emerald-300">HISTORICAL CIPHER ADVISORY:</strong> DES is cryptographically obsolete and was officially withdrawn by NIST in 2005. Its small 56-bit key space (2⁵⁶ ≈ 7.2×10¹⁶ keys) can be exhaustively brute-forced in hours by modern hardware.
          </div>
          <div className="text-[11px] text-slate-400">
            <strong>Unauthenticated CBC Mode:</strong> CBC mode provides NO cryptographic integrity or authentication and is vulnerable to bit-flipping attacks. <strong>NEVER</strong> use DES to protect sensitive or production data. SecureCipher implements DES strictly for academic Feistel network analysis and comparative study against AES.
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-emerald-500/20 gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => {
            setActiveTab('encrypt');
            setEncError('');
          }}
          className={`shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all min-h-[40px] cursor-pointer ${
            activeTab === 'encrypt'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#040e06]/40'
          }`}
        >
          <Lock className="w-3.5 h-3.5" />
          <span>DES-CBC Encryption</span>
        </button>
        <button
          onClick={() => {
            setActiveTab('decrypt');
            setDecError('');
          }}
          className={`shrink-0 px-4 py-2.5 text-xs font-medium border-b-2 flex items-center gap-2 transition-all min-h-[40px] cursor-pointer ${
            activeTab === 'decrypt'
              ? 'border-emerald-500 text-emerald-300 bg-emerald-950/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-[#040e06]/40'
          }`}
        >
          <Unlock className="w-3.5 h-3.5" />
          <span>DES-CBC Decryption</span>
        </button>
      </div>

      {/* Main Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-5">
          {/* TAB 1: ENCRYPTION */}
          {activeTab === 'encrypt' && (
            <form onSubmit={handleEncrypt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Plaintext Message
                </label>
                <textarea
                  rows={3}
                  value={encPlaintext}
                  onChange={(e) => setEncPlaintext(e.target.value)}
                  placeholder="Enter UTF-8 message to encrypt with DES-CBC..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <label className="text-xs font-medium text-slate-300">
                    56-Bit Secret Key (Exactly 8 ASCII characters)
                  </label>
                  <span
                    className={`font-mono text-[11px] ${
                      encKey.length === 8 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {encKey.length} / 8 chars
                  </span>
                </div>
                <input
                  type="text"
                  value={encKey}
                  maxLength={8}
                  onChange={(e) => setEncKey(e.target.value)}
                  placeholder="e.g. DESKEY56"
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  64-bit representation where 8 bits are parity bits, leaving 56 effective key bits.
                </p>
              </div>

              <button
                type="submit"
                disabled={encLoading || encKey.length !== 8}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {encLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Executing 16 Feistel Rounds...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Encrypt with DES-CBC (Educational)</span>
                  </>
                )}
              </button>

              {encError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{encError}</span>
                </div>
              )}

              {/* Encryption Result Output */}
              {encResult && (
                <div className="p-4 rounded-lg bg-[#040e06]/90 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      DES-CBC Ciphertext Output:
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {encResult.execution_duration_ms} ms
                    </span>
                  </div>

                  {/* Ciphertext */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Ciphertext (Base64):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(encResult.ciphertext, 'enc-ct')}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'enc-ct' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'enc-ct' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-emerald-300 bg-[#030a04] p-2.5 rounded border border-emerald-500/20 break-all select-all font-bold">
                      {encResult.ciphertext}
                    </div>
                  </div>

                  {/* Initialization Vector */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span>Fresh Random IV (Base64 - 8 bytes):</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(encResult.iv, 'enc-iv')}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'enc-iv' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'enc-iv' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-xs text-emerald-300 bg-[#030a04] p-2.5 rounded border border-emerald-500/20 break-all select-all">
                      {encResult.iv}
                    </div>
                  </div>

                  {/* Security Notice on Result */}
                  <div className="p-2.5 rounded bg-[#030a04] border border-emerald-500/30 text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span>
                      <strong className="text-emerald-300">Authentication Status:</strong> None (CBC mode does not verify integrity).
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleTransferToDecrypt}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold flex items-center gap-1 shadow transition-colors cursor-pointer"
                      >
                        <span>Transfer to Decrypt</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}

          {/* TAB 2: DECRYPTION */}
          {activeTab === 'decrypt' && (
            <form onSubmit={handleDecrypt} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Ciphertext (Base64)
                </label>
                <textarea
                  rows={3}
                  value={decCiphertext}
                  onChange={(e) => setDecCiphertext(e.target.value)}
                  placeholder="Paste Base64-encoded ciphertext..."
                  className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Initialization Vector (IV - Base64)
                  </label>
                  <input
                    type="text"
                    value={decIv}
                    onChange={(e) => setDecIv(e.target.value)}
                    placeholder="Paste 8-byte Base64 IV..."
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label className="text-xs font-medium text-slate-300">
                      Secret Key (8 chars)
                    </label>
                    <span
                      className={`font-mono text-[11px] ${
                        decKey.length === 8 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {decKey.length} / 8 chars
                    </span>
                  </div>
                  <input
                    type="text"
                    value={decKey}
                    maxLength={8}
                    onChange={(e) => setDecKey(e.target.value)}
                    placeholder="e.g. DESKEY56"
                    className="w-full bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={decLoading || !decCiphertext || !decIv || decKey.length !== 8}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {decLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Inverting 16 Feistel Rounds...</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4 text-slate-950" />
                    <span>Decrypt DES Ciphertext</span>
                  </>
                )}
              </button>

              {decError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{decError}</span>
                </div>
              )}

              {/* Decryption Result Output */}
              {decResult && (
                <div className="p-4 rounded-lg bg-[#040e06]/90 border border-emerald-500/40 space-y-3">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      Decrypted Plaintext Output:
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-slate-400">
                        {decResult.execution_duration_ms} ms
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(decResult.plaintext, 'dec-pt')}
                        className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'dec-pt' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedKey === 'dec-pt' ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="font-mono text-xs text-white bg-[#030a04] p-3 rounded border border-emerald-500/20 break-all select-all font-semibold">
                    {decResult.plaintext}
                  </div>

                  {/* CBC Tamper Warning */}
                  <div className="p-3 rounded bg-emerald-950/30 border border-emerald-500/30 text-xs text-slate-300 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="font-semibold text-emerald-300">
                        Zero Authentication Notice (is_authenticated: false):
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {decResult.tamper_warning}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </form>
          )}
        </div>

        {/* Technical Anatomy Side Panel */}
        <div className="space-y-4">
          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>DES Architecture</span>
            </h3>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Block Size:</strong> 64 bits (split into L₀ and R₀ 32-bit halves)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Key Size:</strong> 56 bits effective (8 parity bits discarded)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Feistel Rounds:</strong> 16 iterative rounds with 8 non-linear S-boxes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1 shrink-0"></span>
                <span><strong>Exhaustive Brute Force:</strong> 2⁵⁶ keys cracked in hours</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0"></span>
                <span><strong>Sweet32 Risk:</strong> 64-bit blocks leak collisions after ~32 GB</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Educational "How It Works" Section */}
      <HowItWorksSection
        algorithmName="DES (Data Encryption Standard — Legacy Block Cipher)"
        subtitle="Historical 16-round symmetric Feistel cipher operating on 64-bit blocks with a deprecated 56-bit key space."
        badge="NIST FIPS 46-3 (Withdrawn 2005)"
        themeColor="emerald"
        warningBanner="INSECURE LEGACY CIPHER — EDUCATIONAL USE ONLY: DES has a critically small 56-bit key space that can be broken by brute-force in hours. CBC mode provides zero message authentication and is vulnerable to bit-flipping attacks. NEVER use DES for real data."
        purpose="DES was adopted by NBS (now NIST) in 1977 as the first public federal encryption standard for securing financial transactions and government communications. Today, it serves as an essential teaching benchmark in cryptanalysis to demonstrate the Feistel structure, S-box non-linearity, and why 56-bit key spaces are completely vulnerable to modern parallel brute-force attacks."
        diagramSteps={[
          { title: '1. Plaintext & Key', subtitle: 'UTF-8 Text + 8-Byte ASCII Key (56-bit)', icon: FileText },
          { title: '2. PKCS#7 Padding', subtitle: 'Aligns data to exact 8-Byte block boundary', icon: Layers },
          { title: '3. DES-CBC Engine', subtitle: '16 Feistel rounds with random 8-Byte IV', icon: Cpu },
          { title: '4. Base64 Output', subtitle: 'Ciphertext & IV encoded in Base64', icon: Lock },
        ]}
        workflowSteps={[
          {
            title: 'Key Validation & 56-Bit Reduction',
            tag: 'Step 1',
            description: 'The user supplies an 8-character ASCII key (64 bits). The least significant bit of each byte was historically used as an odd parity check, leaving only 56 bits of true cryptographic entropy (2^56 possible keys).',
          },
          {
            title: 'PKCS#7 Block Padding',
            tag: 'Step 2',
            description: 'Because DES encrypts in fixed 64-bit (8-byte) blocks, arbitrary plaintext must be padded. PKCS#7 appends N bytes each with value N (e.g., \\x05\\x05\\x05\\x05\\x05 for 3 bytes of remaining space) so the total length is an exact multiple of 8.',
          },
          {
            title: 'Random 8-Byte IV & CBC Chaining',
            tag: 'Step 3',
            description: 'A cryptographically fresh 8-byte Initialization Vector (IV) is generated via os.urandom(8). In Cipher Block Chaining (CBC) mode, each plaintext block is XORed with the preceding ciphertext block (or IV for the first block) before 16 rounds of Feistel substitution-permutation.',
          },
          {
            title: 'Ciphertext Emission & Base64 Encoding',
            tag: 'Step 4',
            description: 'The resulting binary ciphertext and random IV are encoded into Base64 strings for safe JSON transmission. Decryption reverses the process: executing 16 Feistel rounds with inverted subkeys, XORing with previous ciphertext/IV, and stripping PKCS#7 padding.',
          },
        ]}
        concepts={[
          {
            term: '56 Effective Key Bits',
            explanation: 'Although the DES key is 8 bytes (64 bits), 8 bits are parity bits, giving only 56 bits of real entropy. A keyspace of 2^56 (approx. 72 quadrillion keys) can be exhaustively searched in under a day using modern distributed GPU clusters.',
          },
          {
            term: '64-Bit Block Size & Sweet32',
            explanation: 'Encrypting in small 64-bit blocks creates collision vulnerabilities (Sweet32 attack). By the birthday paradox, after encrypting about 2^32 blocks (approx. 32 GB), ciphertext blocks repeat, leaking plaintext.',
          },
          {
            term: 'PKCS#7 Block Padding',
            explanation: 'Standard padding scheme that adds 1 to 8 bytes to fill the final 64-bit block. Each padding byte contains the integer count of padding bytes added, allowing deterministic unpadding.',
          },
          {
            term: 'CBC Mode & Lack of Authentication',
            explanation: 'CBC provides confidentiality but ZERO message integrity. An active attacker can flip bits in the IV or ciphertext block C_(i-1) to deterministically alter decrypted plaintext in block P_i without triggering any error.',
          },
          {
            term: '16-Round Feistel Structure',
            explanation: 'Splits 64 bits into two 32-bit halves (L, R). In each round: L_i = R_(i-1), R_i = L_(i-1) \u2295 F(R_(i-1), K_i). The decryption algorithm is mathematically identical to encryption, simply applying the 16 subkeys in reverse order.',
          },
          {
            term: 'Base64 Representation',
            explanation: 'Raw encrypted blocks and IVs are arbitrary binary bytes that corrupt plain text consoles. Base64 encodes these bytes into 64 ASCII characters for safe JSON transport.',
          },
        ]}
        example={{
          scenario: 'DES-CBC Encryption & Base64 Transmission',
          input: 'Plaintext: "Secret Message" | Key: "DESKEY56" (8 ASCII bytes)',
          process: 'Padded to 16 bytes (2 blocks) with \\x02\\x02. XORed with fresh 8-byte IV and run through 16 Feistel rounds per block.',
          output: 'Ciphertext: "3B1m...=" (Base64) | IV: "x9Ak...=" (Base64 8 bytes).',
        }}
        securityNotes={{
          benefits: [
            'Historically critical: Established modern symmetric block cipher theory and Feistel network design.',
            'Very simple hardware implementation: Feistel network uses the exact same circuit for encryption and decryption.',
            'Demonstrates the necessity of block padding (PKCS#7) and initialization vectors (IV).',
          ],
          limitations: [
            'CRITICAL: 56-bit key space is trivial to crack via brute-force (EFF Deep Crack broke DES in 1999; modern GPUs do it in hours).',
            'Unauthenticated CBC: Vulnerable to padding oracle attacks and deterministic bit-flipping tampering.',
            'Sweet32 birthday attacks leak data after only ~32 GB of encrypted traffic on 64-bit blocks.',
          ],
          warning: 'INSECURE: Withdrawn by NIST in 2005. Replace with AES-256-GCM for all production and sensitive applications.',
        }}
        keyTakeaway="DES is an insecure legacy 56-bit block cipher that lacks message authentication and must only be used for historical and educational study."
      />

      {/* Comprehensive DES vs AES Comparison Section */}
      <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-4">
        <div className="flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white tracking-tight uppercase font-mono">
            Cryptographic Comparison: Legacy DES vs Modern AES
          </h2>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The transition from DES to AES highlights the shift from 20th-century electromechanical hardware constraints to 21st-century software efficiency, large mathematical key spaces, and authenticated encryption.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-emerald-500/20 rounded-lg overflow-hidden">
            <thead className="bg-[#040e06]/90 text-slate-300 font-mono text-[11px]">
              <tr>
                <th className="p-3 border-b border-emerald-500/20">Cryptographic Metric</th>
                <th className="p-3 border-b border-emerald-500/20 text-slate-300 font-bold">DES (Legacy Standard)</th>
                <th className="p-3 border-b border-emerald-500/20 text-emerald-400 font-bold">AES (Current Gold Standard)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans text-xs">
              <tr className="hover:bg-[#040e06]/40">
                <td className="p-3 font-medium text-white">NIST Standardization</td>
                <td className="p-3 text-slate-300">FIPS 46-3 (1977, Withdrawn 2005)</td>
                <td className="p-3 text-emerald-300">FIPS 197 (2001, Active Standard)</td>
              </tr>
              <tr className="hover:bg-[#040e06]/40">
                <td className="p-3 font-medium text-white">Effective Key Length</td>
                <td className="p-3 text-rose-400 font-mono font-bold">56 bits (2⁵⁶ ≈ 7.2 × 10¹⁶ keys)</td>
                <td className="p-3 text-emerald-400 font-mono font-bold">128, 192, or 256 bits (2²⁵⁶ ≈ 1.15 × 10⁷⁷ keys)</td>
              </tr>
              <tr className="hover:bg-[#040e06]/40">
                <td className="p-3 font-medium text-white">Cipher Block Size</td>
                <td className="p-3 text-slate-300 font-mono">64 bits (Sweet32 vulnerability)</td>
                <td className="p-3 text-emerald-300 font-mono">128 bits (Immune to Sweet32 collisions)</td>
              </tr>
              <tr className="hover:bg-[#040e06]/40">
                <td className="p-3 font-medium text-white">Mathematical Structure</td>
                <td className="p-3 text-slate-300">16-round Feistel network</td>
                <td className="p-3 text-slate-300">Substitution-Permutation Network (SPN in GF(2⁸))</td>
              </tr>
              <tr className="hover:bg-[#040e06]/40">
                <td className="p-3 font-medium text-white">Mode of Operation</td>
                <td className="p-3 text-rose-300">CBC (Unauthenticated, bit-flipping risk)</td>
                <td className="p-3 text-emerald-300">GCM (Galois/Counter Mode - AEAD authenticated)</td>
              </tr>
              <tr className="hover:bg-[#040e06]/40">
                <td className="p-3 font-medium text-white">Brute-Force Feasibility</td>
                <td className="p-3 text-rose-400 font-semibold">Trivial: Cracked in under 24 hours</td>
                <td className="p-3 text-emerald-400 font-semibold">Computationally impossible with known physics</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Educational & Architectural Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Feistel Network</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            DES processes data by dividing 64 bits into two 32-bit halves: L(i) = R(i-1) and R(i) = L(i-1) ⊕ F(R(i-1), K(i)). Decryption is identical to encryption with reversed subkeys.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>EFF Deep Crack (1999)</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            In 1999, the Electronic Frontier Foundation (EFF) built "Deep Crack" for $250,000, which decrypted a DES message in 22 hours, proving 56-bit keys were fundamentally insecure.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Audit & Privacy Policy</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Zero-Knowledge Storage:</strong> The PostgreSQL audit log only records operation type and latency. Plaintexts, DES keys, and ciphertexts are <strong>never stored or logged</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
