/**
 * SecureCipher Frontend API Client
 * Connects to the FastAPI backend endpoints with fallback handling.
 */

const API_BASE_URL = '/api';

/**
 * Checks general backend health
 */
export async function fetchHealth() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    const latency = Math.round(performance.now() - startTime);
    if (!response.ok) {
      return {
        status: 'error',
        connected: false,
        latency,
        error: `HTTP ${response.status}`,
      };
    }
    const data = await response.json();
    return {
      ...data,
      connected: true,
      latency,
    };
  } catch (err) {
    return {
      status: 'offline',
      connected: false,
      latency: Math.round(performance.now() - startTime),
      error: err.message || 'Connection refused',
    };
  }
}

/**
 * Checks PostgreSQL live connectivity
 */
export async function fetchDatabaseHealth() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health/database`);
    const latency = Math.round(performance.now() - startTime);
    const data = await response.json();
    return {
      ...data,
      httpStatus: response.status,
      networkLatency: latency,
    };
  } catch (err) {
    return {
      status: 'unreachable',
      connected: false,
      message: 'Unable to communicate with backend to verify database',
      error: err.message,
    };
  }
}

/**
 * Fetches the registry of six supported algorithms
 */
export async function fetchAlgorithms() {
  try {
    const response = await fetch(`${API_BASE_URL}/algorithms`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    console.warn('Backend unavailable, using client fallback registry:', err);
    // Client-side fallback if backend server is not yet started
    return {
      total: 6,
      algorithms: [
        {
          id: 'aes',
          name: 'AES (Advanced Encryption Standard)',
          category: 'Symmetric Block Cipher',
          purpose: 'Confidential bulk data encryption and secure file protection',
          description: 'NIST FIPS 197 standard. Operates on 128-bit blocks using 128, 192, or 256-bit keys.',
          key_size_info: '128, 192, or 256 bits',
          status: 'Foundation Layout Ready (Pending Crypto Implementation)',
          features: ['128-bit block size', 'FIPS 197 compliant', 'CBC and GCM modes'],
        },
        {
          id: 'rsa',
          name: 'RSA (Rivest-Shamir-Adleman)',
          category: 'Asymmetric Cryptography',
          purpose: 'Public-key encryption, secure key transport, and digital signatures',
          description: 'Trapdoor one-way permutation based on the difficulty of prime factorization.',
          key_size_info: '2048, 3072, or 4096 bits',
          status: 'Foundation Layout Ready (Pending Crypto Implementation)',
          features: ['Public/Private key pairs', 'OAEP padding', 'Digital signatures'],
        },
        {
          id: 'diffie-hellman',
          name: 'Diffie-Hellman Key Exchange',
          category: 'Key Agreement Protocol',
          purpose: 'Secure establishment of shared secret keys over insecure communication channels',
          description: 'Discrete logarithm based handshake deriving identical symmetric session keys.',
          key_size_info: '2048-bit MODP or ECDH',
          status: 'Foundation Layout Ready (Pending Crypto Implementation)',
          features: ['Zero pre-shared secret', 'Forward secrecy', 'Modular arithmetic visualization'],
        },
        {
          id: 'sha-256',
          name: 'SHA-256 (Secure Hash Algorithm)',
          category: 'Cryptographic Hash Function',
          purpose: 'Cryptographic data integrity, digital fingerprints, and message authentication',
          description: 'NIST FIPS 180-4 standard producing a deterministic 256-bit digest.',
          key_size_info: 'Fixed 256-bit digest',
          status: 'Foundation Layout Ready (Pending Crypto Implementation)',
          features: ['Collision resistant', 'Strict avalanche effect', 'Integrity verification'],
        },
        {
          id: 'md5',
          name: 'MD5 (Message Digest 5)',
          category: 'Legacy Hash Function',
          purpose: 'Educational integrity comparison, legacy checksum verification, and collision analysis',
          description: 'Historical 128-bit hash function included for comparative vulnerability study.',
          key_size_info: 'Fixed 128-bit digest',
          status: 'Foundation Layout Ready (Pending Crypto Implementation)',
          features: ['128-bit digest', 'High execution speed', 'Educational vulnerability study'],
        },
        {
          id: 'des',
          name: 'DES (Data Encryption Standard)',
          category: 'Legacy Symmetric Cipher',
          purpose: 'Historical and educational block cipher analysis and cryptanalysis demonstrations',
          description: '16-round Feistel cipher with 56-bit key, highlighting the evolution towards AES.',
          key_size_info: '56 effective bits',
          status: 'Foundation Layout Ready (Pending Crypto Implementation)',
          features: ['64-bit blocks', '16 Feistel rounds', 'Comparative key-space study'],
        },
      ],
    };
  }
}

/**
 * Fetches recent operation history metadata
 */
export async function fetchHistory(limit = 20) {
  try {
    const response = await fetch(`${API_BASE_URL}/history?limit=${limit}`);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (err) {
    return {
      items: [],
      total: 0,
      database_connected: false,
      message: err.message,
    };
  }
}

/**
 * Real AES-256-GCM Text Encryption
 */
export async function encryptAES(plaintext, passphrase) {
  const response = await fetch(`${API_BASE_URL}/aes/encrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ plaintext, passphrase }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Encryption failed');
  }
  return data;
}

/**
 * Real AES-256-GCM Text Decryption & Authentication
 */
export async function decryptAES({ passphrase, nonce, salt, ciphertext, tag }) {
  const response = await fetch(`${API_BASE_URL}/aes/decrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ passphrase, nonce, salt, ciphertext, tag }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Decryption failed');
  }
  return data;
}

