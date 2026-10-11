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
│   │   │   │   ├── algorithms.py
│   │   │   │   ├── health.py
│   │   │   │   └── history.py
│   │   │   └── router.py
│   │   ├── core/
│   │   │   └── config.py
│   │   ├── db/
│   │   │   ├── init_db.py
│   │   │   └── session.py
│   │   ├── models/
│   │   │   └── history.py
│   │   ├── schemas/
│   │   │   ├── algorithm.py
│   │   │   ├── health.py
│   │   │   └── history.py
│   │   ├── services/
│   │   │   ├── algorithm_service.py
│   │   │   └── history_service.py
│   │   └── main.py
│   ├── tests/
│   │   └── test_api.py
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

## 11. Next Implementation Phase (Roadmap)

- **Phase 2:** Integrate Python cryptographic backends (`cryptography` / `pycryptodome`) for real-time encryption, decryption, key pair derivation, and file stream hashing.
- **Phase 3:** File drag-and-drop encryption (.enc files) and downloadable digital certificate validation.
