import React, { useState, useMemo } from 'react';
import {
  Server,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Shield,
  ShieldCheck,
  Terminal,
  Code2,
  FileCode,
  SlidersHorizontal,
  ArrowRight,
  Database,
  RefreshCw,
  Sparkles,
  Layers,
} from 'lucide-react';

export const API_ENDPOINTS = [
  // ── Health & Diagnostics ──
  {
    id: 'root-info',
    method: 'GET',
    path: '/',
    category: 'Health & Diagnostics',
    summary: 'Root Service & Documentation Info',
    description: 'Returns top-level project metadata, active API version, and discovery links for health, algorithms, and documentation.',
    auth: 'none',
    authDescription: 'Public endpoint. No authentication required.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      service: 'SecureCipher',
      description: 'Multi-Algorithm Cryptography and Secure Data Protection System',
      version: '0.1.0',
      docs_url: '/docs',
      api_health: '/api/health',
      api_database: '/api/health/database',
      api_algorithms: '/api/algorithms',
      api_history: '/api/history',
    },
    statusCodes: [
      { code: 200, desc: 'Root service metadata successfully delivered' },
    ],
  },
  {
    id: 'health-check',
    method: 'GET',
    path: '/api/health',
    category: 'Health & Diagnostics',
    summary: 'Backend Service Health Check',
    description: 'Verifies FastAPI server availability, UTC timestamp synchronization, and application operational state.',
    auth: 'none',
    authDescription: 'Public endpoint. Used by frontend polling and uptime monitors.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      status: 'ok',
      project: 'SecureCipher',
      timestamp: '2026-10-18T17:00:00Z',
    },
    statusCodes: [
      { code: 200, desc: 'API backend is operational and healthy' },
    ],
  },
  {
    id: 'health-database',
    method: 'GET',
    path: '/api/health/database',
    category: 'Health & Diagnostics',
    summary: 'PostgreSQL Connectivity Verification',
    description: 'Tests active database connection pool, validates Alembic migration readiness, and reports table persistence status.',
    auth: 'none',
    authDescription: 'Public diagnostics endpoint. Safe connection status inquiry.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      status: 'connected',
      connected: true,
      message: 'PostgreSQL database connected and operational.',
      pool_status: 'active',
    },
    statusCodes: [
      { code: 200, desc: 'PostgreSQL connection verified and ready' },
      { code: 503, desc: 'Database unavailable or connection failed' },
    ],
  },

  // ── Cryptographic Algorithms Metadata ──
  {
    id: 'algorithms-list',
    method: 'GET',
    path: '/api/algorithms',
    category: 'Algorithms Meta',
    summary: 'List Supported Cryptographic Algorithms',
    description: 'Enumerates the 6 supported algorithm modules with architectural classification, key sizes, and standards references.',
    auth: 'none',
    authDescription: 'Public algorithm catalog endpoint.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      total: 6,
      algorithms: [
        { id: 'aes', name: 'Advanced Encryption Standard (AES-256-GCM)', type: 'symmetric_authenticated' },
        { id: 'rsa', name: 'Rivest-Shamir-Adleman (RSA-OAEP)', type: 'asymmetric_public_key' },
        { id: 'diffie-hellman', name: 'Diffie-Hellman Key Agreement (RFC 3526)', type: 'key_exchange' },
        { id: 'sha-256', name: 'Secure Hash Algorithm 256 (SHA-256)', type: 'cryptographic_hash' },
        { id: 'md5', name: 'Message Digest 5 (MD5 - Legacy)', type: 'legacy_hash' },
        { id: 'des', name: 'Data Encryption Standard (DES-CBC - Legacy)', type: 'legacy_symmetric' },
      ],
    },
    statusCodes: [
      { code: 200, desc: 'Complete algorithm specifications catalog returned' },
    ],
  },
  {
    id: 'algorithm-detail',
    method: 'GET',
    path: '/api/algorithms/{algo_id}',
    category: 'Algorithms Meta',
    summary: 'Get Specific Algorithm Details',
    description: 'Returns technical specifications, security advisories, NIST FIPS references, and parameters for a specific cipher primitive.',
    auth: 'none',
    authDescription: 'Public endpoint. Validates path parameter.',
    pathParams: [
      { name: 'algo_id', type: 'string', required: true, desc: 'Algorithm ID (e.g. aes, rsa, diffie-hellman, sha-256, md5, des)' },
    ],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      id: 'aes',
      name: 'Advanced Encryption Standard (AES-256-GCM)',
      standard: 'NIST FIPS 197 / SP 800-38D',
      key_size: '256 bits',
      mode: 'GCM (Galois/Counter Mode)',
      description: 'Authenticated symmetric block cipher providing confidentiality and mathematical integrity validation.',
    },
    statusCodes: [
      { code: 200, desc: 'Algorithm details returned successfully' },
      { code: 404, desc: 'Algorithm ID not recognized in registry' },
    ],
  },

  // ── Authentication & User Accounts ──
  {
    id: 'auth-request-otp',
    method: 'POST',
    path: '/api/auth/register/request-otp',
    category: 'Authentication',
    summary: 'Request Email Verification OTP',
    description: 'Dispatches a 6-digit one-time password to the specified email address with anti-abuse rate limits and cooldown verification.',
    auth: 'none',
    authDescription: 'Public onboarding endpoint. Governed by 60-second resend cooldown.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      email: 'analyst@example.com',
      password: 'StrongPassword#2026',
      full_name: 'Cipher Analyst',
    },
    responseBody: {
      email: 'analyst@example.com',
      message: 'Verification code dispatched to your email address.',
      expires_in_seconds: 300,
    },
    statusCodes: [
      { code: 200, desc: 'OTP generated and dispatched' },
      { code: 400, desc: 'Email already registered or invalid input' },
      { code: 429, desc: 'Cooldown active; retry after 60 seconds' },
      { code: 503, desc: 'Production mode requires configured SMTP server' },
    ],
  },
  {
    id: 'auth-verify-otp',
    method: 'POST',
    path: '/api/auth/register/verify-otp',
    category: 'Authentication',
    summary: 'Verify OTP & Complete Registration',
    description: 'Verifies 6-digit OTP code against SHA-256 salt digest. Enforces 5-attempt lockout, hashes password with bcrypt, and issues JWT.',
    auth: 'none',
    authDescription: 'Registration finalization step.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      email: 'analyst@example.com',
      password: 'StrongPassword#2026',
      full_name: 'Cipher Analyst',
      otp: '123456',
    },
    responseBody: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmFseXN0QGV4YW1wbGUuY29tIiwiaWQiOjEsImV4cCI6MTc5MjM0MjAwMH0...',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'analyst@example.com',
        full_name: 'Cipher Analyst',
        is_verified: true,
      },
    },
    statusCodes: [
      { code: 201, desc: 'Account created and authenticated successfully' },
      { code: 400, desc: 'Invalid/expired OTP or max attempts exceeded' },
    ],
  },
  {
    id: 'auth-login',
    method: 'POST',
    path: '/api/auth/login',
    category: 'Authentication',
    summary: 'Authenticate User & Issue JWT',
    description: 'Validates email and password against bcrypt hash. Returns an HS256-signed JSON Web Token with configurable expiration.',
    auth: 'none',
    authDescription: 'Standard credential login endpoint.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      email: 'analyst@example.com',
      password: 'StrongPassword#2026',
    },
    responseBody: {
      access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmFseXN0QGV4YW1wbGUuY29tIiwiaWQiOjEsImV4cCI6MTc5MjM0MjAwMH0...',
      token_type: 'bearer',
      user: {
        id: 1,
        email: 'analyst@example.com',
        full_name: 'Cipher Analyst',
      },
    },
    statusCodes: [
      { code: 200, desc: 'Authentication successful; Bearer token returned' },
      { code: 401, desc: 'Invalid email or password credentials' },
    ],
  },
  {
    id: 'auth-me',
    method: 'GET',
    path: '/api/auth/me',
    category: 'Authentication',
    summary: 'Get Current Authenticated User',
    description: 'Validates Bearer token signature and returns the authenticated user account profile and registration timestamp.',
    auth: 'required',
    authDescription: 'Requires valid Bearer token in Authorization header.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token>', desc: 'HS256 JWT access token' }],
    requestBody: null,
    responseBody: {
      id: 1,
      email: 'analyst@example.com',
      full_name: 'Cipher Analyst',
      is_active: true,
      is_verified: true,
      created_at: '2026-10-18T16:00:00Z',
    },
    statusCodes: [
      { code: 200, desc: 'User profile retrieved successfully' },
      { code: 401, desc: 'Missing, expired, or tampered token signature' },
    ],
  },
  {
    id: 'auth-profile',
    method: 'PUT',
    path: '/api/auth/profile',
    category: 'Authentication',
    summary: 'Update Authenticated Profile',
    description: 'Updates editable user metadata (e.g. full name) for the active authenticated account.',
    auth: 'required',
    authDescription: 'Requires valid Bearer token in Authorization header.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token>', desc: 'HS256 JWT access token' }],
    requestBody: {
      full_name: 'Lead Cryptographic Analyst',
    },
    responseBody: {
      id: 1,
      email: 'analyst@example.com',
      full_name: 'Lead Cryptographic Analyst',
      is_verified: true,
    },
    statusCodes: [
      { code: 200, desc: 'Profile updated successfully' },
      { code: 401, desc: 'Unauthorized request' },
      { code: 422, desc: 'Validation error on input length' },
    ],
  },
  {
    id: 'auth-change-password',
    method: 'POST',
    path: '/api/auth/change-password',
    category: 'Authentication',
    summary: 'Change User Account Password',
    description: 'Verifies existing password hash and replaces with new password adhering to 8+ char, uppercase, lowercase, digit, and symbol rules.',
    auth: 'required',
    authDescription: 'Requires valid Bearer token in Authorization header.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token>', desc: 'HS256 JWT access token' }],
    requestBody: {
      current_password: 'CurrentPassword#2026',
      new_password: 'NewStrongPassword#2027',
    },
    responseBody: {
      status: 'success',
      message: 'Password changed successfully.',
    },
    statusCodes: [
      { code: 200, desc: 'Password updated successfully' },
      { code: 400, desc: 'Current password incorrect or new password weak' },
      { code: 401, desc: 'Unauthorized session' },
    ],
  },
  {
    id: 'auth-logout',
    method: 'POST',
    path: '/api/auth/logout',
    category: 'Authentication',
    summary: 'User Session Logout',
    description: 'Invalidates client-side session and cookies on the backend.',
    auth: 'optional',
    authDescription: 'Optional token authorization.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      status: 'success',
      message: 'Logged out successfully.',
    },
    statusCodes: [
      { code: 200, desc: 'Session logged out cleanly' },
    ],
  },

  // ── AES-256-GCM ──
  {
    id: 'aes-encrypt',
    method: 'POST',
    path: '/api/aes/encrypt',
    category: 'AES-256-GCM',
    summary: 'Encrypt Text with AES-256-GCM',
    description: 'Derives 256-bit symmetric key via Scrypt (N=32768, r=8, p=1, 16-byte random salt), generates a 12-byte CSPRNG nonce, encrypts plaintext, and emits 16-byte authentication tag.',
    auth: 'optional',
    authDescription: 'Public execution. When Bearer token is provided, audit history record is linked to authenticated user account.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token> (Optional)', desc: 'User attribution for audit log' }],
    requestBody: {
      plaintext: 'Confidential message payload',
      passphrase: 'UserSuppliedPassphrase#2026',
    },
    responseBody: {
      algorithm: 'AES-256-GCM',
      ciphertext: 's9F2lM8pQ...',
      nonce: 'yB3kP1xZ...',
      salt: 'qW7mN2rT...',
      tag: 'hK9vX4bC...',
      kdf: { algorithm: 'scrypt', n: 32768, r: 8, p: 1, key_length: 32 },
      execution_duration_ms: 12.45,
    },
    statusCodes: [
      { code: 200, desc: 'Authenticated ciphertext and parameter package returned' },
      { code: 400, desc: 'Empty input or parameter validation failure' },
      { code: 422, desc: 'Input length exceeds 500,000 characters limit' },
    ],
  },
  {
    id: 'aes-decrypt',
    method: 'POST',
    path: '/api/aes/decrypt',
    category: 'AES-256-GCM',
    summary: 'Decrypt and Authenticate with AES-256-GCM',
    description: 'Reconstitutes Scrypt key from salt and passphrase, validates GCM authentication tag, and recovers original plaintext. Rejects tampered payloads with HTTP 400 before emitting plaintext.',
    auth: 'optional',
    authDescription: 'Public execution. Tags audit history if authenticated.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token> (Optional)', desc: 'User attribution for audit log' }],
    requestBody: {
      ciphertext: 's9F2lM8pQ...',
      nonce: 'yB3kP1xZ...',
      salt: 'qW7mN2rT...',
      tag: 'hK9vX4bC...',
      passphrase: 'UserSuppliedPassphrase#2026',
    },
    responseBody: {
      algorithm: 'AES-256-GCM',
      plaintext: 'Confidential message payload',
      verified: true,
      execution_duration_ms: 11.23,
    },
    statusCodes: [
      { code: 200, desc: 'Decryption and integrity check verified' },
      { code: 400, desc: 'Authentication tag mismatch, wrong passphrase, or tampered payload' },
    ],
  },
  {
    id: 'aes-encrypt-file',
    method: 'POST',
    path: '/api/aes/encrypt-file',
    category: 'AES-256-GCM',
    summary: 'Encrypt Arbitrary Binary File (AES-256-GCM)',
    description: 'Accepts a multipart file upload (up to 50 MB) and passphrase. Derives a 256-bit Scrypt key, generates a fresh 12-byte nonce, encrypts binary bytes with AES-256-GCM, cryptographically binds the metadata header as Associated Authenticated Data (AAD), and streams a binary .scipher container for download.',
    auth: 'optional',
    authDescription: 'Public execution. When Bearer token is provided, audit history record is linked to authenticated user account with zero file or key data saved.',
    pathParams: [],
    queryParams: [],
    headers: [
      { name: 'Authorization', value: 'Bearer <token> (Optional)', desc: 'User attribution for audit log' },
      { name: 'Content-Type', value: 'multipart/form-data', desc: 'Binary multipart form-data boundary' },
    ],
    requestBody: {
      file: '(binary file stream, max 50 MB)',
      passphrase: 'UserSuppliedPassphrase#2026',
    },
    responseBody: {
      '[binary stream]': 'SecureCipher Container (.scipher): [MAGIC (8B)][HEADER_LEN (4B)][METADATA_JSON][CIPHERTEXT + 16B TAG]',
      'Content-Disposition': 'attachment; filename="document.pdf.scipher"',
      'Content-Type': 'application/octet-stream',
      'X-Encrypted-Size': '1048704',
      'X-Execution-Duration-Ms': '24.15',
    },
    statusCodes: [
      { code: 200, desc: 'Binary encrypted .scipher file stream successfully returned' },
      { code: 400, desc: 'Empty passphrase, invalid file, or file exceeds 50 MB size limit' },
      { code: 500, desc: 'Server streaming failure' },
    ],
  },
  {
    id: 'aes-decrypt-file',
    method: 'POST',
    path: '/api/aes/decrypt-file',
    category: 'AES-256-GCM',
    summary: 'Authenticate and Decrypt Binary File (AES-256-GCM)',
    description: 'Accepts a .scipher encrypted file container and passphrase. Validates the magic header (b"SCENC01\\0"), parses authenticated JSON metadata, reconstructs AAD, derives Scrypt key, validates the 16-byte GCM tag, and streams the restored original binary file with safe Content-Disposition filename.',
    auth: 'optional',
    authDescription: 'Public execution. When Bearer token is provided, audit history record is linked to authenticated user account with zero file or key data saved.',
    pathParams: [],
    queryParams: [],
    headers: [
      { name: 'Authorization', value: 'Bearer <token> (Optional)', desc: 'User attribution for audit log' },
      { name: 'Content-Type', value: 'multipart/form-data', desc: 'Binary multipart form-data boundary' },
    ],
    requestBody: {
      file: '(encrypted .scipher container file)',
      passphrase: 'UserSuppliedPassphrase#2026',
    },
    responseBody: {
      '[binary stream]': 'Recovered original binary file byte stream (PDF, DOCX, ZIP, PNG, etc.)',
      'Content-Disposition': 'attachment; filename="document.pdf"',
      'Content-Type': 'application/octet-stream',
      'X-Decrypted-Size': '1048576',
      'X-Execution-Duration-Ms': '22.80',
    },
    statusCodes: [
      { code: 200, desc: 'Original file authenticated and recovered successfully' },
      { code: 400, desc: 'Authentication tag mismatch, wrong passphrase, corrupted header, or tampered file' },
      { code: 500, desc: 'Server streaming failure' },
    ],
  },

  // ── RSA-OAEP ──
  {
    id: 'rsa-generate-keys',
    method: 'POST',
    path: '/api/rsa/generate-keys',
    category: 'RSA-OAEP',
    summary: 'Generate RSA Public/Private Keypair',
    description: 'Generates asymmetric RSA-2048 or RSA-3072 keypair. Returns standard PKCS#8 PEM blocks directly to caller. Server never saves or caches private keys.',
    auth: 'optional',
    authDescription: 'Public execution. Links execution telemetry to user if authenticated.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      key_size: 2048,
    },
    responseBody: {
      algorithm: 'RSA',
      key_size: 2048,
      public_key_pem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
      private_key_pem: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAo...',
      format: 'PKCS#8 PEM',
      execution_duration_ms: 48.72,
    },
    statusCodes: [
      { code: 200, desc: 'Keypair generated and delivered in-memory' },
      { code: 422, desc: 'Unsupported key size (only 2048 and 3072 permitted)' },
    ],
  },
  {
    id: 'rsa-encrypt',
    method: 'POST',
    path: '/api/rsa/encrypt',
    category: 'RSA-OAEP',
    summary: 'Encrypt with RSA Public Key and OAEP-SHA256',
    description: 'Encrypts plaintext using recipient\'s RSA public key with Optimal Asymmetric Encryption Padding (OAEP) and MGF1-SHA256.',
    auth: 'optional',
    authDescription: 'Public execution. Logs metadata to user account if authenticated.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      plaintext: 'Asymmetric confidential secret',
      public_key_pem: '-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    },
    responseBody: {
      algorithm: 'RSA-OAEP-SHA256',
      key_size: 2048,
      ciphertext: 'kM82xL9q...',
      padding: 'OAEP-MGF1-SHA256',
      execution_duration_ms: 4.15,
    },
    statusCodes: [
      { code: 200, desc: 'RSA ciphertext successfully generated' },
      { code: 400, desc: 'Plaintext too long for key size or malformed public key' },
    ],
  },
  {
    id: 'rsa-decrypt',
    method: 'POST',
    path: '/api/rsa/decrypt',
    category: 'RSA-OAEP',
    summary: 'Decrypt with RSA Private Key and OAEP-SHA256',
    description: 'Recovers plaintext from Base64 RSA ciphertext using caller\'s private key PEM and verifies OAEP-SHA256 padding structure.',
    auth: 'optional',
    authDescription: 'Public execution. Tags audit trail if authenticated.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      ciphertext: 'kM82xL9q...',
      private_key_pem: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAo...',
    },
    responseBody: {
      algorithm: 'RSA-OAEP-SHA256',
      plaintext: 'Asymmetric confidential secret',
      verified: true,
      execution_duration_ms: 8.94,
    },
    statusCodes: [
      { code: 200, desc: 'Plaintext decrypted and verified' },
      { code: 400, desc: 'Padding error, wrong private key, or corrupted ciphertext' },
    ],
  },

  // ── Diffie-Hellman Key Exchange ──
  {
    id: 'dh-generate-keypair',
    method: 'POST',
    path: '/api/diffie-hellman/generate-keypair',
    category: 'Diffie-Hellman',
    summary: 'Generate Diffie-Hellman Keypair (RFC 3526)',
    description: 'Generates private exponent x and computes public component y = g^x mod p using standardized RFC 3526 MODP Group 14 (2048-bit prime, g=2).',
    auth: 'optional',
    authDescription: 'Public key agreement primitive.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      party_name: 'Alice',
    },
    responseBody: {
      algorithm: 'Diffie-Hellman (RFC 3526 MODP Group 14)',
      group_name: 'MODP Group 14 (2048-bit)',
      prime_bits: 2048,
      generator: 2,
      party_name: 'Alice',
      public_key_pem: '-----BEGIN PUBLIC KEY-----\nMIIBojANBgkqhkiG9w0BAQUFAAOCAY8AMIIBigKCAYEA...',
      private_key_pem: '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQUFAASCBMkwggTFAgEA...',
      public_key_hex: 'a1b2c3d4...',
      execution_duration_ms: 14.2,
    },
    statusCodes: [
      { code: 200, desc: 'Group 14 keypair generated successfully' },
      { code: 400, desc: 'Invalid party parameter' },
    ],
  },
  {
    id: 'dh-derive-secret',
    method: 'POST',
    path: '/api/diffie-hellman/derive-secret',
    category: 'Diffie-Hellman',
    summary: 'Derive Shared Secret & HKDF Symmetric Key',
    description: 'Computes modular shared secret S = y_peer^x mod p, and derives a 256-bit symmetric session key via HKDF-SHA256 with context info.',
    auth: 'optional',
    authDescription: 'Key derivation operation.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      private_key_pem: '-----BEGIN PRIVATE KEY-----\n...',
      peer_public_key_pem: '-----BEGIN PUBLIC KEY-----\n...',
      info: 'SecureCipher Diffie-Hellman KDF',
    },
    responseBody: {
      algorithm: 'Diffie-Hellman (RFC 3526 MODP Group 14)',
      kdf: 'HKDF-SHA256',
      shared_secret_length_bytes: 256,
      derived_key_b64: 'mX4k9Q2...',
      derived_key_hex: '4a9f2b8c...',
      key_fingerprint: '7c8b2a1e4f9d...',
      execution_duration_ms: 11.5,
    },
    statusCodes: [
      { code: 200, desc: 'Shared secret computed and HKDF key derived' },
      { code: 400, desc: 'Malformed PEM keys or modular exponentiation error' },
    ],
  },
  {
    id: 'dh-simulate-exchange',
    method: 'POST',
    path: '/api/diffie-hellman/simulate-exchange',
    category: 'Diffie-Hellman',
    summary: 'Simulate Alice <-> Bob Key Exchange',
    description: 'Generates independent keypairs for Alice and Bob, calculates shared secrets independently on both sides, and mathematically proves key agreement.',
    auth: 'optional',
    authDescription: 'Educational protocol simulation.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: null,
    responseBody: {
      algorithm: 'Diffie-Hellman (RFC 3526 MODP Group 14)',
      group_name: 'MODP Group 14 (2048-bit)',
      generator: 2,
      kdf: 'HKDF-SHA256',
      alice: { party_name: 'Alice', public_key_hex: 'a1b2...' },
      bob: { party_name: 'Bob', public_key_hex: 'c3d4...' },
      alice_derived_key_b64: 'vL8jP1...',
      bob_derived_key_b64: 'vL8jP1...',
      key_match: true,
      key_fingerprint: '9f2a4c1b...',
      execution_duration_ms: 28.6,
    },
    statusCodes: [
      { code: 200, desc: 'Handshake completed with matching session keys' },
    ],
  },

  // ── SHA-256 Hashing ──
  {
    id: 'sha256-hash-text',
    method: 'POST',
    path: '/api/sha256/hash-text',
    category: 'SHA-256',
    summary: 'Compute SHA-256 Digest of Text',
    description: 'Computes deterministic 256-bit (32-byte / 64-hex char) NIST FIPS 180-4 hash digest of UTF-8 input string.',
    auth: 'optional',
    authDescription: 'Public cryptographic hashing.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      text: 'The quick brown fox jumps over the lazy dog',
    },
    responseBody: {
      algorithm: 'SHA-256',
      digest: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
      byte_length: 43,
      execution_duration_ms: 0.42,
    },
    statusCodes: [
      { code: 200, desc: 'SHA-256 digest computed successfully' },
      { code: 422, desc: 'Input string exceeds 500,000 characters limit' },
    ],
  },
  {
    id: 'sha256-hash-file',
    method: 'POST',
    path: '/api/sha256/hash-file',
    category: 'SHA-256',
    summary: 'Stream & Compute SHA-256 Digest of File',
    description: 'Streams uploaded file in bounded 64KB memory chunks, calculating the exact SHA-256 checksum without persisting file contents to disk.',
    auth: 'optional',
    authDescription: 'File upload hashing endpoint.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'multipart/form-data', desc: 'Binary file multipart form stream' }],
    requestBody: null,
    responseBody: {
      algorithm: 'SHA-256',
      filename: 'document.pdf',
      digest: '2c26b46b68ffc68ff99b453c1d30413413422d706483bfa0f98a5e886266e7ae',
      file_size_bytes: 1048576,
      content_type: 'application/pdf',
      execution_duration_ms: 4.12,
    },
    statusCodes: [
      { code: 200, desc: 'File stream hashed and checksum returned' },
      { code: 400, desc: 'Empty file or stream read failure' },
    ],
  },
  {
    id: 'sha256-compare',
    method: 'POST',
    path: '/api/sha256/compare',
    category: 'SHA-256',
    summary: 'Constant-Time Digest Comparison & Avalanche',
    description: 'Compares two strings or hashes using hmac.compare_digest in constant time to thwart timing side-channels. Computes bitwise Hamming distance.',
    auth: 'optional',
    authDescription: 'Integrity comparison service.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      input_a: 'Original document text',
      input_b: 'Modified document text',
      compare_mode: 'text_vs_text',
    },
    responseBody: {
      algorithm: 'SHA-256',
      is_match: false,
      hash_a: 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      hash_b: 'cb340f1a92e105e48545e82f80164e29cb4b4231b44b7d159a6064121d5a71a3',
      hamming_distance_bits: 124,
      bit_difference_percentage: 48.44,
      execution_duration_ms: 0.58,
    },
    statusCodes: [
      { code: 200, desc: 'Comparison metrics delivered' },
      { code: 400, desc: 'Invalid comparison mode or checksum format' },
    ],
  },

  // ── MD5 (Legacy Educational) ──
  {
    id: 'md5-hash-text',
    method: 'POST',
    path: '/api/md5/hash-text',
    category: 'MD5 (Legacy)',
    summary: 'Compute MD5 Text Digest (Educational)',
    description: 'Computes legacy 128-bit (16-byte / 32-hex char) RFC 1321 MD5 hash digest. Includes explicit warning regarding cryptographic collision vulnerability.',
    auth: 'optional',
    authDescription: 'Educational demonstration.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      text: 'Academic cryptanalysis sample for MD5',
    },
    responseBody: {
      algorithm: 'MD5',
      digest: '900150983cd24fb0d6963f7d28e17f72',
      byte_length: 37,
      execution_duration_ms: 0.31,
      security_warning: 'MD5 is cryptographically broken and vulnerable to collision attacks (Wang et al.). It must NOT be used for security purposes.',
    },
    statusCodes: [
      { code: 200, desc: 'Legacy MD5 checksum computed' },
      { code: 422, desc: 'Input exceeds 500,000 characters limit' },
    ],
  },
  {
    id: 'md5-hash-file',
    method: 'POST',
    path: '/api/md5/hash-file',
    category: 'MD5 (Legacy)',
    summary: 'Stream & Compute MD5 of Uploaded File',
    description: 'Streams file content in chunks to compute traditional MD5 checksums for non-cryptographic file identification.',
    auth: 'optional',
    authDescription: 'Educational demonstration.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'multipart/form-data', desc: 'Binary file multipart form stream' }],
    requestBody: null,
    responseBody: {
      algorithm: 'MD5',
      filename: 'legacy_firmware.bin',
      digest: 'd41d8cd98f00b204e9800998ecf8427e',
      file_size_bytes: 4096,
      execution_duration_ms: 1.15,
    },
    statusCodes: [
      { code: 200, desc: 'MD5 file digest computed' },
      { code: 400, desc: 'Empty file stream' },
    ],
  },
  {
    id: 'md5-compare',
    method: 'POST',
    path: '/api/md5/compare',
    category: 'MD5 (Legacy)',
    summary: 'MD5 Comparison & Collision Analysis',
    description: 'Compares two inputs or verifies checksums, measuring bit differences and educating on collision vulnerabilities in broken hash functions.',
    auth: 'optional',
    authDescription: 'Educational demonstration.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Content-Type', value: 'application/json', desc: 'Standard JSON payload' }],
    requestBody: {
      input_a: 'Message One',
      input_b: 'Message Two',
      compare_mode: 'text_vs_text',
    },
    responseBody: {
      algorithm: 'MD5',
      is_match: false,
      hash_a: '5d41402abc4b2a76b9719d911017c592',
      hash_b: '7d793037a0760186574b0282f2f435e7',
      hamming_distance_bits: 64,
      bit_difference_percentage: 50.0,
    },
    statusCodes: [
      { code: 200, desc: 'Comparison output with bit analysis' },
    ],
  },

  // ── DES-CBC (Legacy) ──
  {
    id: 'des-encrypt',
    method: 'POST',
    path: '/api/des/encrypt',
    category: 'DES-CBC (Legacy)',
    summary: 'DES-CBC Text Encryption (Educational)',
    description: 'Encrypts UTF-8 plaintext with historical 56-bit DES in CBC mode and PKCS#7 block padding. Emits educational advisory on 56-bit key space brute-force vulnerability.',
    auth: 'optional',
    authDescription: 'Educational cipher workbench.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      plaintext: 'Historical cipher demonstration',
      key: '8ByteKey',
    },
    responseBody: {
      algorithm: 'DES-CBC',
      ciphertext: 'xN92jKmQ...',
      iv: '1a2b3c4d5e6f7a8b',
      key_size_bits: 56,
      warning: 'DES is cryptographically obsolete (withdrawn by NIST in 2005). Key space of 2^56 can be brute-forced in hours.',
      execution_duration_ms: 1.85,
    },
    statusCodes: [
      { code: 200, desc: 'Legacy DES ciphertext generated' },
      { code: 400, desc: 'Key must be exactly 8 bytes' },
    ],
  },
  {
    id: 'des-decrypt',
    method: 'POST',
    path: '/api/des/decrypt',
    category: 'DES-CBC (Legacy)',
    summary: 'DES-CBC Text Decryption (Educational)',
    description: 'Decrypts Base64 DES ciphertext using 8-byte key and 8-byte IV, removing PKCS#7 block padding.',
    auth: 'optional',
    authDescription: 'Educational cipher workbench.',
    pathParams: [],
    queryParams: [],
    headers: [],
    requestBody: {
      ciphertext: 'xN92jKmQ...',
      key: '8ByteKey',
      iv: '1a2b3c4d5e6f7a8b',
    },
    responseBody: {
      algorithm: 'DES-CBC',
      plaintext: 'Historical cipher demonstration',
      execution_duration_ms: 1.45,
    },
    statusCodes: [
      { code: 200, desc: 'Plaintext unpadded and recovered' },
      { code: 400, desc: 'Invalid key, corrupted IV, or invalid padding' },
    ],
  },

  // ── Operation Audit History ──
  {
    id: 'history-list',
    method: 'GET',
    path: '/api/history',
    category: 'Audit History',
    summary: 'Query User Operation Audit History',
    description: 'Retrieves execution telemetry records strictly scoped to the authenticated caller with offset pagination and optional algorithm/status filtering.',
    auth: 'required',
    authDescription: 'Requires valid Bearer token in Authorization header. Prevents cross-user IDOR access.',
    pathParams: [],
    queryParams: [
      { name: 'limit', type: 'integer', required: false, desc: 'Max records returned (1-100, default: 50)' },
      { name: 'offset', type: 'integer', required: false, desc: 'Pagination offset index (default: 0)' },
      { name: 'algorithm', type: 'string', required: false, desc: 'Filter by algorithm (e.g. AES, RSA, SHA-256)' },
      { name: 'status', type: 'string', required: false, desc: 'Filter by status (success or failure)' },
    ],
    headers: [{ name: 'Authorization', value: 'Bearer <token>', desc: 'HS256 JWT access token' }],
    requestBody: null,
    responseBody: {
      items: [
        {
          id: 142,
          user_id: 1,
          algorithm_name: 'AES-256-GCM',
          operation_type: 'encryption',
          status: 'success',
          execution_duration_ms: 12.45,
          created_at: '2026-10-18T16:45:00Z',
        },
      ],
      total: 1,
      total_count: 1,
      limit: 50,
      offset: 0,
    },
    statusCodes: [
      { code: 200, desc: 'Authenticated user history list returned' },
      { code: 401, desc: 'Missing or invalid authentication token' },
    ],
  },
  {
    id: 'history-delete-item',
    method: 'DELETE',
    path: '/api/history/{item_id}',
    category: 'Audit History',
    summary: 'Delete Single Audit Record',
    description: 'Permanently deletes a specific audit record owned by the authenticated caller. Returns 404 if record does not belong to user, preventing IDOR deletion.',
    auth: 'required',
    authDescription: 'Requires valid Bearer token in Authorization header.',
    pathParams: [
      { name: 'item_id', type: 'integer', required: true, desc: 'PostgreSQL primary key ID of audit record' },
    ],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token>', desc: 'HS256 JWT access token' }],
    requestBody: null,
    responseBody: {
      status: 'success',
      message: 'Audit record #142 deleted successfully.',
    },
    statusCodes: [
      { code: 200, desc: 'Record deleted permanently' },
      { code: 401, desc: 'Unauthorized request' },
      { code: 404, desc: 'Audit record not found or not owned by caller' },
    ],
  },
  {
    id: 'history-clear-all',
    method: 'DELETE',
    path: '/api/history',
    category: 'Audit History',
    summary: 'Clear Authenticated User History',
    description: 'Atomically wipes all operation audit records belonging to the authenticated caller in a single transaction. Isolates and preserves other users\' data.',
    auth: 'required',
    authDescription: 'Requires valid Bearer token in Authorization header.',
    pathParams: [],
    queryParams: [],
    headers: [{ name: 'Authorization', value: 'Bearer <token>', desc: 'HS256 JWT access token' }],
    requestBody: null,
    responseBody: {
      status: 'success',
      message: 'Cleared 1 audit records successfully.',
      deleted_count: 1,
    },
    statusCodes: [
      { code: 200, desc: 'User history purged successfully' },
      { code: 401, desc: 'Unauthorized request' },
    ],
  },
];

export const CATEGORIES = [
  'ALL',
  'Health & Diagnostics',
  'Algorithms Meta',
  'Authentication',
  'AES-256-GCM',
  'RSA-OAEP',
  'Diffie-Hellman',
  'SHA-256',
  'MD5 (Legacy)',
  'DES-CBC (Legacy)',
  'Audit History',
];

export const METHOD_COLORS = {
  GET: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/40',
    text: 'text-emerald-400',
    pill: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  },
  POST: {
    bg: 'bg-teal-950/60',
    border: 'border-teal-500/40',
    text: 'text-teal-400',
    pill: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
  },
  PUT: {
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/40',
    text: 'text-amber-400',
    pill: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  },
  DELETE: {
    bg: 'bg-rose-950/60',
    border: 'border-rose-500/40',
    text: 'text-rose-400',
    pill: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  },
};

export default function ApiDocumentationSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedAuth, setSelectedAuth] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedSnippet, setCopiedSnippet] = useState(null);

  // Filter endpoints
  const filteredEndpoints = useMemo(() => {
    return API_ENDPOINTS.filter((ep) => {
      // Method filter
      if (selectedMethod !== 'ALL' && ep.method !== selectedMethod) return false;

      // Category filter
      if (selectedCategory !== 'ALL' && ep.category !== selectedCategory) return false;

      // Auth filter
      if (selectedAuth === 'REQUIRED' && ep.auth !== 'required') return false;
      if (selectedAuth === 'OPTIONAL' && ep.auth !== 'optional') return false;
      if (selectedAuth === 'NONE' && ep.auth !== 'none') return false;

      // Text search
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        ep.path.toLowerCase().includes(q) ||
        ep.summary.toLowerCase().includes(q) ||
        ep.description.toLowerCase().includes(q) ||
        ep.category.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, selectedMethod, selectedCategory, selectedAuth]);

  // Method counts
  const methodCounts = useMemo(() => {
    const counts = { ALL: API_ENDPOINTS.length, GET: 0, POST: 0, PUT: 0, DELETE: 0 };
    API_ENDPOINTS.forEach((ep) => {
      if (counts[ep.method] !== undefined) {
        counts[ep.method]++;
      }
    });
    return counts;
  }, []);

  const handleCopy = (text, id) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleCopySnippet = (snippet, snippetId) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(typeof snippet === 'string' ? snippet : JSON.stringify(snippet, null, 2));
      setCopiedSnippet(snippetId);
      setTimeout(() => setCopiedSnippet(null), 2000);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedMethod('ALL');
    setSelectedCategory('ALL');
    setSelectedAuth('ALL');
  };

  const isDevMode = import.meta.env.DEV ?? true;
  const baseUrl = 'http://127.0.0.1:8000';

  return (
    <div className="glass-panel rounded-xl p-6 border border-emerald-500/20 space-y-6">
      {/* ── Section Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-emerald-500/20 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="p-2 rounded-lg bg-[#06180a] border border-emerald-500/30 text-emerald-400">
              <Server className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight m-0">
              REST API Documentation & Endpoints Reference
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 m-0 leading-relaxed">
            Technical API reference derived directly from registered FastAPI routers, request schemas, and authentication guards.
          </p>
        </div>

        {/* Right Tools: Base URL & Swagger Button */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono bg-[#030a04] border border-emerald-500/30 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-subtle" />
            <span className="text-slate-400 font-sans text-[11px]">Base URL:</span>
            <span className="text-emerald-300 font-bold">{baseUrl}</span>
          </div>

          <a
            href={`${baseUrl}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 transition-all shadow-sm group"
            title="Open Interactive Swagger UI in new tab (Available in development)"
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-6 transition-transform" />
            <span>FastAPI Swagger UI</span>
            <ExternalLink className="w-3 h-3 text-emerald-400/80" />
          </a>
        </div>
      </div>

      {/* ── Search & Filter Controls ── */}
      <div className="space-y-3.5">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by endpoint path, method, description, or algorithm..."
              className="w-full pl-9 pr-9 py-2 rounded-lg bg-[#030a04] border border-emerald-500/30 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs px-1"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#030a04] border border-emerald-500/30 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat} className="bg-[#030a04] text-slate-200">
                  {cat === 'ALL' ? 'All Categories (31)' : cat}
                </option>
              ))}
            </select>
          </div>

          {/* Authentication Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedAuth}
              onChange={(e) => setSelectedAuth(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#030a04] border border-emerald-500/30 text-xs text-slate-200 focus:outline-none focus:border-emerald-400 cursor-pointer"
            >
              <option value="ALL" className="bg-[#030a04]">All Auth States</option>
              <option value="REQUIRED" className="bg-[#030a04]">Auth Required (JWT)</option>
              <option value="OPTIONAL" className="bg-[#030a04]">Auth Optional (User Tagging)</option>
              <option value="NONE" className="bg-[#030a04]">Public / No Auth</option>
            </select>
          </div>
        </div>

        {/* Method Pills & Results Counter */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {['ALL', 'GET', 'POST', 'PUT', 'DELETE'].map((method) => {
              const isSelected = selectedMethod === method;
              const count = methodCounts[method] || 0;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => setSelectedMethod(method)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-bold transition-all border ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                      : 'bg-[#030a04] text-slate-400 hover:text-white border-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  {method} <span className="opacity-70 text-[10px]">({count})</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span>
              Showing <strong className="text-emerald-400">{filteredEndpoints.length}</strong> of{' '}
              <strong className="text-slate-200">{API_ENDPOINTS.length}</strong> Endpoints
            </span>
            {(searchQuery || selectedMethod !== 'ALL' || selectedCategory !== 'ALL' || selectedAuth !== 'ALL') && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-emerald-400 hover:text-emerald-300 text-[11px] underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Endpoints Table ── */}
      {filteredEndpoints.length === 0 ? (
        <div className="p-8 text-center rounded-xl bg-[#030a04] border border-emerald-500/20 space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
          <h3 className="text-sm font-bold text-white m-0">No Matching Endpoints Found</h3>
          <p className="text-xs text-slate-400 m-0 max-w-md mx-auto">
            No registered API routes matched your search criteria. Try modifying your search keywords or clearing active filters.
          </p>
          <button
            type="button"
            onClick={resetFilters}
            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all inline-block mt-2"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-[#040e06]/60">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-[#030a04] text-slate-400 border-b border-emerald-500/20 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 text-left w-24">Method</th>
                  <th className="py-3 px-4 text-left min-w-[220px]">Endpoint Path</th>
                  <th className="py-3 px-4 text-left hidden sm:table-cell">Description & Scope</th>
                  <th className="py-3 px-4 text-left w-36">Authentication</th>
                  <th className="py-3 px-4 text-center w-20">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {filteredEndpoints.map((ep) => {
                  const mColor = METHOD_COLORS[ep.method] || METHOD_COLORS.GET;
                  const isExpanded = expandedId === ep.id;
                  const isCopied = copiedId === ep.id;

                  return (
                    <React.Fragment key={ep.id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : ep.id)}
                        className={`transition-colors cursor-pointer ${
                          isExpanded ? 'bg-emerald-950/20' : 'hover:bg-[#06180a]/80'
                        }`}
                      >
                        {/* Method Badge */}
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[10px] font-black border tracking-wider ${mColor.pill}`}
                          >
                            {ep.method}
                          </span>
                        </td>

                        {/* Endpoint Path & Copy Button */}
                        <td className="py-2.5 px-4 font-mono font-bold text-slate-200">
                          <div className="flex items-center gap-2 group/path">
                            <span className="text-white hover:text-emerald-400 transition-colors">
                              {ep.path}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(ep.path, ep.id);
                              }}
                              className="opacity-0 group-hover/path:opacity-100 text-slate-400 hover:text-emerald-400 p-1 rounded hover:bg-black/40 transition-all"
                              title="Copy endpoint path"
                            >
                              {isCopied ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            {isCopied && (
                              <span className="text-[10px] text-emerald-400 font-sans font-normal">
                                Copied!
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Description & Category Tag */}
                        <td className="py-2.5 px-4 text-slate-300 font-sans hidden sm:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-slate-200 text-xs">{ep.summary}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-emerald-400/80 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                {ep.category}
                              </span>
                              <span className="text-[11px] text-slate-400 truncate max-w-sm">
                                {ep.description}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Authentication Requirement Badge */}
                        <td className="py-2.5 px-4">
                          {ep.auth === 'required' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-bold bg-amber-950/40 text-amber-300 border border-amber-500/30">
                              <Lock className="w-3 h-3 text-amber-400 flex-shrink-0" />
                              <span>Required (JWT)</span>
                            </span>
                          ) : ep.auth === 'optional' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-slate-900/60 text-slate-300 border border-slate-700/50">
                              <Shield className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              <span>Optional</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-sans font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                              <ShieldCheck className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                              <span>Public</span>
                            </span>
                          )}
                        </td>

                        {/* Expand Chevron */}
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            className="p-1 rounded text-slate-400 hover:text-white transition-colors"
                            aria-label={isExpanded ? 'Collapse endpoint' : 'Expand endpoint'}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-emerald-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* ── Expanded Detail Accordion Row ── */}
                      {isExpanded && (
                        <tr className="bg-[#030a04]/90 border-b border-emerald-500/30">
                          <td colSpan={5} className="p-4 sm:p-5">
                            <div className="space-y-4 font-sans text-xs">
                              {/* Summary & Auth Overview */}
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg bg-[#06180a] border border-emerald-500/20">
                                <div>
                                  <div className="font-bold text-white text-sm mb-0.5 flex items-center gap-2">
                                    <span>{ep.summary}</span>
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                                      {ep.category}
                                    </span>
                                  </div>
                                  <p className="text-slate-300 text-xs m-0 leading-relaxed">
                                    {ep.description}
                                  </p>
                                </div>
                                <div className="text-[11px] text-slate-400 font-mono bg-black/40 px-2.5 py-1 rounded border border-slate-700/40 flex-shrink-0">
                                  Auth: <strong className="text-slate-200">{ep.authDescription}</strong>
                                </div>
                              </div>

                              {/* Parameters Section (if any) */}
                              {(ep.pathParams.length > 0 || ep.queryParams.length > 0 || ep.headers.length > 0) && (
                                <div className="space-y-2">
                                  <h4 className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono m-0 flex items-center gap-1.5">
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Parameters & Required Headers
                                  </h4>
                                  <div className="overflow-x-auto rounded border border-slate-800">
                                    <table className="w-full text-xs font-mono">
                                      <thead className="bg-black/40 text-slate-400 text-[10px]">
                                        <tr>
                                          <th className="p-2 text-left">Type</th>
                                          <th className="p-2 text-left">Parameter Name</th>
                                          <th className="p-2 text-left">Schema Type</th>
                                          <th className="p-2 text-left">Description</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-800/40 text-slate-300 text-[11px]">
                                        {ep.headers.map((h) => (
                                          <tr key={h.name}>
                                            <td className="p-2 text-teal-400">Header</td>
                                            <td className="p-2 font-bold text-white">{h.name}</td>
                                            <td className="p-2 text-slate-400">{h.value}</td>
                                            <td className="p-2 text-slate-300 font-sans">{h.desc}</td>
                                          </tr>
                                        ))}
                                        {ep.pathParams.map((p) => (
                                          <tr key={p.name}>
                                            <td className="p-2 text-amber-400">Path</td>
                                            <td className="p-2 font-bold text-white">{p.name}</td>
                                            <td className="p-2 text-slate-400">{p.schema || p.type}</td>
                                            <td className="p-2 text-slate-300 font-sans">{p.desc}</td>
                                          </tr>
                                        ))}
                                        {ep.queryParams.map((q) => (
                                          <tr key={q.name}>
                                            <td className="p-2 text-emerald-400">Query</td>
                                            <td className="p-2 font-bold text-white">
                                              {q.name} {!q.required && <span className="text-slate-500 text-[10px]">(optional)</span>}
                                            </td>
                                            <td className="p-2 text-slate-400">{q.type}</td>
                                            <td className="p-2 text-slate-300 font-sans">{q.desc}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {/* Request & Response Schemas */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* Request Body */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                      <Code2 className="w-3.5 h-3.5 text-teal-400" />
                                      Sample Request Payload
                                    </span>
                                    {ep.requestBody && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopySnippet(ep.requestBody, `${ep.id}-req`)}
                                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 font-mono transition-colors"
                                      >
                                        {copiedSnippet === `${ep.id}-req` ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" /> Copy JSON
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <div className="p-3 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
                                    {ep.requestBody ? (
                                      <pre className="m-0 text-teal-300">
                                        {JSON.stringify(ep.requestBody, null, 2)}
                                      </pre>
                                    ) : (
                                      <span className="text-slate-500 italic">No request body required (GET/DELETE request or URL parameters only)</span>
                                    )}
                                  </div>
                                </div>

                                {/* Response Body */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                                      <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                                      Expected Success Response (200 / 201)
                                    </span>
                                    {ep.responseBody && (
                                      <button
                                        type="button"
                                        onClick={() => handleCopySnippet(ep.responseBody, `${ep.id}-res`)}
                                        className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-emerald-400 font-mono transition-colors"
                                      >
                                        {copiedSnippet === `${ep.id}-res` ? (
                                          <>
                                            <Check className="w-3 h-3 text-emerald-400" /> Copied!
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="w-3 h-3" /> Copy JSON
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>
                                  <div className="p-3 rounded-lg bg-black/80 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56 leading-relaxed">
                                    <pre className="m-0 text-emerald-300">
                                      {JSON.stringify(ep.responseBody, null, 2)}
                                    </pre>
                                  </div>
                                </div>
                              </div>

                              {/* Status Codes */}
                              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
                                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider">
                                  HTTP Statuses:
                                </span>
                                {ep.statusCodes.map((s) => (
                                  <span
                                    key={s.code}
                                    className={`inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded border ${
                                      s.code < 300
                                        ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                                        : s.code < 500
                                        ? 'bg-amber-950/40 text-amber-300 border-amber-500/30'
                                        : 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                                    }`}
                                    title={s.desc}
                                  >
                                    <strong>{s.code}</strong> {s.desc}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Footer Note ── */}
      <div className="p-3.5 rounded-lg bg-[#030a04] border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            All 31 API endpoints execute with zero plaintext retention. Cryptographic keys and plaintexts are processed in-memory and discarded upon response delivery.
          </span>
        </div>
        <div className="text-slate-500 font-mono text-[10px]">
          FIPS 197 • FIPS 180-4 • RFC 3526 • RFC 8017
        </div>
      </div>
    </div>
  );
}
