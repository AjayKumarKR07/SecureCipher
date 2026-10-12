import React, { useState } from 'react';
import {
  Repeat,
  Key,
  Shield,
  ArrowRight,
  Info,
  Check,
  CheckCircle2,
  AlertCircle,
  Cpu,
  Copy,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Zap,
  FileText,
} from 'lucide-react';
import { generateDHKeypair, deriveDHSecret, simulateDHExchange } from '../services/api';
import HowItWorksSection from '../components/HowItWorksSection';

export default function DiffieHellmanPage({ onOperationSuccess }) {
  const [activeMode, setActiveMode] = useState('simulation'); // 'simulation' | 'workbench'

  // Clipboard copy tracker
  const [copiedKey, setCopiedKey] = useState(null);

  const handleCopy = (text, key) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // --- Mode 1: Automated Handshake Simulation State ---
  const [simulationLoading, setSimulationLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [simulationError, setSimulationError] = useState('');

  const handleRunSimulation = async () => {
    setSimulationError('');
    setSimulationLoading(true);
    try {
      const data = await simulateDHExchange();
      setSimulationResult(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setSimulationError(err.message || 'Diffie-Hellman handshake simulation failed.');
    } finally {
      setSimulationLoading(false);
    }
  };

  // --- Mode 2: Manual Dual-Party Workbench State ---
  // Alice State
  const [alicePrivKey, setAlicePrivKey] = useState('');
  const [alicePubKey, setAlicePubKey] = useState('');
  const [alicePeerPubKey, setAlicePeerPubKey] = useState('');
  const [aliceDerivedKey, setAliceDerivedKey] = useState(null);
  const [aliceLoading, setAliceLoading] = useState(false);
  const [aliceError, setAliceError] = useState('');

  // Bob State
  const [bobPrivKey, setBobPrivKey] = useState('');
  const [bobPubKey, setBobPubKey] = useState('');
  const [bobPeerPubKey, setBobPeerPubKey] = useState('');
  const [bobDerivedKey, setBobDerivedKey] = useState(null);
  const [bobLoading, setBobLoading] = useState(false);
  const [bobError, setBobError] = useState('');

  // Key Derivation Context Info
  const [kdfInfo, setKdfInfo] = useState('SecureCipher Diffie-Hellman KDF');

  // Alice: Generate Keypair
  const handleGenerateAlice = async () => {
    setAliceError('');
    setAliceLoading(true);
    try {
      const data = await generateDHKeypair('Alice');
      setAlicePrivKey(data.private_key_pem);
      setAlicePubKey(data.public_key_pem);
      // Auto-populate Bob's peer public key if empty
      if (!bobPeerPubKey) {
        setBobPeerPubKey(data.public_key_pem);
      }
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setAliceError(err.message || 'Alice key generation failed.');
    } finally {
      setAliceLoading(false);
    }
  };

  // Bob: Generate Keypair
  const handleGenerateBob = async () => {
    setBobError('');
    setBobLoading(true);
    try {
      const data = await generateDHKeypair('Bob');
      setBobPrivKey(data.private_key_pem);
      setBobPubKey(data.public_key_pem);
      // Auto-populate Alice's peer public key if empty
      if (!alicePeerPubKey) {
        setAlicePeerPubKey(data.public_key_pem);
      }
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setBobError(err.message || 'Bob key generation failed.');
    } finally {
      setBobLoading(false);
    }
  };

  // Alice: Derive Secret
  const handleDeriveAlice = async (e) => {
    e.preventDefault();
    setAliceError('');
    setAliceDerivedKey(null);

    if (!alicePrivKey.trim()) {
      setAliceError("Alice's private key is required.");
      return;
    }
    if (!alicePeerPubKey.trim()) {
      setAliceError("Bob's public key (peer key) is required.");
      return;
    }

    setAliceLoading(true);
    try {
      const data = await deriveDHSecret(alicePrivKey.trim(), alicePeerPubKey.trim(), kdfInfo.trim());
      setAliceDerivedKey(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setAliceError(err.message || 'Secret derivation failed.');
    } finally {
      setAliceLoading(false);
    }
  };

  // Bob: Derive Secret
  const handleDeriveBob = async (e) => {
    e.preventDefault();
    setBobError('');
    setBobDerivedKey(null);

    if (!bobPrivKey.trim()) {
      setBobError("Bob's private key is required.");
      return;
    }
    if (!bobPeerPubKey.trim()) {
      setBobError("Alice's public key (peer key) is required.");
      return;
    }

    setBobLoading(true);
    try {
      const data = await deriveDHSecret(bobPrivKey.trim(), bobPeerPubKey.trim(), kdfInfo.trim());
      setBobDerivedKey(data);
      if (onOperationSuccess) {
        onOperationSuccess();
      }
    } catch (err) {
      setBobError(err.message || 'Secret derivation failed.');
    } finally {
      setBobLoading(false);
    }
  };

  // Check agreement in workbench mode
  const workbenchKeysMatch =
    aliceDerivedKey &&
    bobDerivedKey &&
    aliceDerivedKey.derived_key_b64 === bobDerivedKey.derived_key_b64;



  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-[#06180a] border border-emerald-500/30 text-emerald-400">
              <Repeat className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              Diffie-Hellman Key Exchange
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            NIST SP 800-56A & RFC 3526 | 2048-bit MODP Group 14 (g=2) | HKDF-SHA256 Derivation
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle"></span>
            Engine Active
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#06180a] text-emerald-300 border border-emerald-500/30">
            MODP-2048
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-[#06180a] text-emerald-300 border border-emerald-500/30">
            HKDF-SHA256
          </span>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex rounded-lg bg-[#040e06] p-1 border border-emerald-500/20 max-w-md">
        <button
          onClick={() => setActiveMode('simulation')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
            activeMode === 'simulation'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Full Protocol Simulation</span>
        </button>
        <button
          onClick={() => setActiveMode('workbench')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-md transition-all ${
            activeMode === 'workbench'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>Dual-Party Workbench</span>
        </button>
      </div>

      {/* MODE 1: FULL PROTOCOL SIMULATION */}
      {activeMode === 'simulation' && (
        <div className="space-y-6">
          <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-emerald-400" />
                  <span>Real-Time Alice & Bob Cryptographic Handshake</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Execute standard 2048-bit modular exponentiation (g^a mod p and g^b mod p) and HKDF key extraction via FastAPI backend.
                </p>
              </div>
              <button
                type="button"
                onClick={handleRunSimulation}
                disabled={simulationLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-purple-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-emerald-950/40 flex items-center gap-2 transition-all self-start sm:self-auto"
              >
                {simulationLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Computing 2048-bit Handshake...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run Protocol Handshake</span>
                  </>
                )}
              </button>
            </div>

            {simulationError && (
              <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-3 text-xs text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{simulationError}</span>
              </div>
            )}

            {/* Protocol Flow Visualization */}
            <div className="space-y-4 pt-2">
              {/* Step 1: Public Domain Parameters */}
              <div className="p-4 rounded-xl bg-[#040e06]/90 border border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" /> Step 1: Public Domain Parameters (Agreed in RFC 3526)
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 bg-[#030a04] px-2 py-0.5 rounded border border-emerald-500/20">
                    Group 14 (2048-bit MODP)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-[#030a04] border border-emerald-500/20 font-mono">
                    <div className="text-[11px] text-slate-400 mb-0.5">Generator (g):</div>
                    <div className="text-emerald-300 font-bold">2</div>
                  </div>
                  <div className="p-2.5 rounded bg-[#030a04] border border-emerald-500/20 font-mono">
                    <div className="text-[11px] text-slate-400 mb-0.5">Prime Modulus (p):</div>
                    <div className="text-slate-300 truncate text-[11px]">
                      0xFFFFFFFFFFFFFFFFC90FDAA22168C234... (2048-bit Sophie Germain safe prime)
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 2: Independent Private Secrets & Public Exponents */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Alice Column */}
                <div className="p-4 rounded-xl bg-[#06180a]/20 border border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Party A (Alice)
                    </span>
                    <span className="text-[11px] font-mono text-emerald-400 bg-[#06180a] px-2 py-0.5 rounded border border-emerald-800">
                      Private Secret (a) Kept Local
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Alice Public Key (A = gᵃ mod p):</span>
                        {simulationResult && (
                          <button
                            type="button"
                            onClick={() => handleCopy(simulationResult.alice.public_key_pem, 'sim-a-pub')}
                            className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center gap-1"
                          >
                            {copiedKey === 'sim-a-pub' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'sim-a-pub' ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      <div className="p-2 rounded bg-[#030a04] border border-emerald-500/20 font-mono text-[11px] text-emerald-200/90 break-all select-all max-h-24 overflow-y-auto">
                        {simulationResult ? simulationResult.alice.public_key_pem : 'Click "Run Protocol Handshake" above to generate Alice\'s 2048-bit key.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bob Column */}
                <div className="p-4 rounded-xl bg-blue-950/20 border border-teal-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5" /> Party B (Bob)
                    </span>
                    <span className="text-[11px] font-mono text-teal-400 bg-[#04160d] px-2 py-0.5 rounded border border-blue-800">
                      Private Secret (b) Kept Local
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span>Bob Public Key (B = gᵇ mod p):</span>
                        {simulationResult && (
                          <button
                            type="button"
                            onClick={() => handleCopy(simulationResult.bob.public_key_pem, 'sim-b-pub')}
                            className="text-teal-400 hover:text-teal-300 text-[11px] flex items-center gap-1"
                          >
                            {copiedKey === 'sim-b-pub' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === 'sim-b-pub' ? 'Copied' : 'Copy'}</span>
                          </button>
                        )}
                      </div>
                      <div className="p-2 rounded bg-[#030a04] border border-emerald-500/20 font-mono text-[11px] text-blue-200/90 break-all select-all max-h-24 overflow-y-auto">
                        {simulationResult ? simulationResult.bob.public_key_pem : 'Click "Run Protocol Handshake" above to generate Bob\'s 2048-bit key.'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3: Shared Secret Derivation Result */}
              {simulationResult && (
                <div className="p-5 rounded-xl bg-[#040e06] border border-emerald-500/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase font-mono">
                      <CheckCircle2 className="w-4 h-4" /> Step 3: Shared Secret Agreement & HKDF-SHA256 Derivation
                    </span>
                    <span className="text-[11px] font-mono text-slate-400 bg-[#030a04] px-2 py-0.5 rounded border border-emerald-500/20">
                      {simulationResult.execution_duration_ms} ms
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Alice computed S_A = B^a mod p and Bob computed S_B = A^b mod p. Since (g^b)^a = (g^a)^b = g^(ab) mod p, both parties computed identical shared secret bytes without ever transmitting their private keys! The shared secret was then passed into <strong>HKDF-SHA256</strong> to extract a uniform 256-bit symmetric session key.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {/* Alice's derived key */}
                    <div className="p-3 rounded-lg bg-[#030a04] border border-emerald-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-emerald-300 font-mono">
                        <span>Alice's Derived Key:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(simulationResult.alice_derived_key_b64, 'sim-a-key')}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          {copiedKey === 'sim-a-key' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-300 break-all select-all font-bold">
                        {simulationResult.alice_derived_key_b64}
                      </div>
                    </div>

                    {/* Bob's derived key */}
                    <div className="p-3 rounded-lg bg-[#030a04] border border-emerald-500/20 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-teal-300 font-mono">
                        <span>Bob's Derived Key:</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(simulationResult.bob_derived_key_b64, 'sim-b-key')}
                          className="text-teal-400 hover:text-teal-300"
                        >
                          {copiedKey === 'sim-b-key' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <div className="font-mono text-xs text-emerald-300 break-all select-all font-bold">
                        {simulationResult.bob_derived_key_b64}
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs text-emerald-200 font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-400" />
                      <span>Mathematical Key Equality: <strong>Identical 256-bit Session Key Derived</strong></span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
                        Fingerprint: {simulationResult.key_fingerprint.substring(0, 16)}...
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: DUAL-PARTY WORKBENCH */}
      {activeMode === 'workbench' && (
        <div className="space-y-6">
          {/* Key Derivation Context Info Config */}
          <div className="glass-panel rounded-xl p-4 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-xs font-semibold text-white mb-0.5">
                HKDF Context String (`info`)
              </label>
              <p className="text-[11px] text-slate-400">
                Application-specific context bound into the key derivation function (RFC 5869).
              </p>
            </div>
            <input
              type="text"
              value={kdfInfo}
              onChange={(e) => setKdfInfo(e.target.value)}
              className="bg-[#040e06] border border-emerald-500/25 rounded-lg px-3 py-1.5 text-xs text-white font-mono w-full sm:w-80 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Alice Workbench */}
            <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-emerald-400" />
                  <span>Party A (Alice)</span>
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAlice}
                  disabled={aliceLoading}
                  className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {aliceLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Generate Keypair</span>
                </button>
              </div>

              {aliceError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-2.5 text-xs text-rose-300 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{aliceError}</span>
                </div>
              )}

              <form onSubmit={handleDeriveAlice} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-[11px] text-slate-300 font-medium">Alice Private Key (PKCS#8 PEM)</label>
                    {alicePrivKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(alicePrivKey, 'alice-priv')}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'alice-priv' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={alicePrivKey}
                    onChange={(e) => setAlicePrivKey(e.target.value)}
                    placeholder="Alice's private key PEM (kept secret)..."
                    className="w-full bg-[#030a04] border border-emerald-500/20 rounded p-2 text-[11px] text-emerald-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-[11px] text-slate-300 font-medium">Alice Public Key (SPKI PEM)</label>
                    {alicePubKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(alicePubKey, 'alice-pub')}
                        className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'alice-pub' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    readOnly
                    value={alicePubKey}
                    placeholder="Alice's public key PEM..."
                    className="w-full bg-[#030a04] border border-emerald-500/20 rounded p-2 text-[11px] text-slate-300 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-[11px] text-slate-300 font-medium">Peer Public Key (Bob's Public PEM)</label>
                    {bobPubKey && (
                      <button
                        type="button"
                        onClick={() => setAlicePeerPubKey(bobPubKey)}
                        className="text-[11px] text-teal-400 hover:underline"
                      >
                        Paste Bob's Public Key
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={alicePeerPubKey}
                    onChange={(e) => setAlicePeerPubKey(e.target.value)}
                    placeholder="Bob's public key PEM..."
                    className="w-full bg-[#030a04] border border-emerald-500/20 rounded p-2 text-[11px] text-blue-200 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={aliceLoading}
                  className="w-full py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Derive Secret as Alice</span>
                </button>
              </form>

              {aliceDerivedKey && (
                <div className="p-3 rounded-lg bg-[#040e06] border border-emerald-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Alice Key Derived</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {aliceDerivedKey.execution_duration_ms} ms
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#030a04] font-mono text-xs text-emerald-300 break-all select-all font-bold">
                    {aliceDerivedKey.derived_key_b64}
                  </div>
                </div>
              )}
            </div>

            {/* Bob Workbench */}
            <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-teal-300 flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-teal-400" />
                  <span>Party B (Bob)</span>
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateBob}
                  disabled={bobLoading}
                  className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                >
                  {bobLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  <span>Generate Keypair</span>
                </button>
              </div>

              {bobError && (
                <div className="rounded-lg bg-rose-950/40 border border-rose-500/40 p-2.5 text-xs text-rose-300 flex items-start gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>{bobError}</span>
                </div>
              )}

              <form onSubmit={handleDeriveBob} className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-[11px] text-slate-300 font-medium">Bob Private Key (PKCS#8 PEM)</label>
                    {bobPrivKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(bobPrivKey, 'bob-priv')}
                        className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'bob-priv' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={bobPrivKey}
                    onChange={(e) => setBobPrivKey(e.target.value)}
                    placeholder="Bob's private key PEM (kept secret)..."
                    className="w-full bg-[#030a04] border border-emerald-500/20 rounded p-2 text-[11px] text-blue-200 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-[11px] text-slate-300 font-medium">Bob Public Key (SPKI PEM)</label>
                    {bobPubKey && (
                      <button
                        type="button"
                        onClick={() => handleCopy(bobPubKey, 'bob-pub')}
                        className="text-[11px] text-teal-400 hover:underline flex items-center gap-1"
                      >
                        {copiedKey === 'bob-pub' ? 'Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    readOnly
                    value={bobPubKey}
                    placeholder="Bob's public key PEM..."
                    className="w-full bg-[#030a04] border border-emerald-500/20 rounded p-2 text-[11px] text-slate-300 font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <label className="text-[11px] text-slate-300 font-medium">Peer Public Key (Alice's Public PEM)</label>
                    {alicePubKey && (
                      <button
                        type="button"
                        onClick={() => setBobPeerPubKey(alicePubKey)}
                        className="text-[11px] text-emerald-400 hover:underline"
                      >
                        Paste Alice's Public Key
                      </button>
                    )}
                  </div>
                  <textarea
                    rows={3}
                    value={bobPeerPubKey}
                    onChange={(e) => setBobPeerPubKey(e.target.value)}
                    placeholder="Alice's public key PEM..."
                    className="w-full bg-[#030a04] border border-emerald-500/20 rounded p-2 text-[11px] text-emerald-200 font-mono focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={bobLoading}
                  className="w-full py-2 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>Derive Secret as Bob</span>
                </button>
              </form>

              {bobDerivedKey && (
                <div className="p-3 rounded-lg bg-[#040e06] border border-teal-500/40 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-teal-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Bob Key Derived</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {bobDerivedKey.execution_duration_ms} ms
                    </span>
                  </div>
                  <div className="p-2 rounded bg-[#030a04] font-mono text-xs text-emerald-300 break-all select-all font-bold">
                    {bobDerivedKey.derived_key_b64}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mutual Agreement Status Banner */}
          {aliceDerivedKey && bobDerivedKey && (
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                workbenchKeysMatch
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
              }`}
            >
              <div className="flex items-center gap-2 text-xs">
                {workbenchKeysMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
                )}
                <span>
                  {workbenchKeysMatch
                    ? 'Agreement Confirmed: Alice and Bob have independently derived the exact same 256-bit symmetric key!'
                    : 'Key Mismatch: Derived keys do not match. Verify private and peer public key pairings.'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono bg-[#030a04] px-2.5 py-1 rounded border border-emerald-500/20">
                  {workbenchKeysMatch ? 'KEY MATCH ✓' : 'KEY MISMATCH ✗'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Educational & Architectural Panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Mathematical Basis</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Diffie-Hellman relies on the <strong>Computational Diffie-Hellman (CDH)</strong> assumption over cyclic groups (Z_p*, *). Given public generator g, Alice's g^a, and Bob's g^b, computing g^(ab) mod p is computationally infeasible without solving the discrete logarithm problem.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            <span>HKDF Key Derivation</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Raw Diffie-Hellman output g^(ab) is <strong>not uniformly distributed</strong> across its bits. Cryptographic best practices strictly require passing the shared secret through a Key Derivation Function like <strong>HKDF-SHA256</strong> to extract cryptographically strong pseudo-random bits.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-5 border border-emerald-500/20 space-y-3">
          <h3 className="text-xs font-bold text-white flex items-center gap-2 uppercase font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Trust & Security Boundaries</span>
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            <strong>Educational Demonstration Boundary:</strong> In production systems (TLS 1.3, Signal), each endpoint retains its own private key and verifies peer identity with digital certificates (preventing Man-in-the-Middle attacks). The backend logs zero secrets.
          </p>
        </div>
      </div>

      {/* Educational "How It Works" Section */}
      <HowItWorksSection
        algorithmName="Diffie-Hellman Key Agreement Protocol"
        subtitle="Asymmetric handshake establishing matching symmetric keys over untrusted channels via discrete logarithms."
        badge="RFC 3526 MODP-2048 & NIST SP 800-56A"
        themeColor="emerald"
        warningBanner={{
          type: 'amber',
          headline: 'UNAUTHENTICATED PROTOCOL WARNING: MAN-IN-THE-MIDDLE (MITM) VULNERABILITY',
          detail: 'Raw Diffie-Hellman establishes a shared secret but provides ZERO identity authentication. An active adversary on the network can intercept public values and negotiate independent keys with both parties. In production (TLS 1.3), Diffie-Hellman keys must be authenticated using digital certificates (X.509).',
        }}
        purpose={
          <>
            <p>
              Diffie-Hellman is a <strong>key agreement protocol</strong>, NOT a message encryption cipher. It allows two independent parties (Alice and Bob) who have never met to establish an identical shared secret key across an insecure public channel (like the open Internet) without transmitting the secret itself.
            </p>
            <p className="text-[11px] text-slate-400">
              Once established, this shared secret is expanded into a 256-bit symmetric session key using HKDF-SHA256, which then feeds into a high-speed cipher like AES-256-GCM for bulk message encryption.
            </p>
          </>
        }
        diagramSteps={[
          { title: '1. Independent Keypairs', subtitle: 'Alice (a, A) & Bob (b, B)', icon: Key },
          { title: '2. Public Exchange', subtitle: 'Send Public Keys A & B Over Wire', icon: Repeat },
          { title: '3. Shared Secret', subtitle: 'S = B^a = A^b = g^(ab) mod p', icon: Cpu },
          { title: '4. HKDF Expansion', subtitle: 'Uniform 256-bit Symmetric Key', icon: ShieldCheck },
        ]}
        workflowSteps={[
          {
            title: 'Domain Parameter Selection',
            tag: 'RFC 3526',
            description: 'Alice and Bob agree on public group parameters: MODP Group 14 (a 2048-bit prime modulus p and generator g = 2). These numbers are completely public.',
          },
          {
            title: 'Independent Private & Public Generation',
            tag: 'Secret Exponents',
            description: 'Alice picks private exponent a and computes public A = g^a mod p. Bob picks private exponent b and computes public B = g^b mod p. Private keys never leave the endpoint.',
          },
          {
            title: 'Public Key Exchange',
            tag: 'Over Insecure Wire',
            description: 'Alice sends A to Bob; Bob sends B to Alice. An eavesdropper observing the wire sees only p, g, A, and B, but cannot deduce a or b due to the discrete log problem.',
          },
          {
            title: 'Independent Secret Derivation',
            tag: 'S = g^(ab) mod p',
            description: 'Alice computes S = B^a mod p. Bob computes S = A^b mod p. By modular exponentiation rules, (g^b)^a = (g^a)^b = g^(ab) mod p, yielding the exact same integer on both sides.',
          },
          {
            title: 'HKDF-SHA256 Key Expansion',
            tag: 'RFC 5869',
            description: 'Raw modular numbers are not uniformly distributed across bits. HKDF-SHA256 digests the shared secret into a uniform 256-bit symmetric encryption key.',
          },
          {
            title: 'Key Agreement Verification',
            tag: 'Match Confirmed',
            description: 'Both parties now share the identical 256-bit key ready for AES encryption without ever having transmitted the key across the wire.',
          },
        ]}
        concepts={[
          {
            term: 'Key Agreement vs Encryption',
            badge: 'Key Negotiation',
            definition: 'Diffie-Hellman does NOT encrypt message text. It negotiates an identical secret key between two parties, which is then used by a cipher like AES.',
          },
          {
            term: 'Discrete Logarithm Problem',
            badge: 'Mathematical Basis',
            definition: 'Given g, p, and g^a mod p, it is computationally infeasible to calculate private exponent a when p is 2048 bits on classical computers.',
          },
          {
            term: 'Shared Secret (g^(ab) mod p)',
            badge: 'Mathematical Intersection',
            definition: 'Alice calculates (g^b)^a mod p, and Bob calculates (g^a)^b mod p. Both formulas arrive at the exact same integer S = g^(ab) mod p.',
          },
          {
            term: 'HKDF-SHA256',
            badge: 'Key Expansion',
            definition: 'HMAC-based Key Derivation Function. Extracts uniform pseudo-random bits from the non-uniform raw Diffie-Hellman secret.',
          },
          {
            term: 'Perfect Forward Secrecy (PFS)',
            badge: 'Ephemeral Keys',
            definition: 'When ephemeral keypairs are generated per session and discarded, compromising a long-term server key cannot decrypt past recorded traffic.',
          },
          {
            term: 'Man-in-the-Middle (MITM) Risk',
            badge: 'Security Warning',
            definition: 'Without digital certificates to verify public key ownership, an active attacker can intercept public keys and establish separate sessions with Alice and Bob.',
          },
        ]}
        example={{
          title: 'Alice & Bob Handshake Simulation',
          inputs: [
            { label: 'Domain Group', value: 'RFC 3526 MODP-2048 (g=2)' },
            { label: 'Keypair Generation', value: 'Independent Private Exponents (a, b)' },
          ],
          process: 'Alice and Bob exchange public values A and B. Alice calculates B^a mod p; Bob calculates A^b mod p. Both pass result through HKDF-SHA256.',
          outputs: [
            { label: 'Alice Derived Key', value: '256-bit Base64 Key' },
            { label: 'Bob Derived Key', value: 'Exact Matching Base64 Key' },
          ],
          note: 'Notice: Both endpoints arrived at identical 256-bit keys independently without ever sending their private exponents over the wire.',
        }}
        securityNotes={[
          {
            type: 'benefit',
            title: 'Forward Secrecy (PFS)',
            description: 'Using fresh ephemeral keypairs per session ensures that long-term key compromises do not decrypt past recorded sessions.',
          },
          {
            type: 'benefit',
            title: 'Zero Pre-Shared Key Requirement',
            description: 'Enables two strangers on the Internet to establish encrypted communication without a pre-existing shared password.',
          },
          {
            type: 'warning',
            title: 'Authentication Vulnerability (MITM)',
            description: 'Unauthenticated Diffie-Hellman has no identity verification. Mallory can perform two separate handshakes and eavesdrop in real time.',
          },
          {
            type: 'warning',
            title: 'Key Agreement is NOT Encryption',
            description: 'Diffie-Hellman must always feed into a symmetric cipher like AES-256-GCM to encrypt actual application payloads.',
          },
        ]}
        keyTakeaway="Diffie-Hellman establishes a shared symmetric key over an insecure wire without transmitting secrets, but requires digital certificates in production to prevent Man-in-the-Middle attacks."
      />
    </div>
  );
}
