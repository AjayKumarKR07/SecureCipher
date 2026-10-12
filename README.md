# SecureCipher – Multi-Algorithm Cryptography & Secure Data Protection System

> **College Mini-Project** | Initial Working Foundation (v0.1.0)  
> **GitHub Repository:** [https://github.com/AjayKumarKR07/SecureCipher](https://github.com/AjayKumarKR07/SecureCipher)

---

## 1. Project Overview

**SecureCipher** is a modern cybersecurity dashboard and cryptographic workbench designed to explore symmetric encryption, asymmetric key pairs, key agreement handshakes, and cryptographic hashing.

Built with a security-by-design architecture:
- **Zero Secret Persistence:** Plaintext messages, file payloads, passphrases, and encryption keys are strictly omitted from logs and database storage.
- **Audit Metadata Logging:** The system persists operational metrics (algorithm name, operation type, duration in milliseconds, status, timestamp) to PostgreSQL for audit analysis without exposing cryptographic secrets.
- **Educational & Comparative Focus:** Implements modern ciphers alongside legacy standards for cryptanalysis comparison:
  1. **AES (Advanced Encryption Standard):** 128, 192, and 256-bit symmetric block cipher (FIPS 197).
  2. **RSA (Rivest-Shamir-Adleman):** 2048 and 4096-bit asymmetric public-key cryptosystem.
  3. **Diffie-Hellman:** Asymmetric key agreement protocol for forward secrecy.
  4. **SHA-256:** 256-bit cryptographic one-way hash function (FIPS 180-4).
  5. **MD5 (Message Digest 5):** 128-bit legacy hash function for educational collision comparison.
  6. **DES (Data Encryption Standard):** 56-bit Feistel block cipher for historical key-space study.

---

## 2. Technology Stack

### Frontend
- **Framework:** React 19 / Vite
- **Language:** JavaScript (ES Modules)
- **Styling:** Tailwind CSS (Dark Navy & Purple/Blue cybersecurity theme)
- **Routing:** React Router v7
- **Icons:** Lucide React

### Backend
- **Framework:** FastAPI (Python 3.10+)
- **Server:** Uvicorn ASGI Server
- **ORM:** SQLAlchemy 2.x (Declarative Base)
- **Database Driver:** Psycopg 3 (`postgresql+psycopg`)
- **Settings:** Pydantic Settings & Python-Dotenv
- **Migrations:** Alembic

### Database
- **Engine:** PostgreSQL (local Windows instance on port 5432)
- **Target Database:** `securecipher_db`
- **Designated User:** `securecipher_user`

---

## 3. Project Structure

```text
SecureCipher/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AlgorithmCard.jsx
│   │   │   ├── Layout.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── StatusBadge.jsx
│   │   ├── pages/
│   │   │   ├── AboutPage.jsx
│   │   │   ├── AESPage.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DESPage.jsx
│   │   │   ├── DiffieHellmanPage.jsx
│   │   │   ├── HistoryPage.jsx
│   │   │   ├── MD5Page.jsx
│   │   │   ├── RSAPage.jsx
│   │   │   └── SHA256Page.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── alembic/
│   │   ├── versions/
│   │   │   └── 001_initial_operation_history.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── aes.py
│   │   │   │   ├── algorithms.py
│   │   │   │   ├── des.py
│   │   │   │   ├── diffie_hellman.py
│   │   │   │   ├── health.py
│   │   │   │   ├── history.py
│   │   │   │   ├── md5.py
│   │   │   │   ├── rsa.py
│   │   │   │   └── sha256.py
│   │   │   └── router.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── init_db.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── history.py
│   │   ├── schemas/
│   │   │   ├── aes.py
│   │   │   ├── algorithm.py
│   │   │   ├── des.py
│   │   │   ├── diffie_hellman.py
│   │   │   ├── health.py
│   │   │   ├── history.py
│   │   │   ├── md5.py
│   │   │   ├── rsa.py
│   │   │   └── sha256.py
│   │   ├── services/
│   │   │   ├── aes_service.py
│   │   │   ├── algorithm_service.py
│   │   │   ├── des_service.py
│   │   │   ├── diffie_hellman_service.py
│   │   │   ├── history_service.py
│   │   │   ├── md5_service.py
│   │   │   ├── rsa_service.py
│   │   │   └── sha256_service.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_aes.py
│   │   ├── test_api.py
│   │   ├── test_des.py
│   │   ├── test_diffie_hellman.py
│   │   ├── test_md5.py
│   │   ├── test_rsa.py
│   │   └── test_sha256.py
│   ├── .env.example
│   ├── alembic.ini
│   ├── pytest.ini
│   └── requirements.txt
├── .gitignore
├── LICENSE
└── README.md
```

---

## 4. Prerequisites

Before running the project, verify that the following tools are installed on your Windows machine:
- **Python:** 3.10 or higher (`python --version`)
- **Node.js & npm:** Node 18+ and npm 9+ (`node --version`, `npm --version`)
- **PostgreSQL:** Version 14 or higher running locally on port 5432 (`psql --version`)

---

## 5. PostgreSQL Database Setup (Windows)

1. Open **Command Prompt** or **PowerShell** and connect to PostgreSQL as administrator:
   ```powershell
   psql -U postgres
   ```
   *(Enter your master `postgres` password when prompted)*

2. Run the SQL commands to create the dedicated database user and database:
   ```sql
   -- Create dedicated application user
   CREATE USER securecipher_user WITH PASSWORD 'YourStrongPasswordHere';

   -- Create database owned by securecipher_user
   CREATE DATABASE securecipher_db OWNER securecipher_user;

   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE securecipher_db TO securecipher_user;
   ```

3. Exit `psql`:
   ```sql
   \q
   ```

---

## 6. Backend Installation and Startup

1. Open PowerShell and navigate to the `backend/` directory:
   ```powershell
   cd backend
   ```

2. Create a virtual environment and activate it:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Configure environment variables:
   Copy `.env.example` to `.env`:
   ```powershell
   Copy-Item .env.example .env
   ```
   Open `backend/.env` in your text editor and set your actual password:
   ```env
   DATABASE_URL="postgresql+psycopg://securecipher_user:YourStrongPasswordHere@localhost:5432/securecipher_db"
   ```

5. Initialize the database schema:
   ```powershell
   python -m app.db.init_db
   ```
   *Or run Alembic migrations:*
   ```powershell
   alembic upgrade head
   ```

6. Run automated test suite:
   ```powershell
   pytest
   ```

7. Start the FastAPI development server:
   ```powershell
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The interactive API documentation is available at:
   - **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 7. Frontend Installation and Startup

1. Open a new PowerShell terminal and navigate to the `frontend/` directory:
   ```powershell
   cd frontend
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Start the Vite development server:
   ```powershell
   npm run dev
   ```

4. Open your browser at:
   [http://127.0.0.1:5173](http://127.0.0.1:5173)

---

## 8. API Endpoints Reference

All API routes are mounted under the `/api` prefix:

| Method | Endpoint | Description | Status Codes |
|---|---|---|---|
| `GET` | `/` | Root service descriptor and navigation map | `200 OK` |
| `GET` | `/api/health` | Backend operational status and latency | `200 OK` |
| `GET` | `/api/health/database` | Live PostgreSQL connectivity check | `200 OK` (connected) / `503 Service Unavailable` |
| `GET` | `/api/algorithms` | Returns the 6 registered algorithms and metadata | `200 OK` |
| `GET` | `/api/algorithms/{id}` | Specification details for a single cipher | `200 OK` / `404 Not Found` |
| `GET` | `/api/history` | Returns recent operation metadata audit log | `200 OK` |
| `POST` | `/api/aes/encrypt` | Encrypts UTF-8 text using AES-256-GCM and Scrypt KDF | `200 OK` / `400 Bad Request` |
| `POST` | `/api/aes/decrypt` | Authenticates and decrypts AES-256-GCM ciphertext payload | `200 OK` / `400 Bad Request` |
| `POST` | `/api/rsa/generate-keys` | Generates RSA-2048 or RSA-3072 keypair in PEM PKCS#8 & SPKI | `200 OK` / `400 Bad Request` |
| `POST` | `/api/rsa/encrypt` | Encrypts UTF-8 payload with RSA public key using OAEP-SHA256 | `200 OK` / `400 Bad Request` |
| `POST` | `/api/rsa/decrypt` | Decrypts RSA ciphertext with private key and verifies OAEP-SHA256 | `200 OK` / `400 Bad Request` |
| `POST` | `/api/diffie-hellman/generate-keypair` | Generates independent DH keypair (RFC 3526 MODP Group 14, 2048-bit) | `200 OK` / `400 Bad Request` |
| `POST` | `/api/diffie-hellman/derive-secret` | Derives shared secret from peer public key and expands via HKDF-SHA256 | `200 OK` / `400 Bad Request` |
| `POST` | `/api/diffie-hellman/simulate-exchange` | Executes complete independent Alice & Bob agreement simulation | `200 OK` / `400 Bad Request` |
| `POST` | `/api/sha256/hash-text` | Computes 256-bit deterministic digest for UTF-8 text (NIST FIPS 180-4) | `200 OK` / `400 Bad Request` |
| `POST` | `/api/sha256/hash-file` | Chunk-streamed multipart file hashing with 50 MB limit and O(1) RAM | `200 OK` / `400 Bad Request` |
| `POST` | `/api/sha256/compare` | Analyzes integrity match, Hamming distance, and avalanche bit flip | `200 OK` / `400 Bad Request` |
| `POST` | `/api/md5/hash-text` | Computes 128-bit digest for UTF-8 text (RFC 1321 legacy demo) | `200 OK` / `400 Bad Request` |
| `POST` | `/api/md5/hash-file` | Chunk-streamed multipart file MD5 hashing with 50 MB limit | `200 OK` / `400 Bad Request` |
| `POST` | `/api/md5/compare` | Compares two inputs or verifies text against 32-hex MD5 checksum | `200 OK` / `400 Bad Request` |
| `POST` | `/api/des/encrypt` | Encrypts UTF-8 text with legacy DES-CBC, fresh 8-byte IV, and PKCS#7 | `200 OK` / `400 Bad Request` |
| `POST` | `/api/des/decrypt` | Decrypts DES-CBC ciphertext payload and warns of unauthenticated mode | `200 OK` / `400 Bad Request` |


---

## 9. Security & Architecture Considerations

1. **No Secret Persistence:**
   The `operation_history` table strictly consists of:
   - `id` (Integer Primary Key)
   - `algorithm_name` (String, e.g., "AES-256")
   - `operation_type` (String, e.g., "encryption")
   - `status` (String, e.g., "success")
   - `execution_duration_ms` (Float)
   - `created_at` (DateTime with timezone)
   No plaintexts, ciphers, or keys are ever persisted to disk.

2. **CORS Security:**
   The FastAPI backend only permits requests originating from authorized local frontend origins (`http://localhost:5173`, `http://127.0.0.1:5173`).

3. **Safe Diagnostics:**
   Database connection strings with passwords are automatically masked before any logging (`postgresql+psycopg://securecipher_user:******@localhost:5432/securecipher_db`). Raw database exceptions are trapped and sanitized so credentials are never sent to HTTP clients.

---

## 10. Troubleshooting

### Problem: PostgreSQL shows "Unconfigured" or "Disconnected"
- **Cause 1:** `backend/.env` has not been created.  
  *Fix:* Copy `backend/.env.example` to `backend/.env` and replace `your_password_here` with your local password.
- **Cause 2:** PostgreSQL service is stopped on Windows.  
  *Fix:* Run in PowerShell as administrator:  
  `Start-Service postgresql-x64-18` (replace with your installed version if different).
- **Cause 3:** Password mismatch or user doesn't exist.  
  *Fix:* Re-run the SQL user creation commands in Section 5.

### Problem: Port 8000 or Port 5173 is already in use
- **Fix:** Check running processes using `Get-NetTCPConnection -LocalPort 8000` or specify a custom port:  
  `uvicorn app.main:app --port 8001` (and update `frontend/vite.config.js` proxy accordingly).

---

## 11. Implementation Status & Roadmap

- **Phase 1 (Complete):** Core architecture, FastAPI routing, PostgreSQL telemetry schema, React 19 UI, and health monitoring.
- **Phase 2 (Complete):** Live cryptographic engine integration using Python `cryptography` and `pycryptodome`:
  - `AES-256-GCM` with Scrypt KDF and authentication tag validation.
  - `RSA-2048/3072` keypair generation, OAEP-SHA256 encryption, and private key decryption.
  - `Diffie-Hellman` key exchange (RFC 3526 MODP Group 14, 2048-bit) with HKDF-SHA256 key derivation.
  - `SHA-256` text hashing, chunked 50 MB file stream hashing, and integrity/avalanche comparison.
  - `MD5` text and file hashing with legacy collision vulnerability analysis.
  - `DES-CBC` Feistel cipher with fresh 8-byte IV generation, PKCS#7 padding, and DES vs AES comparative analysis.
- **Phase 3 (Future):** Extended streaming for files > 100 MB, downloadable PKCS#12 certificates, and PSS digital signatures.

---

## 12. Educational Scope, Trust Boundaries & Limitations

> **Academic & Mini-Project Disclaimer:**  
> SecureCipher is developed as an educational workbench and comparative demonstration system for undergraduate computer science / cybersecurity coursework. It is **not** intended or certified as a production-grade cryptographic framework or hardware security module (HSM) replacement.

1. **Diffie-Hellman Mutual Authentication Boundary:**
   - Raw Diffie-Hellman key agreement establishes a shared secret over an insecure channel but provides **no inherent identity authentication**.
   - In production environments (e.g., TLS 1.3, Signal Protocol), Diffie-Hellman exchange keys are signed with digital certificates (X.509) to prevent **Man-in-the-Middle (MITM)** attacks. The local educational workbench simulates two-party agreement in memory; production deployment would require an authenticated PKI infrastructure.

2. **Legacy Ciphers Deprecation & Tampering Risks:**
   - **MD5 (RFC 1321):** Severely broken by practical collision attacks ($< 2^{32}$ operations). Included strictly for legacy checksum matching and illustrating the avalanche effect compared to SHA-256. Must **never** be used for password hashing, SSL/TLS certificates, or digital signatures.
   - **DES (FIPS 46-3):** Obsolete Feistel cipher with a 56-bit effective key space ($2^{56} \approx 7.2 \times 10^{16}$ keys), vulnerable to brute-force recovery within hours. Furthermore, DES-CBC mode provides **zero cryptographic integrity or message authentication**, making it susceptible to bit-flipping attacks. Included solely for historical study and comparative cryptanalysis alongside modern AES.

3. **In-Memory Cryptographic Handling:**
   - All private keys, plaintexts, and derived secrets exist strictly in volatile server/client memory during operation execution.
   - PostgreSQL persistence is strictly limited to non-sensitive operational metadata (algorithm name, operation type, status, execution duration in milliseconds, and timestamp). No ciphertexts, passphrases, or keys are ever written to the database or logged to disk.
