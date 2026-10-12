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
          key_size_info: '2048-bit MODP Group 14 (RFC 3526)',
          status: 'Active (RFC 3526 MODP-2048 & HKDF-SHA256 Implemented)',
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

/**
 * Generate RSA Public/Private Keypair
 */
export async function generateRSAKeys(keySize = 2048) {
  const response = await fetch(`${API_BASE_URL}/rsa/generate-keys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ key_size: parseInt(keySize, 10) }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'RSA key generation failed');
  }
  return data;
}

/**
 * Encrypt text with RSA Public Key and OAEP-SHA256
 */
export async function encryptRSA(plaintext, publicKeyPem) {
  const response = await fetch(`${API_BASE_URL}/rsa/encrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plaintext,
      public_key_pem: publicKeyPem,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'RSA encryption failed');
  }
  return data;
}

/**
 * Decrypt ciphertext with RSA Private Key and OAEP-SHA256
 */
export async function decryptRSA(ciphertext, privateKeyPem) {
  const response = await fetch(`${API_BASE_URL}/rsa/decrypt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ciphertext,
      private_key_pem: privateKeyPem,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'RSA decryption failed');
  }
  return data;
}

/**
 * Generate Diffie-Hellman Keypair (RFC 3526 MODP Group 14)
 */
export async function generateDHKeypair(partyName = 'Party') {
  const response = await fetch(`${API_BASE_URL}/diffie-hellman/generate-keypair`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ party_name: partyName }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Diffie-Hellman key generation failed');
  }
  return data;
}

/**
 * Derive Shared Secret and HKDF-SHA256 Symmetric Key
 */
export async function deriveDHSecret(privateKeyPem, peerPublicKeyPem, info = 'SecureCipher Diffie-Hellman KDF') {
  const response = await fetch(`${API_BASE_URL}/diffie-hellman/derive-secret`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      private_key_pem: privateKeyPem,
      peer_public_key_pem: peerPublicKeyPem,
      info,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Diffie-Hellman key derivation failed');
  }
  return data;
}

/**
 * Simulate Complete Alice <-> Bob Diffie-Hellman Handshake
 */
export async function simulateDHExchange() {
  const response = await fetch(`${API_BASE_URL}/diffie-hellman/simulate-exchange`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Diffie-Hellman handshake simulation failed');
  }
  return data;
}



