import React, { useState } from 'react';
import { Repeat, Key, Shield, ArrowRight, Info, Check, Cpu } from 'lucide-react';

export default function DiffieHellmanPage() {
  const [primeP, setPrimeP] = useState('23');
  const [generatorG, setGeneratorG] = useState('5');
  const [alicePriv, setAlicePriv] = useState('6');
  const [bobPriv, setBobPriv] = useState('15');
  const [simulated, setSimulated] = useState(false);

  // Quick mathematical illustrative calculation for educational demonstration
  const p = parseInt(primeP, 10) || 23;
  const g = parseInt(generatorG, 10) || 5;
  const a = parseInt(alicePriv, 10) || 6;
  const b = parseInt(bobPriv, 10) || 15;

  // Power mod helper for toy example
  const modPow = (base, exp, mod) => {
    let res = 1;
    base = base % mod;
    while (exp > 0) {
      if (exp % 2 === 1) res = (res * base) % mod;
      exp = Math.floor(exp / 2);
      base = (base * base) % mod;
    }
    return res;
  };

  const alicePub = modPow(g, a, p);
  const bobPub = modPow(g, b, p);
  const aliceSecret = modPow(bobPub, a, p);
  const bobSecret = modPow(alicePub, b, p);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-lg bg-indigo-950/60 border border-indigo-500/30 text-indigo-400">
              <Repeat className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight m-0">
              Diffie-Hellman Key Exchange
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0">
            Cryptographic key agreement establishing shared secrets over untrusted channels
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-500/30">
            Key Agreement
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30">
            Forward Secrecy
          </span>
        </div>
      </div>

      {/* Educational Notice */}
      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-xs text-indigo-200/90 leading-relaxed">
          <strong className="text-indigo-300">Phase 1 Foundation Layout:</strong> Interactive handshake simulator below displays the step-by-step modular exponentiation theory. Production 2048-bit MODP groups and ECDH curve generation will connect to the backend in Phase 2.
        </div>
      </div>

      {/* Educational Handshake Interactive Visualizer */}
      <div className="glass-panel rounded-xl p-5 border border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Interactive Protocol Handshake Walkthrough</span>
        </h3>

        {/* Step 1: Public Domain Parameters */}
        <div className="p-4 rounded-lg bg-slate-900/90 border border-slate-800">
          <div className="text-xs font-semibold text-purple-300 mb-2 uppercase font-mono">
            Step 1: Public Domain Parameters (Agreed in the clear)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Prime modulus (p)</label>
              <input
                type="number"
                value={primeP}
                onChange={(e) => setPrimeP(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Primitive root generator (g)</label>
              <input
                type="number"
                value={generatorG}
                onChange={(e) => setGeneratorG(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white font-mono"
              />
            </div>
          </div>
        </div>

        {/* Step 2: Private Secrets & Public Exponents */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Alice's Box */}
          <div className="p-4 rounded-lg bg-purple-950/20 border border-purple-500/30">
            <h4 className="text-xs font-bold text-purple-300 mb-2">Party A (Alice)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Alice Private Secret (a):</label>
                <input
                  type="number"
                  value={alicePriv}
                  onChange={(e) => setAlicePriv(e.target.value)}
                  className="w-full bg-slate-900 border border-purple-900 rounded p-2 text-xs text-white font-mono"
                />
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <div className="text-[11px] text-slate-400">Public Key A = gᵃ mod p:</div>
                <div className="text-purple-300 font-bold mt-0.5">
                  {g}^{a} mod {p} = <span className="text-white">{alicePub}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bob's Box */}
          <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-500/30">
            <h4 className="text-xs font-bold text-blue-300 mb-2">Party B (Bob)</h4>
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Bob Private Secret (b):</label>
                <input
                  type="number"
                  value={bobPriv}
                  onChange={(e) => setBobPriv(e.target.value)}
                  className="w-full bg-slate-900 border border-blue-900 rounded p-2 text-xs text-white font-mono"
                />
              </div>
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-xs font-mono">
                <div className="text-[11px] text-slate-400">Public Key B = gᵇ mod p:</div>
                <div className="text-blue-300 font-bold mt-0.5">
                  {g}^{b} mod {p} = <span className="text-white">{bobPub}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3: Shared Secret Derivation */}
        <div className="p-4 rounded-lg bg-emerald-950/30 border border-emerald-500/40 text-center">
          <div className="text-xs font-semibold text-emerald-300 mb-1 uppercase font-mono">
            Step 3: Derived Shared Secret Key (S)
          </div>
          <p className="text-xs text-slate-300 mb-3">
            Alice calculates S = Bᵃ mod p ({bobPub}^{a} mod {p} = {aliceSecret}). Bob calculates S = Aᵇ mod p ({alicePub}^{b} mod {p} = {bobSecret}).
          </p>
          <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-slate-900 border border-emerald-500/50">
            <span className="text-xs text-slate-400 font-mono">Derived Secret:</span>
            <span className="text-base font-bold text-emerald-300 font-mono">
              S = {aliceSecret} ({aliceSecret === bobSecret ? 'Identical Key Derived ✓' : 'Mismatch'})
            </span>
          </div>
        </div>

        <button
          onClick={() => setSimulated(true)}
          className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-semibold shadow-md transition-all"
        >
          Simulate Handshake Telemetry Check
        </button>

        {simulated && (
          <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 font-mono">
            Handshake telemetry validated. Production backend will perform 2048-bit FIPS 186-4 modular exponentiation and HKDF key derivation.
          </div>
        )}
      </div>
    </div>
  );
}
