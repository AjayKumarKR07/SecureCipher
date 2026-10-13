<div align="center">

# SecureCipher

### Multi-Algorithm Cryptography & Secure Data Protection System

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=flat-square&logo=python)](https://www.python.org/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=flat-square&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](./LICENSE)

>
> A full-stack cryptographic workbench with interactive algorithm demonstrations,
> authenticated user management, PostgreSQL audit telemetry, and professional PDF reporting.

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Feature Highlights](#2-feature-highlights)
3. [Cryptographic Algorithms](#3-cryptographic-algorithms)
4. [Technology Stack](#4-technology-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [Project Structure](#6-project-structure)
7. [Prerequisites](#7-prerequisites)
8. [Database Setup](#8-database-setup)
9. [Backend Setup](#9-backend-setup)
10. [Frontend Setup](#10-frontend-setup)
11. [Environment Variables](#11-environment-variables)
12. [API Reference](#12-api-reference)
13. [Authentication System](#13-authentication-system)
14. [Audit History and PDF Reports](#14-audit-history-and-pdf-reports)
15. [Security Architecture](#15-security-architecture)
16. [Testing](#16-testing)
17. [Troubleshooting](#17-troubleshooting)
18. [Roadmap](#18-roadmap)
19. [Disclaimer](#19-disclaimer)
20. [Academic & Technical Project Report (IEEE/Viva Format)](./PROJECT_REPORT.md)

---

## 1. Project Overview

**SecureCipher** is a premium cybersecurity dashboard and interactive cryptographic workbench that demonstrates six industry-standard and legacy cryptographic primitives. It is built with a security-by-design philosophy:

- **Zero Secret Persistence** — Plaintexts, passphrases, private keys, and ciphertexts are never written to any database or log file. Only operational metadata (algorithm, status, duration) is persisted.
- **JWT-Authenticated Sessions** — All protected routes require a signed JWT bearer token. Passwords are hashed with `bcrypt` and never stored in plaintext.
- **OTP Email Verification** — New accounts require one-time password email confirmation before activation.
- **PostgreSQL Audit Telemetry** — Every cryptographic operation records timing and status metadata for review in the full-featured Operation Audit History.
- **Professional PDF Reporting** — Downloadable A4 PDF reports for individual operations and the complete audit log, generated client-side with `jsPDF`.

---

## 2. Feature Highlights

### Authentication and User Management

| Feature | Detail |
| --- | --- |
| **User Registration** | Full name, email, password with OTP email verification flow |
| **Login** | JWT Bearer token authentication with optional remember-me persistence |
| **Password Change** | Current password verification, live strength meter, bcrypt re-hashing |
| **Profile Settings** | Editable display name, verified email badge, member ID, security overview |
| **Notification Center** | Activity feed with unread badge, mark-as-read, and preference toggles |
| **Public Route Guard** | Authenticated users are automatically redirected from `/login` and `/register` to the dashboard |

### Cryptographic Workbenches

- Six fully interactive workbenches: AES-256-GCM, RSA-OAEP, Diffie-Hellman, SHA-256, MD5, DES-CBC
- Real-time execution duration measurement (milliseconds)
- Inline operation result panels with copy-to-clipboard
- Zero server-side secret storage

### Operation Audit History (`/history`)

- Full paginated table of all cryptographic operations
- Per-record actions: **View Details**, **Download PDF Report**, **Delete**
- Bulk **Download PDF Report** for the full audit log
- Filter, sort, and refresh controls
- All timestamps displayed in **IST (UTC+05:30)**

### PDF Report Generation

- Individual operation reports — academic A4 portrait format with header, algorithm specs, operation metadata, explanation, and security notes
- Full history report — A4 landscape table with all audit records, summary statistics, and generation timestamp

### Premium Home Page

- Dribbble-reference cybersecurity landing page design
- Dark forest-green and near-black backgrounds with neon-green accents
- Bento-grid algorithm cards with animated SVG decorations
- Interactive "How It Works" workflow tabs
- Live PostgreSQL audit trail preview

---

## 3. Cryptographic Algorithms

| # | Algorithm | Standard | Key Size | Mode | Purpose |
| --- | --- | --- | --- | --- | --- |
| 1 | **AES-256-GCM** | NIST FIPS 197 | 256-bit | GCM (AEAD) | Authenticated symmetric encryption with Scrypt KDF |
| 2 | **RSA-OAEP** | RFC 8017 | 2048 / 3072-bit | OAEP-SHA256 | Asymmetric public-key encryption and decryption |
| 3 | **Diffie-Hellman** | RFC 3526 | 2048-bit MODP | Group 14 + HKDF | Shared-secret key agreement handshake |
| 4 | **SHA-256** | NIST FIPS 180-4 | N/A | Merkle-Damgard | One-way cryptographic hash — text and file up to 50 MB |
| 5 | **MD5** | RFC 1321 | N/A | Merkle-Damgard | Legacy 128-bit digest for avalanche comparison ⚠️ |
| 6 | **DES-CBC** | FIPS 46-3 | 56-bit | CBC + PKCS#7 | Historical Feistel cipher for cryptanalysis study ⚠️ |

> ⚠️ MD5 and DES are included **for educational comparison only**. They are cryptographically broken and must never be used in production systems.

---

## 4. Technology Stack

### Frontend

| Technology | Version | Role |
| --- | --- | --- |
| React | 19 | Component-based UI framework |
| Vite | 6 | Build tool and HMR dev server |
| React Router | v7 | Client-side SPA routing |
| Tailwind CSS | 3 | Utility-first styling with dark cyber theme |
| Lucide React | latest | Icon library |
| jsPDF | 2.x | Client-side PDF generation |
| jsPDF-AutoTable | 3.x | Table rendering inside PDFs |

### Backend

| Technology | Version | Role |
| --- | --- | --- |
| FastAPI | 0.115 | ASGI REST API framework |
| Uvicorn | 0.32 | ASGI production server |
| SQLAlchemy | 2.x | ORM with declarative models |
| Alembic | 1.x | Database schema migrations |
| Psycopg | 3 | PostgreSQL async driver |
| Pydantic | 2.x | Request/response schema validation |
| Python-Jose | 3.x | JWT creation and verification |
| Passlib + bcrypt | 1.7 | Password hashing |
| Python Cryptography | 43+ | AES-GCM, RSA-OAEP, DH, SHA-256 |
| PyCryptodome | 3.x | DES-CBC, MD5 implementations |

### Database

| Item | Detail |
| --- | --- |
| Engine | PostgreSQL 14+ on localhost:5432 |
| Database | `securecipher_db` |
| User | `securecipher_user` |
| Tables | `operation_history`, `users`, `email_otps` |

---

## 5. Architecture Overview

```
+------------------------------------------------------------+
|                      BROWSER CLIENT                         |
|    React 19 + Vite SPA  (localhost:5173)                   |
|                                                             |
|    [Auth/JWT Context]    [Algorithm Workbenches]           |
|    [Audit History]       [PDF Reports via jsPDF]           |
+---------------------------|--------------------------------+
                            | HTTP / REST (JSON)
                            v
+------------------------------------------------------------+
|              FastAPI Backend  (localhost:8000)              |
|                                                             |
|    /api/auth       -- JWT login, OTP, bcrypt               |
|    /api/{cipher}   -- Crypto engines (6 algorithms)        |
|    /api/history    -- Audit telemetry CRUD                 |
|                                                             |
|    SQLAlchemy ORM  -->  Alembic migrations                 |
+---------------------------|--------------------------------+
                            | psycopg3 / TCP
                            v
+------------------------------------------------------------+
|            PostgreSQL 14+   (localhost:5432)                |
|    securecipher_db                                          |
|    |-- operation_history   (metadata only, no secrets)     |
|    |-- users               (bcrypt hashed passwords)       |
|    `-- email_otps          (expiring 6-digit OTP codes)    |
+------------------------------------------------------------+
```

---

## 6. Project Structure

```text
SecureCipher/
|-- frontend/
|   |-- src/
|   |   |-- components/
|   |   |   |-- HowItWorksSection.jsx     # Interactive workflow tab component
|   |   |   |-- Layout.jsx                # Page shell (Navbar vs Dashboard header)
|   |   |   |-- Navbar.jsx                # Workbench header with user dropdown
|   |   |   |-- Sidebar.jsx               # Algorithm and audit navigation
|   |   |   `-- StatusBadge.jsx           # Reusable status indicator pill
|   |   |-- context/
|   |   |   |-- AuthContext.jsx           # JWT session state, login, logout, OTP
|   |   |   |-- NotificationContext.jsx   # Notification feed and preferences
|   |   |   `-- ThemeContext.jsx          # Theme provider (always dark mode)
|   |   |-- pages/
|   |   |   |-- AboutPage.jsx             # Project info and tech credits
|   |   |   |-- AESPage.jsx               # AES-256-GCM encrypt/decrypt workbench
|   |   |   |-- Dashboard.jsx             # Premium home page with bento grid
|   |   |   |-- DESPage.jsx               # DES-CBC workbench (legacy study)
|   |   |   |-- DiffieHellmanPage.jsx     # Diffie-Hellman key agreement workbench
|   |   |   |-- HistoryPage.jsx           # Paginated audit history and PDF controls
|   |   |   |-- LoginPage.jsx             # JWT login page
|   |   |   |-- MD5Page.jsx               # MD5 hashing workbench (legacy study)
|   |   |   |-- ProfileSettingsPage.jsx   # Profile, password, notifications (3 tabs)
|   |   |   |-- RegisterPage.jsx          # OTP email verification registration
|   |   |   |-- RSAPage.jsx               # RSA-OAEP key gen, encrypt, decrypt
|   |   |   `-- SHA256Page.jsx            # SHA-256 text and file hash workbench
|   |   |-- services/
|   |   |   `-- api.js                    # All fetch wrappers (crypto, auth, history)
|   |   |-- utils/
|   |   |   `-- historyPdfGenerator.js    # jsPDF report builders (single + bulk)
|   |   |-- App.jsx                       # Routes + PublicRoute guard
|   |   |-- main.jsx
|   |   `-- index.css                     # Tailwind directives + custom animations
|   |-- index.html
|   |-- package.json
|   `-- vite.config.js
|
`-- backend/
    |-- alembic/
    |   |-- versions/
    |   |   |-- 001_initial_operation_history.py
    |   |   `-- 4013954a5376_add_users_and_email_otps.py
    |   `-- env.py
    |-- app/
    |   |-- api/
    |   |   |-- endpoints/
    |   |   |   |-- auth.py               # /api/auth/: register, login, profile, password
    |   |   |   |-- aes.py                # /api/aes/
    |   |   |   |-- algorithms.py         # /api/algorithms/
    |   |   |   |-- des.py                # /api/des/
    |   |   |   |-- diffie_hellman.py     # /api/diffie-hellman/
    |   |   |   |-- health.py             # /api/health, /api/health/database
    |   |   |   |-- history.py            # /api/history/
    |   |   |   |-- md5.py                # /api/md5/
    |   |   |   |-- rsa.py                # /api/rsa/
    |   |   |   `-- sha256.py             # /api/sha256/
    |   |   `-- router.py
    |   |-- core/
    |   |   |-- config.py                 # Pydantic settings loader
    |   |   `-- security.py               # JWT creation, bcrypt helpers
    |   |-- db/
    |   |   |-- init_db.py                # Table bootstrap (create_all)
    |   |   `-- session.py                # SQLAlchemy engine + session factory
    |   |-- models/
    |   |   |-- history.py                # OperationHistory ORM model
    |   |   `-- user.py                   # User + EmailOTP ORM models
    |   |-- schemas/
    |   |   |-- auth.py                   # RegisterRequest, LoginRequest, etc.
    |   |   |-- history.py                # HistoryItem, PaginatedHistory
    |   |   `-- *.py                      # Per-algorithm request/response schemas
    |   |-- services/
    |   |   |-- auth_service.py           # Registration, login, password, profile
    |   |   |-- email_service.py          # OTP email dispatch via SMTP
    |   |   |-- history_service.py        # Audit CRUD with pagination and filters
    |   |   `-- *.py                      # Per-algorithm cryptographic services
    |   `-- main.py                       # FastAPI app factory, CORS, routers
    |-- tests/
    |   |-- test_api.py                   # Health, history, algorithm integration tests
    |   |-- test_auth.py                  # Registration, login, password change tests
    |   |-- test_aes.py
    |   |-- test_des.py
    |   |-- test_diffie_hellman.py
    |   |-- test_md5.py
    |   |-- test_rsa.py
    |   `-- test_sha256.py
    |-- .env.example
    |-- alembic.ini
    |-- pytest.ini
    `-- requirements.txt
```

---

## 7. Prerequisites

| Tool | Minimum Version | Check Command |
| --- | --- | --- |
| Python | 3.10+ | `python --version` |
| Node.js | 18+ | `node --version` |
| npm | 9+ | `npm --version` |
| PostgreSQL | 14+ | `psql --version` |
| Git | any | `git --version` |

---

## 8. Database Setup

Connect to PostgreSQL as administrator:

```powershell
psql -U postgres
```

Run the following SQL:

```sql
-- Create dedicated application user
CREATE USER securecipher_user WITH PASSWORD 'YourStrongPasswordHere';

-- Create application database
CREATE DATABASE securecipher_db OWNER securecipher_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE securecipher_db TO securecipher_user;

\q
```

---

## 9. Backend Setup

```powershell
# 1. Navigate to backend
cd backend

# 2. Create and activate virtual environment
python -m venv venv
.\venv\Scripts\Activate.ps1

# 3. Install Python dependencies
pip install -r requirements.txt

# 4. Configure environment variables (see Section 11)
Copy-Item .env.example .env

# 5. Apply database migrations
alembic upgrade head

# 6. Run the test suite
pytest

# 7. Start the development server
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API documentation:

- **Swagger UI:** <http://127.0.0.1:8000/docs>
- **ReDoc:** <http://127.0.0.1:8000/redoc>

---

## 10. Frontend Setup

```powershell
# Open a separate terminal
cd frontend

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```

Open **<http://localhost:5173>** in your browser.

---

## 11. Environment Variables

Create `backend/.env` from `backend/.env.example`:

```env
# ── Database ──────────────────────────────────────────────────────
DATABASE_URL="postgresql+psycopg://securecipher_user:YourStrongPasswordHere@localhost:5432/securecipher_db"

# ── JWT ───────────────────────────────────────────────────────────
SECRET_KEY="your-secret-key-minimum-32-characters"
ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ── Email OTP (Gmail SMTP example) ────────────────────────────────
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="SecureCipher noreply@securecipher.local"

# ── App ───────────────────────────────────────────────────────────
APP_NAME="SecureCipher"
DEBUG=true
```

> **Gmail:** Generate an **App Password** at Google Account > Security > 2-Step Verification > App passwords. Do not use your main account password.

---

## 12. API Reference

All routes are prefixed with `/api`.

### Health

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Backend status and version |
| `GET` | `/api/health/database` | Live PostgreSQL connectivity check |

### Authentication

| Method | Endpoint | Auth Required | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register/request-otp` | No | Send 6-digit OTP to email for registration |
| `POST` | `/api/auth/register/verify-otp` | No | Verify OTP and create account |
| `POST` | `/api/auth/login` | No | Login and receive JWT access token |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user profile |
| `PUT` | `/api/auth/profile` | Bearer | Update display name |
| `POST` | `/api/auth/change-password` | Bearer | Change password with current password verification |
| `POST` | `/api/auth/logout` | Bearer | Invalidate session |

### Algorithms Metadata

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/algorithms` | List all 6 registered algorithm specs |
| `GET` | `/api/algorithms/{id}` | Single algorithm specification |

### AES-256-GCM

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/aes/encrypt` | Encrypt UTF-8 text (AES-256-GCM + Scrypt KDF) |
| `POST` | `/api/aes/decrypt` | Authenticate GCM tag and decrypt ciphertext |

### RSA-OAEP

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/rsa/generate-keys` | Generate RSA-2048 or RSA-3072 keypair (PEM PKCS#8 + SPKI) |
| `POST` | `/api/rsa/encrypt` | Encrypt with RSA public key (OAEP-SHA256) |
| `POST` | `/api/rsa/decrypt` | Decrypt with RSA private key |

### Diffie-Hellman

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/diffie-hellman/generate-keypair` | Generate DH keypair (RFC 3526 MODP Group 14, 2048-bit) |
| `POST` | `/api/diffie-hellman/derive-secret` | Derive shared secret from peer public key + HKDF-SHA256 |
| `POST` | `/api/diffie-hellman/simulate-exchange` | Full Alice and Bob key agreement simulation in-memory |

### SHA-256

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/sha256/hash-text` | Hash UTF-8 text (NIST FIPS 180-4) |
| `POST` | `/api/sha256/hash-file` | Chunk-stream hash file up to 50 MB |
| `POST` | `/api/sha256/compare` | Integrity check + Hamming distance + avalanche analysis |

### MD5

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/md5/hash-text` | 128-bit legacy MD5 digest |
| `POST` | `/api/md5/hash-file` | Chunk-streamed file MD5 (50 MB limit) |
| `POST` | `/api/md5/compare` | Compare two digests or verify text vs hex checksum |

### DES-CBC

| Method | Endpoint | Description |
| --- | --- | --- |
| `POST` | `/api/des/encrypt` | DES-CBC encrypt with fresh 8-byte IV and PKCS#7 padding |
| `POST` | `/api/des/decrypt` | DES-CBC decrypt (unauthenticated — educational only) |

### Audit History

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/history` | Paginated audit log (filterable by algorithm, status, date) |
| `GET` | `/api/history/{id}` | Single record detail |
| `DELETE` | `/api/history/{id}` | Delete a single audit record |

---

## 13. Authentication System

### Registration Flow

```
1. User submits registration form
2. POST /api/auth/register/request-otp
   --> SMTP sends 6-digit OTP to email (5 minute expiry)
3. User enters OTP code
4. POST /api/auth/register/verify-otp
   --> Account created, JWT returned
   --> Redirect to dashboard (/)
```

### Login Flow

```
1. User submits credentials
2. POST /api/auth/login
   --> bcrypt.verify(password, stored_hash)
   --> JWT signed with HS256 (configurable expiry)
   --> Token stored in localStorage or sessionStorage
3. All subsequent API requests send:
   Authorization: Bearer <token>
```

### Password Policy

All passwords must meet every requirement:

- Minimum **8 characters**
- At least one **uppercase** letter (A–Z)
- At least one **lowercase** letter (a–z)
- At least one **numeric digit** (0–9)
- At least one **special character** (e.g. `!@#$%^&*`)

### Route Guards

- **`PublicRoute`** — wraps `/login` and `/register`. Redirects authenticated users to `/`.
- **Backend dependency injection** — every auth-required endpoint validates the Bearer token via `Depends(get_current_user)`.

---

## 14. Audit History and PDF Reports

Every cryptographic operation appends a non-sensitive record to `operation_history`:

```sql
CREATE TABLE operation_history (
    id                    SERIAL PRIMARY KEY,
    algorithm_name        VARCHAR NOT NULL,   -- e.g. "AES-256-GCM"
    operation_type        VARCHAR NOT NULL,   -- e.g. "encryption"
    status                VARCHAR NOT NULL,   -- "success" | "failure"
    execution_duration_ms FLOAT,             -- wall-clock milliseconds
    created_at            TIMESTAMPTZ DEFAULT NOW()
);
```

> **No plaintexts, ciphertexts, keys, or passphrases are ever stored.**

### PDF Report Types

| Report | Page Format | Contents |
| --- | --- | --- |
| Single Operation | A4 Portrait | Header, algorithm specs, operation metadata, security explanation, IST timestamp |
| Full Audit Log | A4 Landscape | Summary statistics, complete paginated table, generation timestamp in IST |

All timestamps are rendered in **Indian Standard Time (IST, UTC+05:30)** using `Intl.DateTimeFormat`.

---

## 15. Security Architecture

### Data Storage Policy

| Data | Stored? | Location |
| --- | --- | --- |
| Algorithm name | Yes | `operation_history.algorithm_name` |
| Operation type | Yes | `operation_history.operation_type` |
| Status | Yes | `operation_history.status` |
| Execution duration | Yes | `operation_history.execution_duration_ms` |
| Timestamp | Yes | `operation_history.created_at` |
| Hashed password | Yes | `users.hashed_password` (bcrypt cost 12) |
| Plaintext input | **Never** | — |
| Ciphertext output | **Never** | — |
| Private keys | **Never** | — |
| Passphrases | **Never** | — |
| OTP codes | Deleted after use | Removed immediately on verification |

### CORS Policy

The FastAPI backend only accepts requests from:

- `http://localhost:5173`
- `http://127.0.0.1:5173`

### Credential Masking

Database URLs are masked in all server logs:

```
postgresql+psycopg://securecipher_user:******@localhost:5432/securecipher_db
```

### JWT Security

- Algorithm: `HS256`
- Configurable `SECRET_KEY` (minimum 32 characters recommended)
- Expiry enforced server-side on every protected endpoint
- Tokens stored in `localStorage` (remember me) or `sessionStorage` (session only)

---

## 16. Testing

```powershell
cd backend
.\venv\Scripts\Activate.ps1
pytest -v
```

**73 / 73 tests passing — 100% pass rate**

| Test File | Coverage |
| --- | --- |
| `test_api.py` | Health endpoints, history CRUD, pagination, filters |
| `test_auth.py` | Registration, login, password change, profile update |
| `test_aes.py` | AES-256-GCM encrypt/decrypt roundtrip, tamper detection |
| `test_rsa.py` | RSA-2048/3072 keygen, OAEP encrypt/decrypt |
| `test_diffie_hellman.py` | Keypair gen, shared secret derivation, full simulation |
| `test_sha256.py` | Text hash, file hash, comparison, avalanche analysis |
| `test_md5.py` | Text hash, file hash, comparison |
| `test_des.py` | DES-CBC encrypt/decrypt, IV freshness |

---

## 17. Troubleshooting

### PostgreSQL shows "Disconnected" or "Unconfigured"

- **`.env` not created:** Run `Copy-Item .env.example .env` and fill in `DATABASE_URL`
- **Service stopped:**

  ```powershell
  Start-Service postgresql-x64-17   # Replace with your installed version
  ```

- **Wrong credentials:** Re-run the SQL commands in Section 8

### Port already in use

```powershell
# Find process using port 8000
Get-NetTCPConnection -LocalPort 8000

# Start backend on an alternate port
uvicorn app.main:app --port 8001
```

Update `frontend/vite.config.js` proxy target to match the new port.

### OTP email not received

- Verify all `SMTP_*` values in `.env`
- For Gmail use an **App Password**, not your main account password
- Check your spam or junk mail folder
- With `DEBUG=true`, the OTP is also printed to backend terminal stdout

### Vite build errors after pulling

```powershell
cd frontend
npm install
npm run dev
```

### Alembic migration conflicts

```powershell
cd backend
alembic downgrade base
alembic upgrade head
```

---

## 18. Roadmap

| Phase | Status | Features |
| --- | --- | --- |
| Phase 1 | ✅ Complete | FastAPI + PostgreSQL foundation, React UI, health monitoring |
| Phase 2 | ✅ Complete | All 6 cryptographic engines, audit history, algorithm workbenches |
| Phase 3 | ✅ Complete | JWT authentication, OTP registration, profile and password management |
| Phase 4 | ✅ Complete | Premium home page redesign, login/register pages, PDF report generation |
| Phase 5 | ✅ Complete | Audit history per-record actions (view, download, delete), IST timestamps |
| Phase 6 | 🔜 Planned | File encryption over 100 MB streaming, PKCS#12 certificate export |
| Phase 7 | 🔜 Planned | RSA-PSS digital signatures, ECDSA, Ed25519 key pairs |
| Phase 8 | 🔜 Planned | Docker deployment, NGINX reverse proxy, HTTPS with self-signed certificate |

---

## 19. Disclaimer

> **Academic and Educational Use Only**

SecureCipher is developed as a college mini-project for undergraduate Computer Science / Cybersecurity coursework. It is **not** intended, audited, or certified as a production-grade cryptographic framework, security library, or hardware security module (HSM) replacement.

**Legacy Algorithm Warnings:**

- **MD5 (RFC 1321):** Practical collision attacks exist with fewer than 2^32 operations. Never use MD5 for password hashing, digital signatures, or SSL certificates.
- **DES (FIPS 46-3):** The 56-bit key space is fully exhaustible by modern brute-force within hours. DES-CBC provides no message authentication and is vulnerable to bit-flipping attacks. Included for historical study only.

**Diffie-Hellman Notice:** Raw DH key agreement establishes a shared secret but provides no identity authentication. Production deployments (TLS 1.3, Signal Protocol) sign DH keys with X.509 certificates to prevent Man-in-the-Middle attacks.

---

<div align="center">

**Built with love by [Ajay Kumar K R](https://github.com/AjayKumarKR07)**

React · FastAPI · PostgreSQL · Python Cryptography

</div>
