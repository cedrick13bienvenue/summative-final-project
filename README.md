# MedConnect Backend

A comprehensive Digital Prescription & Patient Records System built with Express.js, TypeScript, and PostgreSQL. This system enables healthcare providers to create digital prescriptions with QR codes, manage patient records, and facilitate seamless pharmacy operations.

## Features

### Authentication & Authorization

- **Multi-role system**: Doctors, Patients, Pharmacists, and Admins
- **JWT-based authentication** with secure token management
- **OTP verification** for medical history access and password reset
- **Role-based access control** with middleware protection

### Doctor Features

- **Patient management**: Create and manage patient profiles
- **Digital prescriptions**: Create prescriptions with detailed medication information
- **Medical visits**: Track patient visits and medical history
- **QR code generation**: Automatic QR code creation for prescriptions
- **Email notifications**: Send prescription details to patients

### Patient Features

- **Profile management**: Complete patient profile with medical information
- **Prescription access**: View and manage prescriptions via QR codes
- **Reference number lookup**: Alternative access method for pharmacies without QR scanners
- **Email notifications**: Receive prescription details via email

### Pharmacy Features

- **QR code scanning**: Scan patient QR codes to retrieve prescriptions
- **Reference number lookup**: Look up prescriptions using patient reference numbers
- **Prescription validation**: Review and approve prescriptions
- **Dispensing management**: Track medication dispensing with inventory details
- **Prescription history**: View dispensing history and logs

### Email System

- **Prescription emails**: Automated emails with QR codes and reference numbers
- **Welcome emails**: New user onboarding
- **OTP emails**: Secure verification codes
- **Professional templates**: HTML and text email formats
- **Event-driven architecture**: Background email processing with retry mechanisms

### QR Code System

- **Secure QR codes**: Encrypted prescription data
- **Expiration management**: Time-limited QR codes for security
- **Usage tracking**: Monitor QR code scans and usage
- **Image generation**: Base64 encoded QR code images

### Event-Driven Architecture

- **Background processing**: Non-blocking email sending
- **Job queue system**: Reliable email delivery with retry logic
- **Event monitoring**: Real-time queue status and health checks
- **Graceful degradation**: Fallback to direct email sending

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm

### 1. Clone and Install

```bash
git clone <repository-url>
cd prescripto
npm install
```

### 2. Environment Setup

```bash
cp env.example .env
# Edit .env with your configuration
```

**Required Environment Variables:**

````env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=medconnect_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# QR Code Encryption
QR_ENCRYPTION_KEY=your_qr_encryption_key_here

# Email (Gmail example)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password


### 3. Database Setup

```bash
# Create database
npm run db:migrate

# Seed with admin user
npm run db:seed
````

### 4. Start Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## Project Structure

```
src/
├── controllers/          # Route controllers
│   ├── authController.ts
│   ├── doctorController.ts
│   ├── patientController.ts
│   ├── pharmacistController.ts
│   └── pharmacyController.ts
├── database/            # Database configuration and migrations
│   ├── config/
│   ├── migrations/
│   └── seeders/
├── middleware/          # Custom middleware
│   ├── auth.ts
│   ├── otpVerification.ts
│   └── validation.ts
├── models/              # Sequelize models
│   ├── Doctor.ts
│   ├── Patient.ts
│   ├── Prescription.ts
│   ├── QRCode.ts
│   └── ...
├── routes/              # API routes
│   ├── auth.ts
│   ├── doctors.ts
│   ├── patients.ts
│   ├── pharmacy.ts
│   ├── qrCodes.ts
│   └── events.ts
├── services/            # Business logic
│   ├── authService.ts
│   ├── emailService.ts
│   ├── eventService.ts
│   ├── pharmacyService.ts
│   └── qrCodeService.ts
├── swagger/             # API documentation
│   ├── paths/
│   └── schemas/
├── types/               # TypeScript type definitions
├── utils/               # Utility functions
└── validation/          # Input validation schemas
```

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Authentication Endpoints

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/logout` - User logout
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password with OTP

### Doctor Endpoints

- `GET /doctors/patients` - Get all patients (with pagination)
- `POST /doctors/patients` - Create new patient
- `GET /doctors/patients/:id` - Get patient details
- `PUT /doctors/patients/:id` - Update patient
- `POST /doctors/prescriptions` - Create prescription
- `GET /doctors/prescriptions` - Get doctor's prescriptions
- `GET /doctors/medical-visits` - Get medical visits

### Patient Endpoints

- `GET /patients/profile` - Get patient profile
- `PUT /patients/profile` - Update patient profile
- `GET /patients/prescriptions` - Get patient's prescriptions
- `GET /patients/medical-history` - Get medical history (OTP required)

### Pharmacy Endpoints

- `POST /pharmacy/scan` - Scan QR code
- `POST /pharmacy/lookup` - Lookup by reference number
- `POST /pharmacy/validate/:id` - Validate prescription
- `POST /pharmacy/dispense/:id` - Dispense prescription
- `POST /pharmacy/reject/:id` - Reject prescription
- `GET /pharmacy/history` - Get dispensing history

### QR Code Endpoints

- `POST /qr-codes/email/:id` - Send prescription email
- `GET /qr-codes/:id` - Get QR code for prescription

### Event Management Endpoints

- `GET /events/email-queue/status` - Get email queue status
- `POST /events/email-queue/clear-completed` - Clear completed email jobs
- `POST /events/test` - Test event emission

### Swagger Documentation

Visit `http://localhost:3000/api-docs` for interactive API documentation.

## Available Scripts

### Development

```bash
npm run dev          # Start development server with hot reload
npm run build        # Build TypeScript to JavaScript
npm run build:dev    # Build for development
```

### Database

```bash
npm run db:migrate           # Run database migrations
npm run db:migrate:undo      # Undo last migration
npm run db:seed              # Seed database with sample data
npm run db:reset             # Drop, create, and migrate database
npm run db:fresh             # Fresh database with seed data
npm run db:clear             # Clear all data (development only)
```

### Code Quality

```bash
npm run lint                # Run ESLint
npm run lint:fix            # Fix ESLint issues automatically
```

### Utilities

```bash
npm run cleanup-tokens      # Clean up expired JWT tokens
```

## Tech Stack

### Backend

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **QR Codes**: qrcode
- **Validation**: Joi
- **Documentation**: Swagger/OpenAPI
- **Events**: Node.js EventEmitter
- **Rate Limiting**: express-rate-limit

### Development Tools

- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Hot Reload**: Nodemon
- **Database CLI**: Sequelize CLI

## Security Features

- **JWT Authentication** with configurable expiration
- **Password hashing** using bcryptjs
- **QR code encryption** for prescription data
- **OTP verification** for sensitive operations
- **Token blacklisting** for secure logout
- **Input validation** with Joi schemas
- **CORS protection** for cross-origin requests
- **Role-based access control** throughout the system
- **Comprehensive rate limiting** with role-based limits
- **API abuse protection** with multiple rate limiting strategies

## Rate Limiting System

The MedConnect API implements comprehensive rate limiting to prevent abuse and ensure fair usage across all endpoints.

### Rate Limiting Strategies

#### Global Rate Limiting

- **Basic Protection**: 100 requests per 15 minutes per IP
- **Applied to**: All API endpoints
- **Purpose**: Prevent basic abuse and DDoS attacks

#### Authentication Endpoints

- **Login Attempts**: 5 attempts per 15 minutes per IP
- **Password Reset**: 3 attempts per hour per IP
- **Registration**: 3 attempts per hour per IP
- **OTP Requests**: 3 requests per 5 minutes per IP

#### Role-Based Rate Limiting

- **Admin**: 100 requests per minute
- **Doctor**: 50 requests per minute
- **Pharmacist**: 30 requests per minute
- **Patient**: 20 requests per minute
- **Anonymous**: 10 requests per minute

#### Endpoint-Specific Limits

- **Prescription Creation**: 10 per minute per user
- **QR Code Scanning**: 20 per minute per user
- **Pharmacy Operations**: 15 per minute per user
- **Email Sending**: 5 per minute per user
- **Medical History Access**: 10 per minute per user
- **Event Management**: 30 per minute per user

### Rate Limit Headers

All rate-limited endpoints return standard headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: Time when the rate limit resets

### Rate Limit Response

When rate limits are exceeded, the API returns:

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

### Monitoring and Management

- **Real-time Monitoring**: Track rate limit usage across all endpoints
- **Automatic Cleanup**: Completed rate limit windows are automatically cleared
- **Configurable Limits**: Easy adjustment of limits based on usage patterns
- **IP-based Tracking**: Separate limits for different IP addresses
- **User-based Tracking**: Additional limits based on authenticated users

## Email Features

### Prescription Emails

- **QR Code inclusion**: Embedded QR code images
- **Reference numbers**: Alternative access for pharmacies without QR scanners
- **Professional templates**: HTML and text formats
- **Expiration tracking**: Clear expiration dates
- **Patient information**: Complete prescription details

### Event-Driven Email System

- **Background processing**: Non-blocking email sending
- **Retry mechanism**: Automatic retry for failed emails
- **Queue monitoring**: Real-time status and health checks
- **Graceful degradation**: Fallback to direct email sending

### Email Templates

- Welcome emails for new users
- Prescription notifications with QR codes
- OTP verification emails
- Password reset emails

## Healthcare Workflow

### 1. Doctor Creates Prescription

1. Doctor logs in and selects patient
2. Creates prescription with medication details
3. System generates QR code and reference number
4. Event system triggers background email processing
5. Email sent to patient with QR code and reference number

### 2. Patient Visits Pharmacy

1. Patient shows QR code or provides reference number
2. Pharmacist scans QR code or looks up by reference number
3. System validates prescription and shows details
4. Pharmacist can validate, dispense, or reject prescription

### 3. Prescription Dispensing

1. Pharmacist validates prescription
2. Enters dispensing details (quantities, prices, batch numbers)
3. System updates prescription status to "dispensed"
4. Prescription is marked as fulfilled

## Event-Driven Architecture

### Event Types

- **prescription.created**: Triggered when a new prescription is created
- **user.registered**: Triggered when a new user registers
- **prescription.dispensed**: Triggered when a prescription is dispensed

### Background Processing

- **Job Queue**: In-memory queue for email processing
- **Retry Logic**: Automatic retry for failed emails (3 attempts)
- **Monitoring**: Real-time queue status and health checks
- **Fallback**: Direct email sending if event system fails

### Queue Management

```bash
# Get queue status
GET /api/v1/events/email-queue/status

# Clear completed jobs
POST /api/v1/events/email-queue/clear-completed

# Test event emission
POST /api/v1/events/test
```

## Deployment

### Production Build

```bash
npm run build
npm run db:migrate
npm start
```

### Environment Variables for Production

Ensure all production environment variables are properly configured:

- Database credentials
- JWT secrets
- Email SMTP settings
- QR encryption keys
- Frontend URL

## API Response Examples

### Successful Prescription Scan

```json
{
  "success": true,
  "message": "Prescription scanned successfully",
  "data": {
    "prescription": {
      "id": "uuid",
      "prescriptionNumber": "RX-20241201-1234",
      "patientName": "John Doe",
      "doctorName": "Dr. Smith",
      "diagnosis": "Fever",
      "status": "scanned",
      "items": [
        {
          "medicineName": "Paracetamol",
          "dosage": "500mg",
          "frequency": "Twice daily",
          "quantity": 20,
          "instructions": "Take with food"
        }
      ],
      "qrCode": {
        "qrHash": "abc123def456",
        "isUsed": false,
        "scanCount": 1,
        "expiresAt": "2024-12-08T10:30:00.000Z"
      }
    },
    "isValid": true,
    "canDispense": true
  }
}
```

### Email Queue Status

```json
{
  "success": true,
  "message": "Email queue status retrieved successfully",
  "data": {
    "totalJobs": 5,
    "pendingJobs": 2,
    "processingJobs": 1,
    "completedJobs": 2,
    "failedJobs": 0,
    "isHealthy": true,
    "lastUpdated": "2024-12-01T10:30:00.000Z"
  }
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Team

**MedConnect Team** - Building the future of digital healthcare

---

For more detailed API documentation, visit the Swagger UI at `http://localhost:3000/api-docs` when the server is running.
