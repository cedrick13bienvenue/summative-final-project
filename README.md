[![CI](https://github.com/cedrick13bienvenue/summative-final-project/actions/workflows/test.yml/badge.svg)](https://github.com/cedrick13bienvenue/summative-final-project/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/cedrick13bienvenue/summative-final-project/badge.svg)](https://codecov.io/gh/cedrick13bienvenue/summative-final-project)
[![Last Commit](https://img.shields.io/github/last-commit/cedrick13bienvenue/summative-final-project)](https://github.com/cedrick13bienvenue/summative-final-project/commits/main)
[![Node](https://img.shields.io/badge/node-%3E%3D18-brightgreen?logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/github/package-json/dependency-version/cedrick13bienvenue/summative-final-project/dev/typescript?label=TypeScript&logo=typescript&logoColor=white&color=blue)](https://www.typescriptlang.org)
[![Express](https://img.shields.io/github/package-json/dependency-version/cedrick13bienvenue/summative-final-project/express?label=Express&logo=express&logoColor=white&color=black)](https://expressjs.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)](Dockerfile)
[![License](https://img.shields.io/github/license/cedrick13bienvenue/summative-final-project)](LICENSE)

# MedConnect Backend

A Digital Prescription & Patient Records System built with **Express.js**, **TypeScript**, and **PostgreSQL**. MedConnect enables doctors to create digital prescriptions with encrypted QR codes, pharmacists to scan and dispense them, and patients to receive everything by email — all through a secure, role-based REST API.

---

## Live Demo

| Resource | URL |
|----------|-----|
| API Base | https://medconnect-backend-ig4x.onrender.com/api/v1 |
| Swagger Docs | https://medconnect-backend-ig4x.onrender.com/api/v1/docs |
| QR Scanner | https://medconnect-backend-ig4x.onrender.com/qr-scanner.html |
| Health Check | https://medconnect-backend-ig4x.onrender.com/health |

> Hosted on Render free tier — the first request after a period of inactivity may take ~30 seconds to wake up.

**Demo credentials — try the full workflow without setting anything up:**

| Role | Email | Password | What you can do |
|------|-------|----------|-----------------|
| Admin | admin@medconnect.com | admin123!@# | Register doctors & pharmacists, manage users |
| Doctor | test@hospital.com | doctor123!@# | Create prescriptions, register patients |
| Pharmacist | test@pharmacy.com | pharma123!@# | Scan QR codes, validate & dispense prescriptions |

> **Patients** don't register themselves — a doctor creates their account during registration. Once created, the patient receives their login credentials by email and can log in to view their full prescription history, past medical visits, and dispensing records.

---

## Table of Contents

1. [How It Works](#how-it-works)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Local Setup](#local-setup)
5. [Project Structure](#project-structure)
6. [API Reference](#api-reference)
7. [Authentication & Security](#authentication--security)
8. [Rate Limiting](#rate-limiting)
9. [Email & Event System](#email--event-system)
10. [Testing](#testing)
11. [Available Scripts](#available-scripts)

---

## How It Works

MedConnect follows a strict clinical workflow across three roles:

### 1. Doctor creates a prescription

1. Doctor logs in and searches for a patient by name or national ID.
2. Opens or creates a medical visit for that patient.
3. Creates a prescription with one or more medications (name, dosage, frequency, quantity).
4. The system automatically:
   - Generates a unique prescription number (`RX-YYYYMMDD-XXXX`).
   - Encrypts the prescription data and creates a QR code linked to it.
   - Fires a background event that queues an email to the patient containing the QR code image and a reference number as fallback.
5. The doctor's API response is instant — email delivery happens asynchronously in the background.

### 2. Patient visits the pharmacy

The patient either:
- Shows the QR code on their phone/printout, or
- Gives the pharmacist their 16-digit national ID (Rwanda Indangamuntu) as a reference lookup fallback — no QR scanner needed.

### 3. Pharmacist dispenses

1. **Scan** — Pharmacist scans the QR code (or looks up by reference number). The system decrypts and displays the prescription details. Status changes to `SCANNED`.
2. **Validate** — Pharmacist reviews and confirms the prescription is legitimate. Status changes to `VALIDATED`.
3. **Dispense** — Pharmacist enters dispensing details per item (quantity dispensed, unit price, batch number, expiry date). Status changes to `DISPENSED` then `FULFILLED`.
4. At any step the pharmacist can **Reject** the prescription with a reason.

Every action (SCAN, VALIDATED, DISPENSED, FULFILLED, REJECTED) is recorded in `PharmacyLog` with full financial and insurance details.

### Prescription Status Flow

```
PENDING ──► SCANNED ──► VALIDATED ──► DISPENSED ──► FULFILLED
   │            │            │              │
   └──► CANCELLED └──► REJECTED ◄────────────┘
```

---

## System Architecture

```
Client (Postman / Browser / Mobile)
        │
        │ HTTPS + JWT
        ▼
┌─────────────────────────────────────────────────┐
│                  Express.js API                  │
│                                                  │
│  Routes ──► Middleware ──► Controllers           │
│                │                │                │
│          ┌─────┴─────┐    ┌─────┴──────┐        │
│          │ Auth (JWT) │    │  Services  │        │
│          │ Role check │    │  (logic)   │        │
│          │ Joi valid. │    └─────┬──────┘        │
│          │ Rate limit │          │                │
│          └───────────┘    ┌─────┴──────┐        │
│                           │   Models   │        │
│                           │ (Sequelize)│        │
│                           └─────┬──────┘        │
└─────────────────────────────────┼───────────────┘
                                  │ SQL
                                  ▼
                          ┌───────────────┐
                          │  PostgreSQL   │
                          └───────────────┘

Background (non-blocking):
EventService ──► EmailService ──► SMTP Server
  (queue)         (Nodemailer)
```

Every request goes through four middleware layers before reaching business logic:
1. **JWT authentication** — verifies the token and attaches the user to `req.user`
2. **Role-based access control** — checks the user's role against what the route requires
3. **Joi validation** — rejects malformed request bodies before any DB call
4. **Rate limiting** — enforces per-IP and per-user request caps

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js 18+ |
| Language | TypeScript 5.2 |
| Framework | Express.js 4 |
| Database | PostgreSQL 12+ |
| ORM | Sequelize 6 |
| Auth | JSON Web Tokens (jsonwebtoken) |
| Password hashing | bcryptjs |
| Validation | Joi 18 |
| QR codes | qrcode |
| Email | Nodemailer |
| API docs | Swagger / OpenAPI (swagger-jsdoc + swagger-ui-express) |
| Rate limiting | express-rate-limit |
| Testing | Jest 29 + ts-jest |

---

## Local Setup

### Prerequisites

- **Node.js 18+** — [download](https://nodejs.org)
- **PostgreSQL 12+** — [download](https://www.postgresql.org/download/)
- **npm** (comes with Node.js)

### Step 1 — Clone and install

```bash
git clone <repository-url>
cd summative-final-project
npm install
```

### Step 2 — Create the database

Open a PostgreSQL shell (or pgAdmin) and create the database:

```sql
CREATE DATABASE medconnect_db;
```

### Step 3 — Configure environment variables

Copy the example env file and fill in your values:

```bash
cp env.example .env
```

Open `.env` and edit:

```env
# ── Database ──────────────────────────────────────
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medconnect_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# ── Server ────────────────────────────────────────
PORT=3000
NODE_ENV=development

# ── JWT ───────────────────────────────────────────
# Use a long random string — generate one with:
#   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# ── QR Code Encryption ────────────────────────────
# Another long random string used to AES-256 encrypt QR data
QR_ENCRYPTION_KEY=your_qr_encryption_key_here

# ── Email (Gmail example) ─────────────────────────
# For Gmail: enable 2FA and create an App Password at
#   https://myaccount.google.com/apppasswords
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
EMAIL_FROM=your_email@gmail.com

```

> **No email account?** The app still works without SMTP configured — prescriptions are created and QR codes generated; email jobs will fail silently in the background queue with no effect on the API responses.

### Step 4 — Run database migrations and seed

```bash
# Create all tables
npm run db:migrate

# Seed the admin user (admin@medconnect.com / admin123!@#)
npm run db:seed
```

### Step 5 — Start the development server

```bash
npm run dev
```

The server starts at `http://localhost:3000`.

Visit `http://localhost:3000/api/v1/docs` for the interactive Swagger UI where you can try every endpoint directly in the browser.

### Verify it's running

```bash
curl http://localhost:3000/health
# → { "status": "ok", "timestamp": "..." }
```

---

## Project Structure

```
src/
├── controllers/          # HTTP layer — parse request, call service, send response
│   ├── authController.ts
│   ├── doctorController.ts
│   ├── patientController.ts
│   ├── pharmacistController.ts
│   └── pharmacyController.ts
│
├── services/             # Business logic — all database interaction lives here
│   ├── authService.ts        # register, login, logout, refresh, changePassword, resetPassword
│   ├── patientService.ts     # patient CRUD, medical visits, prescriptions
│   ├── doctorService.ts      # doctor CRUD, verification
│   ├── pharmacistService.ts  # pharmacist CRUD, verify/unverify
│   ├── pharmacyService.ts    # scan, lookup, validate, dispense, reject, history
│   ├── qrCodeService.ts      # generate, encrypt, verify, mark as used
│   ├── emailService.ts       # HTML email templates and SMTP delivery
│   ├── eventService.ts       # in-memory job queue, retry logic, background processing
│   └── otpService.ts         # OTP generation, verification (medical history & password reset)
│
├── models/               # Sequelize ORM models (11 tables)
│   ├── User.ts               # email, passwordHash, role, nationalId, isActive
│   ├── Patient.ts            # dateOfBirth, gender, insurance, allergies, conditions
│   ├── Doctor.ts             # licenseNumber, specialization, hospitalName, isVerified
│   ├── Pharmacist.ts         # licenseNumber, pharmacyName, pharmacyAddress, isVerified
│   ├── MedicalVisit.ts       # visitDate, visitType, chiefComplaint, diagnosis, notes
│   ├── Prescription.ts       # prescriptionNumber, status, diagnosis, QR hash
│   ├── PrescriptionItem.ts   # medicine details + dispensing fields
│   ├── QRCode.ts             # qrHash, encryptedData, expiresAt, scanCount, isUsed
│   ├── PharmacyLog.ts        # every pharmacy action with financial/insurance data
│   ├── TokenBlacklist.ts     # invalidated JWT tokens for secure logout
│   ├── OTPVerification.ts    # OTP codes for medical history access and password reset
│   └── index.ts              # exports all models with associations set up
│
├── middleware/           # Express middleware (applied before controllers)
│   ├── auth.ts               # authenticateToken, requireRole, requireVerified
│   ├── otpVerification.ts    # requireOTPVerification (for medical history)
│   ├── rateLimiter.ts        # role-based and endpoint-specific rate limits
│   └── validation.ts         # validate(), validateBody(), validateParams(), etc.
│
├── routes/               # Route definitions (wires middleware + controllers)
│   ├── auth.ts
│   ├── doctors.ts
│   ├── patients.ts
│   ├── pharmacists.ts
│   ├── pharmacy.ts
│   ├── qrCodes.ts
│   ├── events.ts
│   └── index.ts
│
├── validation/
│   └── schemas.ts        # All Joi schemas (register, login, prescription, dispensing, etc.)
│
├── types/                # TypeScript interfaces and type definitions
│   ├── auth.ts
│   ├── patient.ts
│   ├── doctor.ts
│   ├── pharmacist.ts
│   └── common.ts
│
├── utils/
│   └── tokenCleanup.ts   # Scheduled cleanup of expired JWT blacklist entries
│
├── swagger/              # OpenAPI spec files (auto-generated)
├── scripts/              # One-off scripts (migrate, seed, swagger gen)
└── server.ts             # App entry point
```

---

## API Reference

Base URL: `http://localhost:3000/api/v1`

For the full interactive reference with request/response schemas, visit the Swagger UI at `/api/v1/docs`.

### Authentication

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/login` | None | Login and receive JWT |
| POST | `/auth/logout` | JWT | Blacklist current token |
| POST | `/auth/refresh` | JWT | Get a new token |
| POST | `/auth/change-password` | JWT | Change own password |
| POST | `/auth/forgot-password` | None | Send password reset OTP by email |
| POST | `/auth/reset-password` | None | Reset password using OTP |

### Doctor Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/doctors/register` | Register a doctor (admin only) |
| GET | `/doctors` | List all doctors (admin only) |
| GET | `/doctors/:id` | Get doctor by ID |
| PUT | `/doctors/:id` | Update doctor profile |
| DELETE | `/doctors/:id` | Delete doctor (admin only) |
| GET | `/doctors/patients` | List all patients |
| POST | `/doctors/patients` | Create a patient |
| GET | `/doctors/patients/:id` | Get patient details |
| PUT | `/doctors/patients/:id` | Update patient |
| GET | `/doctors/patients/search` | Search patients by name |
| GET | `/doctors/patients/lookup/:nationalId` | Lookup patient by national ID |
| POST | `/doctors/prescriptions` | Create prescription + auto-generate QR |
| GET | `/doctors/prescriptions` | List doctor's prescriptions |
| GET | `/doctors/prescriptions/:id` | Get single prescription |
| GET | `/doctors/medical-visits` | List all medical visits |
| POST | `/doctors/medical-visits` | Create medical visit |

### Patient Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/patients/profile` | Get own profile |
| PUT | `/patients/profile` | Update own profile |
| GET | `/patients/prescriptions` | Get own prescriptions |
| GET | `/patients/medical-history` | View medical history (OTP required) |
| POST | `/patients/generate-otp` | Request OTP for medical history access |

### Pharmacy Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pharmacy/scan` | Scan QR code → returns prescription details |
| POST | `/pharmacy/lookup` | Lookup by patient national ID (reference fallback) |
| POST | `/pharmacy/validate/:id` | Validate a scanned prescription |
| POST | `/pharmacy/dispense/:id` | Dispense with item-level details |
| POST | `/pharmacy/reject/:id` | Reject prescription with reason |
| GET | `/pharmacy/history` | View own dispensing history |
| GET | `/pharmacy/prescription/:id/logs` | View all logs for a prescription |
| GET | `/pharmacy/qr-status/:hash` | Check QR code scan status |

### Admin — Pharmacist Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/pharmacists/register` | Register a pharmacist |
| GET | `/pharmacists` | List all pharmacists |
| GET | `/pharmacists/:id` | Get pharmacist by ID |
| PUT | `/pharmacists/:id` | Update pharmacist |
| DELETE | `/pharmacists/:id` | Delete pharmacist |
| POST | `/pharmacists/:id/verify` | Verify pharmacist (allows dispensing) |
| POST | `/pharmacists/:id/unverify` | Revoke verification |

### QR Code & Event Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/qr-codes` | List all QR codes (admin) |
| GET | `/qr-codes/:prescriptionId` | Get QR code for prescription |
| POST | `/qr-codes/email/:prescriptionId` | Manually trigger prescription email |
| GET | `/events/email-queue/status` | Get email queue health and stats |
| POST | `/events/email-queue/clear-completed` | Purge completed jobs |
| POST | `/events/test` | Emit a test event |

---

## Authentication & Security

### JWT Flow

1. Client calls `POST /auth/login` → receives a JWT (default 24h expiry).
2. Every subsequent request includes `Authorization: Bearer <token>`.
3. `authenticateToken` middleware verifies the token and checks it is not blacklisted.
4. `requireRole('doctor')` middleware checks `req.user.role` before sensitive routes.
5. On logout, the token is stored in `TokenBlacklist` — all future requests with that token return 401.

### Password Security

Passwords are hashed with **bcryptjs** (12 salt rounds) via a Sequelize `beforeCreate`/`beforeUpdate` hook on the `User` model. Plain text passwords are never stored.

### QR Code Encryption

QR code data (prescription ID, patient details, medications) is encrypted with **AES-256-CBC** before being stored in the database and embedded in the QR image. Decryption happens server-side on every scan — the client never receives the raw key.

### OTP Verification

Sensitive operations (viewing medical history, resetting password) require a time-limited OTP sent to the patient's registered email. OTPs expire after a configurable window and are single-use.

---

## Rate Limiting

All endpoints are protected by layered rate limits using `express-rate-limit`.

### Global limits (all endpoints)

| Limit | Window |
|---|---|
| 100 requests per IP | 15 minutes |

### Authentication endpoints

| Endpoint | Limit | Window |
|---|---|---|
| Login | 5 attempts | 15 minutes |
| Registration | 3 attempts | 1 hour |
| Password reset | 3 attempts | 1 hour |
| OTP requests | 3 attempts | 5 minutes |

### Role-based limits (authenticated users)

| Role | Limit | Window |
|---|---|---|
| Admin | 100 requests | 1 minute |
| Doctor | 50 requests | 1 minute |
| Pharmacist | 30 requests | 1 minute |
| Patient | 20 requests | 1 minute |
| Anonymous | 10 requests | 1 minute |

When a limit is exceeded the API returns:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests, please try again later.",
    "statusCode": 429,
    "type": "RATE_LIMIT_EXCEEDED"
  }
}
```

---

## Email & Event System

Email delivery is **fully decoupled** from the request/response cycle using an in-memory job queue inside `EventService` (a singleton extending Node.js `EventEmitter`).

### How it works

```
POST /doctors/prescriptions
        │
        ▼
PatientService.createPrescription()
        │
        ├── saves prescription + QR code to DB
        │
        ├── eventService.emit('prescription.created', data)
        │       │
        │       └── [background] queuePrescriptionEmail()
        │               │
        │               ├── fetches prescription with all relations
        │               ├── builds EmailJob and pushes to queue
        │               └── processEmailQueue() fires asynchronously
        │                       │
        │                       └── EmailService.sendPrescriptionEmail()
        │                               │
        │                               └── Nodemailer → SMTP
        │
        └── returns 201 to the doctor immediately
            (email is in-flight, not blocking)
```

### Retry logic

- Each job has a `maxAttempts` of 3.
- On failure, the job is re-queued with a 5-second delay.
- After 3 failures, the job status becomes `failed`.
- If the event system itself throws, `PatientService` falls back to calling `EmailService` directly as a last resort.

### Email types

| Template | Trigger |
|---|---|
| Prescription notification | Prescription created — includes QR image and reference number |
| OTP verification | Patient requests medical history access |
| Password reset OTP | User requests password reset |

---

## Testing

The test suite has **789 tests across 58 test files** and enforces a minimum of **90% coverage** on every metric.

### Coverage results

| Metric | Result |
|---|---|
| Statements | 98.71% |
| Branches | 90.22% |
| Functions | 97.65% |
| Lines | 98.79% |

### How tests are structured

Every test is a **unit test** — all external dependencies (PostgreSQL, SMTP, QR generation) are replaced with `jest.mock()` fakes. No real database or network connection is needed to run the suite.

```
src/tests/
├── models/               # Tests for Sequelize model methods and hooks
│   ├── User-test.ts
│   ├── User-extended-test.ts
│   ├── Patient-test.ts
│   ├── Doctor-test.ts
│   ├── Pharmacist-test.ts
│   ├── MedicalVisit-test.ts
│   ├── Prescription-test.ts
│   ├── QRCode-test.ts
│   ├── PharmacyLog-test.ts
│   ├── OTPVerification-test.ts
│   ├── OTPVerification-static-test.ts
│   ├── TokenBlacklist-test.ts
│   ├── TokenBlacklist-static-test.ts
│   └── models-extended-test.ts
│
├── services/             # Tests for all business logic with mocked DB calls
│   ├── authService-test.ts / authService-unit-test.ts / authService-extended-test.ts
│   ├── patientService-test.ts / extended / extended2
│   ├── doctorService-test.ts / extended
│   ├── pharmacistService-test.ts / extended
│   ├── pharmacyService-test.ts / extended / extended2 / extended3 / extended4
│   ├── qrCodeService-test.ts / extended / extended2
│   ├── emailService-test.ts
│   ├── eventService-test.ts / extended / extended2
│   └── otpService-test.ts / extended
│
├── controllers/          # Tests for HTTP layer (mocked services, real Express routing)
│   ├── authController-test.ts / extended
│   ├── patientController-test.ts / extended
│   ├── doctorController-test.ts / extended / extended2
│   ├── pharmacistController-test.ts / extended / extended2
│   └── pharmacyController-test.ts / extended
│
├── middleware/           # Tests for auth, OTP, rate limiting, validation middleware
│   ├── auth-test.ts
│   ├── otpVerification-test.ts
│   ├── rateLimiter-test.ts / extended2
│   └── validation-test.ts
│
├── validation/
│   └── schemas-test.ts   # Joi schema tests for all request shapes
│
├── types/
│   └── types-test.ts
│
├── utils/
│   └── tokenCleanup-test.ts
│
└── setup.ts              # Global: silences console output, loads test env vars
```

### Running tests

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Watch mode (reruns on file save)
npm run test:watch

# Run a specific file
npm test -- --testPathPattern="authService"

# Run a whole group
npm test -- --testPathPattern="services"
npm test -- --testPathPattern="controllers"
npm test -- --testPathPattern="models"
npm test -- --testPathPattern="middleware"
```

After running `npm run test:coverage`, open `coverage/index.html` in your browser for a line-by-line breakdown of exactly which code is covered.

### Coverage thresholds

Jest is configured to **fail the test run** if any metric drops below 90% (see `jest.config.ts`):

```
Statements ≥ 90%   Branches ≥ 90%   Functions ≥ 90%   Lines ≥ 90%
```

---

## Available Scripts

### Development

```bash
npm run dev              # Start server with hot reload (nodemon)
npm run build            # Compile TypeScript → dist/
npm run build:dev        # Compile without prod optimizations
```

### Database

```bash
npm run db:migrate           # Apply all pending migrations
npm run db:migrate:undo      # Roll back the last migration
npm run db:seed              # Seed admin user
npm run db:seed:undo         # Remove all seeded data
npm run db:reset             # Drop → create → migrate (keeps seed data)
npm run db:fresh             # Drop → create → migrate → seed (full reset)
```

### Testing

```bash
npm test                 # Run all tests
npm run test:coverage    # Run tests + generate coverage report
npm run test:watch       # Watch mode
npm run test:ci          # CI mode (no watch, outputs coverage)
```

### Code quality

```bash
npm run lint             # Run ESLint
npm run lint:fix         # Auto-fix ESLint issues
```

### Production

```bash
npm run deploy           # build + db:deploy + start
npm start                # Start compiled server (requires npm run build first)
npm run cleanup-tokens   # Remove expired JWT blacklist entries from DB
```

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Write your code and add tests for it
4. Make sure all tests pass and coverage stays above 90% (`npm run test:coverage`)
5. Submit a pull request

---

## License

MIT — see [LICENSE](LICENSE) for details.
