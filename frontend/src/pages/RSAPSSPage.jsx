import React, { useState, useRef, useCallback } from 'react';
import {
  PenLine,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  KeyRound,
  FileSignature,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  Check,
  Download,
  Upload,
  Eye,
  EyeOff,
  RefreshCw,
  Cpu,
  Info,
  Lock,
  FileText,
  ArrowRight,
  Fingerprint,
} from 'lucide-react';
import {
  generateRSAPSSKeys,
  signRSAPSSMessage,
  verifyRSAPSSMessage,
  signRSAPSSFile,
  verifyRSAPSSFile,
} from '../services/api';
import HowItWorksSection from '../components/HowItWorksSection';

// ─── Helper: download text as file ───────────────────────────────────────────
function downloadText(content, filename) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TabButton({ active, onClick, icon: Icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 whitespace-nowrap min-h-[40px] cursor-pointer ${
        active
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-950/40'
          : 'text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent'
      }`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

function PemTextarea({ label, value, onChange, readOnly = false, placeholder = '', rows = 6, id }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label htmlFor={id} className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
          {label}
        </label>
        {value && (
          <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        )}
      </div>
      <textarea
        id={id}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        readOnly={readOnly}
        placeholder={placeholder}
        rows={rows}
        spellCheck={false}
        className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-100 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-y transition-colors"
      />
    </div>
  );
}

function PassphraseInput({ id, label, value, onChange, placeholder = 'Enter passphrase…' }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors"
          aria-label={show ? 'Hide passphrase' : 'Show passphrase'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function VerifyResult({ result }) {
  if (!result) return null;
  const isValid = result.valid === true;
  const isError = result._isError;

  if (isError) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
        <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-amber-300">Input Error</p>
          <p className="text-xs text-amber-200/80 mt-0.5">{result.message}</p>
        </div>
      </div>
    );
  }

  if (isValid) {
    return (
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/40">
        <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Signature Valid
          </p>
          <p className="text-xs text-emerald-200/80 mt-1">{result.message}</p>
          {result.algorithm && (
            <p className="text-[10px] font-mono text-emerald-500/70 mt-1.5">
              {result.algorithm} · {result.digest} · {result.execution_duration_ms?.toFixed(1)} ms
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/40">
      <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-bold text-red-300 flex items-center gap-1.5">
          <ShieldX className="w-4 h-4" /> Signature Invalid
        </p>
        <p className="text-xs text-red-200/80 mt-1">{result.message}</p>
      </div>
    </div>
  );
}

function FileDropZone({ file, onFile, accept = '*', label = 'Drop file or click to select' }) {
  const inputRef = useRef(null);
  const [drag, setDrag] = useState(false);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) onFile(f);
  }, [onFile]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={`relative cursor-pointer border-2 border-dashed rounded-xl p-5 transition-all duration-200 text-center ${
        drag
          ? 'border-emerald-400 bg-emerald-500/10'
          : file
            ? 'border-emerald-500/50 bg-emerald-500/5'
            : 'border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ''; }}
      />
      {file ? (
        <div className="flex items-center justify-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <div className="text-left">
            <p className="text-xs font-semibold text-emerald-300 truncate max-w-xs">{file.name}</p>
            <p className="text-[10px] text-slate-500 font-mono">{formatBytes(file.size)}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-1.5">
          <Upload className="w-5 h-5 text-slate-500" />
          <p className="text-xs text-slate-500">{label}</p>
          <p className="text-[10px] text-slate-600">Max 50 MB</p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Generate Keys ───────────────────────────────────────────────────────

function GenerateKeysTab({ onOperationSuccess }) {
  const [keySize, setKeySize] = useState('2048');
  const [passphrase, setPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [copied, setCopied] = useState(null);

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleGenerate = async () => {
    setError('');
    if (passphrase && passphrase !== confirmPassphrase) {
      setError('Passphrases do not match.');
      return;
    }
    setLoading(true);
    setResult(null);
    setShowPrivateKey(false);
    setConfirmed(false);
    try {
      const data = await generateRSAPSSKeys(parseInt(keySize, 10), passphrase || null);
      setResult(data);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setError(err.message || 'Key generation failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Notice */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/25">
        <Info className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-amber-200/80 leading-relaxed space-y-1">
          <p><span className="font-semibold text-amber-300">Private Key Security:</span> Your private key is generated in memory and returned <em>once</em>. It is <strong>never stored</strong> on the server. Save it securely immediately after generation.</p>
          <p>If you lose the private key, you cannot recreate signatures made with it using the public key alone.</p>
        </div>
      </div>

      {/* Configuration */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Key Size</label>
          <select
            value={keySize}
            onChange={(e) => setKeySize(e.target.value)}
            className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/50 transition-colors"
          >
            <option value="2048">RSA-2048 (Standard)</option>
            <option value="3072">RSA-3072 (Enhanced)</option>
            <option value="4096">RSA-4096 (Maximum)</option>
          </select>
          <p className="text-[10px] text-slate-500 font-mono">
            {keySize === '2048' ? 'Recommended for most use cases. Fast generation.' : keySize === '3072' ? 'Higher security margin. Moderate generation time.' : 'Maximum security. Slower generation (~3–10s).'}
          </p>
        </div>
        <div />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <PassphraseInput
          id="pss-gen-passphrase"
          label="Private Key Passphrase (recommended)"
          value={passphrase}
          onChange={setPassphrase}
          placeholder="Encrypt your private key…"
        />
        <PassphraseInput
          id="pss-gen-confirm"
          label="Confirm Passphrase"
          value={confirmPassphrase}
          onChange={setConfirmPassphrase}
          placeholder="Repeat passphrase…"
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        id="pss-gen-btn"
        onClick={handleGenerate}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        {loading ? 'Generating…' : 'Generate Key Pair'}
      </button>

      {result && (
        <div className="space-y-4 pt-2 border-t border-emerald-500/10">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            RSA-{result.key_size} key pair generated · {result.execution_duration_ms?.toFixed(0)} ms
            {result.private_key_encrypted && <span className="ml-2 px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">Encrypted</span>}
          </div>

          {/* Public Key */}
          <div className="space-y-2">
            <PemTextarea
              id="pss-gen-pub-key"
              label="Public Key (SubjectPublicKeyInfo / SPKI PEM)"
              value={result.public_key_pem}
              readOnly
              rows={7}
            />
            <button
              onClick={() => downloadText(result.public_key_pem, `rsa-pss-public-${result.key_size}.pem`)}
              className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Download public key (.pem)
            </button>
          </div>

          {/* Private Key — gated */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wider font-mono">
                Private Key (PKCS#8 PEM{result.private_key_encrypted ? ' · Encrypted' : ' · Unencrypted'})
              </span>
              <button
                onClick={() => {
                  if (!confirmed && !showPrivateKey) {
                    const ok = window.confirm(
                      'You are about to reveal your private key.\n\n' +
                      '⚠️  Never share it with anyone.\n' +
                      '⚠️  Download and store it securely — it will not be available again.\n\n' +
                      'Proceed?'
                    );
                    if (!ok) return;
                    setConfirmed(true);
                  }
                  setShowPrivateKey(!showPrivateKey);
                }}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                {showPrivateKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                {showPrivateKey ? 'Hide' : 'Reveal'}
              </button>
            </div>
            {showPrivateKey ? (
              <PemTextarea
                id="pss-gen-priv-key"
                label=""
                value={result.private_key_pem}
                readOnly
                rows={8}
              />
            ) : (
              <div className="h-16 bg-black/30 border border-red-500/20 rounded-xl flex items-center justify-center">
                <Lock className="w-4 h-4 text-red-500/60 mr-2" />
                <span className="text-xs text-red-400/60 font-mono">Private key hidden — click Reveal to show</span>
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const ok = window.confirm('Download private key?\n\nStore it in a secure location immediately. Do not share it.');
                  if (ok) downloadText(result.private_key_pem, `rsa-pss-private-${result.key_size}${result.private_key_encrypted ? '-enc' : ''}.pem`);
                }}
                className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Download private key (.pem)
              </button>
              <button
                onClick={() => handleCopy(result.private_key_pem, 'priv')}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                {copied === 'priv' ? <Check className="w-3.5 h-3.5 text-red-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied === 'priv' ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Sign Text ───────────────────────────────────────────────────────────

function SignTextTab({ onOperationSuccess }) {
  const [message, setMessage] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const handleSign = async () => {
    setError('');
    setResult(null);
    if (!privateKey.trim()) { setError('Private key PEM is required.'); return; }
    setLoading(true);
    try {
      const data = await signRSAPSSMessage(message, privateKey, passphrase || null);
      setResult(data);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setError(err.message || 'Signing failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, key) => {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-slate-400 leading-relaxed">
        <span className="text-emerald-400 font-semibold">Exact UTF-8 Signing: </span>
        The message is signed byte-for-byte. Any whitespace, newline, or Unicode difference will produce a different signature and fail verification.
      </div>

      {/* Message Input */}
      <div className="space-y-1.5">
        <label htmlFor="pss-sign-msg" className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
          Message to Sign
        </label>
        <textarea
          id="pss-sign-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter the exact text message to sign. An empty message is valid."
          rows={5}
          className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 resize-y transition-colors font-mono"
        />
        <p className="text-[10px] text-slate-600 font-mono text-right">{new TextEncoder().encode(message).length} UTF-8 bytes</p>
      </div>

      <PemTextarea
        id="pss-sign-privkey"
        label="Private Key PEM (PKCS#8)"
        value={privateKey}
        onChange={setPrivateKey}
        placeholder="-----BEGIN PRIVATE KEY-----&#10;...or-----BEGIN ENCRYPTED PRIVATE KEY-----&#10;..."
        rows={6}
      />

      <PassphraseInput
        id="pss-sign-passphrase"
        label="Private Key Passphrase (if encrypted)"
        value={passphrase}
        onChange={setPassphrase}
        placeholder="Leave blank if key is not encrypted"
      />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        id="pss-sign-btn"
        onClick={handleSign}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
        {loading ? 'Signing…' : 'Sign Message'}
      </button>

      {result && (
        <div className="space-y-3 pt-2 border-t border-emerald-500/10">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            Signed · {result.algorithm} · {result.signature_byte_length} bytes · {result.execution_duration_ms?.toFixed(1)} ms
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">Signature (Base64)</span>
              <div className="flex gap-3">
                <button onClick={() => handleCopy(result.signature_base64, 'sig')} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 transition-colors">
                  {copied === 'sig' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied === 'sig' ? 'Copied' : 'Copy'}
                </button>
                <button onClick={() => downloadText(result.signature_base64, 'rsa-pss-signature.sig')} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 transition-colors">
                  <Download className="w-3 h-3" /> Download
                </button>
              </div>
            </div>
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-100 font-mono break-all leading-relaxed">
              {result.signature_base64}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              ['Algorithm', result.algorithm],
              ['Digest', result.digest],
              ['MGF', result.mgf],
              ['Salt Length', result.salt_length],
              ['Key Size', result.key_size ? `RSA-${result.key_size}` : '—'],
              ['Sig Bytes', result.signature_byte_length],
            ].map(([k, v]) => (
              <div key={k} className="bg-black/20 border border-emerald-500/10 rounded-lg p-2">
                <p className="text-[9px] font-mono text-slate-500 uppercase">{k}</p>
                <p className="text-[10px] font-mono text-emerald-300 mt-0.5 font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Verify Text ────────────────────────────────────────────────────────

function VerifyTextTab({ onOperationSuccess }) {
  const [message, setMessage] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    setResult(null);
    if (!publicKey.trim()) { setResult({ _isError: true, message: 'Public key PEM is required.' }); return; }
    if (!signature.trim()) { setResult({ _isError: true, message: 'Signature is required.' }); return; }
    setLoading(true);
    try {
      const data = await verifyRSAPSSMessage(message, signature, publicKey);
      setResult(data);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setResult({ _isError: true, message: err.message || 'Verification request failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-slate-400 leading-relaxed">
        <span className="text-emerald-400 font-semibold">Public Key Trust Notice: </span>
        A valid signature proves the message was signed by the private-key holder. It does <em>not</em> independently prove real-world identity, a timestamp, or that the public key is authentic. Establish key authenticity separately.
      </div>

      <div className="space-y-1.5">
        <label htmlFor="pss-verify-msg" className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
          Original Message (exact)
        </label>
        <textarea
          id="pss-verify-msg"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter the exact original message that was signed."
          rows={5}
          className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y transition-colors font-mono"
        />
        <p className="text-[10px] text-slate-600 font-mono text-right">{new TextEncoder().encode(message).length} UTF-8 bytes</p>
      </div>

      <PemTextarea
        id="pss-verify-pubkey"
        label="Public Key PEM (SPKI)"
        value={publicKey}
        onChange={setPublicKey}
        placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
        rows={6}
      />

      <div className="space-y-1.5">
        <label htmlFor="pss-verify-sig" className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
          Signature (Base64)
        </label>
        <textarea
          id="pss-verify-sig"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Paste Base64-encoded RSA-PSS signature here…"
          rows={4}
          spellCheck={false}
          className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-100 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y transition-colors"
        />
      </div>

      <button
        id="pss-verify-btn"
        onClick={handleVerify}
        disabled={loading}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {loading ? 'Verifying…' : 'Verify Signature'}
      </button>

      <VerifyResult result={result} />
    </div>
  );
}

// ─── Tab: Sign File ───────────────────────────────────────────────────────────

function SignFileTab({ onOperationSuccess }) {
  const [file, setFile] = useState(null);
  const [privateKey, setPrivateKey] = useState('');
  const [passphrase, setPassphrase] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleSign = async () => {
    setError('');
    setResult(null);
    if (!file) { setError('Please select a file to sign.'); return; }
    if (!privateKey.trim()) { setError('Private key PEM is required.'); return; }
    setLoading(true);
    try {
      const data = await signRSAPSSFile(file, privateKey, passphrase || null);
      setResult(data);
      if (onOperationSuccess) onOperationSuccess();
    } catch (err) {
      setError(err.message || 'File signing failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-slate-400">
        <span className="text-emerald-400 font-semibold">File Integrity Signing: </span>
        Signs the exact bytes of your file. Save the signature separately — share both the original file and the signature so verifiers can authenticate it.
      </div>

      <FileDropZone file={file} onFile={setFile} label="Drop file to sign or click to select (max 50 MB)" />

      <PemTextarea
        id="pss-sign-file-privkey"
        label="Private Key PEM (PKCS#8)"
        value={privateKey}
        onChange={setPrivateKey}
        placeholder="-----BEGIN PRIVATE KEY-----&#10;..."
        rows={5}
      />

      <PassphraseInput
        id="pss-sign-file-pass"
        label="Private Key Passphrase (if encrypted)"
        value={passphrase}
        onChange={setPassphrase}
        placeholder="Leave blank if key is not encrypted"
      />

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-sm text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <button
        id="pss-sign-file-btn"
        onClick={handleSign}
        disabled={loading || !file}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileSignature className="w-4 h-4" />}
        {loading ? 'Signing File…' : 'Sign File'}
      </button>

      {result && (
        <div className="space-y-3 pt-2 border-t border-emerald-500/10">
          <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            File signed · {result.original_filename} · {formatBytes(result.original_file_size)} · {result.execution_duration_ms?.toFixed(1)} ms
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">File Signature (Base64)</span>
              <div className="flex gap-3">
                <button
                  onClick={() => { navigator.clipboard?.writeText(result.signature_base64); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button
                  onClick={() => downloadText(result.signature_base64, `${result.original_filename}.pss.sig`)}
                  className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-300 transition-colors"
                >
                  <Download className="w-3 h-3" /> Download .sig
                </button>
              </div>
            </div>
            <div className="bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-100 font-mono break-all leading-relaxed">
              {result.signature_base64}
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">
            {result.algorithm} · SHA-256 · {result.signature_byte_length} bytes signature
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Tab: Verify File ─────────────────────────────────────────────────────────

function VerifyFileTab({ onOperationSuccess }) {
  const [file, setFile] = useState(null);
  const [publicKey, setPublicKey] = useState('');
  const [signature, setSignature] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleVerify = async () => {
    setResult(null);
    if (!file) { setResult({ _isError: true, message: 'Please select the original file to verify.' }); return; }
    if (!publicKey.trim()) { setResult({ _isError: true, message: 'Public key PEM is required.' }); return; }
    if (!signature.trim()) { setResult({ _isError: true, message: 'Signature (Base64) is required.' }); return; }
    setLoading(true);
    try {
      const data = await verifyRSAPSSFile(file, signature, publicKey);
      if (onOperationSuccess) onOperationSuccess();
      setResult(data);
    } catch (err) {
      setResult({ _isError: true, message: err.message || 'Verification request failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 text-xs text-slate-400">
        <span className="text-emerald-400 font-semibold">File Verification: </span>
        A modified file, a signature from a different file, or a wrong public key will all return an invalid result. This is normal — not an error.
      </div>

      <FileDropZone file={file} onFile={setFile} label="Drop the original file or click to select (max 50 MB)" />

      <PemTextarea
        id="pss-vfile-pubkey"
        label="Public Key PEM (SPKI)"
        value={publicKey}
        onChange={setPublicKey}
        placeholder="-----BEGIN PUBLIC KEY-----&#10;..."
        rows={5}
      />

      <div className="space-y-1.5">
        <label htmlFor="pss-vfile-sig" className="block text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
          Signature (Base64)
        </label>
        <textarea
          id="pss-vfile-sig"
          value={signature}
          onChange={(e) => setSignature(e.target.value)}
          placeholder="Paste Base64 file signature here…"
          rows={4}
          spellCheck={false}
          className="w-full bg-black/40 border border-emerald-500/20 rounded-xl px-4 py-3 text-xs text-emerald-100 font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 resize-y transition-colors"
        />
      </div>

      <button
        id="pss-vfile-btn"
        onClick={handleVerify}
        disabled={loading || !file}
        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
        {loading ? 'Verifying…' : 'Verify File Signature'}
      </button>

      {result && (
        <div className="space-y-2">
          <VerifyResult result={result} />
          {!result._isError && result.original_filename && (
            <p className="text-[10px] text-slate-500 font-mono pl-1">
              File: {result.original_filename} · {formatBytes(result.original_file_size)} · {result.execution_duration_ms?.toFixed(1)} ms
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ─── HowItWorks data ──────────────────────────────────────────────────────────

const howItWorksSteps = [
  {
    step: 1,
    title: 'Generate Key Pair',
    description: 'Cryptographically generate an RSA key pair (2048–4096 bits). The private key stays with the signer; the public key is distributed.',
    icon: KeyRound,
    color: 'text-emerald-400',
  },
  {
    step: 2,
    title: 'Sign with Private Key',
    description: 'Hash the message with SHA-256, then apply RSA-PSS padding (MGF1, max salt) and encrypt the hash with the private key to produce a signature.',
    icon: PenLine,
    color: 'text-emerald-400',
  },
  {
    step: 3,
    title: 'Distribute Message + Signature',
    description: 'Share the original message/file and the Base64 signature. Keep the private key secret — never share it.',
    icon: ArrowRight,
    color: 'text-emerald-400',
  },
  {
    step: 4,
    title: 'Verify with Public Key',
    description: 'Use the public key to decrypt the signature and compare its hash to the message hash. Any modification to the message or signature causes failure.',
    icon: ShieldCheck,
    color: 'text-emerald-400',
  },
];

// ─── Main Page ────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'keygen', label: 'Generate Keys', icon: KeyRound },
  { id: 'sign-text', label: 'Sign Text', icon: PenLine },
  { id: 'verify-text', label: 'Verify Text', icon: ShieldCheck },
  { id: 'sign-file', label: 'Sign File', icon: FileSignature },
  { id: 'verify-file', label: 'Verify File', icon: Fingerprint },
];

export default function RSAPSSPage({ onOperationSuccess }) {
  const [activeTab, setActiveTab] = useState('keygen');

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#06180a] via-[#041006] to-[#020904] border border-emerald-500/25 p-6 sm:p-8 shadow-2xl shadow-black/80">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <PenLine className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">Digital Signature Module</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              RSA-PSS Digital <span className="text-emerald-400">Signatures</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-lg leading-relaxed">
              Sign messages and files with RSA-PSS-SHA256. Verify their integrity using the corresponding public key. Distinct from RSA-OAEP encryption.
            </p>
          </div>
          <div className="flex flex-col gap-1.5 text-[10px] font-mono bg-black/30 border border-emerald-500/15 rounded-xl p-3 min-w-[160px]">
            {[
              ['Scheme', 'RSA-PSS'],
              ['Digest', 'SHA-256'],
              ['MGF', 'MGF1-SHA256'],
              ['Salt', 'PSS.MAX_LENGTH'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4">
                <span className="text-slate-500">{k}</span>
                <span className="text-emerald-400 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Security Warning ── */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/25">
        <Info className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-200/90 leading-relaxed">
          <span className="font-semibold text-emerald-300">Signature ≠ Encryption: </span>
          RSA-PSS produces a <em>digital signature</em> — it proves a message was signed by the private-key holder and detects tampering. It does <strong>not</strong> encrypt or hide the message content. Use the RSA Encryption module for confidential data.
        </div>
      </div>

      {/* ── Main Card with Tabs ── */}
      <div className="rounded-2xl bg-[#040e06]/80 border border-emerald-500/15 shadow-xl overflow-hidden">
        {/* Tab Bar */}
        <div className="flex flex-wrap gap-1.5 p-4 border-b border-emerald-500/10 bg-black/20">
          {TABS.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
              icon={tab.icon}
              label={tab.label}
            />
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'keygen' && <GenerateKeysTab onOperationSuccess={onOperationSuccess} />}
          {activeTab === 'sign-text' && <SignTextTab onOperationSuccess={onOperationSuccess} />}
          {activeTab === 'verify-text' && <VerifyTextTab onOperationSuccess={onOperationSuccess} />}
          {activeTab === 'sign-file' && <SignFileTab onOperationSuccess={onOperationSuccess} />}
          {activeTab === 'verify-file' && <VerifyFileTab onOperationSuccess={onOperationSuccess} />}
        </div>
      </div>

      {/* ── How It Works ── */}
      <HowItWorksSection
        title="How RSA-PSS Digital Signatures Work"
        steps={howItWorksSteps}
      />

      {/* ── Security Notes ── */}
      <div className="rounded-2xl bg-[#040e06]/80 border border-emerald-500/15 p-6 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security Reference
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-slate-400 leading-relaxed">
          {[
            ['Signature Integrity', 'Any single byte change in the message or file invalidates the signature — providing strong tamper detection.'],
            ['Key Authenticity', 'A valid signature proves possession of the private key, not real-world identity. Verify public keys through a trusted channel.'],
            ['No Timestamps', 'RSA-PSS alone does not prove when a signature was created. Use a trusted timestamping authority for non-repudiation.'],
            ['Private Key Safety', 'Never share your private key. Once generated, it is never stored on the server — download and protect it securely.'],
            ['PSS vs OAEP', 'RSA-PSS signs data; RSA-OAEP encrypts data. These are distinct operations and should never be confused.'],
            ['Salt Randomization', 'PSS uses a random salt (max length) per signature, so identical messages produce different — yet all valid — signatures.'],
          ].map(([title, desc]) => (
            <div key={title} className="flex gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-emerald-400/80">{title}: </span>
                {desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
