# SecureCipher

> **Multi-Algorithm Cryptography and Secure Data Protection System**

SecureCipher is a full-stack web application for hands-on, interactive cryptographic exploration. It implements six cryptographic primitives — AES-256-GCM, RSA-OAEP, Diffie-Hellman key exchange, SHA-256, MD5, and DES — served through a FastAPI REST backend, with a React + Vite frontend. Every operation writes only audit metadata (algorithm, operation type, success/failure, duration) to a PostgreSQL database; plaintext, keys, and passphrases exist only in volatile RAM during execution.

![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Diagram](#3-architecture-diagram)
4. [User Workflow](#4-user-workflow)
5. [Algorithm Reference](#5-algorithm-reference)
   - [AES-256-GCM](#aes-256-gcm)
   - [RSA-OAEP](#rsa-oaep)
   - [Diffie-Hellman Key Exchange](#diffie-hellman-key-exchange)
   - [SHA-256](#sha-256)
   - [MD5 (Legacy)](#md5-legacy)
   - [DES-CBC (Legacy)](#des-cbc-legacy)
6. [Algorithm Comparison Table](#6-algorithm-comparison-table)
7. [Frontend Pages and Navigation](#7-frontend-pages-and-navigation)
8. [PostgreSQL Audit History](#8-postgresql-audit-history)
9. [PDF Audit Reports](#9-pdf-audit-reports)
10. [API Reference](#10-api-reference)
11. [Request / Response Lifecycle](#11-request--response-lifecycle)
12. [Project Structure](#12-project-structure)
13. [Prerequisites and Windows Installation](#13-prerequisites-and-windows-installation)
14. [Environment Variables](#14-environment-variables)
15. [Testing](#15-testing)
16. [Security Model and Limitations](#16-security-model-and-limitations)
17. [Troubleshooting](#17-troubleshooting)
18. [License](#18-license)

---

## 1. Project Overview

### Purpose

SecureCipher provides an interactive, browser-based environment for studying and demonstrating six cryptographic primitives. It is intended as an educational platform for understanding how modern and legacy algorithms work, what their parameters mean, and why certain algorithms are no longer considered secure.

### Problem It Addresses

Cryptographic concepts — key derivation, authenticated encryption, asymmetric key exchange, and one-way hashing — are difficult to learn from textbooks alone. SecureCipher makes these concepts observable: users can encrypt a message, see the exact nonce/salt/tag produced, tamper with a ciphertext, and watch authentication fail.

### Architecture Summary

| Layer | Technology | Role |
|---|---|---|
| Browser | React 19 + Vite 8 | Renders UI, calls backend via `fetch` |
| Frontend proxy | Vite dev-server proxy | Forwards `/api/*` to FastAPI on port 8000 |
| Backend | FastAPI 0.115+ | Validates requests, delegates to crypto services |
| Cryptographic layer | `cryptography`, `pycryptodome` | Executes algorithms entirely in RAM |
| Persistence | PostgreSQL + SQLAlchemy 2 | Stores audit metadata only |
| Migrations | Alembic | Schema version management |
| Auth | JWT (PyJWT) + bcrypt | Session tokens, password hashing, OTP |
| PDF | jsPDF (browser) | Report generation client-side |

### How the Frontend Communicates with the Backend

The Vite development server includes a built-in proxy. All requests from the browser to `/api/*` are transparently forwarded to `http://127.0.0.1:8000`. The frontend's `api.js` service uses `const API_BASE_URL = '/api'` and plain `fetch()` — no third-party HTTP client is used.

JWT access tokens are stored in `localStorage` (when **Remember Me** is checked) or `sessionStorage` (for session-only login) under the key `securecipher_token`. Every authenticated request sends the token in an `Authorization: Bearer <token>` header.

### How Cryptographic Operations Are Performed

Cryptographic computations happen inside the FastAPI backend, inside service modules in `backend/app/services/`. The `cryptography` library (from the Python Cryptographic Authority) provides AES-GCM, Scrypt KDF, RSA-OAEP, Diffie-Hellman, HKDF, and SHA-256. The `pycryptodome` library provides DES-CBC. MD5 uses Python's standard `hashlib`. The frontend sends inputs to the API and receives only the cryptographic result (ciphertext, digest, keys). Keys and passphrases are never written to disk, the database, or logs.

### How Audit History Works

After each operation the service calls `record_audit_operation()`, which creates an `OperationHistory` row containing only: `algorithm_name`, `operation_type`, `status`, `execution_duration_ms`, and `created_at`. No plaintext, no key material, no ciphertext, no digest is ever stored. Audit records are permanently and irreversibly deleted by the `DELETE /api/history` and `DELETE /api/history/{id}` endpoints.

### How PDF Reports Are Generated

PDF reports are generated entirely in the browser using [jsPDF](https://github.com/parallax/jsPDF). The frontend fetches audit records from the API and passes them to `historyPdfGenerator.js`. No PDF is generated or stored on the backend server.

---

## 2. Technology Stack

| Category | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend framework** | React | 19 | Component-based UI |
| **Build tool** | Vite | 8 | Dev server with API proxy, production bundler |
| **Styling** | Tailwind CSS v4 | 4.3+ | Utility-first CSS via `@tailwindcss/vite` plugin |
| **Icons** | lucide-react | 1.55+ | SVG icon library |
| **Routing** | react-router-dom | 7 | Client-side SPA routing, route guards |
| **PDF generation** | jsPDF | 4.2+ | Client-side A4 PDF report generation |
| **HTTP client** | Native `fetch` | — | Browser Fetch API, no additional library |
| **Linter** | oxlint | 1.81+ | Frontend code quality |
| **Backend framework** | FastAPI | 0.115+ | Async REST API with OpenAPI auto-docs |
| **ASGI server** | Uvicorn | 0.30+ | Production-grade ASGI runtime |
| **Data validation** | Pydantic v2 | 2.8+ | Request/response schema validation |
| **Settings** | pydantic-settings | 2.4+ | `.env` file configuration |
| **Database ORM** | SQLAlchemy | 2.0+ | Async-compatible ORM with PostgreSQL |
| **Database driver** | psycopg[binary] | 3.2+ | PostgreSQL wire protocol driver (Psycopg 3) |
| **Migrations** | Alembic | 1.13+ | Versioned schema migrations |
| **Cryptography** | cryptography (PyCA) | 43+ | AES-GCM, Scrypt, RSA-OAEP, HKDF, DH |
| **Legacy crypto** | pycryptodome | 3.20+ | DES-CBC implementation |
| **Password hashing** | bcrypt | 4.0+ | User password storage |
| **Authentication** | PyJWT | 2.8+ | JWT access token generation and verification |
| **Email validation** | email-validator | 2.0+ | Email format validation for registration |
| **Testing** | pytest + FastAPI TestClient | — | Backend unit and integration tests |
| **Database** | PostgreSQL | 16+ (recommended) | Persistent audit history and user accounts |

---

## 3. Architecture Diagram

```mermaid
graph TB
    Browser["Browser\n(React 19 + Vite)"]

    subgraph Frontend ["Frontend (port 5173)"]
        Pages["Pages\nAES / RSA / DH / SHA256\nMD5 / DES / History\nLogin / Register / Profile"]
        APIClient["services/api.js\nfetch() + Bearer JWT"]
        PDFGen["utils/historyPdfGenerator.js\njsPDF (browser-side)"]
        AuthCtx["context/AuthContext\nJWT token management"]
    end

    subgraph ViteProxy ["Vite Dev Proxy"]
        Proxy["/api/* → http://127.0.0.1:8000"]
    end

    subgraph Backend ["FastAPI Backend (port 8000)"]
        Router["app/api/router.py\nAPIRouter"]
        
        subgraph Endpoints ["Route Handlers (app/api/endpoints/)"]
            Health["health.py\nGET /api/health\nGET /api/health/database"]
            AuthEP["auth.py\nPOST /api/auth/*"]
            AESEP["aes.py\nPOST /api/aes/*"]
            RSAEP["rsa.py\nPOST /api/rsa/*"]
            DHEP["diffie_hellman.py\nPOST /api/diffie-hellman/*"]
            SHA256EP["sha256.py\nPOST /api/sha256/*"]
            MD5EP["md5.py\nPOST /api/md5/*"]
            DESEP["des.py\nPOST /api/des/*"]
            HistEP["history.py\nGET/DELETE /api/history"]
        end

        subgraph Services ["Crypto Services (app/services/)"]
            AESSvc["aes_service.py\nScrypt KDF + AES-256-GCM\n(cryptography lib)"]
            RSASvc["rsa_service.py\nRSA-OAEP-SHA256\n(cryptography lib)"]
            DHSvc["diffie_hellman_service.py\nRFC 3526 MODP-2048 + HKDF\n(cryptography lib)"]
            SHA256Svc["sha256_service.py\nhashlib.sha256"]
            MD5Svc["md5_service.py\nhashlib.md5"]
            DESSvc["des_service.py\nDES-CBC + PKCS7\n(pycryptodome)"]
            AuthSvc["auth_service.py\nbcrypt + JWT + OTP"]
            HistSvc["history_service.py\nAudit CRUD"]
        end

        subgraph DB ["Database Layer"]
            Models["app/models/\nOperationHistory\nUser  EmailOTP"]
            Session["app/db/session.py\nSQLAlchemy engine"]
            InitDB["app/db/init_db.py\nAuto-create tables"]
        end
    end

    subgraph PostgreSQL ["PostgreSQL (port 5432)"]
        PGTables["operation_history\nusers\nemail_otps"]
    end

    Browser --> Pages
    Pages --> APIClient
    Pages --> PDFGen
    Pages --> AuthCtx
    APIClient -->|"/api/*"| ViteProxy
    ViteProxy --> Router
    Router --> Endpoints
    Endpoints --> Services
    Services --> HistSvc
    HistSvc --> Models
    Models --> Session
    Session --> PGTables
```

### Layer Responsibilities

| Layer | Responsibility |
|---|---|
| **React Pages** | Render forms, display results, handle local state |
| **api.js** | Serialise requests, attach Bearer tokens, handle HTTP errors |
| **historyPdfGenerator.js** | Format jsPDF documents from audit JSON data |
| **AuthContext** | Store JWT, expose `user` object and `login`/`logout` helpers |
| **FastAPI Endpoints** | Input validation, orchestrate service calls, format responses |
| **Crypto Services** | Execute cryptographic operations in-memory, return results |
| **history_service.py** | CRUD for `operation_history`; ensures no secrets are stored |
| **SQLAlchemy Models** | Define `operation_history`, `users`, `email_otps` table schemas |
| **PostgreSQL** | Persist audit metadata and user accounts durably |

---

## 4. User Workflow

```mermaid
flowchart TD
    A([Open SecureCipher]) --> B{Authenticated?}
    B -- No --> C[Landing Page / Register / Login]
    C --> D[Register: request OTP by email\nVerify OTP to create account]
    D --> E[Login: email + password → JWT]
    E --> F[Dashboard]
    B -- Yes --> F

    F --> G[Select Algorithm Page\ne.g. AES / RSA / SHA-256]
    G --> H[Enter inputs\nplaintext · passphrase · key]
    H --> I[Submit → POST /api/algorithm/operation]
    I --> J{FastAPI Validation\nPydantic schema}
    J -- Invalid --> K[400 Error returned to UI]
    J -- Valid --> L[Cryptographic Service\nRAM-only computation]
    L --> M{Operation\nSuccess?}
    M -- Failure --> N[record audit: status=failure\nReturn 400 to frontend]
    M -- Success --> O[record audit: status=success\nalgorithm · operation · duration_ms]
    O --> P[Return result to frontend\nnonce · ciphertext · digest · keys]
    P --> Q[Display result in UI]
    Q --> R{Download PDF?}
    R -- Yes --> S[Browser: jsPDF renders\nSingle-record or Full-history PDF\nNo backend call]
    R -- No --> T([Done])
    S --> T
```

---

## 5. Algorithm Reference

### AES-256-GCM

**Category:** Symmetric Authenticated Encryption  
**Purpose:** Confidential and authenticated encryption of text data.

#### How It Works

1. A fresh 16-byte (128-bit) random **salt** is generated with `os.urandom(16)`.
2. A 256-bit **key** is derived from the passphrase and salt using **Scrypt** (N=16384, r=8, p=1 — OWASP-recommended parameters).
3. A fresh 12-byte (96-bit) random **nonce** is generated with `os.urandom(12)`.
4. **AES-256-GCM** encryption produces a ciphertext and a 16-byte **GCM authentication tag** appended at the end.
5. The nonce, salt, ciphertext, and tag are each **Base64-encoded** and returned.

Decryption reverses this: derives the key from the passphrase and stored salt, reconstructs the ciphertext+tag payload, and asks `AESGCM.decrypt()` to verify the authentication tag and decrypt simultaneously. If the passphrase is wrong or the ciphertext was modified, a `ValueError("authentication tag verification failed")` is raised.

#### AES Operation Flow

```mermaid
sequenceDiagram
    participant Client
    participant API as POST /api/aes/encrypt
    participant AESSvc as aes_service.py
    participant DB as PostgreSQL

    Client->>API: {plaintext, passphrase}
    API->>AESSvc: encrypt_aes_256_gcm(plaintext, passphrase)
    AESSvc->>AESSvc: salt = os.urandom(16)
    AESSvc->>AESSvc: nonce = os.urandom(12)
    AESSvc->>AESSvc: key = Scrypt(passphrase, salt, N=16384, r=8, p=1)
    AESSvc->>AESSvc: ciphertext + tag = AESGCM(key).encrypt(nonce, plaintext)
    AESSvc-->>API: {nonce_b64, salt_b64, ciphertext_b64, tag_b64, kdf_info}
    API->>DB: INSERT audit (AES-256-GCM, encryption, success, duration_ms)
    API-->>Client: 200 {algorithm, nonce, salt, ciphertext, tag, kdf, execution_duration_ms}
```

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/aes/encrypt` | `plaintext`, `passphrase` | `algorithm`, `nonce`, `salt`, `ciphertext`, `tag`, `kdf`, `execution_duration_ms` |
| POST | `/api/aes/decrypt` | `passphrase`, `nonce`, `salt`, `ciphertext`, `tag` | `algorithm`, `plaintext`, `verified`, `execution_duration_ms` |

#### Security Limitations

- The backend **receives the plaintext and passphrase** over the local network. HTTPS is required in production.
- The passphrase is only as strong as the user chooses. Scrypt protects against brute-force but weak passphrases remain vulnerable.
- Nonce uniqueness is guaranteed per operation by `os.urandom(12)`. Never reuse a nonce with the same key.

---

### AES-256-GCM File Cryptography (.scipher)

**Category:** Authenticated Binary File Encryption
**Purpose:** End-to-end authenticated encryption of arbitrary binary files (documents, images, PDFs, archives, executables) up to 50 MB.

#### Binary Container Specification (SCENC01)

SecureCipher encapsulates encrypted files in a tamper-proof binary container format (`.scipher`):

```
+-----------------------------------------------------------------------------------+
| Magic (8 Bytes)    | Header Length (4B) | JSON Metadata Block (Variable Length)  |
| b"SCENC01\x00"     | Big-Endian uint32  | UTF-8 JSON: salt, nonce, filename, etc. |
+-----------------------------------------------------------------------------------+
| Ciphertext + GCM Authentication Tag (16 Bytes appended at EOF)                    |
+-----------------------------------------------------------------------------------+
```

- **Magic Identifier (8 bytes):** `b"SCENC01\x00"` identifies the file as a valid SecureCipher container.
- **Header Length (4 bytes):** 32-bit big-endian unsigned integer specifying exact UTF-8 byte length of metadata.
- **JSON Metadata Header:**
  - `version`: Format version integer (`1`).
  - `algorithm`: Cryptographic cipher (`"AES-256-GCM"`).
  - `original_filename`: Sanitized original basename (directory traversal stripped).
  - `original_file_size`: Integer byte count of plaintext file.
  - `salt`: Base64-encoded 16-byte Scrypt salt.
  - `nonce`: Base64-encoded 12-byte CSPRNG nonce.
  - `kdf`: Scrypt parameters (`N=16384`, `r=8`, `p=1`, `key_length=32`).
- **Cryptographic Header Binding (AAD):** The entire header bytes `[0 : 12 + header_len]` are supplied as AES-GCM Associated Authenticated Data (AAD). Any modification to metadata, version, salt, nonce, or filename fails GCM tag authentication.
- **Ciphertext & Tag:** `AESGCM(key).encrypt(nonce, file_bytes, associated_data)` appends the 16-byte GCM authentication tag.

#### File Encryption & Decryption Workflow

```mermaid
sequenceDiagram
    participant User as User / Browser
    participant API as FastAPI Endpoints
    participant AESSvc as aes_service.py
    participant DB as PostgreSQL

    Note over User,API: File Encryption Flow
    User->>API: POST /api/aes/encrypt-file (file multipart, passphrase)
    API->>API: Enforce 50 MB size limit in 64 KB chunks
    API->>AESSvc: encrypt_aes_file(file_bytes, filename, passphrase)
    AESSvc->>AESSvc: salt = os.urandom(16), nonce = os.urandom(12)
    AESSvc->>AESSvc: key = Scrypt(passphrase, salt, N=16384, r=8, p=1)
    AESSvc->>AESSvc: header = MAGIC + 4-byte metadata length + metadata JSON
    AESSvc->>AESSvc: ciphertext_with_tag = AESGCM(key).encrypt(nonce, file_bytes, AAD=header)
    AESSvc-->>API: (container_bytes, filename.scipher, metadata)
    API->>DB: INSERT audit (AES-256-GCM, file_encryption, success)
    API-->>User: 200 Binary Stream (Content-Disposition: attachment, Cache-Control: no-store)

    Note over User,API: File Decryption Flow
    User->>API: POST /api/aes/decrypt-file (.scipher file, passphrase)
    API->>AESSvc: decrypt_aes_file(container_bytes, passphrase)
    AESSvc->>AESSvc: Verify MAGIC header and metadata length
    AESSvc->>AESSvc: Parse and validate JSON metadata (version, salt, nonce)
    AESSvc->>AESSvc: key = Scrypt(passphrase, salt, N=16384, r=8, p=1)
    AESSvc->>AESSvc: Decrypt ciphertext with AAD and verify 16-byte GCM tag
    AESSvc-->>API: (decrypted_bytes, safe_original_filename, metadata)
    API->>DB: INSERT audit (AES-256-GCM, file_decryption, success)
    API-->>User: 200 Recovered Binary Stream
```

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/aes/encrypt-file` | `file` (multipart upload), `passphrase` (Form) | Binary `.scipher` container stream (`application/octet-stream`) |
| POST | `/api/aes/decrypt-file` | `file` (multipart `.scipher`), `passphrase` (Form) | Recovered original file stream (`application/octet-stream`) |

#### Security Considerations & Limits

- **Memory and Size Limits:** Configured via `MAX_FILE_SIZE_BYTES` (default 50 MB / 52,428,800 bytes). Uploads exceeding this threshold are aborted in 64 KB chunks before in-memory cipher execution.
- **Zero-Recovery Model:** AES-256-GCM ensures cryptographic authenticity. Losing the passphrase or modifying any byte of the `.scipher` file renders recovery mathematically impossible.
- **Zero Server-Side Storage:** Plaintext files, decrypted contents, passphrases, and encryption keys are processed in volatile memory only and are never persisted to disk or the database.

---

### RSA-OAEP

**Category:** Asymmetric Public-Key Encryption  
**Purpose:** Public-key encryption for small payloads, key transport.

#### How It Works

1. The backend generates an RSA key pair (2048-bit or 3072-bit, selectable) using `cryptography.hazmat.primitives.asymmetric.rsa.generate_private_key`.
2. Keys are returned in **PKCS#8 PEM** format. The private key is **never stored** on the server.
3. Encryption uses the **public key** with **OAEP padding (MGF1-SHA256)**.
4. Decryption uses the **private key** with the same OAEP configuration.

The maximum plaintext size is determined by the RSA modulus length minus OAEP overhead: ~190 bytes for RSA-2048, ~318 bytes for RSA-3072.

#### RSA Operation Flow

```mermaid
flowchart LR
    A[Generate RSA Keypair\nPOST /api/rsa/generate-keys] --> B[Receive public_key_pem\nprivate_key_pem]
    B --> C[Copy public key → encrypt form\nPOST /api/rsa/encrypt]
    C --> D[ciphertext_b64 returned]
    D --> E[Copy private key + ciphertext\n→ decrypt form\nPOST /api/rsa/decrypt]
    E --> F[plaintext returned]
```

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/rsa/generate-keys` | `key_size` (2048 or 3072) | `algorithm`, `key_size`, `public_key_pem`, `private_key_pem`, `format`, `execution_duration_ms` |
| POST | `/api/rsa/encrypt` | `plaintext`, `public_key_pem` | `algorithm`, `key_size`, `ciphertext`, `padding`, `execution_duration_ms` |
| POST | `/api/rsa/decrypt` | `ciphertext`, `private_key_pem` | `algorithm`, `plaintext`, `verified`, `execution_duration_ms` |

#### Security Limitations

- Private keys are **generated in-memory and returned to the client**. The server never stores or logs them.
- The user is responsible for protecting the private key in the browser.
- RSA plaintext size is limited by the key modulus minus OAEP padding overhead.
- RSA is not suitable for bulk data encryption; use AES-GCM for data and RSA for key transport.

---

### Diffie-Hellman Key Exchange

**Category:** Key Agreement Protocol  
**Purpose:** Establish a shared symmetric key over an insecure channel without transmitting the key.

#### How It Works

The implementation uses **RFC 3526 MODP Group 14**: a standardised 2048-bit prime modulus (p) with generator g=2. Three operations are supported:

1. **Generate Keypair** — generates an independent (private, public) DH key pair for one party. The private key is returned to the client and never stored.
2. **Derive Shared Secret** — accepts a party's private key PEM and the peer's public key PEM, computes the raw shared secret (`peer_pub^my_priv mod p`), and expands it into a 256-bit symmetric key using **HKDF-SHA256**.
3. **Simulate Exchange** — runs a complete Alice ↔ Bob handshake on the backend server and confirms that both derived keys match.

#### DH Operation Flow

```mermaid
sequenceDiagram
    participant Alice
    participant API
    participant Bob

    Alice->>API: POST /api/diffie-hellman/generate-keypair {party_name: "Alice"}
    API-->>Alice: {pub_pem_A, priv_pem_A}

    Bob->>API: POST /api/diffie-hellman/generate-keypair {party_name: "Bob"}
    API-->>Bob: {pub_pem_B, priv_pem_B}

    Note over Alice,Bob: Exchange public keys (e.g. copy-paste in UI)

    Alice->>API: POST /api/diffie-hellman/derive-secret {private_key_pem: priv_pem_A, peer_public_key_pem: pub_pem_B}
    API-->>Alice: {derived_key_b64: K_A}

    Bob->>API: POST /api/diffie-hellman/derive-secret {private_key_pem: priv_pem_B, peer_public_key_pem: pub_pem_A}
    API-->>Bob: {derived_key_b64: K_B}

    Note over Alice,Bob: K_A == K_B ✓
```

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/diffie-hellman/generate-keypair` | `party_name` (optional) | `algorithm`, `group_name`, `prime_bits`, `generator`, `party_name`, `public_key_pem`, `private_key_pem`, `public_key_hex`, `execution_duration_ms` |
| POST | `/api/diffie-hellman/derive-secret` | `private_key_pem`, `peer_public_key_pem`, `info` (optional) | `algorithm`, `kdf`, `shared_secret_length_bytes`, `derived_key_b64`, `derived_key_hex`, `key_fingerprint`, `execution_duration_ms` |
| POST | `/api/diffie-hellman/simulate-exchange` | _(none)_ | `algorithm`, `group_name`, `prime_modulus_hex`, `generator`, `kdf`, `alice`, `bob`, `alice_derived_key_b64`, `bob_derived_key_b64`, `key_match`, `key_fingerprint`, `execution_duration_ms` |

#### Security Limitations

- Diffie-Hellman provides key agreement, **not** authentication. Without an authenticated channel, it is vulnerable to Man-in-the-Middle (MitM) attacks.
- The simulate-exchange endpoint runs both parties' operations on the same server — this is for educational purposes only. In real deployments, each party's private key must never leave its endpoint.
- The shared secret and private keys are processed purely in-memory and are never persisted.

---

### SHA-256

**Category:** Cryptographic Hash Function  
**Purpose:** Data integrity verification, digital fingerprints, content-addressable identifiers.

#### How It Works

- **Text hashing**: encodes input as UTF-8 and computes a 256-bit (32-byte) digest using `hashlib.sha256()`, returned as a 64-character lowercase hex string. Empty input yields the NIST test vector `e3b0c442...`.
- **File hashing**: streams the uploaded file in 64 KB chunks through `hashlib.sha256()` to avoid loading large files entirely into memory. Enforces a **50 MB maximum file size** limit. Returns the digest and the file's byte count.
- **Compare mode** (`text_vs_text` or `text_vs_hash`): hashes one or two inputs, compares their digests, and computes the **Hamming distance** in bits to demonstrate the cryptographic avalanche effect.

#### SHA-256 Flow

```mermaid
flowchart LR
    A[Input Text or File] --> B{Mode}
    B --> C[Text: hashlib.sha256\nencode UTF-8]
    B --> D[File: 64KB chunk streaming\nhashlib.sha256 update]
    B --> E[Compare: hash A and B\nor hash A vs expected digest]
    C --> F[64-hex digest]
    D --> F
    E --> G[digest_A · digest_B\nis_match · hamming_distance_bits\nbit_difference_percentage]
```

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/sha256/hash-text` | `text` | `algorithm`, `digest`, `byte_length`, `execution_duration_ms` |
| POST | `/api/sha256/hash-file` | `file` (multipart) | `algorithm`, `filename`, `digest`, `file_size_bytes`, `content_type`, `execution_duration_ms` |
| POST | `/api/sha256/compare` | `input_a`, `input_b`, `compare_mode` | `algorithm`, `compare_mode`, `hash_a`, `hash_b`, `is_match`, `hamming_distance_bits`, `bit_difference_percentage`, `execution_duration_ms` |

#### Security Limitations

- SHA-256 is a **hash function, not an encryption algorithm**. Hashes are one-way and cannot be reversed.
- The input text and file content are never stored in the database.

---

### MD5 (Legacy)

**Category:** Legacy Hash Function (Cryptographically Broken)  
**Purpose:** Educational collision analysis, legacy checksum demonstration. **Not suitable for any security-sensitive use.**

#### How It Works

Identical structure to SHA-256: text hashing (`hashlib.md5`), file streaming in 64 KB chunks (50 MB limit), and compare mode with Hamming distance. Returns a 128-bit digest as a 32-character lowercase hex string.

MD5 is included to contrast with SHA-256, demonstrating why it was deprecated. Known collision attacks exist against MD5; it must not be used for password storage, digital signatures, or integrity checks in adversarial contexts.

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/md5/hash-text` | `text` | `algorithm`, `digest`, `byte_length`, `execution_duration_ms`, `security_warning` |
| POST | `/api/md5/hash-file` | `file` (multipart) | `algorithm`, `filename`, `digest`, `file_size_bytes`, `content_type`, `execution_duration_ms`, `security_warning` |
| POST | `/api/md5/compare` | `input_a`, `input_b`, `compare_mode` | `algorithm`, `compare_mode`, `hash_a`, `hash_b`, `is_match`, `hamming_distance_bits`, `bit_difference_percentage`, `execution_duration_ms`, `security_warning` |

---

### DES-CBC (Legacy)

**Category:** Legacy Symmetric Block Cipher (Cryptographically Weak)  
**Purpose:** Historical demonstration of the Feistel cipher design that AES replaced. **Not suitable for any security-sensitive use.**

#### How It Works

- Requires an **8-character key** (64 bits input, 56 bits effective after parity strip).
- Generates a fresh random **8-byte IV** for each encryption.
- Encrypts using **DES-CBC** with **PKCS#7 padding** via `pycryptodome`.
- Returns **Base64-encoded** ciphertext and IV.
- Decryption requires the matching key and the IV from the encryption response.
- The response explicitly sets `is_authenticated=False` and includes a tamper warning, because DES-CBC provides no authentication and is vulnerable to padding oracle and ciphertext modification attacks.

#### DES Flow

```mermaid
flowchart LR
    A["Input: plaintext + 8-char key"] --> B["IV = os.urandom(8)"]
    B --> C["DES-CBC PKCS7 encrypt\n(pycryptodome)"]
    C --> D["ciphertext_b64 + iv_b64"]
    D --> E["Decrypt:\nciphertext_b64 + key + iv_b64"]
    E --> F["DES-CBC PKCS7 decrypt"]
    F --> G["plaintext\nis_authenticated=False\ntamper_warning included"]
```

#### Endpoints

| Method | Path | Request Fields | Response Fields |
|---|---|---|---|
| POST | `/api/des/encrypt` | `plaintext`, `key` (8 chars) | `algorithm`, `ciphertext`, `iv`, `block_size_bytes`, `key_size_bits`, `is_authenticated`, `security_warning`, `execution_duration_ms` |
| POST | `/api/des/decrypt` | `ciphertext`, `key` (8 chars), `iv` | `algorithm`, `plaintext`, `is_authenticated`, `tamper_warning`, `security_warning`, `execution_duration_ms` |

#### Security Limitations

- DES has an **effective key length of only 56 bits**, which is exhaustively brute-forceable by modern hardware.
- **CBC mode provides no authentication**. A modified ciphertext will silently produce garbled plaintext instead of failing.
- DES was withdrawn from the FIPS standard (FIPS 46-3 withdrawn 2005). Do not use in production.

---

## 6. Algorithm Comparison Table

| Algorithm | Category | Purpose | Key / Digest Size | Operations | Limitations | Recommended Use |
|---|---|---|---|---|---|---|
| **AES-256-GCM** | Symmetric Authenticated Encryption | Bulk data encryption + integrity | 256-bit key, 128-bit tag, 12-byte nonce | Encrypt, Decrypt | Passphrase travels to backend; requires HTTPS in prod | Current standard for symmetric encryption |
| **RSA-OAEP-SHA256** | Asymmetric Encryption | Small-payload encryption, key transport | 2048 or 3072-bit modulus | Generate keypair, Encrypt, Decrypt | Max plaintext ~190B (2048), ~318B (3072); slow for bulk data | Key transport, digital envelope |
| **Diffie-Hellman** | Key Agreement Protocol | Shared secret derivation | 2048-bit MODP Group 14 (RFC 3526) | Generate keypair, Derive secret, Simulate exchange | No authentication — vulnerable to MitM without additional auth | Session key establishment (paired with auth) |
| **SHA-256** | Cryptographic Hash | Data integrity, fingerprints | Fixed 256-bit digest (64 hex chars) | Hash text, Hash file, Compare | One-way; not encryption | Password hashing (with salt), integrity verification |
| **MD5** | Legacy Hash (broken) | Educational comparison only | Fixed 128-bit digest (32 hex chars) | Hash text, Hash file, Compare | Known collision attacks; cryptographically broken | Legacy checksum only; do not use for security |
| **DES-CBC** | Legacy Symmetric Cipher (broken) | Historical / educational only | 56-bit effective key (8-char input) | Encrypt, Decrypt | 56-bit key brute-forceable; CBC unauthenticated | Educational only; never use in production |

---

## 7. Frontend Pages and Navigation

All algorithm pages, `/history`, `/dashboard`, and `/profile` require authentication. Accessing them while logged out redirects to `/register`. The public landing page `/home` and `/about` are accessible without login.

| Route | Component | Auth Required | Purpose |
|---|---|---|---|
| `/` | `HomeOrDashboard` | Auto-detect | Public landing page (guests) or Dashboard (authenticated) |
| `/home` | `HomePage.jsx` | No | Public marketing and feature overview page |
| `/login` | `LoginPage.jsx` | No (redirects if already logged in) | Email + password login, "Remember Me" option |
| `/register` | `RegisterPage.jsx` | No (redirects if already logged in) | Two-step registration: request OTP → verify OTP |
| `/dashboard` | `Dashboard.jsx` | Yes | Authenticated workspace; live backend/DB health telemetry |
| `/algorithm/aes` | `AESPage.jsx` | Yes | AES-256-GCM text encryption and decryption |
| `/algorithm/aes-file` | `AESFileCryptoPage.jsx` | Yes | AES-256-GCM binary file encryption and decryption (.scipher) |
| `/algorithm/rsa` | `RSAPage.jsx` | Yes | RSA key generation, OAEP encryption and decryption |
| `/algorithm/diffie-hellman` | `DiffieHellmanPage.jsx` | Yes | DH keypair generation, secret derivation, exchange simulation |
| `/algorithm/sha-256` | `SHA256Page.jsx` | Yes | SHA-256 text/file hashing and comparison |
| `/algorithm/md5` | `MD5Page.jsx` | Yes | MD5 text/file hashing and comparison (legacy) |
| `/algorithm/des` | `DESPage.jsx` | Yes | DES-CBC encryption and decryption (legacy) |
| `/history` | `HistoryPage.jsx` | Yes | Paginated audit log; delete records; download PDF reports |
| `/about` | `AboutPage.jsx` | No | Platform overview, architecture, workflow documentation |
| `/profile` | `ProfileSettingsPage.jsx` | Yes | Update display name; change password |
| `*` | Redirect | — | Any unmatched path redirects to `/` |

### Navigation Components

| Component | File | Role |
|---|---|---|
| `Layout` | `Layout.jsx` | Top-level wrapper providing `Navbar` and `Sidebar` |
| `Navbar` | `Navbar.jsx` | Top bar: logo, health indicator, theme toggle, user menu |
| `Sidebar` | `Sidebar.jsx` | Left navigation with links to all algorithm pages |
| `AlgorithmCard` | `AlgorithmCard.jsx` | Summary card shown on Dashboard and Home |
| `HowItWorksSection` | `HowItWorksSection.jsx` | Educational workflow illustration section |
| `StatusBadge` | `StatusBadge.jsx` | Coloured pill for backend/DB health status |

### Authentication Context

`AuthContext.jsx` wraps the app and exposes `user`, `loading`, `login()`, and `logout()`. On mount it calls `GET /api/auth/me` with the stored JWT to restore a session. The `PublicRoute` and `ProtectedRoute` guards in `App.jsx` redirect users appropriately.

### Theme Support

`ThemeContext.jsx` provides a dark/light mode toggle. The selected preference is persisted in `localStorage`.

---

## 8. PostgreSQL Audit History

### Database Tables

**`operation_history`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement, indexed | Unique record identifier |
| `algorithm_name` | VARCHAR(50) | NOT NULL, indexed | e.g. `AES-256-GCM`, `RSA-2048`, `SHA-256`, `DES-CBC` |
| `operation_type` | VARCHAR(50) | NOT NULL, indexed | e.g. `encryption`, `decryption`, `hash_text`, `hash_file`, `compare`, `key_generation`, `key_derivation`, `key_exchange_simulation` |
| `status` | VARCHAR(20) | NOT NULL, default `success` | `success` or `failure` |
| `execution_duration_ms` | FLOAT | NOT NULL | Milliseconds the operation took server-side |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, server default `now()` | UTC timestamp of the operation |

**`users`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement, indexed | User ID |
| `full_name` | VARCHAR(100) | NOT NULL | Display name |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL, indexed | Login email |
| `hashed_password` | VARCHAR(255) | NOT NULL | bcrypt one-way hash |
| `is_active` | BOOLEAN | NOT NULL, default `True` | Account active flag |
| `is_verified` | BOOLEAN | NOT NULL, default `False` | Email verification status |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Account creation time |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Last update time |

**`email_otps`**

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PK, autoincrement, indexed | OTP record ID |
| `email` | VARCHAR(255) | NOT NULL, indexed | Target email |
| `hashed_otp` | VARCHAR(255) | NOT NULL | SHA-256 + salted HMAC hash of the OTP |
| `purpose` | VARCHAR(50) | NOT NULL, default `registration` | Purpose of the OTP |
| `attempts` | INTEGER | NOT NULL, default `0` | Failed attempt count (max 5) |
| `is_used` | BOOLEAN | NOT NULL, default `False` | Consumed flag |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | OTP creation time |
| `expires_at` | TIMESTAMP WITH TIME ZONE | NOT NULL | Expiry time (5-minute window) |

### Table Initialisation

On startup, `init_db()` calls `Base.metadata.create_all()` using the SQLAlchemy engine. If `DATABASE_URL` is not set, the backend starts in **decoupled mode**: API calls still work, but audit records are silently discarded. Alembic is also configured for migration-based schema management:

```powershell
# From backend/ directory with venv activated
alembic upgrade head
```

### Audit Workflow

```mermaid
flowchart TD
    A[API receives request] --> B[Execute crypto operation]
    B --> C{Success or Failure}
    C --> D["record_audit_operation(\n  algorithm_name,\n  operation_type,\n  status,\n  duration_ms\n)"]
    D --> E{db is None?}
    E -- Yes --> F[Skip silently\nbackend in decoupled mode]
    E -- No --> G[INSERT INTO operation_history]
    G --> H{DB error?}
    H -- Error --> I[Log warning\nrollback\ncontinue]
    H -- OK --> J[Audit record committed]
```

### History Operations

| Operation | Endpoint | Behaviour |
|---|---|---|
| Retrieve history | `GET /api/history?limit=N` | Returns up to N records (default 20, max 100), plus `total_count` from DB |
| Delete single record | `DELETE /api/history/{item_id}` | Permanently deletes one row by ID; returns 404 if not found |
| Clear all records | `DELETE /api/history` | Permanently deletes all rows; returns `deleted_count` |

> **Important:** Deletions are permanent and irreversible. There is no soft-delete or recycle bin. The endpoints do not currently require authentication — any client that can reach the backend can call them.

### What Is Intentionally Excluded from Audit Records

The `operation_history` table intentionally stores **only** metadata. The following are **never** stored:
- Plaintext input or output
- Ciphertexts
- Passphrases, passwords, or keys of any kind
- Hash digests or file contents
- RSA public or private keys
- Diffie-Hellman private keys or shared secrets

---

## 9. PDF Audit Reports

PDF reports are generated **entirely in the browser** using [jsPDF](https://github.com/parallax/jsPDF). No PDF file is ever created or stored on the backend server.

The generator lives in [`frontend/src/utils/historyPdfGenerator.js`](frontend/src/utils/historyPdfGenerator.js) and exports two functions:

### Single Record Report (`generateSingleAuditRecordPDF`)

Generates an A4 Portrait document for one audit record. Contents include:
- Document header with SecureCipher branding and timestamp
- Record metadata: ID, algorithm, operation type, status, duration, timestamp
- Theoretical algorithm architecture section
- Operation-specific workflow steps
- Security evaluation section

### Full History Report (`generateAuditHistoryPDF`)

Generates an A4 Landscape document for multiple audit records. Contents include:
- Executive summary with record count and filter info
- Algorithm benchmark metrics table (per-algorithm stats)
- Chronological audit trail table with repeating headers across pages
- Audit logging rationale
- Privacy statement
- Cryptographic glossary

### PDF Workflow

```mermaid
flowchart LR
    A[HistoryPage.jsx] -->|User clicks Download| B{Single or Full History?}
    B -->|Single| C[generateSingleAuditRecordPDF\nitem object]
    B -->|Full History| D[generateAuditHistoryPDF\nitems array + filter + dbHealth]
    C --> E[jsPDF A4 Portrait]
    D --> F[jsPDF A4 Landscape]
    E --> G[jsPDF.save — browser download]
    F --> G
    G --> H[PDF file saved locally\nno backend request]
```

### Privacy Guarantee

PDFs export **only** what is in the `operation_history` table: `id`, `algorithm_name`, `operation_type`, `status`, `execution_duration_ms`, `created_at`. They never contain plaintext, keys, passphrases, or any sensitive cryptographic material.

Reports are not digitally signed or legally certified.

---

## 10. API Reference

The FastAPI backend mounts all routes at the prefix `/api` (configured via `API_V1_STR` in `config.py`).

Interactive documentation is available at:
- **Swagger UI**: `http://127.0.0.1:8000/docs`
- **ReDoc**: `http://127.0.0.1:8000/redoc`

### Health & Diagnostics

| Method | Path | Auth | Purpose | Response |
|---|---|---|---|---|
| GET | `/` | No | Root information, links to docs | `{service, description, version, docs_url, api_health, api_database, api_algorithms, api_history}` |
| GET | `/api/health` | No | Backend liveness check | `{status, project, version, timestamp, message}` |
| GET | `/api/health/database` | No | PostgreSQL connectivity check | `{status, connected, message, database, user, latency_ms}` — 503 if disconnected |
| GET | `/api/algorithms` | No | List all six supported algorithms | `{algorithms: [...], total}` |
| GET | `/api/algorithms/{algo_id}` | No | Get one algorithm's details by ID (e.g. `aes`, `rsa`, `sha-256`) | `AlgorithmInfo` — 404 if not found |

### Authentication

| Method | Path | Auth | Purpose | Key Request Fields | Key Response Fields |
|---|---|---|---|---|---|
| POST | `/api/auth/register/request-otp` | No | Step 1 registration: validate email and send OTP | `full_name`, `email`, `password` | `status`, `message`, `email`, `smtp_configured`, `expires_in_seconds`, `resend_cooldown_seconds`, `dev_otp` (dev only) |
| POST | `/api/auth/register/verify-otp` | No | Step 2 registration: verify OTP, create account, issue JWT — **returns 201 Created** | `full_name`, `email`, `password`, `otp` | `access_token`, `token_type`, `expires_in`, `user` |
| POST | `/api/auth/login` | No | Authenticate and issue JWT | `email`, `password`, `remember_me` | `access_token`, `token_type`, `expires_in`, `user` |
| GET | `/api/auth/me` | Bearer JWT | Return current user profile | — | `id`, `full_name`, `email`, `is_active`, `is_verified`, `created_at` |
| PUT | `/api/auth/profile` | Bearer JWT | Update display name | `full_name` | Updated `UserResponse` |
| POST | `/api/auth/change-password` | Bearer JWT | Change password | `current_password`, `new_password` | `{status, message}` |
| POST | `/api/auth/logout` | No (client-side) | Signal logout | — | `{status, message}` |

### AES-256-GCM

| Method | Path | Auth | Purpose | Request Body | Response |
|---|---|---|---|---|---|
| POST | `/api/aes/encrypt` | No | Encrypt text | `{"plaintext": "...", "passphrase": "..."}` | `{algorithm, nonce, salt, ciphertext, tag, kdf, execution_duration_ms}` |
| POST | `/api/aes/decrypt` | No | Decrypt + authenticate text | `{"passphrase": "...", "nonce": "...", "salt": "...", "ciphertext": "...", "tag": "..."}` | `{algorithm, plaintext, verified, execution_duration_ms}` |
| POST | `/api/aes/encrypt-file` | No | Encrypt binary file (max 50 MB) | `multipart/form-data`: `file`, `passphrase` | Binary `.scipher` container stream (`application/octet-stream`) |
| POST | `/api/aes/decrypt-file` | No | Decrypt + authenticate `.scipher` file | `multipart/form-data`: `file`, `passphrase` | Recovered original binary file stream (`application/octet-stream`) |

**Example — Encrypt:**
```json
// POST /api/aes/encrypt
// Request
{"plaintext": "Hello SecureCipher", "passphrase": "my-strong-passphrase"}

// Response 200
{
  "algorithm": "AES-256-GCM",
  "nonce": "AAAAAAAAAAAAAAAA",
  "salt": "AAAAAAAAAAAAAAAAAAAAAA==",
  "ciphertext": "aGVsbG8=",
  "tag": "AAAAAAAAAAAAAAAAAAAAAA==",
  "kdf": {"algorithm": "scrypt", "n": 16384, "r": 8, "p": 1, "salt_length_bytes": 16, "key_length_bytes": 32},
  "execution_duration_ms": 42.1
}
```

### RSA

| Method | Path | Auth | Purpose | Request Body | Response |
|---|---|---|---|---|---|
| POST | `/api/rsa/generate-keys` | No | Generate RSA keypair | `{"key_size": 2048}` | `{algorithm, key_size, public_key_pem, private_key_pem, format, execution_duration_ms}` |
| POST | `/api/rsa/encrypt` | No | Encrypt with public key | `{"plaintext": "...", "public_key_pem": "-----BEGIN..."}` | `{algorithm, key_size, ciphertext, padding, execution_duration_ms}` |
| POST | `/api/rsa/decrypt` | No | Decrypt with private key | `{"ciphertext": "...", "private_key_pem": "-----BEGIN..."}` | `{algorithm, plaintext, verified, execution_duration_ms}` |

### Diffie-Hellman

| Method | Path | Auth | Purpose | Request Body | Response |
|---|---|---|---|---|---|
| POST | `/api/diffie-hellman/generate-keypair` | No | Generate DH keypair | `{"party_name": "Alice"}` | `{algorithm, group_name, prime_bits, generator, party_name, public_key_pem, private_key_pem, public_key_hex, execution_duration_ms}` |
| POST | `/api/diffie-hellman/derive-secret` | No | Derive shared secret + HKDF | `{"private_key_pem": "...", "peer_public_key_pem": "...", "info": "..."}` | `{algorithm, kdf, shared_secret_length_bytes, derived_key_b64, derived_key_hex, key_fingerprint, execution_duration_ms}` |
| POST | `/api/diffie-hellman/simulate-exchange` | No | Full Alice↔Bob simulation | _(empty body)_ | `{algorithm, group_name, prime_modulus_hex, generator, kdf, alice, bob, alice_derived_key_b64, bob_derived_key_b64, key_match, key_fingerprint, execution_duration_ms}` |

### SHA-256

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/sha256/hash-text` | No | Hash UTF-8 text |
| POST | `/api/sha256/hash-file` | No | Stream-hash uploaded file (max 50 MB) |
| POST | `/api/sha256/compare` | No | Compare two inputs (modes: `text_vs_text`, `text_vs_hash`) |

### MD5 (Legacy)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/md5/hash-text` | No | Hash UTF-8 text |
| POST | `/api/md5/hash-file` | No | Stream-hash uploaded file (max 50 MB) |
| POST | `/api/md5/compare` | No | Compare two inputs (modes: `text_vs_text`, `text_vs_hash`) |

### DES-CBC (Legacy)

| Method | Path | Auth | Purpose |
|---|---|---|---|
| POST | `/api/des/encrypt` | No | Encrypt with 8-char key (DES-CBC PKCS7) |
| POST | `/api/des/decrypt` | No | Decrypt with 8-char key and IV |

### Audit History

| Method | Path | Auth | Purpose | Notes |
|---|---|---|---|---|
| GET | `/api/history` | No | List recent audit records | Query param: `limit` (1–100, default 20) |
| DELETE | `/api/history` | No | Permanently delete ALL records | Returns `{success, deleted_count, message}` |
| DELETE | `/api/history/{item_id}` | No | Permanently delete one record by ID | 404 if not found |

> **Route ordering note:** `DELETE /api/history` is declared before `DELETE /api/history/{item_id}` in `history.py` to prevent FastAPI from mistakenly routing the literal string `history` as a path parameter value.

### Common Error Responses

| Status | Meaning |
|---|---|
| 400 | Validation failed (empty input, wrong passphrase, tampered ciphertext, bad Base64) |
| 401 | Missing or expired JWT |
| 404 | Record not found |
| 422 | Pydantic schema validation failure |
| 500 | Unexpected internal error (details in backend logs only) |
| 503 | Database unavailable |

---

## 11. Request / Response Lifecycle

```mermaid
sequenceDiagram
    participant U as User / Browser
    participant P as React Page
    participant AC as api.js fetch()
    participant VP as Vite Proxy
    participant FA as FastAPI Endpoint
    participant PY as Pydantic Schema
    participant CS as Crypto Service
    participant HS as history_service.py
    participant DB as PostgreSQL

    U->>P: Fill form and click Submit
    P->>AC: encryptAES(plaintext, passphrase)
    AC->>VP: POST /api/aes/encrypt
    VP->>FA: Forward to :8000/api/aes/encrypt
    FA->>PY: Validate AESEncryptRequest
    alt Invalid schema
        PY-->>FA: ValidationError
        FA-->>AC: 422 Unprocessable Entity
        AC-->>P: throw Error
        P-->>U: Show error message
    end
    PY-->>FA: Valid request
    FA->>CS: encrypt_aes_256_gcm(plaintext, passphrase)
    alt Encryption error
        CS-->>FA: raise Exception
        FA->>HS: record_audit_operation(...status="failure"...)
        HS->>DB: INSERT operation_history
        FA-->>AC: 400 Bad Request
        AC-->>P: throw Error
        P-->>U: Show error message
    end
    CS-->>FA: {nonce, salt, ciphertext, tag, kdf}
    FA->>HS: record_audit_operation(...status="success"...)
    HS->>DB: INSERT operation_history
    DB-->>HS: OK
    FA-->>AC: 200 AESEncryptResponse
    AC-->>P: result object
    P-->>U: Display nonce, salt, ciphertext, tag

    Note over U,P: PDF generation (client-side only)
    U->>P: Click Download PDF
    P->>P: generateSingleAuditRecordPDF(item) via jsPDF
    P-->>U: Browser saves PDF file (no backend call)
```

---

## 12. Project Structure

```
CryptoShield-mini/
├── backend/
│   ├── .env                        # Local secrets (not committed)
│   ├── .env.example                # Safe template with placeholder values
│   ├── alembic.ini                 # Alembic configuration
│   ├── alembic/                    # Migration scripts
│   ├── pytest.ini                  # pytest configuration
│   ├── requirements.txt            # Python dependencies
│   ├── app/
│   │   ├── main.py                 # FastAPI app, CORS, lifespan, global error handler
│   │   ├── api/
│   │   │   ├── router.py           # Assembles all sub-routers
│   │   │   └── endpoints/
│   │   │       ├── health.py       # GET /api/health, GET /api/health/database
│   │   │       ├── algorithms.py   # GET /api/algorithms (registry)
│   │   │       ├── auth.py         # POST /api/auth/* (register, login, JWT)
│   │   │       ├── aes.py          # POST /api/aes/encrypt|decrypt
│   │   │       ├── rsa.py          # POST /api/rsa/generate-keys|encrypt|decrypt
│   │   │       ├── diffie_hellman.py # POST /api/diffie-hellman/*
│   │   │       ├── sha256.py       # POST /api/sha256/hash-text|hash-file|compare
│   │   │       ├── md5.py          # POST /api/md5/hash-text|hash-file|compare
│   │   │       ├── des.py          # POST /api/des/encrypt|decrypt
│   │   │       └── history.py      # GET/DELETE /api/history, DELETE /api/history/{id}
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic Settings (DATABASE_URL, JWT, CORS, SMTP)
│   │   │   └── security.py         # JWT creation/decoding, bcrypt, OTP utilities
│   │   ├── db/
│   │   │   ├── session.py          # SQLAlchemy engine, SessionLocal, check_database_connection
│   │   │   └── init_db.py          # create_all() on startup
│   │   ├── models/
│   │   │   ├── history.py          # OperationHistory SQLAlchemy model
│   │   │   └── user.py             # User + EmailOTP SQLAlchemy models
│   │   ├── schemas/
│   │   │   ├── aes.py              # AESEncryptRequest/Response, KDFParameters
│   │   │   ├── rsa.py              # RSAKeyGenRequest/Response, RSAEncrypt/DecryptRequest/Response
│   │   │   ├── diffie_hellman.py   # DHKeyGenRequest/Response, DHDeriveSecretRequest/Response, DHSimulationResponse
│   │   │   ├── sha256.py           # SHA256TextRequest/Response, SHA256FileResponse, SHA256CompareRequest/Response
│   │   │   ├── md5.py              # MD5 equivalents of SHA256 schemas
│   │   │   ├── des.py              # DESEncryptRequest/Response, DESDecryptRequest/Response
│   │   │   ├── history.py          # OperationHistoryItem, OperationHistoryResponse, DeleteHistoryResponse, ClearAllHistoryResponse
│   │   │   ├── auth.py             # LoginRequest, RegisterRequest, AuthTokenResponse, UserResponse, OTP schemas
│   │   │   └── health.py           # HealthResponse, DatabaseHealthResponse
│   │   └── services/
│   │       ├── aes_service.py      # Scrypt + AES-256-GCM (cryptography lib)
│   │       ├── rsa_service.py      # RSA key generation + OAEP encrypt/decrypt
│   │       ├── diffie_hellman_service.py  # RFC 3526 DH + HKDF-SHA256
│   │       ├── sha256_service.py   # hashlib.sha256, file streaming, compare
│   │       ├── md5_service.py      # hashlib.md5, file streaming, compare
│   │       ├── des_service.py      # DES-CBC PKCS7 (pycryptodome)
│   │       ├── auth_service.py     # User registration, login, OTP, profile
│   │       └── history_service.py  # Audit CRUD: get, record, delete, clear
│   └── tests/
│       ├── test_api.py             # Health and root endpoint tests
│       ├── test_aes.py             # AES round-trips, tampering, empty input
│       ├── test_rsa.py             # RSA key generation, encrypt/decrypt
│       ├── test_diffie_hellman.py  # DH keypairs, derivation, simulation
│       ├── test_sha256.py          # SHA-256 hashing, file, compare
│       ├── test_md5.py             # MD5 hashing, file, compare
│       ├── test_des.py             # DES encryption, decryption
│       └── test_auth.py            # Registration, login, OTP, JWT, password change
│
└── frontend/
    ├── index.html                  # Vite entry HTML
    ├── package.json                # npm scripts and dependencies
    ├── vite.config.js              # Vite plugins + API proxy to :8000
    ├── .oxlintrc.json              # oxlint rules
    └── src/
        ├── main.jsx                # React DOM root render
        ├── App.jsx                 # BrowserRouter, route tree, health polling
        ├── App.css                 # Global app styles
        ├── index.css               # Tailwind CSS base
        ├── context/
        │   ├── AuthContext.jsx     # JWT storage, user state, login/logout
        │   ├── ThemeContext.jsx    # Dark/light theme toggle
        │   └── NotificationContext.jsx  # Toast notification system
        ├── components/
        │   ├── Layout.jsx          # Page wrapper with Navbar + Sidebar
        │   ├── Navbar.jsx          # Top bar: health badge, theme, user menu
        │   ├── Sidebar.jsx         # Algorithm navigation links
        │   ├── AlgorithmCard.jsx   # Summary card for Dashboard
        │   ├── HowItWorksSection.jsx  # Educational workflow illustration
        │   └── StatusBadge.jsx     # Coloured health indicator pill
        ├── pages/
        │   ├── HomePage.jsx        # Public landing page
        │   ├── Dashboard.jsx       # Authenticated workspace and health telemetry
        │   ├── LoginPage.jsx       # Email + password login
        │   ├── RegisterPage.jsx    # Two-step OTP registration
        │   ├── AESPage.jsx         # AES-256-GCM encrypt/decrypt UI
        │   ├── RSAPage.jsx         # RSA key generation, encrypt/decrypt UI
        │   ├── DiffieHellmanPage.jsx  # DH keypair, derivation, simulation UI
        │   ├── SHA256Page.jsx      # SHA-256 hash/file/compare UI
        │   ├── MD5Page.jsx         # MD5 hash/file/compare UI
        │   ├── DESPage.jsx         # DES-CBC encrypt/decrypt UI
        │   ├── HistoryPage.jsx     # Audit log table, delete, PDF download
        │   ├── AboutPage.jsx       # Platform documentation
        │   └── ProfileSettingsPage.jsx  # Update profile, change password
        ├── services/
        │   └── api.js              # All fetch() calls to backend; auth token helpers
        └── utils/
            └── historyPdfGenerator.js  # jsPDF single-record and full-history PDF engines
```

---

## 13. Prerequisites and Windows Installation

### Prerequisites

| Requirement | Minimum Version | Check |
|---|---|---|
| Python | 3.11 | `python --version` |
| Node.js | 18 LTS | `node --version` |
| npm | 9 | `npm --version` |
| PostgreSQL | 15 (16 recommended) | `psql --version` |
| Git | Any recent | `git --version` |

---

### Step 1 — Clone the Repository

```powershell
git clone https://github.com/AjayKumarKR07/SecureCipher.git
cd SecureCipher
```

---

### Step 2 — Backend: Create Virtual Environment

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
```

> If PowerShell blocks script execution, run:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

---

### Step 3 — Backend: Install Dependencies

```powershell
pip install -r requirements.txt
```

---

### Step 4 — PostgreSQL: Create Database and User

Open **psql** as the `postgres` superuser and run:

```sql
CREATE USER securecipher_user WITH PASSWORD 'your_password_here';
CREATE DATABASE securecipher_db OWNER securecipher_user;
GRANT ALL PRIVILEGES ON DATABASE securecipher_db TO securecipher_user;
\q
```

Replace `your_password_here` with a strong password. **Do not commit this password anywhere.**

---

### Step 5 — Backend: Configure Environment Variables

```powershell
copy .env.example .env
```

Edit `backend/.env`:

```env
PROJECT_NAME="SecureCipher"
API_V1_STR="/api"
PORT=8000
HOST="127.0.0.1"

CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

# Replace your_password_here with the actual password you set in Step 4
DATABASE_URL="postgresql+psycopg://securecipher_user:your_password_here@localhost:5432/securecipher_db"

JWT_SECRET_KEY="replace-this-with-a-long-random-secret-string-at-least-32-chars"
JWT_ALGORITHM="HS256"
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Optional SMTP (leave blank to skip email sending during OTP registration)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM_EMAIL=
```

> **Important:** Never commit `backend/.env` to version control. It is listed in `.gitignore`.

---

### Step 6 — Backend: Initialise Database Tables

The application auto-creates tables on startup. Alternatively, use Alembic:

```powershell
alembic upgrade head
```

---

### Step 7 — Start the FastAPI Backend

```powershell
# Still inside backend/ with venv active
python -m app.main
```

Or with Uvicorn directly:

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Verify the backend is running:
- Open `http://127.0.0.1:8000/docs` in your browser.
- You should see the Swagger UI with all API endpoints.

---

### Step 8 — Frontend: Install Dependencies

Open a **new terminal** (keep the backend running):

```powershell
cd ..\frontend
npm install
```

---

### Step 9 — Start the Vite Development Server

```powershell
npm run dev
```

Output will show:

```
  VITE v8.x.x  ready in XXX ms
  ➜  Local:   http://localhost:5173/
```

The Vite proxy automatically forwards `/api/*` requests to `http://127.0.0.1:8000`.

---

### Step 10 — Open the Application

| URL | Purpose |
|---|---|
| `http://localhost:5173` | React frontend |
| `http://127.0.0.1:8000/docs` | FastAPI Swagger UI |
| `http://127.0.0.1:8000/redoc` | FastAPI ReDoc |

---

### Troubleshooting Common Setup Errors

| Problem | Likely cause | Fix |
|---|---|---|
| `ModuleNotFoundError` | venv not activated | Run `.\venv\Scripts\Activate.ps1` |
| `password authentication failed` | Wrong DB password in `.env` | Verify `DATABASE_URL` password matches psql user |
| `connection refused` (PostgreSQL) | PostgreSQL service not running | `net start postgresql-x64-16` or start from Services |
| Port 8000 already in use | Another process using port 8000 | Change `PORT=8001` in `.env` and restart uvicorn |
| Port 5173 already in use | Another Vite instance | Kill the old process or run `npm run dev -- --port 5174` |
| CORS error in browser | Frontend URL not in `CORS_ORIGINS` | Add `http://localhost:5174` to `CORS_ORIGINS` in `.env` |
| `alembic: command not found` | venv not activated | Activate venv; alembic is installed in `venv/Scripts/` |
| `DATABASE_URL not set` log | `.env` missing or not loaded | Confirm `.env` is in the `backend/` directory |
| Frontend shows "Backend Offline" | FastAPI not running | Start backend first, then frontend |
| Decryption `authentication tag verification failed` | Wrong passphrase or tampered ciphertext | Use the exact passphrase and unmodified ciphertext from encryption |

---

## 14. Environment Variables

All environment variables are read from `backend/.env` by `pydantic-settings`.

| Variable | Component | Required | Purpose | Example / Placeholder |
|---|---|---|---|---|
| `PROJECT_NAME` | Backend | No | Service name in API responses | `SecureCipher` |
| `API_V1_STR` | Backend | No | API route prefix | `/api` |
| `HOST` | Backend | No | Uvicorn bind host | `127.0.0.1` |
| `PORT` | Backend | No | Uvicorn port | `8000` |
| `DATABASE_URL` | Backend | **Yes** (for persistence) | PostgreSQL connection string (SQLAlchemy 2 + Psycopg 3 format) | `postgresql+psycopg://user:password@localhost:5432/securecipher_db` |
| `CORS_ORIGINS` | Backend | No | Comma-separated allowed origins | `http://localhost:5173,http://127.0.0.1:5173` |
| `JWT_SECRET_KEY` | Backend | **Yes** (for auth) | HMAC signing key for JWT tokens | `replace-with-a-32+-char-random-secret` |
| `JWT_ALGORITHM` | Backend | No | JWT signing algorithm | `HS256` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Backend | No | Token lifetime (minutes) | `1440` (24 hours) |
| `SMTP_HOST` | Backend | No | SMTP server for OTP emails | `smtp.gmail.com` |
| `SMTP_PORT` | Backend | No | SMTP port | `587` |
| `SMTP_USER` | Backend | No | SMTP login username | `your-email@example.com` |
| `SMTP_PASSWORD` | Backend | No | SMTP password or app password | _(secret)_ |
| `SMTP_FROM_EMAIL` | Backend | No | From address on OTP emails | `noreply@yourdomain.com` |
| `SMTP_FROM_NAME` | Backend | No | Sender name | `SecureCipher Security` |
| `SMTP_TLS` | Backend | No | Enable STARTTLS | `True` |
| `DEMO_OTP_ENABLED` | Backend | No | Enable demonstration OTP mode without email service | `false` |
| `ENVIRONMENT` | Backend | No | Deployment context | `development` |

> **Security note:** `backend/.env` contains secrets. It is listed in `.gitignore` and must **never** be committed. The `.env.example` file contains only safe placeholders.

**Frontend API URL** is configured via the Vite proxy in `vite.config.js` — no `.env` file is used on the frontend side. The proxy target `http://127.0.0.1:8000` can be changed in `vite.config.js` if the backend runs on a different host or port.

---

## 15. Testing

### Backend Tests

Tests are located in `backend/tests/` and use **pytest** with FastAPI's `TestClient`. The authentication tests use an in-memory SQLite database to avoid requiring a live PostgreSQL connection.

```powershell
# From backend/ directory with venv activated
pytest
```

Run a specific test file:

```powershell
pytest tests/test_aes.py -v
pytest tests/test_aes_file.py -v
pytest tests/test_diffie_hellman.py -v
```

### Test Coverage by File

| Test File | What It Tests |
|---|---|
| `test_api.py` | Health endpoint (`GET /api/health`), root endpoint |
| `test_aes.py` | Round-trip text encrypt/decrypt, fresh nonce/salt uniqueness, wrong passphrase rejection, tampered ciphertext/tag rejection, malformed Base64, empty input validation, audit record creation without secrets |
| `test_aes_file.py` | AES-256-GCM arbitrary binary file round-trip (PDF, DOCX, images, binaries), 0-byte file handling, Unicode filenames, path traversal sanitization, Scrypt KDF parameters, AAD metadata tampering rejection, truncated/corrupted container rejection, 50 MB size limit enforcement, zero secret leakage in audit history |
| `test_rsa.py` | RSA keypair generation (2048), encrypt/decrypt round-trip, wrong key rejection |
| `test_diffie_hellman.py` | Keypair generation, shared secret derivation, simulation endpoint, key match verification |
| `test_sha256.py` | Text hashing (NIST vectors), empty input, file hashing, compare modes, avalanche check |
| `test_md5.py` | Text hashing (RFC 1321 vectors), empty input, file hashing, compare modes |
| `test_des.py` | Encrypt/decrypt round-trip, wrong key/IV rejection, block alignment |
| `test_auth.py` | Registration OTP flow, OTP expiry, login with correct/wrong credentials, JWT validation, password change, profile update |

> Test pass/fail counts are not listed here because they depend on whether a live database is configured. Do not rely on reported numbers without running the suite yourself.

### Frontend Build Check

```powershell
# From frontend/ directory
npm run build
```

A successful build outputs to `frontend/dist/`. This validates that all imports resolve and JSX compiles without errors.

### Frontend Linting

```powershell
npm run lint
```

Uses oxlint with configuration in `.oxlintrc.json`.

---

## 16. Security Model and Limitations

This section provides a candid account of the security boundaries of SecureCipher.

### What the Backend Receives

**The FastAPI backend receives plaintext, passphrases, and private keys in request bodies.** For AES operations the passphrase travels from the browser to the backend. For RSA operations, the private key is pasted into the browser and sent to the backend for decryption. This is inherent to the server-side cryptographic architecture.

**Consequence:** SecureCipher is **not** end-to-end encrypted and makes **no** zero-knowledge guarantee. HTTPS is mandatory for any deployment beyond localhost.

### Audit Metadata Only in Database

The `operation_history` table stores **only** audit metadata. Plaintext, ciphertexts, keys, passphrases, digests, and file contents are **never written to the database or logs**. This is enforced by the `record_audit_operation()` function in all service modules.

### Private Keys

RSA and DH private keys are generated in-memory and returned in the API response. The server does **not** cache, store, or log them. The client is responsible for their security once received.

### Authentication and Authorisation

- User passwords are hashed with **bcrypt** before storage.
- Registration uses a **6-digit OTP** with a 5-minute expiry and a maximum of 5 attempts before invalidation. OTPs are stored as HMAC-SHA256 hashes, never plaintext.
- Session management uses **JWT** (HS256 algorithm) with a configurable expiry (default 24 hours, or 7 days with "Remember Me").
- **The audit history endpoints (`GET/DELETE /api/history`) do not currently require authentication.** Any client that can reach the backend can read or delete audit records.
- Crypto operation endpoints also do not require authentication. This is intentional for educational exploration.

### CORS

CORS is configured by `CORS_ORIGINS` in `.env`. In development, only `localhost:5173` and `127.0.0.1:5173` are allowed by default.

### HTTPS and Production

The application runs over plain HTTP in the development configuration. **HTTPS must be configured at the reverse proxy layer (e.g., Nginx, Caddy) before any production or semi-public deployment.**

The default `JWT_SECRET_KEY` in `.env.example` is a placeholder and must be replaced with a long, randomly generated secret before production use.

### Passphrase and Key Strength

AES security depends entirely on passphrase strength. Scrypt (N=16384, r=8, p=1) provides computational cost against brute-force but cannot compensate for short or common passphrases.

### MD5 and DES Warnings

MD5 is **cryptographically broken** — known practical collision attacks exist. It must not be used for password storage, digital signatures, or any security-sensitive purpose. DES has a 56-bit effective key length that is brute-forceable in hours with modern hardware and provides **no ciphertext authentication**. Both are included for educational comparison only.

### Audit Deletion

Audit deletions are permanent and irreversible. There is no recycle bin or soft-delete. No access control currently restricts who can delete records.

### What This Application Is Not

SecureCipher is **not** a production security tool, a certified cryptographic library, a zero-knowledge system, or a military-grade platform. It is an educational application demonstrating how cryptographic primitives work.

---

## 17. Troubleshooting

### PostgreSQL Connection Failure

```
sqlalchemy.exc.OperationalError: connection to server at "localhost" failed
```

- Confirm PostgreSQL is running: `Get-Service postgresql*` in PowerShell
- Verify `DATABASE_URL` in `backend/.env` matches the database name, user, and password
- If your password contains `@`, URL-encode it as `%40`

### Missing or Stale Environment Variables

Backend logs print `DATABASE_URL not set` or use wrong defaults:
- Confirm `backend/.env` exists and is not named `.env.example`
- Restart the backend after editing `.env`

### CORS Error in Browser Console

```
Access to fetch at 'http://127.0.0.1:8000/api/...' from origin 'http://localhost:5174' has been blocked by CORS policy
```

- Add `http://localhost:5174` to `CORS_ORIGINS` in `backend/.env`
- Restart the backend

### Port Conflicts

```
error: listen EADDRINUSE :::5173
```

```powershell
# Find the process using port 5173
netstat -ano | findstr :5173
# Kill it (replace PID)
taskkill /PID <PID> /F
```

Or run Vite on a different port: `npm run dev -- --port 5174`

### AES Decryption Authentication Failure

```json
{"detail": "Decryption failed: authentication tag verification failed. ..."}
```

- Ensure the passphrase matches exactly (case-sensitive, no trailing spaces)
- Ensure the `nonce`, `salt`, `ciphertext`, and `tag` values are copied unmodified from the encryption response
- Any modification to any field will cause authentication to fail by design

### DES Decryption Produces Garbled Output

DES-CBC has **no authentication**. A wrong key will produce garbled plaintext rather than an error. Verify the key is exactly 8 characters.

### PDF Download Produces Empty or Error

- Ensure the browser has not blocked popups or file downloads
- Ensure the audit history has at least one record before downloading a report
- Check the browser console for any jsPDF JavaScript errors

### Backend Import Errors on Startup

```
ImportError: No module named 'app'
```

- Run from the `backend/` directory, not the project root
- Confirm the virtual environment is activated

### Frontend API Proxy Not Working

- Confirm the Vite dev server is running on port 5173
- Confirm the backend is running on `127.0.0.1:8000`
- The proxy target is hardcoded in `vite.config.js` — verify it has not been changed

### Database Tables Not Created

If operations succeed but history is empty and logs show `Auto table initialization skipped`:
- The `DATABASE_URL` may be missing or incorrect
- Run `alembic upgrade head` from `backend/` with venv active and a valid database connection

---

## 18. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for the full text.

---

> **Educational Disclaimer:** SecureCipher is built for learning and demonstrating cryptographic concepts. It is not audited, certified, or hardened for production security-sensitive deployments. Do not use it to protect real user data without a full security review, HTTPS, and appropriate access controls.
