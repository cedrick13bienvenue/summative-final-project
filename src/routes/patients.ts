import { Router } from 'express';
import { PatientController } from '../controllers/patientController';
import {
  authenticateToken,
  requireRole,
  requireDoctor
} from '../middleware/auth';
import { requireOTPVerification, generateOTPForPatient } from '../middleware/otpVerification';
import { User, UserRole } from '../models';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { prescriptionRateLimiter, medicalHistoryRateLimiter, otpRateLimiter, registrationRateLimiter } from '../middleware/rateLimiter';
import { 
  patientRegistrationSchema, 
  patientUpdateSchema, 
  medicalVisitSchema, 
  prescriptionSchema, 
  searchQuerySchema, 
  paginationSchema,
  medicalHistoryPaginationSchema,
  medicalHistoryWithOTPSchema,
  advancedPaginationSchema,
  patientIdParamSchema,
  nationalIdParamSchema,
  otpVerificationSchema
} from '../validation/schemas';

const router = Router();

// Protected routes (authentication required)
router.post('/patients/register', registrationRateLimiter, authenticateToken, requireRole([UserRole.ADMIN, UserRole.DOCTOR]), validateBody(patientRegistrationSchema), PatientController.registerPatient);
router.get('/patients/search', authenticateToken, requireRole([UserRole.ADMIN, UserRole.DOCTOR]), validateQuery(searchQuerySchema), PatientController.searchPatients);
router.get('/patients/:patientId', authenticateToken, requireRole([UserRole.ADMIN, UserRole.DOCTOR]), validateParams(patientIdParamSchema), PatientController.getPatientById);
router.put('/patients/:patientId', authenticateToken, requireRole([UserRole.ADMIN, UserRole.DOCTOR]), validateParams(patientIdParamSchema), validateBody(patientUpdateSchema), PatientController.updatePatient);
// OTP generation route for patients
router.post('/patients/:patientId/otp', authenticateToken, requireRole([UserRole.PATIENT]), validateParams(patientIdParamSchema), generateOTPForPatient);

// Medical history route with OTP verification
router.get('/patients/:patientId/history', medicalHistoryRateLimiter, authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN, UserRole.PATIENT]), validateParams(patientIdParamSchema), validateQuery(medicalHistoryPaginationSchema), requireOTPVerification, PatientController.getPatientMedicalHistory);

// Doctor and Admin only routes
router.post('/patients/:patientId/visits', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN]), validateParams(patientIdParamSchema), validateBody(medicalVisitSchema), PatientController.createMedicalVisit);
router.post('/patients/:patientId/prescriptions', prescriptionRateLimiter, authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN]), validateParams(patientIdParamSchema), validateBody(prescriptionSchema), PatientController.createPrescription);
router.get('/patients/:patientId/prescriptions', authenticateToken, requireRole([UserRole.DOCTOR, UserRole.ADMIN]), validateParams(patientIdParamSchema), validateQuery(advancedPaginationSchema), PatientController.getPatientPrescriptions);
router.get('/patients', authenticateToken, requireDoctor, validateQuery(paginationSchema), PatientController.getAllPatients);
router.get(
  '/patients/prescriptions', 
  authenticateToken, 
  requireRole([UserRole.DOCTOR, UserRole.ADMIN]), 
  validateQuery(advancedPaginationSchema), 
  PatientController.getAllPrescriptions
);

// Cross-hospital lookup by National ID (any authenticated user)
router.get('/patients/national-id/:nationalId', authenticateToken, validateParams(nationalIdParamSchema), PatientController.getPatientByNationalId);

export default router;
