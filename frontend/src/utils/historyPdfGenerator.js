import { jsPDF } from 'jspdf';

/**
 * SecureCipher — Academic-Quality Cryptographic Audit PDF Report Generator
 *
 * Provides two publication-grade PDF reporting engines:
 * 1. generateSingleAuditRecordPDF(item):
 *    Comprehensive single-record audit dossier in A4 Portrait orientation,
 *    featuring execution telemetry, theoretical algorithm architecture,
 *    operation-specific workflow steps, and security evaluation.
 *
 * 2. generateAuditHistoryPDF({ items, filterAlgo, dbHealth }):
 *    Full-system audit history report in A4 Landscape orientation,
 *    featuring an executive summary, dynamic algorithm benchmark metrics table,
 *    chronological audit trail with repeating table headers, audit logging rationale,
 *    zero-knowledge privacy statement, and cryptographic glossary.
 *
 * STRICT PRIVACY GUARANTEE:
 * - Persists and exports execution audit metadata ONLY (ID, Algorithm, Operation, Status, Duration, Timestamp).
 * - NEVER contains plaintexts, ciphertexts, passwords, passphrases, private keys,
 *   symmetric keys, shared secrets, or database credentials.
 */

// ============================================================================
// HELPER UTILITIES & DESIGN SYSTEM
// ============================================================================

const PALETTE = {
  slate900: [15, 23, 42],
  slate800: [30, 41, 59],
  slate700: [51, 65, 85],
  slate600: [71, 85, 105],
  slate500: [100, 116, 139],
  slate400: [148, 163, 184],
  slate300: [203, 213, 225],
  slate200: [226, 232, 240],
  slate100: [241, 245, 249],
  slate50: [248, 250, 252],
  white: [255, 255, 255],
  indigo: [79, 70, 229],
  indigoLight: [238, 242, 255],
  indigoBorder: [199, 210, 254],
  emerald: [4, 120, 87],
  emeraldLight: [236, 253, 245],
  emeraldBorder: [167, 243, 208],
  rose: [185, 28, 28],
  roseLight: [254, 242, 242],
  roseBorder: [254, 202, 202],
  amber: [180, 83, 9],
  amberLight: [254, 243, 199],
  amberBorder: [253, 230, 138],
};

function formatIndiaTimestamp(dateInput) {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    const parts = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).formatToParts(d);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    const period = (map.dayPeriod || '').toUpperCase();
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute}:${map.second} ${period} IST`;
  } catch {
    return String(dateInput);
  }
}

function formatUtcTimestamp(dateInput) {
  if (!dateInput) return 'N/A';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
  } catch {
    return String(dateInput);
  }
}

function getSafeFileSlug(str) {
  if (!str) return 'crypto';
  return String(str).replace(/[^a-zA-Z0-9_-]/g, '_');
}

/**
 * Detailed cryptographic metadata and academic explanations
 */
function getAlgorithmMetadata(algorithmName) {
  const algo = (algorithmName || '').toUpperCase();

  if (algo.includes('AES')) {
    return {
      canonicalName: 'AES-256-GCM',
      themeColor: [126, 34, 206], // Purple
      category: 'Symmetric AEAD Block Cipher',
      standard: 'NIST FIPS 197 & NIST SP 800-38D',
      keyDerivation: 'Scrypt KDF (N=16384, r=8, p=1, 16-byte random salt)',
      ivNonce: '96-bit (12-byte) Cryptographically Random IV / Nonce',
      tag: '128-bit (16-byte) Galois GMAC Authentication Tag in GF(2^128)',
      securityStatus: 'Active & Cryptographically Secure (NIST Recommended AEAD Standard)',
      isLegacy: false,
      explanation:
        'Advanced Encryption Standard (AES) with a 256-bit key operating in Galois/Counter Mode (GCM) is an industry-standard Authenticated Encryption with Associated Data (AEAD) cipher. It ensures both data confidentiality and cryptographic authenticity. User passphrases are strengthened through Scrypt key derivation with random salting to thwart GPU-accelerated dictionary attacks. GCM mode utilizes CTR mode for high-throughput streaming encryption and calculates an authentication tag using GHASH polynomial multiplication over the Galois field GF(2^128). This tag detects any unauthorized tampering, bit-flipping, or ciphertext corruption.',
    };
  }

  if (algo.includes('RSA')) {
    return {
      canonicalName: 'RSA-OAEP',
      themeColor: [29, 78, 216], // Blue
      category: 'Asymmetric Trapdoor Permutation',
      standard: 'NIST FIPS 186-5 & RFC 8017 (PKCS #1 v2.2)',
      keyDerivation: 'Probabilistic Prime Generation via CSPRNG (e = 65537)',
      ivNonce: 'Not Applicable (Randomized OAEP Seed Padding)',
      tag: 'Semantic Security via OAEP (Optimal Asymmetric Encryption Padding)',
      securityStatus: 'Active & Cryptographically Secure (NIST Approved Asymmetric Cipher)',
      isLegacy: false,
      explanation:
        'Rivest-Shamir-Adleman (RSA) is an asymmetric public-key cryptosystem grounded in the computational intractability of factoring large semi-prime moduli (N = p * q). SecureCipher enforces Optimal Asymmetric Encryption Padding (OAEP) utilizing SHA-256 hashing and Mask Generation Function 1 (MGF1). OAEP introduces cryptographic randomness into the plaintext prior to modular exponentiation, preventing chosen-ciphertext attacks (IND-CCA2) and eliminating padding oracle vulnerabilities. Due to mathematical constraints, the maximum plaintext payload size is strictly bounded by the modulus length minus padding overhead (k - 2*hLen - 2 bytes, exactly 190 bytes for RSA-2048 with SHA-256).',
    };
  }

  if (algo.includes('DIFFIE') || algo.includes('DH')) {
    return {
      canonicalName: 'Diffie-Hellman (DH)',
      themeColor: [67, 56, 202], // Indigo
      category: 'Asymmetric Key Agreement Protocol',
      standard: 'RFC 3526 MODP Group 14 (2048-bit Prime) & RFC 5869 (HKDF)',
      keyDerivation: 'HKDF-SHA256 (HMAC-based Key Derivation Function)',
      ivNonce: 'Ephemeral CSPRNG Exponents (Alice "a", Bob "b")',
      tag: 'Mathematical Equality Verification (Shared Secret S)',
      securityStatus: 'Active & Cryptographically Secure (RFC 3526 Standard)',
      isLegacy: false,
      explanation:
        'The Diffie-Hellman Key Agreement protocol enables two independent parties to establish a shared cryptographic secret across an untrusted, public communication channel without prior shared secrets. Security relies on the hardness of the Discrete Logarithm Problem (DLP) over finite cyclic groups. SecureCipher implements RFC 3526 MODP Group 14, featuring a vetted 2048-bit prime modulus and generator g=2. Both parties generate private exponents, exchange public components (g^a mod p and g^b mod p), and compute matching shared secrets (S = B^a mod p = A^b mod p). The raw mathematical secret is passed through HKDF-SHA256 to produce a clean 256-bit symmetric session key.',
    };
  }

  if (algo.includes('SHA')) {
    return {
      canonicalName: 'SHA-256',
      themeColor: [4, 120, 87], // Emerald
      category: 'Cryptographic One-Way Hash Function',
      standard: 'NIST FIPS 180-4 (Secure Hash Standard)',
      keyDerivation: 'Keyless Deterministic Message Digest',
      ivNonce: '8 Standard 32-bit Initialization Vectors (Fractional Primes)',
      tag: '256-bit (32-byte / 64-hex character) Fixed Digest',
      securityStatus: 'Active & Cryptographically Secure (NIST FIPS 180-4 Standard)',
      isLegacy: false,
      explanation:
        'SHA-256 belongs to the Secure Hash Algorithm 2 (SHA-2) family standardized by NIST. It transforms arbitrary-length input messages into an irreversible, deterministic 256-bit (32-byte / 64 hexadecimal character) hash digest. Operating via the Merkle-Damgård construction over 512-bit message blocks with 64 iterative compression rounds, SHA-256 employs bitwise rotations, non-linear boolean operations (Ch and Maj), modular addition, and round constants. It provides strong pre-image resistance, second pre-image resistance, collision resistance, and a dramatic avalanche effect where modifying a single input bit alters over 50% of the output digest.',
    };
  }

  if (algo.includes('MD5')) {
    return {
      canonicalName: 'MD5 (Message Digest 5)',
      themeColor: [180, 83, 9], // Amber
      category: 'Historical Message Digest (Legacy Educational Analysis)',
      standard: 'RFC 1321 (Cryptographically Deprecated / Insecure)',
      keyDerivation: 'Keyless Deterministic Message Digest',
      ivNonce: '4 Standard 32-bit Chaining Variables (RFC 1321 Constants)',
      tag: '128-bit (16-byte / 32-hex character) Fixed Digest',
      securityStatus: 'CRYPTOGRAPHICALLY BROKEN (Educational Demonstration Only)',
      isLegacy: true,
      explanation:
        'MD5 is a historical 128-bit cryptographic hash function developed in 1992 by Ronald Rivest (RFC 1321). It processes 512-bit blocks through 64 rounds across four non-linear functions. IMPORTANT EDUCATIONAL WARNING: MD5 is thoroughly broken and insecure against modern collision attacks. Practical collision attacks demonstrated by Wang et al. in 2004, chosen-prefix collision attacks, and real-world exploit incidents (such as the Flame malware rogue certificate) prove that adversaries can generate colliding inputs in seconds. MD5 is implemented in SecureCipher strictly for academic cryptanalysis, algorithm comparison, and legacy non-security checksum education.',
    };
  }

  if (algo.includes('DES')) {
    return {
      canonicalName: 'DES-CBC (Data Encryption Standard)',
      themeColor: [194, 65, 12], // Orange-Red
      category: 'Legacy Symmetric Feistel Cipher (Educational Analysis)',
      standard: 'NIST FIPS 46-3 (Officially Withdrawn in 2005)',
      keyDerivation: '56-bit Key Schedule (64-bit key with 8 parity bits)',
      ivNonce: '64-bit (8-byte) Initialization Vector (CBC Chaining)',
      tag: 'PKCS#7 Block Padding (No Built-in Authenticated MAC)',
      securityStatus: 'INSECURE & WITHDRAWN (Educational Demonstration Only)',
      isLegacy: true,
      explanation:
        'Data Encryption Standard (DES) is an archetype 16-round Feistel block cipher operating on 64-bit blocks, standardized in 1977 as FIPS 46 and officially withdrawn by NIST in 2005. SecureCipher demonstrates DES in Cipher Block Chaining (CBC) mode with an 8-byte IV and PKCS#7 padding. IMPORTANT EDUCATIONAL WARNING: DES provides only 56 effective key bits, yielding a key space of 2^56 (approximately 7.2 * 10^16 possibilities). Dedicated hardware clusters (such as EFF Deep Crack) and modern cloud computing can exhaustively brute-force the entire 56-bit key space in under an hour. DES is included exclusively for historical cryptanalysis and education on the evolution to modern AES.',
    };
  }

  return {
    canonicalName: algorithmName || 'Cryptographic Primitive',
    themeColor: [79, 70, 229],
    category: 'Cryptographic Algorithm',
    standard: 'Recognized Cryptographic Benchmark',
    keyDerivation: 'Standard Key Management',
    ivNonce: 'Cryptographic Nonce / IV',
    tag: 'Integrity Check / Digest',
    securityStatus: 'Operational Evaluation',
    isLegacy: false,
    explanation:
      'This cryptographic operation was executed under SecureCipher to benchmark computational performance, verify algorithmic correctness, and record compliance metadata in the PostgreSQL operation audit log.',
  };
}

/**
 * Returns tailored, numbered operational workflow steps for the audit record
 */
function getWorkflowSteps(algorithmName, operationType, status) {
  const op = (operationType || '').toLowerCase();
  const algo = (algorithmName || '').toUpperCase();
  const isFailed = (status || '').toLowerCase() !== 'success';

  if (op.includes('hash_file')) {
    return [
      {
        step: 1,
        title: 'File Streaming & Buffer Ingestion',
        detail: 'The client initiates a multipart upload stream. Input file bytes are read in controlled memory buffers without persisting raw payload data to disk.',
      },
      {
        step: 2,
        title: 'Incremental Chunk Processing',
        detail: 'The hashing engine processes file stream chunks incrementally through standard 512-bit message blocks with length-padding verification.',
      },
      {
        step: 3,
        title: 'Digest Finalization',
        detail: isFailed
          ? 'An input stream error or abort occurred during block processing; digest calculation was terminated prematurely.'
          : 'Upon reaching EOF, final block compression rounds compute the fixed-length hexadecimal digest.',
      },
      {
        step: 4,
        title: 'Client Delivery & Memory Erasure',
        detail: 'Calculated hash digest and execution latency (in milliseconds) are returned to the frontend. All in-memory buffers are purged.',
      },
      {
        step: 5,
        title: 'Zero-Knowledge Audit Registration',
        detail: `Execution telemetry (Algorithm: ${algorithmName}, Op: hash_file, Status: ${status}, Latency ms, UTC Timestamp) is written to PostgreSQL without saving file contents.`,
      },
    ];
  }

  if (op.includes('hash') || op.includes('text')) {
    return [
      {
        step: 1,
        title: 'Plaintext Input Ingestion',
        detail: 'User submits text input via the frontend workbench to the FastAPI cryptographic endpoint.',
      },
      {
        step: 2,
        title: 'Binary Encoding & Padding Preprocessing',
        detail: 'The string is UTF-8 encoded and padded with a 1-bit, zero-padding bits, and a 64-bit message length integer according to FIPS specifications.',
      },
      {
        step: 3,
        title: 'Compression Rounds Execution',
        detail: isFailed
          ? 'Hashing engine raised an execution exception during data parsing; operation terminated.'
          : 'Iterative compression rounds execute non-linear boolean transformations across 512-bit message blocks.',
      },
      {
        step: 4,
        title: 'Deterministic Digest Generation',
        detail: isFailed
          ? 'No valid cryptographic digest was output due to execution failure.'
          : 'The final chaining state variables are formatted into a deterministic hexadecimal hash string and returned to the client.',
      },
      {
        step: 5,
        title: 'Safe Audit Trail Persistence',
        detail: 'Operational latency and execution status are recorded in the PostgreSQL audit log. Raw plaintext is never stored.',
      },
    ];
  }

  if (op.includes('encrypt')) {
    return [
      {
        step: 1,
        title: 'Plaintext & Passphrase Ingestion',
        detail: 'Plaintext message and encryption passphrase/key are submitted through secure memory channels.',
      },
      {
        step: 2,
        title: 'Cryptographic Salt & Nonce Generation',
        detail: 'Operating system CSPRNG (os.urandom) generates a cryptographically random salt and unique nonce/IV.',
      },
      {
        step: 3,
        title: 'Key Derivation & Cipher Execution',
        detail: isFailed
          ? 'Key derivation or encryption engine encountered an error; process halted safely.'
          : 'Scrypt derives a 256-bit symmetric key; cipher executes block transformations and computes the authentication tag.',
      },
      {
        step: 4,
        title: 'Base64 Serialization & Emission',
        detail: 'Ciphertext, nonce, salt, and tag are Base64 encoded and returned to the client.',
      },
      {
        step: 5,
        title: 'Memory Cleansing & Audit Recording',
        detail: 'All intermediate keys and plaintexts are cleared from memory. Execution duration and status are saved in PostgreSQL.',
      },
    ];
  }

  if (op.includes('decrypt')) {
    return [
      {
        step: 1,
        title: 'Cipher Package & Credential Ingestion',
        detail: 'Base64 ciphertext, nonce, salt, tag, and user passphrase/key are received by the endpoint.',
      },
      {
        step: 2,
        title: 'Parameter Reconstitution & Key Derivation',
        detail: 'Session key is re-derived via Scrypt using the supplied salt and passphrase.',
      },
      {
        step: 3,
        title: 'Cryptographic Authenticity & Integrity Verification',
        detail: isFailed
          ? 'INTEGRITY VERIFICATION FAILED: Authentication tag mismatch, invalid padding, or incorrect passphrase. Decryption aborted.'
          : 'Authentication tag / padding is verified mathematically before any plaintext is released.',
      },
      {
        step: 4,
        title: 'Plaintext Recovery',
        detail: isFailed
          ? 'Decryption engine refused to output data to prevent chosen-ciphertext oracle leaks.'
          : 'Authenticity confirmed; plaintext is decrypted and returned to the user.',
      },
      {
        step: 5,
        title: 'Telemetry Audit Registration',
        detail: `Verification outcome (${status}) and latency are recorded in PostgreSQL with zero plaintext retention.`,
      },
    ];
  }

  if (op.includes('compare')) {
    return [
      {
        step: 1,
        title: 'Hash Pair Submission',
        detail: 'User provides reference hash and candidate hash for integrity comparison.',
      },
      {
        step: 2,
        title: 'String Normalization',
        detail: 'Input hashes are stripped of extraneous whitespace and normalized to lowercase hexadecimal formatting.',
      },
      {
        step: 3,
        title: 'Constant-Time Digest Comparison',
        detail: 'Comparison is executed using hmac.compare_digest() in strict constant time to prevent side-channel timing attacks.',
      },
      {
        step: 4,
        title: 'Verdict Emission',
        detail: isFailed
          ? 'Comparison failed or hashes mismatched.'
          : 'Cryptographic match confirmed; verification response returned to frontend.',
      },
      {
        step: 5,
        title: 'Audit Logging',
        detail: 'Operation duration and status are logged to PostgreSQL history.',
      },
    ];
  }

  if (op.includes('agreement') || op.includes('dh') || op.includes('diffie')) {
    return [
      {
        step: 1,
        title: 'Domain Group Initialization',
        detail: 'RFC 3526 MODP Group 14 parameters (2048-bit prime modulus and generator g=2) are initialized.',
      },
      {
        step: 2,
        title: 'CSPRNG Private Exponent Generation',
        detail: 'Cryptographically strong random private exponents are generated for participating entities.',
      },
      {
        step: 3,
        title: 'Public Key Component Exchange',
        detail: 'Public values are calculated via modular exponentiation and exchanged over untrusted channel.',
      },
      {
        step: 4,
        title: 'Shared Secret & HKDF Derivation',
        detail: isFailed
          ? 'Key agreement computation failed during modular exponentiation or validation.'
          : 'Identical mathematical shared secret is derived independently and expanded into a 256-bit symmetric session key via HKDF.',
      },
      {
        step: 5,
        title: 'Zero-Knowledge Audit Recording',
        detail: 'Agreement latency and status logged in PostgreSQL without storing private exponents or shared secrets.',
      },
    ];
  }

  // Default cryptographic operation workflow
  return [
    {
      step: 1,
      title: 'Cryptographic Request Ingestion',
      detail: `The client dispatches an execution request for algorithm ${algorithmName} to the API.`,
    },
    {
      step: 2,
      title: 'Parameter Validation & Context Setup',
      detail: 'Request parameters are validated against cryptographic boundary limits and schema definitions.',
    },
    {
      step: 3,
      title: 'Cryptographic Engine Execution',
      detail: isFailed
        ? 'Operation encountered an exception during mathematical execution.'
        : 'Underlying cryptographic service processes the operation according to security standards.',
    },
    {
      step: 4,
      title: 'Response Transmission',
      detail: 'Operation outcome and benchmark execution timing are delivered back to the client interface.',
    },
    {
      step: 5,
      title: 'PostgreSQL Audit Trail Logging',
      detail: `Execution metadata (Status: ${status}) is persisted in the PostgreSQL audit log with zero secret retention.`,
    },
  ];
}

// ============================================================================
// REPORT 1: INDIVIDUAL AUDIT RECORD PDF (A4 PORTRAIT)
// ============================================================================

/**
 * Generate a publication-quality single-record audit execution dossier
 * for a specific PostgreSQL audit record.
 */
export function generateSingleAuditRecordPDF(item) {
  if (!item) {
    throw new Error('No audit record provided for PDF report generation.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182 mm
  let currentY = margin;

  const now = new Date();
  const dateStr = formatIndiaTimestamp(now);
  const recordDateStr = formatIndiaTimestamp(item.created_at);
  const reportId = `SC-EXEC-${item.id}-${Date.now().toString(36).toUpperCase()}`;

  const meta = getAlgorithmMetadata(item.algorithm_name);
  const isSuccess = (item.status || '').toLowerCase() === 'success';
  const workflow = getWorkflowSteps(item.algorithm_name, item.operation_type, item.status);

  // Helper for page break checks
  function checkPageBreak(neededHeight) {
    if (currentY + neededHeight > pageHeight - margin - 12) {
      doc.addPage();
      currentY = margin;
      renderRunningPortraitHeader();
    }
  }

  function renderRunningPortraitHeader() {
    doc.setFillColor(...PALETTE.slate900);
    doc.rect(margin, currentY, contentWidth, 7, 'F');

    doc.setFillColor(...meta.themeColor);
    doc.rect(margin, currentY, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.white);
    doc.text('SecureCipher — Individual Audit Record Dossier', margin + 5, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PALETTE.slate400);
    doc.text(`Record #${item.id} | Generated: ${dateStr}`, pageWidth - margin - 3, currentY + 4.8, { align: 'right' });

    currentY += 10;
  }

  // --------------------------------------------------------------------------
  // 1. PAGE 1: HEADER BANNER (INK-FRIENDLY & PROFESSIONAL)
  // --------------------------------------------------------------------------
  const bannerHeight = 25;
  doc.setFillColor(...PALETTE.slate900);
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2, 2, 'F');

  // Left Theme Accent Stripe
  doc.setFillColor(...meta.themeColor);
  doc.roundedRect(margin, currentY, 4, bannerHeight, 1.5, 1.5, 'F');

  // Project Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...PALETTE.white);
  doc.text('SecureCipher', margin + 8, currentY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.slate400);
  doc.text('Multi-Algorithm Cryptography & Secure Data Protection System', margin + 8, currentY + 12);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...meta.themeColor);
  doc.text(`Individual Operation Audit Record Dossier — Record #${item.id}`, margin + 8, currentY + 18);

  // Right Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...meta.themeColor);
  doc.text(reportId, pageWidth - margin - 5, currentY + 7, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate400);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 5, currentY + 12, { align: 'right' });
  doc.text('Audit Engine: PostgreSQL Persistence', pageWidth - margin - 5, currentY + 17, { align: 'right' });

  currentY += bannerHeight + 4;

  // --------------------------------------------------------------------------
  // 2. OPERATION TELEMETRY TABLE (ACTUAL RECORD VALUES)
  // --------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('1. OPERATION AUDIT TELEMETRY & EXECUTION PARAMETERS', margin, currentY + 4);
  currentY += 6.5;

  const telemetryRows = [
    { label: 'Audit Record ID', value: `#${item.id} (PostgreSQL Primary Key)` },
    { label: 'Cryptographic Algorithm', value: item.algorithm_name || 'N/A' },
    { label: 'Cryptographic Category', value: meta.category },
    { label: 'Operation Performed', value: item.operation_type || 'N/A' },
    {
      label: 'Execution Status',
      value: isSuccess ? 'SUCCESS (Operation Completed)' : 'FAILED (Execution Error / Verification Failure)',
      isStatus: true,
    },
    {
      label: 'Benchmark Execution Latency',
      value: item.execution_duration_ms != null ? `${item.execution_duration_ms} ms (High-Precision Measurement)` : 'N/A',
    },
    { label: 'Recorded Timestamp (IST / India)', value: `${recordDateStr} (UTC+05:30)` },
    { label: 'Cryptographic Standard', value: meta.standard },
    { label: 'Data Retention Standard', value: 'Zero-Knowledge Isolation (Ephemeral Execution Only)' },
  ];

  const tableRowHeight = 6.2;
  const col1Width = 56;
  const col2Width = contentWidth - col1Width;

  telemetryRows.forEach((row, idx) => {
    checkPageBreak(tableRowHeight);

    const isEven = idx % 2 === 0;
    doc.setFillColor(...(isEven ? PALETTE.slate50 : PALETTE.white));
    doc.setDrawColor(...PALETTE.slate200);
    doc.rect(margin, currentY, contentWidth, tableRowHeight, 'FD');

    // Label column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.slate600);
    doc.text(row.label, margin + 3, currentY + 4.3);

    // Value column
    if (row.isStatus) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      if (isSuccess) {
        doc.setTextColor(...PALETTE.emerald);
        doc.text(`[SUCCESS] ${row.value}`, margin + col1Width + 3, currentY + 4.3);
      } else {
        doc.setTextColor(...PALETTE.rose);
        doc.text(`[FAILED] ${row.value}`, margin + col1Width + 3, currentY + 4.3);
      }
    } else {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...PALETTE.slate900);
      doc.text(row.value, margin + col1Width + 3, currentY + 4.3);
    }

    currentY += tableRowHeight;
  });

  currentY += 4.5;

  // --------------------------------------------------------------------------
  // 3. THEORETICAL FRAMEWORK & CRYPTOGRAPHIC CONTEXT
  // --------------------------------------------------------------------------
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('2. ALGORITHM THEORETICAL FRAMEWORK & FUNCTIONAL ARCHITECTURE', margin, currentY + 4);
  currentY += 6.5;

  // Algorithm context card
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);

  const explanationLines = doc.splitTextToSize(meta.explanation, contentWidth - 8);
  const explanationBoxHeight = explanationLines.length * 4.2 + 8;

  checkPageBreak(explanationBoxHeight);
  doc.roundedRect(margin, currentY, contentWidth, explanationBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.4);
  doc.setTextColor(...PALETTE.slate700);
  doc.text(explanationLines, margin + 4, currentY + 5.5);

  currentY += explanationBoxHeight + 4.5;

  // --------------------------------------------------------------------------
  // 4. OPERATIONAL EXECUTION WORKFLOW
  // --------------------------------------------------------------------------
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(`3. OPERATIONAL WORKFLOW: ${item.algorithm_name} (${item.operation_type})`, margin, currentY + 4);
  currentY += 6.5;

  workflow.forEach((wf) => {
    const detailLines = doc.splitTextToSize(wf.detail, contentWidth - 28);
    const itemHeight = Math.max(detailLines.length * 3.8 + 4, 8);

    checkPageBreak(itemHeight);

    doc.setFillColor(...PALETTE.slate50);
    doc.setDrawColor(...PALETTE.slate200);
    doc.roundedRect(margin, currentY, contentWidth, itemHeight, 1, 1, 'FD');

    // Step Number Badge
    doc.setFillColor(...meta.themeColor);
    doc.circle(margin + 5, currentY + itemHeight / 2, 2.8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...PALETTE.white);
    doc.text(String(wf.step), margin + 5, currentY + itemHeight / 2 + 1, { align: 'center' });

    // Step Title & Detail
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.slate900);
    doc.text(wf.title, margin + 11, currentY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...PALETTE.slate600);
    doc.text(detailLines, margin + 11, currentY + 7.5);

    currentY += itemHeight + 2;
  });

  currentY += 2.5;

  // --------------------------------------------------------------------------
  // 5. SECURITY EVALUATION & OPERATIONAL LIMITATIONS
  // --------------------------------------------------------------------------
  checkPageBreak(32);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('4. SECURITY EVALUATION, VERIFICATION STATUS & LIMITATIONS', margin, currentY + 4);
  currentY += 6.5;

  // Status Banner
  const statusBannerHeight = 13;
  if (isSuccess) {
    doc.setFillColor(...PALETTE.emeraldLight);
    doc.setDrawColor(...PALETTE.emeraldBorder);
    doc.roundedRect(margin, currentY, contentWidth, statusBannerHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.emerald);
    doc.text('OPERATIONAL EXECUTION VERIFIED SUCCESSFUL', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(
      `The operation completed cleanly in ${item.execution_duration_ms} ms. Mathematical integrity checks, padding verifications, and parameter boundaries were fully satisfied.`,
      margin + 4,
      currentY + 9,
      { maxWidth: contentWidth - 8 }
    );
  } else {
    doc.setFillColor(...PALETTE.roseLight);
    doc.setDrawColor(...PALETTE.roseBorder);
    doc.roundedRect(margin, currentY, contentWidth, statusBannerHeight, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PALETTE.rose);
    doc.text('OPERATIONAL EXECUTION FAILED / EXCEPTION RECORDED', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.text(
      'The operation failed during execution. Possible root causes include invalid credentials, integrity tag mismatch, corrupted input parameters, or cryptographic boundary violations. No valid unverified plaintext was emitted.',
      margin + 4,
      currentY + 9,
      { maxWidth: contentWidth - 8 }
    );
  }
  currentY += statusBannerHeight + 3;

  // Legacy Algorithm Warning (If MD5 or DES)
  if (meta.isLegacy) {
    checkPageBreak(15);
    doc.setFillColor(...PALETTE.amberLight);
    doc.setDrawColor(...PALETTE.amberBorder);
    doc.roundedRect(margin, currentY, contentWidth, 13, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.amber);
    doc.text('ACADEMIC LEGACY WARNING: CRYPTOGRAPHICALLY INSECURE', margin + 4, currentY + 4.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...PALETTE.amber);
    doc.text(
      `This algorithm (${meta.canonicalName}) is officially retired and vulnerable to practical cryptanalysis. It is provided in SecureCipher strictly for educational demonstration, historical analysis, and performance benchmarking. Do NOT employ this cipher in modern security-sensitive applications.`,
      margin + 4,
      currentY + 8.5,
      { maxWidth: contentWidth - 8 }
    );
    currentY += 15;
  }

  // Zero-Knowledge Privacy Guarantee Card
  checkPageBreak(14);
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate700);
  doc.text('CONFIDENTIALITY & ZERO-KNOWLEDGE ASSURANCE:', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.7);
  doc.setTextColor(...PALETTE.slate600);
  doc.text(
    'In compliance with privacy and data protection standards, SecureCipher never stores raw plaintexts, uploaded file contents, passphrases, RSA private keys, AES secret keys, or Diffie-Hellman private exponents in the audit database. Only execution telemetry is permanently audited.',
    margin + 4,
    currentY + 8.5,
    { maxWidth: contentWidth - 8 }
  );

  // --------------------------------------------------------------------------
  // 6. RUNNING FOOTER ON ALL PAGES (TWO-PASS)
  // --------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...PALETTE.slate200);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(
      `SecureCipher — College Mini-Project | Audit Record #${item.id} (${item.algorithm_name})`,
      margin,
      pageHeight - 5.5
    );

    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  // --------------------------------------------------------------------------
  // 7. DOWNLOAD TRIGGER & RETURN
  // --------------------------------------------------------------------------
  const cleanAlgo = getSafeFileSlug(item.algorithm_name || 'Crypto');
  const cleanOp = getSafeFileSlug(item.operation_type || 'Execution');
  const filename = `SecureCipher_Audit_${item.id}_${cleanAlgo}_${cleanOp}.pdf`;

  let blobUrl = null;
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined') {
    const rawBlob = doc.output('blob');
    const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
    blobUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.target = '_self';
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);

    try {
      const clickEvt = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvt);
    } catch {
      link.click();
    }

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  }

  return { success: true, filename, blobUrl, totalPages, doc };
}

// ============================================================================
// REPORT 2: FULL OPERATION AUDIT HISTORY PDF (A4 LANDSCAPE)
// ============================================================================

/**
 * Generate a comprehensive publication-grade A4 Landscape audit history report
 * of all or filtered cryptographic executions logged in PostgreSQL.
 */
export function generateAuditHistoryPDF({
  items = [],
  filterAlgo = 'ALL',
  dbHealth = null,
  totalMatchingRecords = 0,
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 269 mm
  let currentY = margin;

  const now = new Date();
  const dateStr = formatIndiaTimestamp(now);
  const dateCompact = now.toISOString().split('T')[0];
  const reportId = `SC-AUDIT-HIST-${Date.now().toString(36).toUpperCase()}`;

  // --------------------------------------------------------------------------
  // SUMMARY CALCULATIONS (ACTUAL VALUES)
  // --------------------------------------------------------------------------
  const totalCount = items.length;
  let successCount = 0;
  let failureCount = 0;
  let totalDurationMs = 0;

  // Group by algorithm for Section 1
  const algoGroupMap = {};

  items.forEach((item) => {
    const isSucc = (item.status || '').toLowerCase() === 'success';
    if (isSucc) successCount++;
    else failureCount++;

    const dur = typeof item.execution_duration_ms === 'number' ? item.execution_duration_ms : 0;
    totalDurationMs += dur;

    const alg = item.algorithm_name || 'Unknown';
    if (!algoGroupMap[alg]) {
      algoGroupMap[alg] = {
        name: alg,
        total: 0,
        success: 0,
        failure: 0,
        durations: [],
      };
    }
    algoGroupMap[alg].total++;
    if (isSucc) algoGroupMap[alg].success++;
    else algoGroupMap[alg].failure++;
    algoGroupMap[alg].durations.push(dur);
  });

  const overallSuccessRate = totalCount > 0 ? ((successCount / totalCount) * 100).toFixed(1) : '100.0';
  const meanLatency = totalCount > 0 ? (totalDurationMs / totalCount).toFixed(2) : '0.00';

  const filterLabel = filterAlgo === 'ALL' ? 'All Algorithms (Unfiltered)' : `Algorithm Filter: ${filterAlgo}`;

  // Helper for Landscape Table Header
  function renderLandscapeTableHeader(yPos) {
    const headerHeight = 7.2;
    doc.setFillColor(...PALETTE.slate800);
    doc.rect(margin, yPos, contentWidth, headerHeight, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.white);

    // Columns: [ID: 26mm, Algo: 44mm, Op: 52mm, Status: 32mm, Duration: 32mm, Timestamp: 53mm, Storage: 30mm] = 269mm
    doc.text('Audit ID', margin + 3, yPos + 4.8);
    doc.text('Algorithm', margin + 26, yPos + 4.8);
    doc.text('Operation Type', margin + 70, yPos + 4.8);
    doc.text('Status', margin + 122, yPos + 4.8);
    doc.text('Execution Latency', margin + 154, yPos + 4.8);
    doc.text('Timestamp (IST / India)', margin + 186, yPos + 4.8);
    doc.text('Audit Storage', margin + 239, yPos + 4.8);

    return yPos + headerHeight;
  }

  // Running Landscape Header for continuation pages
  function renderRunningLandscapeHeader(includeTableHeader = false) {
    doc.setFillColor(...PALETTE.slate900);
    doc.rect(margin, currentY, contentWidth, 7, 'F');

    doc.setFillColor(...PALETTE.indigo);
    doc.rect(margin, currentY, 2.5, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.white);
    doc.text('SecureCipher — Operation Audit History Report', margin + 5, currentY + 4.8);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PALETTE.slate400);
    doc.text(
      `Filter: ${filterAlgo} | Records Exported: ${totalCount} | Generated: ${dateStr}`,
      pageWidth - margin - 3,
      currentY + 4.8,
      { align: 'right' }
    );

    currentY += 9;

    if (includeTableHeader) {
      currentY = renderLandscapeTableHeader(currentY);
    }
  }

  function checkLandscapePageBreak(neededHeight, isWithinAuditTable = false) {
    if (currentY + neededHeight > pageHeight - margin - 11) {
      doc.addPage('a4', 'landscape');
      currentY = margin;
      renderRunningLandscapeHeader(isWithinAuditTable);
    }
  }

  // --------------------------------------------------------------------------
  // 1. PAGE 1: HEADER BANNER (LANDSCAPE)
  // --------------------------------------------------------------------------
  const bannerHeight = 22;
  doc.setFillColor(...PALETTE.slate900);
  doc.roundedRect(margin, currentY, contentWidth, bannerHeight, 2, 2, 'F');

  // Left Indigo Accent Stripe
  doc.setFillColor(...PALETTE.indigo);
  doc.roundedRect(margin, currentY, 3.5, bannerHeight, 1.5, 1.5, 'F');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...PALETTE.white);
  doc.text('SecureCipher', margin + 7, currentY + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.slate400);
  doc.text('Multi-Algorithm Cryptography & Secure Data Protection System', margin + 7, currentY + 11.5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...PALETTE.indigoBorder);
  doc.text('Operation Audit History — Cryptographic Execution Audit Report', margin + 7, currentY + 17);

  // Right Metadata
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...PALETTE.indigoBorder);
  doc.text(reportId, pageWidth - margin - 5, currentY + 6.5, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate400);
  doc.text(`Generated: ${dateStr}`, pageWidth - margin - 5, currentY + 11.5, { align: 'right' });
  doc.text('Audit Engine: PostgreSQL Persistence Layer', pageWidth - margin - 5, currentY + 16.5, { align: 'right' });

  currentY += bannerHeight + 3.5;

  // --------------------------------------------------------------------------
  // 2. EXECUTIVE SUMMARY METRICS CARD
  // --------------------------------------------------------------------------
  const summaryBoxHeight = 15;
  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.roundedRect(margin, currentY, contentWidth, summaryBoxHeight, 1.5, 1.5, 'FD');

  const dbStatusText = dbHealth?.connected
    ? 'PostgreSQL: Connected & Verified'
    : dbHealth?.status === 'unconfigured'
    ? 'PostgreSQL: Awaiting .env Config'
    : 'PostgreSQL: Standalone / Disconnected';

  // Metric 1: Filter Scope
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate500);
  doc.text('ACTIVE FILTER SCOPE', margin + 4, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(filterLabel, margin + 4, currentY + 10.5);

  // Metric 2: Database Persistence
  const col2X = margin + 65;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate500);
  doc.text('DATABASE PERSISTENCE', col2X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.2);
  doc.setTextColor(...(dbHealth?.connected ? PALETTE.emerald : PALETTE.rose));
  doc.text(dbStatusText, col2X, currentY + 10.5);

  // Metric 3: Records Exported
  const col3X = margin + 130;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate500);
  doc.text('RECORDS EXPORTED', col3X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(`${totalCount} records (active snapshot)`, col3X, currentY + 10.5);

  // Metric 4: Success Rate
  const col4X = margin + 190;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate500);
  doc.text('OVERALL SUCCESS RATE', col4X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...(failureCount === 0 ? PALETTE.emerald : PALETTE.slate900));
  doc.text(`${overallSuccessRate}% (${successCount} / ${totalCount})`, col4X, currentY + 10.5);

  // Metric 5: Mean Latency
  const col5X = margin + 235;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate500);
  doc.text('MEAN EXECUTION LATENCY', col5X, currentY + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text(`${meanLatency} ms`, col5X, currentY + 10.5);

  currentY += summaryBoxHeight + 3.5;

  // --------------------------------------------------------------------------
  // 3. SECTION 1: ALGORITHM BENCHMARK & EXECUTION SUMMARY TABLE
  // --------------------------------------------------------------------------
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('1. ALGORITHM BENCHMARK & EXECUTION SUMMARY', margin, currentY + 3.5);
  currentY += 5.5;

  // Render Aggregate Table Header
  const aggHeaderHeight = 6.5;
  doc.setFillColor(...PALETTE.slate800);
  doc.rect(margin, currentY, contentWidth, aggHeaderHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.white);

  // Columns: [Algo: 50mm, Category: 65mm, Ops: 26mm, Success: 26mm, Failed: 26mm, Rate: 34mm, Avg: 22mm, Min/Max: 20mm] = 269mm
  doc.text('Algorithm Name', margin + 3, currentY + 4.5);
  doc.text('Cryptographic Classification', margin + 50, currentY + 4.5);
  doc.text('Total Ops', margin + 115, currentY + 4.5);
  doc.text('Successes', margin + 141, currentY + 4.5);
  doc.text('Failures', margin + 167, currentY + 4.5);
  doc.text('Success Rate', margin + 193, currentY + 4.5);
  doc.text('Mean Latency', margin + 227, currentY + 4.5);
  doc.text('Range (Min / Max)', margin + 249, currentY + 4.5);

  currentY += aggHeaderHeight;

  const algoGroups = Object.values(algoGroupMap);
  if (algoGroups.length === 0) {
    doc.setFillColor(...PALETTE.slate50);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.slate500);
    doc.text('No cryptographic operations recorded yet in audit history.', margin + 3, currentY + 4.8);
    currentY += 7;
  } else {
    algoGroups.forEach((g, gIdx) => {
      const gMeta = getAlgorithmMetadata(g.name);
      const gSuccessRate = g.total > 0 ? ((g.success / g.total) * 100).toFixed(1) + '%' : '100%';
      const sumDur = g.durations.reduce((a, b) => a + b, 0);
      const avgDur = g.total > 0 ? (sumDur / g.total).toFixed(2) + ' ms' : '0.00 ms';
      const minDur = g.durations.length > 0 ? Math.min(...g.durations).toFixed(2) : '0';
      const maxDur = g.durations.length > 0 ? Math.max(...g.durations).toFixed(2) : '0';

      const isEven = gIdx % 2 === 0;
      doc.setFillColor(...(isEven ? PALETTE.slate50 : PALETTE.white));
      doc.setDrawColor(...PALETTE.slate200);
      doc.rect(margin, currentY, contentWidth, 6, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.slate900);
      doc.text(g.name, margin + 3, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...PALETTE.slate600);
      doc.text(gMeta.category, margin + 50, currentY + 4.2);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.slate900);
      doc.text(String(g.total), margin + 115, currentY + 4.2);

      doc.setTextColor(...PALETTE.emerald);
      doc.text(String(g.success), margin + 141, currentY + 4.2);

      doc.setTextColor(...(g.failure > 0 ? PALETTE.rose : PALETTE.slate500));
      doc.text(String(g.failure), margin + 167, currentY + 4.2);

      doc.setTextColor(...PALETTE.slate900);
      doc.text(gSuccessRate, margin + 193, currentY + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(avgDur, margin + 227, currentY + 4.2);
      doc.text(`${minDur} / ${maxDur} ms`, margin + 249, currentY + 4.2);

      currentY += 6;
    });

    // Total Row
    doc.setFillColor(...PALETTE.slate100);
    doc.setDrawColor(...PALETTE.slate300);
    doc.rect(margin, currentY, contentWidth, 6.2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...PALETTE.slate900);
    doc.text('TOTAL / OVERALL BENCHMARK', margin + 3, currentY + 4.3);
    doc.text(String(totalCount), margin + 115, currentY + 4.3);

    doc.setTextColor(...PALETTE.emerald);
    doc.text(String(successCount), margin + 141, currentY + 4.3);

    doc.setTextColor(...(failureCount > 0 ? PALETTE.rose : PALETTE.slate500));
    doc.text(String(failureCount), margin + 167, currentY + 4.3);

    doc.setTextColor(...PALETTE.slate900);
    doc.text(`${overallSuccessRate}%`, margin + 193, currentY + 4.3);
    doc.text(`${meanLatency} ms`, margin + 227, currentY + 4.3);
    doc.text('—', margin + 249, currentY + 4.3);

    currentY += 6.2;
  }

  currentY += 4;

  // --------------------------------------------------------------------------
  // 4. SECTION 2: CHRONOLOGICAL AUDIT TRAIL LOG TABLE
  // --------------------------------------------------------------------------
  checkLandscapePageBreak(25);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('2. CHRONOLOGICAL AUDIT TRAIL LOG', margin, currentY + 3.5);
  currentY += 5.5;

  currentY = renderLandscapeTableHeader(currentY);

  if (!items || items.length === 0) {
    const emptyBoxHeight = 16;
    doc.setFillColor(...PALETTE.slate50);
    doc.setDrawColor(...PALETTE.slate200);
    doc.rect(margin, currentY, contentWidth, emptyBoxHeight, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...PALETTE.slate600);
    doc.text('Audit Trail Log is Empty', pageWidth / 2, currentY + 7, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.slate400);
    doc.text(
      `No cryptographic executions logged in PostgreSQL matching filter scope "${filterAlgo}".`,
      pageWidth / 2,
      currentY + 12,
      { align: 'center' }
    );

    currentY += emptyBoxHeight + 4;
  } else {
    const rowHeight = 5.8;

    items.forEach((item, idx) => {
      // Check page break while inside the audit table (repeats header on new page)
      if (currentY + rowHeight > pageHeight - margin - 11) {
        doc.addPage('a4', 'landscape');
        currentY = margin;
        renderRunningLandscapeHeader(true);
      }

      const isSucc = (item.status || '').toLowerCase() === 'success';
      const isEven = idx % 2 === 0;

      doc.setFillColor(...(isEven ? PALETTE.slate50 : PALETTE.white));
      doc.setDrawColor(...PALETTE.slate200);
      doc.rect(margin, currentY, contentWidth, rowHeight, 'FD');

      // 1. Audit ID
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.indigo);
      doc.text(`#${item.id}`, margin + 3, currentY + 4.1);

      // 2. Algorithm
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...PALETTE.slate900);
      const algName = item.algorithm_name || 'N/A';
      doc.text(algName.length > 25 ? algName.substring(0, 24) + '…' : algName, margin + 26, currentY + 4.1);

      // 3. Operation Type
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...PALETTE.slate600);
      const opName = item.operation_type || 'N/A';
      doc.text(opName.length > 30 ? opName.substring(0, 29) + '…' : opName, margin + 70, currentY + 4.1);

      // 4. Status
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      if (isSucc) {
        doc.setTextColor(...PALETTE.emerald);
        doc.text('SUCCESS', margin + 122, currentY + 4.1);
      } else {
        doc.setTextColor(...PALETTE.rose);
        doc.text('FAILED', margin + 122, currentY + 4.1);
      }

      // 5. Duration
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(...PALETTE.slate700);
      const durStr = item.execution_duration_ms != null ? `${item.execution_duration_ms} ms` : 'N/A';
      doc.text(durStr, margin + 154, currentY + 4.1);

      // 6. Timestamp (IST / India)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.6);
      doc.setTextColor(...PALETTE.slate500);
      const timeStr = item.created_at ? formatIndiaTimestamp(item.created_at) : 'N/A';
      doc.text(timeStr, margin + 186, currentY + 4.1);

      // 7. Audit Storage
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...PALETTE.slate500);
      doc.text('PostgreSQL Verified', margin + 239, currentY + 4.1);

      currentY += rowHeight;
    });
  }

  currentY += 4.5;

  // --------------------------------------------------------------------------
  // 5. SECTION 3: AUDIT LOGGING & TELEMETRY RATIONALE
  // --------------------------------------------------------------------------
  checkLandscapePageBreak(26);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('3. CRYPTOGRAPHIC AUDIT LOGGING & TELEMETRY RATIONALE', margin, currentY + 3.5);
  currentY += 5.5;

  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.roundedRect(margin, currentY, contentWidth, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...PALETTE.slate700);
  const rationaleText =
    'Audit logging serves three indispensable security functions in modern cryptographic systems: (1) Non-Repudiation & Traceability: Establishing an unalterable chronological timeline of cryptographic executions for post-incident forensic analysis; (2) Empirical Benchmarking: Measuring real-world execution latencies across block ciphers, asymmetric key-agreement protocols, and hash functions under varying payload sizes; and (3) Standards Compliance: Satisfying NIST FIPS 140-3, ISO/IEC 27001, and common criteria mandates requiring verifiable operational monitoring without compromising data privacy.';
  doc.text(doc.splitTextToSize(rationaleText, contentWidth - 8), margin + 4, currentY + 4.5);

  currentY += 17.5;

  // --------------------------------------------------------------------------
  // 6. SECTION 4: ZERO-KNOWLEDGE SECURITY & PRIVACY STATEMENT
  // --------------------------------------------------------------------------
  checkLandscapePageBreak(22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('4. ZERO-KNOWLEDGE SECURITY & PRIVACY COMPLIANCE STATEMENT', margin, currentY + 3.5);
  currentY += 5.5;

  doc.setFillColor(...PALETTE.emeraldLight);
  doc.setDrawColor(...PALETTE.emeraldBorder);
  doc.roundedRect(margin, currentY, contentWidth, 13, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...PALETTE.emerald);
  doc.text('STRICT ZERO-KNOWLEDGE CONFIDENTIALITY GUARANTEE:', margin + 4, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.emerald);
  const privacyText =
    'In rigorous compliance with cryptographic zero-knowledge principles, the SecureCipher audit persistence layer strictly records only operational execution metadata (Audit ID, Algorithm Name, Operation Type, Execution Status, Latency in Milliseconds, and UTC Timestamp). User plaintext messages, uploaded file contents, secret passphrases, RSA private keys, AES secret keys, Diffie-Hellman private exponents, and database credentials are NEVER persisted to PostgreSQL or rendered in any generated PDF document.';
  doc.text(doc.splitTextToSize(privacyText, contentWidth - 8), margin + 4, currentY + 8.5);

  currentY += 16.5;

  // --------------------------------------------------------------------------
  // 7. SECTION 5: CRYPTOGRAPHIC ALGORITHMS & OPERATIONS GLOSSARY
  // --------------------------------------------------------------------------
  checkLandscapePageBreak(38);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('5. CRYPTOGRAPHIC ALGORITHMS & OPERATIONS GLOSSARY', margin, currentY + 3.5);
  currentY += 5.5;

  const glossaryItems = [
    {
      term: 'AES-256-GCM',
      def: 'Advanced Encryption Standard in Galois/Counter Mode. Provides symmetric authenticated encryption (AEAD) with 256-bit keys, 96-bit nonces, and 128-bit authentication tags.',
    },
    {
      term: 'RSA-OAEP',
      def: 'Rivest-Shamir-Adleman asymmetric cipher utilizing Optimal Asymmetric Encryption Padding (OAEP) with SHA-256 to ensure IND-CCA2 security against chosen-ciphertext attacks.',
    },
    {
      term: 'Diffie-Hellman (DH)',
      def: 'Breakthrough key agreement protocol over RFC 3526 MODP Group 14 (2048-bit prime), enabling secure derivation of a shared symmetric key via HKDF without transmitting secrets.',
    },
    {
      term: 'SHA-256',
      def: 'Cryptographic hash function from the NIST FIPS 180-4 standard producing deterministic 256-bit digests with proven pre-image and collision resistance.',
    },
    {
      term: 'MD5 & DES (Legacy)',
      def: 'Historical ciphers included exclusively for academic study. MD5 is collision-vulnerable; DES has an insecure 56-bit key space. Both are deprecated for production security.',
    },
    {
      term: 'Operation Types',
      def: 'encrypt (ciphertext generation), decrypt (plaintext recovery + tag check), hash_text / hash_file (digest generation), compare (constant-time verification), key_agreement (shared secret derivation).',
    },
  ];

  glossaryItems.forEach((g) => {
    checkLandscapePageBreak(6.5);

    doc.setFillColor(...PALETTE.slate50);
    doc.setDrawColor(...PALETTE.slate200);
    doc.rect(margin, currentY, contentWidth, 5.8, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...PALETTE.indigo);
    doc.text(g.term, margin + 3, currentY + 4.1);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.7);
    doc.setTextColor(...PALETTE.slate700);
    doc.text(g.def, margin + 48, currentY + 4.1, { maxWidth: contentWidth - 52 });

    currentY += 5.8;
  });

  currentY += 4;

  // --------------------------------------------------------------------------
  // 8. SECTION 6: CONCLUSION & SYSTEM HEALTH SUMMARY
  // --------------------------------------------------------------------------
  checkLandscapePageBreak(18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PALETTE.slate900);
  doc.text('6. CONCLUSION & SYSTEM HEALTH ASSESSMENT', margin, currentY + 3.5);
  currentY += 5.5;

  doc.setFillColor(...PALETTE.slate50);
  doc.setDrawColor(...PALETTE.slate200);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...PALETTE.slate700);
  const conclusionText = `This operation audit report represents an authoritative snapshot of ${totalCount} cryptographic executions logged in PostgreSQL. The system demonstrated an overall success rate of ${overallSuccessRate}% with a mean benchmark execution latency of ${meanLatency} ms across all active algorithm testbenches. All cryptographic operations complied with zero-knowledge data protection guidelines, confirming robust system health and suitability for academic project evaluation.`;
  doc.text(doc.splitTextToSize(conclusionText, contentWidth - 8), margin + 4, currentY + 4.5);

  // --------------------------------------------------------------------------
  // 9. RUNNING FOOTER ON ALL PAGES (TWO-PASS)
  // --------------------------------------------------------------------------
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...PALETTE.slate200);
    doc.line(margin, pageHeight - 9, pageWidth - margin, pageHeight - 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...PALETTE.slate500);
    doc.text(
      `SecureCipher — College Mini-Project | Operation Audit History (${filterLabel})`,
      margin,
      pageHeight - 5.5
    );

    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 5.5, { align: 'right' });
  }

  // --------------------------------------------------------------------------
  // 10. DOWNLOAD TRIGGER & RETURN
  // --------------------------------------------------------------------------
  const cleanFilter = filterAlgo === 'ALL' ? 'All_Algorithms' : getSafeFileSlug(filterAlgo);
  const filename = `SecureCipher_Operation_Audit_History_${cleanFilter}_${dateCompact}.pdf`;

  let blobUrl = null;
  if (typeof window !== 'undefined' && typeof document !== 'undefined' && typeof URL !== 'undefined') {
    const rawBlob = doc.output('blob');
    const pdfBlob = new Blob([rawBlob], { type: 'application/pdf' });
    blobUrl = URL.createObjectURL(pdfBlob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    link.target = '_self';
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);

    try {
      const clickEvt = new MouseEvent('click', { view: window, bubbles: true, cancelable: true });
      link.dispatchEvent(clickEvt);
    } catch {
      link.click();
    }

    setTimeout(() => {
      if (document.body.contains(link)) {
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(blobUrl);
    }, 10000);
  }

  return { success: true, filename, blobUrl, totalPages, doc };
}
