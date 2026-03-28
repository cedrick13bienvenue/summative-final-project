# SOFTWARE REQUIREMENTS SPECIFICATION
## MedConnect — Digital Prescription & Patient Records System

**Prepared by:** Cedrick Bienvenue
**Course:** Software Engineering
**Date:** January 23, 2026
**Version:** 2.0

---

## Revision History

| Name    | Date         | Reason For Changes                                              | Version |
|---------|--------------|-----------------------------------------------------------------|---------|
| Cedrick | Jan 23, 2026 | Initial SRS Draft including QR Security and NST2 alignment      | 1.0     |
| Cedrick | Mar 28, 2026 | Updated to reflect implemented system: Joi validation, 11-model ERD, full prescription lifecycle, National ID integration, OTP for medical history, token blacklist, rate limiting, corrected frontend scope | 2.0     |

---

## Table of Contents

1. Introduction
   - 1.1 Purpose
   - 1.2 Document Conventions
   - 1.3 Intended Audience and Reading Suggestions
   - 1.4 Product Scope
   - 1.5 References
2. Overall Description
   - 2.1 Product Perspective
   - 2.2 Product Functions
   - 2.3 User Classes and Characteristics
   - 2.4 Operating Environment
   - 2.5 Design and Implementation Constraints
   - 2.6 User Documentation
   - 2.7 Assumptions and Dependencies
3. External Interface Requirements
   - 3.1 User Interfaces
   - 3.2 Hardware Interfaces
   - 3.3 Software Interfaces
   - 3.4 Communications Interfaces
4. Requirement Specification
5. Other Nonfunctional Requirements
   - 5.1 Performance Requirements
   - 5.2 Safety Requirements
   - 5.3 Security Requirements
   - 5.4 Software Quality Attributes
   - 5.5 Business Rules
6. Appendix
   - Appendix A: Glossary
   - Appendix B: Analysis Models

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for the MedConnect platform. It defines the functional and non-functional requirements, system features, interfaces, and constraints of the system. The SRS covers the entire MedConnect system, with a focus on digitizing prescriptions in Rwandan public health facilities to replace manual workflows.

### 1.2 Document Conventions

- Functional requirements are labeled as **FR**.
- Non-functional requirements are labeled as **NFR**.
- Technical terms are defined in the glossary.
- Requirements are written in clear, measurable statements.

### 1.3 Intended Audience and Reading Suggestions

This document is intended for:

- Developers and software engineers
- Project managers
- System testers
- Healthcare stakeholders
- Documentation writers

### 1.4 Product Scope

MedConnect is a digital management system for healthcare prescriptions. It reduces medication errors, prevents fraud, and provides searchable clinical histories. While it currently prioritizes email-based delivery to comply with RURA ICT regulations, the architecture is prepared for future government-level API integrations. The primary benefit is the transition from paper-based forgery-prone slips to a secure digital "source of truth."

### 1.5 References

- Ministry of Health, Rwanda. (2024). *Digital Health Strategic Plan (2020–2025)*. Kigali: Government Publications.
- Rwanda Food and Drugs Authority. (2023). *Guidelines for Electronic Prescribing and Dispensing*.
- World Health Organization. (2023). *Global Strategy on Digital Health 2020–2025*. Geneva: WHO Press.

---

## 2. Overall Description

### 2.1 Product Perspective

MedConnect is a new, self-contained system targeted at public sector healthcare facilities. It replaces physical patient ledgers and manual prescription slips and is designed with standardized RESTful hooks for future interoperability with national platforms like e-Ubuzima. It is a targeted solution for the "last mile" of clinical workflows.

### 2.2 Product Functions

- **User Authentication & Session Management:** Secure login for all roles, JWT-based sessions with token blacklisting on logout.
- **Visit Logging:** Recording clinical symptoms, diagnosis, visit type, and treatment notes for every clinical encounter.
- **QR-Secured Prescribing:** Creation of tamper-proof prescriptions with unique encrypted QR code identifiers.
- **Prescription Lifecycle Management:** Full state tracking from creation through scan, validation, dispensing, and fulfillment or rejection.
- **Identity Management:** Linking medical records to Rwanda National ID (Indangamuntu, 16 digits) across all user personas.
- **National ID-Based Patient Lookup:** Cross-hospital patient lookup using the national ID, accessible to verified clinical staff.
- **Pharmacy Verification & Dispensing:** Real-time QR scanning, prescription validation, itemized dispensing with insurance and billing details, and rejection with documented reasons.
- **OTP-Based Security:** One-Time Password verification for patient medical history access and password reset operations.
- **Email Notification System:** Event-driven background email queue dispatching prescription details and system notifications.
- **Rate-Limited API Access:** Protection of all critical endpoints against abuse via configurable rate limiting.
- **Administrative Oversight:** Admin-controlled user management, pharmacist verification, system event monitoring, and email queue management.

### 2.3 User Classes and Characteristics

- **Doctors:** Require fast clinical entry and full access to patient visit history. Can register patients, create medical visits, write prescriptions, and generate QR codes.
- **Pharmacists:** Require QR scanning capabilities, prescription validation, and dispensing log management. Only verified pharmacists may dispense.
- **Administrators:** Manage system configuration, user roles, security audits, doctor and pharmacist accounts, and the email event queue.
- **Patients:** Receive digital prescription notifications via secure email; access their own medical history after OTP verification.

### 2.4 Operating Environment

MedConnect is a web-based REST API system.

- **Client side:** The primary clinical interface is consumed via REST API clients. A lightweight QR scanner interface (`qr-scanner.html`) operates in modern web browsers (Chrome, Edge) on desktop PCs and Android/iOS tablets at pharmacy counters.
- **Server side:** Hosted on cloud infrastructure (Node.js v18+ environment) with a PostgreSQL 15+ database.

The software will operate in a web-based environment accessible via standard workstations (Windows/Linux) and Android-based tablets within the facility network.

### 2.5 Design and Implementation Constraints

- **Telecommunications Policy:** In accordance with Rwanda Utilities Regulatory Authority (RURA) Regulation No 013/2021, automated SMS features are restricted until a formal Sender ID is registered. The initial release is constrained to secure Email and system UI as primary notification channels.
- **Technology Stack:** The system is built using TypeScript and Node.js, with PostgreSQL serving as the primary relational database and Sequelize as the ORM.
- **Validation:** All inbound API data is validated using **Joi** schema validation (v18+).
- **Programming Standards:** Developers follow the camelCase naming convention across all backend entities and database schemas.
- **Security Standards:** Implementation uses secure HTTPS communication protocols and incorporates Role-Based Access Control (RBAC) to protect sensitive patient clinical data. JWT tokens are used for session management with a token blacklist for immediate invalidation.
- **Language Requirements:** The entire user interface, error messaging, and system documentation is provided exclusively in English.
- **Identity Standard:** All patient and staff records must include a Rwanda National ID (Indangamuntu) — a 16-digit numeric identifier — as the primary cross-facility identity field.

### 2.6 User Documentation

The following user documentation components will be delivered with the MedConnect system:

- **Online Help Modules:** Integrated contextual help within the system interface providing step-by-step guidance.
- **System User Manual:** A comprehensive document detailing all system functionalities, user roles, and data entry standards.
- **API Reference (Swagger/OpenAPI):** Interactive API documentation accessible at `/api-docs`, auto-generated from inline JSDoc annotations using swagger-jsdoc v6.

### 2.7 Assumptions and Dependencies

**Assumptions:**

- **Staff Digital Literacy:** Clinical staff possess a baseline level of digital literacy and will undergo standard orientation.
- **Institutional Infrastructure:** Public health facilities have access to a consistent power supply or UPS systems.
- **Patient Email Access:** Patients (or their legal guardians) have access to a valid email address to receive digital prescriptions.
- **National ID Availability:** All patients have or will be issued a Rwanda National ID (Indangamuntu). Babies and minors may be registered under a guardian's national ID until their own is issued.
- **Data Accuracy:** Initial data migrated into the system is accurate and provided by facility administration.

**Dependencies:**

- **Internet Connectivity:** MedConnect depends on stable 4G/fiber internet for cloud synchronization and real-time status updates.
- **Regulatory Approvals:** Ongoing operations depend on maintaining compliance with the Rwanda Food and Drugs Authority (RFDA).
- **Third-Party SMTP Services:** The system depends on a reliable SMTP service provider (Nodemailer-compatible) for automated email dispatch.
- **RURA Licensing:** Future SMS/USSD expansion depends on securing a registered Sender ID and a non-objection certificate from RURA.

---

## 3. External Interface Requirements

### 3.1 User Interfaces

The MedConnect system features:

- **REST API Interface:** The primary interface for all clinical operations, consumed by frontend clients. Returns JSON responses following a standardized `{ success, message, data }` structure.
- **Swagger UI (API Documentation):** Accessible at `/api-docs`, provides an interactive browser-based interface for all API endpoints.
- **QR Scanner Web Page (`/qr-scanner.html`):** A standalone, browser-based pharmacy interface for scanning QR codes via device camera and performing National ID-based patient lookups. Displays prescription ID and QR hash in a monospace, copyable format.

**GUI Standards:** The QR scanner interface follows a minimalist, high-contrast style to ensure readability under various hospital lighting conditions.

**Error Handling:** Error messages are standardized to be non-technical for clinical staff (e.g., "Invalid National ID" rather than "Database Constraint Error") and are returned in structured JSON error responses.

### 3.2 Hardware Interfaces

- **Device Types:** Supports standard x86-based PCs, laptops, and ARM-based Android/iOS tablets.
- **Peripheral Support:** Supports device cameras (via browser API) for QR code scanning at pharmacy counters.
- **Communication Protocols:** Hardware interactions managed via standard TCP/IP for networked devices.

### 3.3 Software Interfaces

| Component        | Technology                     | Version  | Purpose                                                        |
|------------------|--------------------------------|----------|----------------------------------------------------------------|
| Runtime          | Node.js                        | v18+     | Server-side JavaScript execution                               |
| Language         | TypeScript                     | ^5.2.2   | Type-safe backend development                                  |
| Framework        | Express.js                     | ^4.18.2  | HTTP routing and middleware                                    |
| Database         | PostgreSQL                     | v15+     | Relational data persistence                                    |
| ORM              | Sequelize                      | ^6.35.0  | Object-relational mapping                                      |
| Validation       | Joi                            | ^18.0.1  | Runtime schema validation of inbound clinical data             |
| Authentication   | jsonwebtoken                   | ^9.0.2   | JWT-based session management                                   |
| Password Hashing | bcryptjs                       | ^2.4.3   | Secure password storage                                        |
| QR Generation    | qrcode                         | ^1.5.3   | Encrypted QR code image generation                             |
| Email            | Nodemailer                     | ^8.0.4   | Automated email dispatch via SMTP                              |
| Rate Limiting    | express-rate-limit             | ^8.1.0   | API abuse prevention                                           |
| API Docs         | swagger-jsdoc + swagger-ui-express | ^6.2.8 / ^5.0.1 | Interactive API documentation                    |
| ID Generation    | uuid                           | ^9.0.1   | UUID primary key generation                                    |

### 3.4 Communications Interfaces

- **HTTPS:** Secure browser-to-server communication for all API traffic.
- **SMTP:** Automated email delivery of prescriptions and OTP codes via Nodemailer.
- **JWT Tokens:** Stateless session management with blacklist enforcement on logout.

---

## 4. Requirement Specification

### Stakeholder Requirements Specification

#### Functional Requirements

| Req ID | Requirement                          | Description                                                                                                                                                           |
|--------|--------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| FR 1   | User Authentication                  | Authenticate all users (Doctor, Pharmacist, Admin, Patient) using email and secure password. Sessions are managed via JWT tokens.                                      |
| FR 2   | Session Revocation                   | Maintain a token blacklist to immediately invalidate sessions upon logout or suspected breach.                                                                         |
| FR 3   | Visit Entry                          | Capture symptoms, diagnosis, visit type (Consultation, Emergency, Follow-up), and treatment notes for every clinical encounter.                                        |
| FR 4   | Digital Prescription                 | Generate medical orders containing medication name, dosage, frequency, quantity, and dispensing instructions per prescription item.                                    |
| FR 5   | QR Code Generation                   | Generate a unique, encrypted QR code for every finalized prescription. The QR hash is stored and tracked with scan count and expiry.                                   |
| FR 6   | Prescription Lifecycle Management    | Track prescription status through the complete lifecycle: PENDING → SCANNED → VALIDATED → DISPENSED → FULFILLED, or REJECTED / CANCELLED at any point.                |
| FR 7   | Email Notification                   | Dispatch prescription details (medication, dosage, QR code) to patient email addresses via an event-driven background queue. Also send OTP and welcome emails.         |
| FR 8   | Pharmacy QR Scan & Verification      | Allow pharmacists to scan/verify prescriptions via the QR scanner web interface. Scan action is logged in the PharmacyLog with timestamp and pharmacist ID.            |
| FR 9   | Pharmacy Dispensing                  | Allow verified pharmacists to dispense prescription items with itemized quantities, unit prices, batch numbers, expiry dates, insurance details, and approval codes.   |
| FR 10  | Prescription Rejection               | Allow verified pharmacists to reject a prescription with a documented reason. Rejected prescriptions are immutable.                                                    |
| FR 11  | National ID Patient Lookup           | Allow clinical staff to look up a patient record by their 16-digit Rwanda National ID (Indangamuntu) for cross-hospital access.                                        |
| FR 12  | OTP Verification                     | Require a 6-digit One-Time Password for: (a) patient self-access to their own medical history, and (b) password reset operations.                                      |
| FR 13  | Pharmacist Management                | Allow admins to register, update, verify, unverify, and delete pharmacist accounts. Only verified pharmacists may dispense prescriptions.                              |
| FR 14  | Doctor Management                    | Allow admins to register, update, and delete doctor accounts. Doctors must have a valid license number and specialization.                                              |
| FR 15  | Patient Registration                 | Allow doctors and admins to register patients with full medical profile: demographics, allergies, existing conditions, insurance details, and emergency contacts.       |
| FR 16  | Rate-Limited API Access              | Apply configurable rate limits to all critical endpoints (auth: 5/15min, OTP: 3/5min, QR scan: per-pharmacist, registration: 3/hour, etc.) to prevent abuse.          |
| FR 17  | Pharmacy Dispensing History          | Allow pharmacists to retrieve the full dispensing history and financial summary for any prescription they have processed.                                              |
| FR 18  | Admin Event Queue Management         | Allow admins to view the status of the background email queue and clear completed jobs.                                                                                |

---

## 5. Other Nonfunctional Requirements

### 5.1 Performance Requirements

| Req ID | Type                | Description                                                                                                                                        |
|--------|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR 1  | Response Time       | The system shall verify QR codes and retrieve patient records in less than 1.0 second under normal network conditions.                             |
| NFR 2  | Throughput          | The platform shall support at least 100 concurrent medical professionals per facility without degradation in API responsiveness.                    |
| NFR 3  | Resource Utilization| The QR scanner web interface shall be optimized for standard hospital hardware (low-spec PCs and Android tablets).                                 |
| NFR 4  | Email Queue         | Prescription email delivery shall be processed asynchronously in the background so that the prescription creation API response is not delayed.     |

### 5.2 Safety Requirements

| Req ID | Type               | Description                                                                                                                                              |
|--------|--------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR 5  | Data Integrity     | Once a prescription reaches DISPENSED or FULFILLED status and a QR code is generated, the prescription record shall become immutable.                    |
| NFR 6  | Prescription Safety| All prescription items must include medication name, dosage, frequency, and quantity. The Rwanda FDA mandatory fields (brand/generic name, dosage strength, route) must be present. |
| NFR 7  | Failure Handling   | In the event of a network failure during an active visit, the system shall preserve draft state to prevent loss of clinical notes.                        |

### 5.3 Security Requirements

| Req ID | Type                   | Description                                                                                                                                                                    |
|--------|------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR 8  | Identity Authentication| All users authenticate via email and password. Sensitive operations (medical history access, password reset) require a 6-digit OTP sent to the user's verified email.          |
| NFR 9  | Role-Based Access      | RBAC enforces that only Doctors/Admins can create prescriptions, only verified Pharmacists can dispense, only Admins can manage staff accounts, and Patients access only their own data. |
| NFR 10 | Anti-Forgery           | Every prescription is tied to a unique encrypted QR hash. Pharmacists must scan this code to initiate verification. The QR code tracks scan count and expiry.                  |
| NFR 11 | Session Security       | JWT tokens are used for session management. A Token Blacklist table immediately invalidates sessions upon logout or suspected breach.                                           |
| NFR 12 | Input Validation       | All inbound API data is validated using Joi schemas before processing. Invalid requests are rejected with structured error messages at the API boundary.                        |
| NFR 13 | Rate Limiting          | Authentication: max 5 attempts per 15 minutes. OTP requests: max 3 per 5 minutes. Password reset: max 3 per hour. Registration: max 3 per hour. QR scan: pharmacist-level limits. |

### 5.4 Software Quality Attributes

| Req ID | Type              | Description                                                                                                                                              |
|--------|-------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------|
| NFR 14 | Availability      | The system shall maintain 99.5% uptime during standard hospital operating hours.                                                                         |
| NFR 15 | Auditability      | Every action — visit creation, prescription signing, QR scan, dispensing, rejection — must be logged in the PharmacyLog with a timestamp and the performing user's ID. |
| NFR 16 | Usability         | The interface shall prioritize "ease of use" to ensure staff with limited technical expertise can navigate clinical workflows with minimal clicks.          |
| NFR 17 | Interoperability  | The system architecture follows RESTful standards to allow future secure data exchange with national platforms like e-Ubuzima.                            |
| NFR 18 | Maintainability   | The TypeScript codebase follows camelCase conventions and a layered architecture (Routes → Controllers → Services → Models) for long-term maintainability.|

### 5.5 Business Rules

- **Prescriber Authorization:** Only users with a verified "Doctor" role and an active license number are authorized to create and finalize prescriptions.
- **Dispensing Authority:** Only users with a verified "Pharmacist" role and `isVerified = true` can update a prescription status to DISPENSED or FULFILLED.
- **Identification Rule:** A patient record cannot be created without a valid full name, date of birth, and gender. A 16-digit Rwanda National ID (Indangamuntu) is recorded on the linked User account for cross-facility lookup.
- **Prescription Statuses:** Valid prescription statuses are: `PENDING` → `SCANNED` → `VALIDATED` → `DISPENSED` → `FULFILLED`, or `REJECTED` / `CANCELLED` at any stage. There is no "Partially Dispensed" status; partial dispensing is handled via `dispensedQuantity` at the item level.
- **QR Code One-Time Use:** A QR code scan triggers a state change (PENDING → SCANNED) and is logged. QR codes have an expiry date and a scan count.
- **Regulatory Compliance:** All digital prescriptions must contain the mandatory fields required by the Rwanda Food and Drugs Authority (RFDA): brand/generic name, dosage strength, frequency, quantity, and route of administration.
- **Insurance Handling:** Insurance provider and insurance number are optional fields on the patient record. During dispensing, pharmacists may record insurance coverage, patient payment, insurance approval code, and insurer details per dispensing event.

---

## 6. Appendix

### Appendix A: Glossary

| Term | Definition |
|------|------------|
| API | Application Programming Interface — a set of protocols for building and integrating application software. |
| camelCase | A naming convention where the first letter of each word is capitalized except for the first word. |
| e-Ubuzima | Rwanda's flagship national Electronic Medical Record (EMR) system. |
| RFDA | Rwanda Food and Drugs Authority. |
| Indangamuntu | Rwanda's National Identity Card. The 16-digit numeric ID is used as the primary cross-facility patient identifier in MedConnect. |
| Joi | A JavaScript/TypeScript schema validation library used in MedConnect to validate all inbound API data. |
| JWT | JSON Web Token — a secure method for representing claims transferred between two parties, used for session authentication. |
| NST2 | National Strategy for Transformation 2 — Rwanda's strategic development framework. |
| OTP | One-Time Password — a unique 6-digit code sent to a verified email for multi-factor authentication. |
| QR Code | Quick Response Code — a machine-readable code used in MedConnect to store encrypted prescription verification data. |
| RBAC | Role-Based Access Control — restricts system access based on user roles (Doctor, Pharmacist, Admin, Patient). |
| RURA | Rwanda Utilities Regulatory Authority. |
| Sequelize | A Node.js ORM used in MedConnect for PostgreSQL database interactions. |
| Token Blacklist | A database table that stores invalidated JWT tokens to immediately revoke sessions upon logout or breach. |
| UUID | Universally Unique Identifier — used as primary keys across all MedConnect database tables. |

---

### Appendix B: Analysis Models

---

#### 1. Entity-Relationship Diagram (ERD)

The MedConnect data model consists of **11 core entities**. The diagram below shows all tables, their key attributes, and the relationships between them.

```mermaid
erDiagram
    USER {
        uuid id PK
        string email
        string passwordHash
        enum role
        string fullName
        string phone
        string nationalId
        boolean isActive
    }
    PATIENT {
        uuid id PK
        uuid userId FK
        date dateOfBirth
        enum gender
        string insuranceProvider
        string insuranceNumber
        json allergies
        json existingConditions
        string emergencyContact
        string emergencyPhone
    }
    DOCTOR {
        uuid id PK
        uuid userId FK
        string licenseNumber
        string specialization
        string hospitalName
        boolean isVerified
    }
    PHARMACIST {
        uuid id PK
        uuid userId FK
        string licenseNumber
        string pharmacyName
        string pharmacyAddress
        boolean isVerified
    }
    MEDICAL_VISIT {
        uuid id PK
        uuid patientId FK
        uuid doctorId FK
        date visitDate
        enum visitType
        string chiefComplaint
        text symptoms
        text diagnosis
        text treatmentNotes
        text recommendations
    }
    PRESCRIPTION {
        uuid id PK
        string prescriptionNumber
        uuid patientId FK
        uuid doctorId FK
        uuid visitId FK
        text diagnosis
        text doctorNotes
        enum status
        string qrCodeHash
    }
    PRESCRIPTION_ITEM {
        uuid id PK
        uuid prescriptionId FK
        string medicineName
        string dosage
        string frequency
        integer quantity
        text instructions
        integer dispensedQuantity
        decimal unitPrice
        string batchNumber
        date expiryDate
        boolean isDispensed
    }
    QR_CODE {
        uuid id PK
        string qrHash
        uuid prescriptionId FK
        text encryptedData
        datetime expiresAt
        boolean isUsed
        integer scanCount
    }
    PHARMACY_LOG {
        uuid id PK
        uuid prescriptionId FK
        uuid pharmacistId FK
        enum action
        text notes
        datetime actionTimestamp
        integer dispensedQuantity
        decimal unitPrice
        decimal totalAmount
        decimal insuranceCoverage
        decimal patientPayment
        string insuranceProvider
        string insuranceNumber
        string insuranceApprovalCode
        string batchNumber
        date expiryDate
    }
    TOKEN_BLACKLIST {
        uuid id PK
        text token
        uuid userId FK
        datetime expiresAt
    }
    OTP_VERIFICATION {
        uuid id PK
        uuid patientId FK
        string email
        string otpCode
        enum purpose
        boolean isUsed
        datetime expiresAt
    }

    USER ||--o| PATIENT : "has profile"
    USER ||--o| DOCTOR : "has profile"
    USER ||--o| PHARMACIST : "has profile"
    USER ||--o{ TOKEN_BLACKLIST : "invalidates"
    PATIENT ||--o{ MEDICAL_VISIT : "attends"
    PATIENT ||--o{ PRESCRIPTION : "receives"
    PATIENT ||--o{ OTP_VERIFICATION : "requests"
    DOCTOR ||--o{ MEDICAL_VISIT : "conducts"
    DOCTOR ||--o{ PRESCRIPTION : "creates"
    MEDICAL_VISIT ||--o{ PRESCRIPTION : "results in"
    PRESCRIPTION ||--o{ PRESCRIPTION_ITEM : "contains"
    PRESCRIPTION ||--|| QR_CODE : "identified by"
    PRESCRIPTION ||--o{ PHARMACY_LOG : "tracked in"
    PHARMACIST ||--o{ PHARMACY_LOG : "performs"
```

**Explanation:**
- `USER` is the central authentication entity shared by all roles (Doctor, Pharmacist, Patient, Admin). The `nationalId` field stores the 16-digit Rwanda Indangamuntu for cross-facility lookup.
- `PATIENT`, `DOCTOR`, and `PHARMACIST` are role-specific profile tables linked to `USER` via a one-to-one relationship.
- Each `PRESCRIPTION` is tied to exactly one `QR_CODE` (1:1) and may contain many `PRESCRIPTION_ITEM` entries.
- `PHARMACY_LOG` records every pharmacy action (SCAN, VALIDATED, DISPENSED, FULFILLED, REJECTED) with full financial and insurance details.
- `TOKEN_BLACKLIST` immediately invalidates JWT sessions on logout.
- `OTP_VERIFICATION` supports two purposes: `medical_history_access` and `password_reset`.

---

#### 2. Use Case Diagram (Behavioral)

This diagram illustrates all functional interactions between the four system actors and the MedConnect platform.

```mermaid
graph LR
    subgraph Actors
        Doctor(["👨‍⚕️ Doctor"])
        Pharmacist(["💊 Pharmacist"])
        Admin(["🔧 Admin"])
        Patient(["🧑 Patient"])
    end

    subgraph MedConnect System
        UC1["Login / Logout"]
        UC2["Change Password"]
        UC3["Register Patient"]
        UC4["Search Patient by Name"]
        UC5["Lookup Patient by National ID"]
        UC6["Create Medical Visit"]
        UC7["Write Prescription"]
        UC8["Generate QR Code"]
        UC9["Email Prescription to Patient"]
        UC10["Scan QR Code"]
        UC11["Validate Prescription"]
        UC12["Dispense Prescription"]
        UC13["Reject Prescription"]
        UC14["View Dispensing History"]
        UC15["Register Doctor"]
        UC16["Register Pharmacist"]
        UC17["Verify / Unverify Pharmacist"]
        UC18["Deactivate / Reactivate User"]
        UC19["Monitor Email Queue"]
        UC20["Request OTP"]
        UC21["View Own Medical History"]
        UC22["Reset Password via OTP"]
    end

    Doctor --> UC1
    Doctor --> UC2
    Doctor --> UC3
    Doctor --> UC4
    Doctor --> UC5
    Doctor --> UC6
    Doctor --> UC7
    Doctor --> UC8
    Doctor --> UC9
    Doctor --> UC22

    Pharmacist --> UC1
    Pharmacist --> UC2
    Pharmacist --> UC10
    Pharmacist --> UC11
    Pharmacist --> UC12
    Pharmacist --> UC13
    Pharmacist --> UC14
    Pharmacist --> UC22

    Admin --> UC1
    Admin --> UC2
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5

    Patient --> UC20
    Patient --> UC21
    Patient --> UC22
```

**Explanation:**
- **Doctor** is the primary clinical actor: registers patients, records visits, and creates prescriptions with QR codes.
- **Pharmacist** handles the dispensing workflow: scans, validates, dispenses, or rejects prescriptions.
- **Admin** manages all staff accounts and monitors system health.
- **Patient** has limited self-service access: OTP-verified medical history viewing and password reset.

---

#### 3. Class Diagram (Structural)

This diagram represents the static structure of the backend models, their attributes, key methods, and relationships.

```mermaid
classDiagram
    class User {
        +UUID id
        +String email
        +String passwordHash
        +UserRole role
        +String fullName
        +String phone
        +String nationalId
        +Boolean isActive
        +comparePassword(password) Boolean
        +hashPassword() void
    }

    class Patient {
        +UUID id
        +UUID userId
        +Date dateOfBirth
        +Gender gender
        +String insuranceProvider
        +String insuranceNumber
        +JSON allergies
        +JSON existingConditions
        +String emergencyContact
        +String emergencyPhone
    }

    class Doctor {
        +UUID id
        +UUID userId
        +String licenseNumber
        +String specialization
        +String hospitalName
        +Boolean isVerified
    }

    class Pharmacist {
        +UUID id
        +UUID userId
        +String licenseNumber
        +String pharmacyName
        +String pharmacyAddress
        +Boolean isVerified
    }

    class MedicalVisit {
        +UUID id
        +UUID patientId
        +UUID doctorId
        +Date visitDate
        +VisitType visitType
        +String chiefComplaint
        +Text symptoms
        +Text diagnosis
        +Text treatmentNotes
        +Text recommendations
    }

    class Prescription {
        +UUID id
        +String prescriptionNumber
        +UUID patientId
        +UUID doctorId
        +UUID visitId
        +Text diagnosis
        +PrescriptionStatus status
        +String qrCodeHash
        +generatePrescriptionNumber()$ String
    }

    class PrescriptionItem {
        +UUID id
        +UUID prescriptionId
        +String medicineName
        +String dosage
        +String frequency
        +Integer quantity
        +Text instructions
        +Integer dispensedQuantity
        +Decimal unitPrice
        +String batchNumber
        +Date expiryDate
        +Boolean isDispensed
    }

    class QRCode {
        +UUID id
        +String qrHash
        +UUID prescriptionId
        +Text encryptedData
        +DateTime expiresAt
        +Boolean isUsed
        +Integer scanCount
        +isExpired() Boolean
        +markAsUsed() void
    }

    class PharmacyLog {
        +UUID id
        +UUID prescriptionId
        +UUID pharmacistId
        +PharmacyAction action
        +Text notes
        +DateTime actionTimestamp
        +Decimal totalAmount
        +Decimal insuranceCoverage
        +Decimal patientPayment
        +String insuranceApprovalCode
    }

    class TokenBlacklist {
        +UUID id
        +Text token
        +UUID userId
        +DateTime expiresAt
        +isTokenBlacklisted(token)$ Boolean
        +blacklistToken(token, userId, expiresAt)$ void
        +cleanupExpiredTokens()$ void
    }

    class OTPVerification {
        +UUID id
        +UUID patientId
        +String email
        +String otpCode
        +OTPPurpose purpose
        +Boolean isUsed
        +DateTime expiresAt
        +isExpired() Boolean
        +isValid() Boolean
        +generateOTPCode()$ String
        +findValidOTP(code, patientId)$ OTPVerification
        +findValidOTPByEmail(code, email)$ OTPVerification
    }

    User "1" --> "0..1" Patient : has profile
    User "1" --> "0..1" Doctor : has profile
    User "1" --> "0..1" Pharmacist : has profile
    User "1" --> "0..*" TokenBlacklist : invalidates
    Patient "1" --> "0..*" MedicalVisit : attends
    Patient "1" --> "0..*" Prescription : receives
    Patient "1" --> "0..*" OTPVerification : requests
    Doctor "1" --> "0..*" MedicalVisit : conducts
    Doctor "1" --> "0..*" Prescription : creates
    MedicalVisit "1" --> "0..*" Prescription : results in
    Prescription "1" --> "1..*" PrescriptionItem : contains
    Prescription "1" --> "1" QRCode : identified by
    Prescription "1" --> "0..*" PharmacyLog : tracked in
    Pharmacist "1" --> "0..*" PharmacyLog : performs
```

**Explanation:**
- `User` is the root authentication class; `Patient`, `Doctor`, and `Pharmacist` extend its identity via composition (not inheritance) through a foreign key.
- Static methods (`$`) on `Prescription`, `TokenBlacklist`, and `OTPVerification` encapsulate business logic at the model level.
- `QRCode` has a strict 1:1 relationship with `Prescription` — every finalized prescription gets exactly one QR code.

---

#### 4. Sequence Diagram (Behavioral) — Prescription Creation & Dispensing

This diagram tracks the full dynamic interaction across all system layers from prescription creation through pharmacy dispensing.

```mermaid
sequenceDiagram
    actor Doctor
    participant Frontend as QR Scanner / API Client
    participant API as Express API
    participant Middleware as Joi Validation + Auth
    participant PatientSvc as PatientService
    participant QRSvc as QRCodeService
    participant DB as PostgreSQL
    participant EventSvc as EventService
    participant EmailSvc as EmailService
    participant SMTP as SMTP Server
    actor Pharmacist

    Note over Doctor,SMTP: === PRESCRIPTION CREATION ===

    Doctor->>Frontend: POST /api/v1/doctors/prescriptions
    Frontend->>API: Request with JWT + prescription payload
    API->>Middleware: Validate JWT (authenticateToken)
    Middleware-->>API: User authenticated (role: DOCTOR)
    API->>Middleware: Validate body (prescriptionSchema + prescriptionItemSchema)
    Middleware-->>API: Validation passed
    API->>PatientSvc: createPrescription(data)
    PatientSvc->>DB: INSERT Prescription + PrescriptionItems
    DB-->>PatientSvc: Prescription record created
    PatientSvc->>QRSvc: generateQRCode(prescriptionId)
    QRSvc->>DB: INSERT QRCode (encrypted hash, expiresAt)
    DB-->>QRSvc: QRCode record saved
    QRSvc-->>PatientSvc: qrHash returned
    PatientSvc-->>API: Prescription + QR data
    API->>EventSvc: emit('prescription.created', data)
    EventSvc-->>API: Job queued (async)
    API-->>Frontend: 201 Created (prescription + QR hash)
    Frontend-->>Doctor: Success response

    Note over EventSvc,SMTP: Background processing (no latency for Doctor)
    EventSvc->>EmailSvc: sendPrescriptionEmail(patientEmail, prescriptionData)
    EmailSvc->>SMTP: Send HTML email (medications + QR details)
    SMTP-->>EmailSvc: Delivery confirmed

    Note over Pharmacist,DB: === PHARMACY DISPENSING ===

    Pharmacist->>Frontend: Scan QR code via browser camera
    Frontend->>API: POST /api/v1/pharmacy/scan { qrHash }
    API->>Middleware: Validate JWT (role: PHARMACIST, isVerified: true)
    Middleware-->>API: Authorized
    API->>DB: Find QRCode by hash
    DB-->>API: QRCode + linked Prescription
    API->>DB: UPDATE Prescription status = SCANNED
    API->>DB: INSERT PharmacyLog (action: SCAN)
    API-->>Frontend: Prescription details + prescriptionId displayed
    Frontend-->>Pharmacist: Prescription info shown

    Pharmacist->>Frontend: POST /api/v1/pharmacy/validate/:id
    Frontend->>API: Validate request
    API->>DB: UPDATE Prescription status = VALIDATED
    API->>DB: INSERT PharmacyLog (action: VALIDATED)
    API-->>Frontend: 200 OK

    Pharmacist->>Frontend: POST /api/v1/pharmacy/dispense/:id (items + insurance)
    Frontend->>API: Dispense request
    API->>Middleware: Validate body (dispensing schema)
    API->>DB: UPDATE PrescriptionItems (dispensedQuantity, isDispensed)
    API->>DB: UPDATE Prescription status = DISPENSED
    API->>DB: INSERT PharmacyLog (action: DISPENSED, amounts, insurance)
    API-->>Frontend: 200 OK — Dispensing complete
    Frontend-->>Pharmacist: Confirmation
```

**Explanation:**
- The event-driven email queue ensures the Doctor's API response is instant — email delivery is handled asynchronously in the background.
- Joi validation blocks invalid payloads before any database operation occurs.
- The pharmacy workflow requires three explicit steps (Scan → Validate → Dispense) with a log entry at each stage.

---

#### 5. Prescription State Diagram

This diagram shows all valid prescription status transitions in MedConnect.

```mermaid
stateDiagram-v2
    [*] --> PENDING : Doctor creates prescription + QR generated

    PENDING --> SCANNED : Pharmacist scans QR code
    PENDING --> CANCELLED : Doctor or Admin cancels

    SCANNED --> VALIDATED : Pharmacist validates
    SCANNED --> REJECTED : Pharmacist rejects (with reason)

    VALIDATED --> DISPENSED : Pharmacist dispenses medication
    VALIDATED --> REJECTED : Pharmacist rejects (with reason)

    DISPENSED --> FULFILLED : All items fully dispensed
    DISPENSED --> REJECTED : Pharmacist rejects remaining

    FULFILLED --> [*]
    REJECTED --> [*]
    CANCELLED --> [*]

    note right of PENDING
        QR code active
        Email sent to patient
    end note

    note right of DISPENSED
        PharmacyLog updated
        Insurance recorded
        Partial dispensing tracked
        via dispensedQuantity per item
    end note
```

---

#### 6. Package Diagram (Structural)

This diagram illustrates the codebase organization and how the frontend, backend layers, and database depend on one another.

```mermaid
graph TD
    subgraph Client["Client Layer"]
        QR["qr-scanner.html\n(Pharmacy Browser Interface)"]
        API_CLIENT["API Client\n(Postman / React / Mobile)"]
    end

    subgraph Backend["Backend: Express.js (Node.js + TypeScript)"]
        subgraph Routes["Routes Layer"]
            R1["auth.ts"]
            R2["patients.ts"]
            R3["doctors.ts"]
            R4["pharmacists.ts"]
            R5["pharmacy.ts"]
            R6["qrCodes.ts"]
            R7["events.ts"]
        end

        subgraph Middleware["Middleware Layer"]
            M1["authenticateToken\n(JWT Auth)"]
            M2["requireRole\n(RBAC)"]
            M3["validateBody\n(Joi Schemas)"]
            M4["rateLimiter\n(express-rate-limit)"]
            M5["requireOTPVerification\n(Medical History)"]
        end

        subgraph Controllers["Controller Layer"]
            C1["authController"]
            C2["patientController"]
            C3["doctorController"]
            C4["pharmacistController"]
            C5["pharmacyController"]
        end

        subgraph Services["Service Layer"]
            S1["authService"]
            S2["patientService"]
            S3["doctorService"]
            S4["pharmacistService"]
            S5["pharmacyService"]
            S6["qrCodeService"]
            S7["emailService"]
            S8["otpService"]
            S9["eventService (Queue)"]
        end

        subgraph Models["Model Layer (Sequelize ORM)"]
            DB1["User"]
            DB2["Patient"]
            DB3["Doctor"]
            DB4["Pharmacist"]
            DB5["MedicalVisit"]
            DB6["Prescription"]
            DB7["PrescriptionItem"]
            DB8["QRCode"]
            DB9["PharmacyLog"]
            DB10["TokenBlacklist"]
            DB11["OTPVerification"]
        end
    end

    subgraph External["External Services"]
        PG[("PostgreSQL 15+\nDatabase")]
        SMTP["SMTP Server\n(Nodemailer)"]
    end

    QR -->|HTTPS| Routes
    API_CLIENT -->|HTTPS + JWT| Routes

    Routes --> Middleware
    Middleware --> Controllers
    Controllers --> Services
    Services --> Models
    Models -->|SQL via Sequelize| PG
    S7 -->|SMTP| SMTP
    S9 -->|async queue| S7
```

**Explanation:**
- **Client Layer:** The QR scanner HTML page is the only delivered frontend; all other consumers interact via the REST API.
- **Middleware Layer:** Every route passes through authentication, role enforcement, Joi validation, and rate limiting before reaching a controller.
- **Service Layer:** Business logic is fully separated from routing. `eventService` manages the async email queue, calling `emailService` in the background.
- **Model Layer:** 11 Sequelize models map to PostgreSQL tables. All primary keys are UUIDs.
- **External:** PostgreSQL for persistence; an SMTP provider for email delivery.
