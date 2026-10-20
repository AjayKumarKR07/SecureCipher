# SecureCipher

> **Multi-Algorithm Cryptography and Secure Data Protection System**

SecureCipher is an enterprise-grade, full-stack cryptographic workbench engineered for interactive cryptographic exploration, algorithmic security evaluation, and educational demonstration. It implements six cryptographic primitives — **AES-256-GCM** (both text and binary container file encryption), **RSA-OAEP / RSA-PSS**, **Diffie-Hellman Key Agreement** (RFC 3526 MODP-2048), **SHA-256**, **MD5**, and **DES-CBC** — served through a high-performance **FastAPI** backend and an adaptive, mobile-responsive **React + Vite** frontend.

Built on a strict **zero-knowledge in-memory execution model**, sensitive data (plaintext, passphrases, private keys, and symmetric secrets) exists exclusively in volatile RAM during runtime and is discarded immediately after execution. The persistent **PostgreSQL** database stores only non-sensitive operational metadata (algorithm identifier, operation type, duration in milliseconds, status, and UTC timestamp) for auditing and performance analytics.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel%20Deployment-00f59b?style=for-the-badge&logo=vercel&logoColor=black)](https://secure-cipher-omega.vercel.app/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11%20|%203.14-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19.2+-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-v4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%20|%2016+-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

---

## 🌐 Live Demo

Explore the live web application deployed on Vercel:

👉 **[https://secure-cipher-omega.vercel.app/](https://secure-cipher-omega.vercel.app/)**

> **Live Deployment Note:** The frontend Single-Page Application (SPA) is hosted on Vercel with automatic HTTPS, edge routing, and SPA rewrite handling. When accessing the live demonstration, backend health checks, simulated algorithm workbenches, and client-side operations function seamlessly. For full end-to-end database auditing and local backend execution, follow the [Installation and Local Setup](#-installation-and-local-setup-windows-powershell) guide below.

---

## 📑 Table of Contents

1. [Key Features](#-key-features)
2. [Supported Cryptographic Algorithms](#-supported-cryptographic-algorithms)
   - [Algorithm Comparison Matrix](#algorithm-comparison-matrix)
3. [Technology Stack](#-technology-stack)
4. [System Architecture](#-system-architecture)
   - [Architectural Topology](#architectural-topology)
   - [Request / Response Lifecycle](#request--response-lifecycle)
   - [Binary Container Format (.scipher)](#binary-container-specification-scenc01)
5. [Visual Tour & Screenshots](#-visual-tour--screenshots)
6. [Mobile-Responsive Design](#-mobile-responsive-design)
7. [Project Structure](#-project-structure)
8. [Prerequisites](#-prerequisites)
9. [Installation and Local Setup (Windows PowerShell)](#-installation-and-local-setup-windows-powershell)
10. [Environment Variables and Configuration](#-environment-variables-and-configuration)
11. [Running the Application](#-running-the-application)
12. [API Documentation and Endpoints](#-api-documentation-and-endpoints)
13. [Testing Instructions](#-testing-instructions)
14. [Deployment Information](#-deployment-information)
15. [Security Considerations](#-security-considerations)
16. [Future Enhancements](#-future-enhancements)
17. [License and Author Information](#-license-and-author-information)

---

## 🌟 Key Features

- **Multi-Algorithm Cryptographic Workbench**: Hands-on experimentation with AES-256-GCM, RSA-OAEP, RSA-PSS, Diffie-Hellman, SHA-256, MD5, and DES.
- **Zero-Retention In-Memory Execution**: Plaintext, cryptographic keys, passphrases, and file contents exist strictly in volatile RAM during runtime and are discarded immediately after execution.
- **Binary File Cryptography (`.scipher`)**: Authenticated encryption and decryption of arbitrary files (PDFs, images, archives, documents) up to 50 MB using AES-256-GCM with Scrypt key derivation and Associated Authenticated Data (AAD) container headers.
- **Zero-Knowledge PostgreSQL Auditing**: PostgreSQL records only non-sensitive execution metrics (`algorithm_name`, `operation_type`, `status`, `execution_duration_ms`, `created_at`). Secrets are never logged or stored.
- **Client-Side PDF Audit Reports**: Single-record technical sheets (A4 Portrait) and full audit history logs (A4 Landscape) generated entirely in-browser using `jsPDF` without server-side payload transmission.
- **Dual Authentication Modes**: Secure registration and login powered by bcrypt (cost factor 12) and PyJWT. Supports live SMTP verification as well as a demonstration OTP mode (`DEMO_OTP_ENABLED=true`) for evaluation environments.
- **Fully Mobile-Responsive Dark Cyber UI**: Optimized cybersecurity theme scaling across mobile screens (320px–480px), tablets (481px–1024px), laptops, and desktop monitors.
- **Interactive OpenAPI Documentation**: Built-in Swagger UI and ReDoc endpoints automatically generated from FastAPI Pydantic v2 schemas.

---

## 🔐 Supported Cryptographic Algorithms

SecureCipher implements modern industry-standard ciphers alongside historical algorithms for comparative security analysis:

### 1. AES-256-GCM (Advanced Encryption Standard in Galois/Counter Mode)
- **Classification**: Symmetric Authenticated Encryption (AEAD).
- **Standards**: NIST SP 800-38D, FIPS 197.
- **Key Derivation**: **Scrypt** (`N=16384`, `r=8`, `p=1`, 256-bit derived key) with CSPRNG 16-byte salt (`os.urandom(16)`).
- **Nonce**: 12-byte (96-bit) cryptographically secure random nonce generated per operation.
- **Integrity**: 16-byte (128-bit) GCM authentication tag verifies ciphertext authenticity simultaneously with decryption. Any payload tampering immediately raises an authentication verification error.
- **File Cryptography**: Custom `.scipher` container with tamper-proof metadata authenticated via AAD.

### 2. RSA-OAEP & RSA-PSS (Rivest–Shamir–Adleman)
- **Classification**: Asymmetric Public-Key Cryptosystem.
- **Standards**: PKCS#1 v2.2, RFC 8017.
- **Key Sizes**: 2048-bit or 3072-bit keys generated in-memory with public exponent $e = 65537$.
- **Encryption Padding**: **OAEP** (Optimal Asymmetric Encryption Padding) with MGF1 and SHA-256, protecting against Chosen Ciphertext Attacks (CCA).
- **Digital Signatures**: **PSS** (Probabilistic Signature Scheme) with SHA-256 for verifiable message authentication and non-repudiation.
- **Key Encoding**: Exported in standard PKCS#8 PEM format. Private keys are never persisted on the server.

### 3. Diffie-Hellman Key Agreement (RFC 3526 MODP-2048)
- **Classification**: Key Agreement Protocol.
- **Standards**: RFC 3526 (Group 14), RFC 5869 (HKDF).
- **Parameters**: 2048-bit MODP prime modulus ($p$) with generator $g = 2$.
- **Key Derivation**: Raw derived secret is expanded into a 256-bit symmetric session key using **HKDF-SHA256**.
- **Interactive Workbenches**: Supports independent party keypair generation, manual shared secret derivation, and complete automated Alice ↔ Bob key exchange simulations with key match verification.

### 4. SHA-256 (Secure Hash Algorithm 256-bit)
- **Classification**: Cryptographic Hash Function.
- **Standards**: FIPS 180-4.
- **Digest Size**: 256 bits (32 bytes), represented as a 64-character hexadecimal string.
- **Streaming Execution**: Processes uploaded files up to 50 MB in 64 KB memory chunks.
- **Avalanche Analyzer**: Compares two inputs or an input against an expected hash, computing the **Hamming bit distance** and percentage difference to demonstrate the cryptographic avalanche effect.

### 5. MD5 (Message Digest 5 — Legacy & Educational)
- **Classification**: Deprecated Legacy Hash Function (Cryptographically Broken).
- **Standards**: RFC 1321 (Historical).
- **Digest Size**: 128 bits (16 bytes), represented as a 32-character hexadecimal string.
- **Educational Context**: Included strictly for collision vulnerability demonstrations. Displays explicit security warnings highlighting practical collision attacks and why it must not be used in production.

### 6. DES-CBC (Data Encryption Standard — Legacy & Educational)
- **Classification**: Deprecated Symmetric Feistel Cipher (Cryptographically Broken).
- **Standards**: FIPS 46-3 (Withdrawn by NIST in 2005).
- **Key Size**: 56-bit effective key length derived from an 8-character input.
- **Mode & Padding**: Cipher Block Chaining (CBC) with PKCS#7 padding and fresh 8-byte IV (`os.urandom(8)`).
- **Educational Context**: Demonstrates the absence of authentication (`is_authenticated=False`). Ciphertext tampering silently corrupts decrypted plaintext without error, contrasting sharply with AES-GCM's AEAD guarantees.

---

### Algorithm Comparison Matrix

| Algorithm | Category | Security Level | Key / Block Size | Primary Use Case | Server Secret Storage |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **AES-256-GCM** | Symmetric AEAD | 🛡️ High (Standard) | 256-bit / 128-bit | Confidential payload & binary file protection | None (RAM-only) |
| **RSA-OAEP** | Asymmetric Encryption | 🛡️ High (Standard) | 2048 / 3072-bit | Small payload encryption & key transport | None (RAM-only) |
| **RSA-PSS** | Digital Signatures | 🛡️ High (Standard) | 2048 / 3072-bit | Tamper-proof digital signatures & non-repudiation | None (RAM-only) |
| **Diffie-Hellman** | Key Agreement | 🛡️ High (Standard) | 2048-bit MODP | Secret derivation over insecure channels | None (RAM-only) |
| **SHA-256** | Cryptographic Hash | 🛡️ High (Standard) | 256-bit digest | Data integrity & fingerprinting | None (RAM-only) |
| **MD5** | Legacy Hash | ⚠️ Broken | 128-bit digest | Historical collision analysis | None (RAM-only) |
| **DES-CBC** | Legacy Symmetric | ⚠️ Deprecated | 56-bit key / 64-bit block | Feistel cipher design study | None (RAM-only) |

---

## 🛠️ Technology Stack

### Frontend Architecture
- **Framework**: [React 19.2+](https://react.dev/) Single Page Application
- **Build Tool & Dev Server**: [Vite 8.3+](https://vitejs.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with `@tailwindcss/vite`
- **Routing**: [React Router v7](https://reactrouter.com/) with declarative route guards
- **Icons**: [Lucide React](https://lucide.dev/) (v1.55+)
- **Data Visualization**: [Recharts](https://recharts.org/) (v3.10+) for execution duration telemetry
- **PDF Generation**: [jsPDF](https://github.com/parallax/jsPDF) (v4.2+) for client-side audit exports
- **Linting & Code Quality**: [oxlint](https://oxc.rs/) (v1.81+)

### Backend Architecture
- **API Framework**: [FastAPI 0.115+](https://fastapi.tiangolo.com/) (Asynchronous ASGI)
- **ASGI Server**: [Uvicorn 0.30+](https://www.uvicorn.org/)
- **Schema Validation**: [Pydantic v2.8+](https://docs.pydantic.dev/) & `pydantic-settings`
- **Database ORM**: [SQLAlchemy 2.0+](https://www.sqlalchemy.org/)
- **Database Driver**: [Psycopg 3.2+](https://www.psycopg.org/psycopg3/) (`psycopg[binary]`)
- **Database Migrations**: [Alembic 1.13+](https://alembic.sqlalchemy.org/)
- **Cryptographic Primitives**: [Cryptography (PyCA) 43.0+](https://cryptography.io/) & [PyCryptodome 3.20+](https://www.pycryptodome.org/)
- **Authentication**: [PyJWT 2.8+](https://pyjwt.readthedocs.io/) (HS256) & [Bcrypt 4.0+](https://github.com/pyca/bcrypt/)
- **Test Suite**: [pytest 9.1+](https://docs.pytest.org/) & `starlette.testclient`

### Database & Persistence
- **RDBMS**: [PostgreSQL 15 / 16+](https://www.postgresql.org/)
- **Persistence Scope**: Operation audit metadata (`operation_history`), verified user credentials (`users`), and short-lived OTP hashes (`email_otps`).

---

## 🏛️ System Architecture

### Architectural Topology

```mermaid
graph TB
    Client["Browser Client\n(React 19 + Tailwind v4 + Vite)"]

    subgraph FrontendApp ["Frontend Application (Port 5173)"]
        UI["Responsive Workbenches\nAES · RSA · DH · SHA · MD5 · DES"]
        APIClient["services/api.js\nNative Fetch + Bearer JWT"]
        PDF["utils/historyPdfGenerator.js\njsPDF (Client-Side Only)"]
        AuthContext["context/AuthContext.jsx\nSession & Token Management"]
    end

    subgraph DevProxy ["Vite Development Proxy"]
        ViteRoute["/api/* → http://127.0.0.1:8000"]
    end

    subgraph BackendApp ["FastAPI Backend (Port 8000)"]
        Router["app/api/router.py\nAPIRouter Engine"]
        
        subgraph Endpoints ["API Endpoints"]
            EP_Health["health.py\nGET /api/health\nGET /api/health/database"]
            EP_Auth["auth.py\nPOST /api/auth/*"]
            EP_Crypto["aes.py · rsa.py · diffie_hellman.py\nsha256.py · md5.py · des.py"]
            EP_History["history.py\nGET/DELETE /api/history"]
        end

        subgraph CryptoServices ["In-Memory Cryptography Services"]
            S_AES["aes_service.py\nScrypt KDF + AES-256-GCM"]
            S_RSA["rsa_service.py\nRSA-OAEP + RSA-PSS"]
            S_DH["diffie_hellman_service.py\nMODP Group 14 + HKDF"]
            S_Hash["sha256_service.py · md5_service.py\nStream Hashing & Avalanche"]
            S_DES["des_service.py\nDES-CBC PKCS7 (Legacy)"]
            S_Audit["history_service.py\nZero-Secret Audit Dispatcher"]
        end

        subgraph DataLayer ["Data & Persistence Layer"]
            Models["SQLAlchemy 2.0 Models\nOperationHistory · User · EmailOTP"]
            Session["db/session.py\nConnection Pool (Psycopg 3)"]
        end
    end

    subgraph Database ["PostgreSQL (Port 5432)"]
        Tables["operation_history\nusers\nemail_otps"]
    end

    Client --> UI
    UI --> APIClient
    UI --> PDF
    UI --> AuthContext
    APIClient -->|/api/* Requests| ViteRoute
    ViteRoute --> Router
    Router --> Endpoints
    Endpoints --> CryptoServices
    CryptoServices --> S_Audit
    S_Audit --> Models
    Models --> Session
    Session --> Database
```

---

### Request / Response Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor User as User / Browser
    participant Page as React Workbench
    participant API as api.js Client
    participant FastAPI as FastAPI Router
    participant Service as Crypto Service (RAM)
    participant Audit as history_service.py
    participant DB as PostgreSQL

    User->>Page: Input plaintext & passphrase
    Page->>API: encryptAES(plaintext, passphrase)
    API->>FastAPI: POST /api/aes/encrypt {plaintext, passphrase}
    FastAPI->>FastAPI: Validate Pydantic schema
    FastAPI->>Service: encrypt_aes_256_gcm(plaintext, passphrase)
    Service->>Service: Generate salt (16B) & nonce (12B)
    Service->>Service: Derive 256-bit key via Scrypt
    Service->>Service: Compute AES-256-GCM ciphertext + 16B tag
    Service-->>FastAPI: Return Base64 payload {nonce, salt, ciphertext, tag}
    FastAPI->>Audit: record_audit_operation("AES-256-GCM", "encryption", "success", duration_ms)
    Audit->>DB: INSERT into operation_history (No secrets stored)
    DB-->>Audit: Confirm commit
    FastAPI-->>API: 200 OK JSON response
    API-->>Page: Update component state
    Page-->>User: Display ciphertext, tag, and telemetry
    Note over Service,FastAPI: Plaintext, keys, and passphrases discarded from RAM immediately
```

---

### Binary Container Specification (`SCENC01`)

For secure binary file encryption, SecureCipher wraps files in a custom container format with authenticated headers:

```
+-----------------------------------------------------------------------------------+
| Magic Header (8 Bytes)  | Header Length (4 Bytes) | Metadata JSON Block (Variable) |
| ASCII: "SCENC01\x00"     | Big-Endian uint32       | UTF-8 JSON: salt, nonce, file  |
+-----------------------------------------------------------------------------------+
| Ciphertext Body + AES-GCM Authentication Tag (16 Bytes appended at EOF)            |
+-----------------------------------------------------------------------------------+
```

- **Magic Identifier**: `b"SCENC01\x00"` guarantees file type integrity.
- **Associated Authenticated Data (AAD)**: The entire header slice `[0 : 12 + metadata_len]` is passed as AAD to the AES-GCM engine. Any byte-level alteration to the original filename, salt, nonce, or container version causes cryptographic tag verification to fail immediately.
- **Size Limit Enforcement**: Files are streamed and enforced up to 50 MB in 64 KB memory chunks, preventing memory denial-of-service.

---

## 📸 Visual Tour & Screenshots

Here is a visual overview of SecureCipher's interfaces:

### 1. Landing & Marketing Homepage
Overview of the cybersecurity suite, live status telemetry, and algorithm index:
![Home Page](images/Home%20page.png)

### 2. User Authentication
JWT session login with "Remember Me" credential persistence:
![Login Page](images/Login%20page.png)

### 3. Registration & Verification
Two-step account registration with email OTP verification and Demo OTP fallback support:
![Register Page](images/Register%20page.png)

### 4. Account & Profile Management
User credential updates, profile configuration, and security settings:
![Account Management](images/Account%20management.png)

### 5. AES-256-GCM Cryptographic Workbench
Interactive encryption, nonce generation, Scrypt derivation parameters, and ciphertext inspection:
![AES Working](images/AES%20working.png)

### 6. SHA-256 Integrity & Avalanche Analysis
Real-time hashing and avalanche bit-comparison analyzer:
![SHA Working](images/SHA%20working.png)

### 7. PostgreSQL Operation Audit History
Paginated operational history tracking execution durations without recording secrets:
![History](images/History.png)

### 8. Client-Side PDF Audit Report
Exported single-record audit sheet generated dynamically in-browser via jsPDF:
![Final Report](images/Final%20report.png)

---

## 📱 Mobile-Responsive Design

SecureCipher has been designed with responsive layouts across diverse screen sizes:

- **Mobile Phones (320px – 480px)**:
  - Header brand titles truncate safely to avoid overflow; actions collapse into vertical stacks.
  - Mobile hamburger toggle with a slide-out drawer featuring backdrop blur and touch targets ($\ge 40$px).
  - Multi-column data tables, JSON payloads, and algorithm benchmarks are wrapped in horizontally scrollable containers (`overflow-x-auto`) to prevent viewport clipping.
- **Tablets (481px – 1024px)**:
  - Responsive 2-column card layouts for cryptographic algorithms and security principles.
  - Fluid sidebar drawer navigation with tap-to-dismiss backdrop.
- **Desktops & Laptops (1024px – 1440px+)**:
  - Full-width expanded dashboard workbench with permanent navigation sidebar, live telemetry pills, and ambient glow effects.
- **Touch Optimization**:
  - Global `touch-action: manipulation;` applied across all buttons, inputs, and links to eliminate mobile double-tap zoom delay.
  - Root viewport enforcement (`max-width: 100vw; overflow-x: hidden;`) eliminates unwanted horizontal scrolling.

---

## 📂 Project Structure

```
SecureCipher/
├── .gitignore                      # Git exclusion rules
├── LICENSE                         # MIT License
├── PROJECT_REPORT.md               # Detailed academic project report
├── README.md                       # Comprehensive repository documentation
├── SECURITY_AUDIT_REPORT.md        # Security audit and threat modeling report
│
├── images/                         # Verified project screenshots
│   ├── Home page.png
│   ├── Login page.png
│   ├── Register page.png
│   ├── Account management.png
│   ├── AES working.png
│   ├── SHA working.png
│   ├── History.png
│   └── Final report.png
│
├── backend/                        # FastAPI Backend Application
│   ├── .env.example                # Safe environment configuration template
│   ├── alembic.ini                 # Alembic migration configuration
│   ├── pytest.ini                  # Pytest test suite configuration
│   ├── requirements.txt            # Python dependencies
│   ├── alembic/                    # Database migration versions
│   ├── app/
│   │   ├── main.py                 # FastAPI application, CORS, lifespan, global error handlers
│   │   ├── api/
│   │   │   ├── router.py           # Master API router
│   │   │   └── endpoints/          # Route handlers (auth, aes, rsa, dh, sha, md5, des, history)
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings & environment configuration
│   │   │   └── security.py         # Bcrypt, JWT encode/decode, and OTP cryptographic hashing
│   │   ├── db/
│   │   │   ├── init_db.py          # Database table initialisation
│   │   │   └── session.py          # SQLAlchemy 2.0 engine & session pool
│   │   ├── models/                 # SQLAlchemy ORM models (OperationHistory, User, EmailOTP)
│   │   ├── schemas/                # Pydantic v2 validation request/response schemas
│   │   └── services/               # Cryptographic in-memory execution engines
│   └── tests/                      # Pytest unit & integration test suites (15 test modules)
│
└── frontend/                       # React 19 + Vite Frontend Application
    ├── index.html                  # HTML entry point with viewport configuration
    ├── package.json                # Frontend dependencies and npm scripts
    ├── vercel.json                 # Vercel SPA rewrite deployment configuration
    ├── vite.config.js              # Vite plugins & backend development API proxy
    ├── public/
    │   ├── robots.txt              # Search engine crawling rules
    │   └── sitemap.xml             # Valid XML sitemap with public URLs
    └── src/
        ├── App.jsx                 # Application routing tree & route guards
        ├── index.css               # Tailwind CSS v4 design system & cyber styling
        ├── components/             # Reusable UI components (Navbar, Sidebar, Layout, etc.)
        ├── context/                # React context providers (AuthContext, NotificationContext)
        ├── pages/                  # Page views (Dashboard, History, Analytics, Workbenches)
        ├── services/
        │   └── api.js              # Centralized fetch API client with token management
        └── utils/
            └── historyPdfGenerator.js # jsPDF single-record and full-history generators
```

---

## ⚙️ Prerequisites

Before installing SecureCipher, ensure your system meets the following requirements:

| Tool | Minimum Version | Verification Command |
| :--- | :---: | :--- |
| **Python** | 3.11+ (Tested on 3.11 & 3.14) | `python --version` |
| **Node.js** | 18.0+ LTS (Tested on Node 20 / 22) | `node --version` |
| **npm** | 9.0+ | `npm --version` |
| **PostgreSQL** | 15.0+ (16 recommended) | `psql --version` |
| **Git** | Any recent version | `git --version` |

---

## 🚀 Installation and Local Setup (Windows PowerShell)

Follow these step-by-step instructions to set up and run SecureCipher locally.

### Step 1: Clone the Repository

Open Windows PowerShell and clone the project:

```powershell
git clone https://github.com/AjayKumarKR07/SecureCipher.git
cd SecureCipher
```

---

### Step 2: Backend Setup & Virtual Environment

1. Navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```

2. Create a Python virtual environment:
   ```powershell
   python -m venv venv
   ```

3. Activate the virtual environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   > *Note:* If PowerShell displays an execution policy error, enable script execution for the current user:
   > ```powershell
   > Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
   > ```

4. Install backend dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

---

### Step 3: PostgreSQL Database Configuration

1. Open `psql` using the `postgres` superuser:
   ```powershell
   psql -U postgres
   ```

2. Create the dedicated database and user:
   ```sql
   CREATE USER securecipher_user WITH PASSWORD 'YourStrongPasswordHere';
   CREATE DATABASE securecipher_db OWNER securecipher_user;
   GRANT ALL PRIVILEGES ON DATABASE securecipher_db TO securecipher_user;
   \q
   ```

---

### Step 4: Configure Backend Environment Variables

1. Copy the safe configuration template:
   ```powershell
   copy .env.example .env
   ```

2. Open `backend/.env` in your preferred editor (e.g., `notepad .env`) and configure:
   ```env
   PROJECT_NAME="SecureCipher"
   API_V1_STR="/api"
   PORT=8000
   HOST="127.0.0.1"
   ENVIRONMENT="development"

   # Allowed CORS origins
   CORS_ORIGINS="http://localhost:5173,http://127.0.0.1:5173"

   # PostgreSQL Connection (replace with your credentials)
   DATABASE_URL="postgresql+psycopg://securecipher_user:YourStrongPasswordHere@localhost:5432/securecipher_db"

   # JWT Secret Key (generate a secure random 32+ character string)
   JWT_SECRET_KEY="generate-at-least-32-random-bytes-for-production-signing"
   JWT_ALGORITHM="HS256"
   JWT_ACCESS_TOKEN_EXPIRE_MINUTES=1440

   # Demo Mode: set to true to test registration without configuring an SMTP email server
   DEMO_OTP_ENABLED=true
   ```

3. Initialize the database schema:
   ```powershell
   alembic upgrade head
   ```

---

### Step 5: Frontend Setup

Open a **separate Windows PowerShell terminal** and navigate to `frontend/`:

```powershell
cd C:\Users\ajayk\OneDrive\Desktop\CryptoShield-mini\frontend
npm install
```

---

## 🔐 Environment Variables and Configuration

All backend environment settings are declared using Pydantic Settings in `backend/app/core/config.py`. Refer to [`backend/.env.example`](backend/.env.example) for placeholder defaults.

| Environment Variable | Default Value | Required | Description |
| :--- | :--- | :---: | :--- |
| `PROJECT_NAME` | `"SecureCipher"` | No | Identifier displayed in API responses |
| `API_V1_STR` | `"/api"` | No | Prefix for all backend API endpoints |
| `PORT` | `8000` | No | Port on which the Uvicorn server listens |
| `HOST` | `"127.0.0.1"` | No | Host bind address for backend server |
| `ENVIRONMENT` | `"development"` | No | Environment tag (`development`, `staging`, `production`) |
| `CORS_ORIGINS` | `"http://localhost:5173,..."` | No | Comma-separated list of allowed frontend origins |
| `DATABASE_URL` | *(None)* | **Yes** | SQLAlchemy 2.0 format: `postgresql+psycopg://user:pass@host:port/db` |
| `JWT_SECRET_KEY` | *(Placeholder)* | **Yes** | HMAC signing secret (minimum 32 random characters) |
| `JWT_ALGORITHM` | `"HS256"` | No | JWT signing algorithm |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` | No | Token lifetime (1440 minutes = 24 hours) |
| `DEMO_OTP_ENABLED` | `false` | No | Enables local demo registration with in-app OTP display |
| `SMTP_HOST` | *(Optional)* | No | SMTP host for live registration verification emails |
| `SMTP_PORT` | `587` | No | SMTP port (typically 587 for TLS) |
| `SMTP_USER` | *(Optional)* | No | SMTP authentication username |
| `SMTP_PASSWORD` | *(Optional)* | No | SMTP authentication password / application token |
| `SMTP_TLS` | `true` | No | Enforce STARTTLS for outbound email dispatch |

> 🔒 **Security Notice:** Never commit `.env` containing genuine database passwords or production secrets to source control. The `.gitignore` file strictly excludes `.env`.

---

## 💻 Running the Application

### 1. Start the Backend Server

In your backend PowerShell terminal (with `venv` active):

```powershell
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- **Backend Health Check**: [http://127.0.0.1:8000/api/health](http://127.0.0.1:8000/api/health)
- **Interactive Swagger Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

### 2. Start the Frontend Development Server

In your frontend PowerShell terminal:

```powershell
npm run dev
```

- **Local Web Application**: [http://localhost:5173](http://localhost:5173)

---

## 📖 API Documentation and Endpoints

FastAPI automatically generates comprehensive OpenAPI documentation accessible at `http://127.0.0.1:8000/docs`.

### Primary Endpoints Reference

| Category | Method | Path | Authentication | Description |
| :--- | :---: | :--- | :---: | :--- |
| **Diagnostics** | `GET` | `/` | Public | Service discovery & operational metadata |
| **Diagnostics** | `GET` | `/api/health` | Public | Backend liveness status & timestamp check |
| **Diagnostics** | `GET` | `/api/health/database` | Public | PostgreSQL connection pool latency & status |
| **Algorithms** | `GET` | `/api/algorithms` | Public | Catalog of the 6 supported cryptographic modules |
| **Algorithms** | `GET` | `/api/algorithms/{id}` | Public | Detailed specifications & security parameters |
| **Authentication** | `POST` | `/api/auth/register/request-otp` | Public | Initiates registration & dispatches 6-digit OTP |
| **Authentication** | `POST` | `/api/auth/register/verify-otp` | Public | Validates OTP, creates account, & returns JWT (201) |
| **Authentication** | `POST` | `/api/auth/login` | Public | Authenticates credentials and returns JWT token |
| **Authentication** | `GET` | `/api/auth/me` | Bearer JWT | Retrieves authenticated profile & account metadata |
| **Authentication** | `PUT` | `/api/auth/profile` | Bearer JWT | Updates authenticated user display name |
| **Authentication** | `POST` | `/api/auth/change-password` | Bearer JWT | Validates current password & updates credentials |
| **AES-256-GCM** | `POST` | `/api/aes/encrypt` | Public | Encrypts text payload with fresh salt/nonce via Scrypt |
| **AES-256-GCM** | `POST` | `/api/aes/decrypt` | Public | Authenticates GCM tag & recovers original plaintext |
| **AES File Crypto** | `POST` | `/api/aes/encrypt-file` | Public | Multipart upload; outputs authenticated `.scipher` file |
| **AES File Crypto** | `POST` | `/api/aes/decrypt-file` | Public | Multipart upload; authenticates AAD & recovers binary file |
| **RSA-OAEP** | `POST` | `/api/rsa/generate-keys` | Public | Generates 2048/3072-bit RSA keypair in PKCS#8 PEM |
| **RSA-OAEP** | `POST` | `/api/rsa/encrypt` | Public | Encrypts payload with RSA public key using OAEP-SHA256 |
| **RSA-OAEP** | `POST` | `/api/rsa/decrypt` | Public | Decrypts payload with RSA private key |
| **Diffie-Hellman** | `POST` | `/api/diffie-hellman/generate-keypair` | Public | Generates party DH keypair (RFC 3526 MODP-2048) |
| **Diffie-Hellman** | `POST` | `/api/diffie-hellman/derive-secret` | Public | Computes shared secret and expands key via HKDF |
| **Diffie-Hellman** | `POST` | `/api/diffie-hellman/simulate-exchange` | Public | End-to-end Alice ↔ Bob key agreement simulation |
| **SHA-256** | `POST` | `/api/sha256/hash-text` | Public | Generates deterministic 256-bit hexadecimal digest |
| **SHA-256** | `POST` | `/api/sha256/hash-file` | Public | Streams uploaded binary file (64 KB chunks, max 50 MB) |
| **SHA-256** | `POST` | `/api/sha256/compare` | Public | Calculates Hamming distance & avalanche percentage |
| **MD5 (Legacy)** | `POST` | `/api/md5/hash-text` | Public | Generates 128-bit digest with deprecation notice |
| **DES (Legacy)** | `POST` | `/api/des/encrypt` | Public | Encrypts using 56-bit DES-CBC with PKCS#7 padding |
| **DES (Legacy)** | `POST` | `/api/des/decrypt` | Public | Decrypts DES-CBC ciphertext (unauthenticated) |
| **Audit History** | `GET` | `/api/history` | Public | Paginated audit trail query (limit 1–100) |
| **Audit History** | `DELETE`| `/api/history/{id}` | Public | Permanently removes an individual audit entry |
| **Audit History** | `DELETE`| `/api/history` | Public | Clears entire audit history table permanently |

---

## 🧪 Testing Instructions

SecureCipher includes automated unit, integration, and security test suites across both the backend and frontend.

### 1. Run Backend Pytest Suite

From the `backend/` directory (with virtual environment active):

```powershell
pytest
```

Run with detailed test execution output:

```powershell
pytest -v
```

#### Verified Test Suite Results:
- **Total Tests Collected**: 224 items across 15 test files
- **Execution Duration**: ~27.0 seconds
- **Status**: **224 Passed, 0 Failed, 100% Pass Rate**
- **Test Modules Covered**:
  - `test_aes.py`: AES-256-GCM round-trips, wrong passphrase rejection, GCM tag tampering detection, CSPRNG nonce uniqueness.
  - `test_aes_file.py`: Container integrity, AAD tampering detection, 0-byte files, Unicode filenames, 50 MB size limits.
  - `test_analytics.py`: Telemetry calculations, duration percentiles, algorithm usage aggregations.
  - `test_api.py`: Root discovery links and `/api/health` diagnostics.
  - `test_auth.py`: Registration, OTP rate limiting, JWT token expiry, bcrypt verification.
  - `test_database_url_normalization.py`: Psycopg 3 driver URL conversion and credential parsing.
  - `test_demo_otp.py`: Demo OTP issuance, verification, invalid code rejection, and replay prevention.
  - `test_des.py`: DES-CBC block alignments, key validations, and unauthenticated tamper responses.
  - `test_diffie_hellman.py`: RFC 3526 keypair generation, HKDF expansion, and Alice-Bob key agreement.
  - `test_md5.py`: RFC 1321 test vectors, streaming file hashing, and comparison modes.
  - `test_rsa.py`: 2048/3072-bit generation, OAEP padding boundaries, and key parsing.
  - `test_rsa_pss.py`: Digital signature generation, verification, and signature forgery rejection.
  - `test_security_audit.py`: Confirms zero secret leakage in the database audit log.
  - `test_security_hardening.py`: Path traversal sanitation, input limits, and payload verification.
  - `test_sha256.py`: NIST test vectors, Hamming distance bit calculations, and avalanche behavior.

---

### 2. Run Frontend Test Suite

From the `frontend/` directory:

```powershell
npm test
```

#### Verified Frontend Results:
- **Runner**: Node.js native test runner (`node --test`)
- **Status**: **5 Passed, 0 Failed**
- **Tested Modules**: API base URL normalization, relative path resolution, and proxy routing.

---

### 3. Run Frontend Production Build

From the `frontend/` directory:

```powershell
npm run build
```

#### Verified Build Results:
```
vite v8.3.4 building client environment for production...
transforming...
✓ 2716 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                          1.14 kB │ gzip:   0.66 kB
dist/assets/index-DPuvUs0t.css         117.57 kB │ gzip:  16.27 kB
dist/assets/purify.es-Dn3VvdGh.js       28.01 kB │ gzip:  11.07 kB
dist/assets/index.es-D00kEFb1.js       151.38 kB │ gzip:  48.88 kB
dist/assets/html2canvas-DWb6itgR.js    199.45 kB │ gzip:  46.76 kB
dist/assets/index-TCPIab0q.js        1,634.40 kB │ gzip: 439.91 kB
✓ built in 1.47s
```
- **Exit Code**: 0 (Clean compilation, zero errors).

---

## 🌐 Deployment Information

### Frontend Deployment (Vercel)
- **Production URL**: [https://secure-cipher-omega.vercel.app/](https://secure-cipher-omega.vercel.app/)
- **Hosting Platform**: [Vercel](https://vercel.com/)
- **Configuration**: Handled by [`frontend/vercel.json`](frontend/vercel.json):
  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "rewrites": [
      { "source": "/api/:path*", "destination": "/api/:path*" },
      { "source": "/((?!api(?:/|$)).*)", "destination": "/index.html" }
    ]
  }
  ```
- **Environment Configuration**: Set `VITE_API_BASE_URL` in the Vercel project settings to route API requests to a hosted backend deployment.

### Backend Hosting Architecture
The FastAPI backend is designed for deployment on ASGI-compatible cloud container platforms:
- **Recommended Cloud Targets**: [Render](https://render.com/), [Railway](https://railway.app/), [AWS ECS / App Runner](https://aws.amazon.com/), or an [Ubuntu VPS](https://digitalocean.com/).
- **Production Execution Command**:
  ```bash
  uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 4
  ```
- **Managed Database**: Connect to a managed PostgreSQL cluster (e.g., Supabase, Neon, AWS RDS) by configuring the production `DATABASE_URL`.

---

## 🛡️ Security Considerations

### 1. In-Memory Execution & Zero Secret Retention
SecureCipher operates on a zero-persistence model for sensitive cryptographic inputs. Plaintext data, derived keys, symmetric secrets, and private keys exist only in process RAM during the execution of the cryptographic routine. The `history_service.py` module strictly extracts only duration, algorithm ID, operation name, and completion status before writing to PostgreSQL.

### 2. Authenticated Encryption vs. Legacy Ciphers
- **AES-256-GCM** provides authenticated encryption. Any alteration of the ciphertext or GCM authentication tag causes an immediate cryptographic failure, guaranteeing data integrity.
- **DES-CBC** is included exclusively for educational comparison. Because CBC mode provides no authentication tag, modified ciphertext decrypts to corrupted garbage without raising an error.

### 3. Password Hashing & Token Security
- User passwords are protected using **bcrypt** with a work factor of 12.
- Session tokens use **JSON Web Tokens (JWT)** signed via HMAC-SHA256 (`HS256`).
- OTP codes are hashed with HMAC-SHA256 prior to storage and expire within 5 minutes (enforcing a maximum of 5 attempts).

### 4. Educational Use Disclaimer
SecureCipher is developed for educational exploration, academic demonstration, and algorithmic study. While it uses production-grade cryptographic libraries (PyCA `cryptography`), deploying it as an end-to-end secret storage service requires terminating TLS/HTTPS at the reverse proxy layer to protect in-flight data.

---

## 🔮 Future Enhancements

- [ ] **WebCrypto Client-Side Execution**: Implement WebCrypto API support for browser-side cryptographic execution.
- [ ] **Post-Quantum Cryptography (PQC)**: Integrate NIST-selected post-quantum algorithms (ML-KEM / Kyber, ML-DSA / Dilithium) for quantum-resistant evaluation.
- [ ] **Role-Based Access Control (RBAC)**: Support multi-tenant organization workspaces and granular team audit management.
- [ ] **Hardware Security Key Integration**: Add WebAuthn / FIDO2 authentication for hardware token-based multi-factor logins.
- [ ] **Automated Key Lifecycle Rotation**: Provide automated scheduled key rotation for asymmetric key pairs.

---

## 📄 License and Author Information

### License
This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for complete details.

### Author
- **Developer**: **Ajay Kumar KR**
- **GitHub**: [@AjayKumarKR07](https://github.com/AjayKumarKR07)
- **Repository**: [https://github.com/AjayKumarKR07/SecureCipher](https://github.com/AjayKumarKR07/SecureCipher)
- **Live Demo**: [https://secure-cipher-omega.vercel.app/](https://secure-cipher-omega.vercel.app/)

---

*SecureCipher — Engineering Transparency, Privacy, and Hands-on Insight into Modern Cryptography.*
