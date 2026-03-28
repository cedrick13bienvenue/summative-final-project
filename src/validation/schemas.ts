import Joi from 'joi';
import { UserRole } from '../models';

// Common validation patterns
const emailPattern = Joi.string().email().required();
const passwordPattern = Joi.string().min(8).pattern(/^(?=.*[a-zA-Z])(?=.*\d)/).required();
const uuidPattern = Joi.string().uuid().required();
const phonePattern = Joi.string().pattern(/^\+?[\d\s-()]+$/).optional();
const datePattern = Joi.date().max('now').required();
const nationalIdPattern = Joi.string().length(16).pattern(/^\d{16}$/).optional();

// User Registration Schema
export const userRegistrationSchema = Joi.object({
  email: emailPattern,
  password: passwordPattern,
  fullName: Joi.string().min(2).max(100).trim().required(),
  role: Joi.string().valid(...Object.values(UserRole)).required(),
  phone: phonePattern,
  nationalId: nationalIdPattern,
});

// User Login Schema
export const userLoginSchema = Joi.object({
  email: emailPattern,
  password: Joi.string().required()
});

// Password Change Schema
export const passwordChangeSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: passwordPattern
});

// Password Reset Request Schema
export const passwordResetRequestSchema = Joi.object({
  email: emailPattern
});

// Password Reset Schema
export const passwordResetSchema = Joi.object({
  email: emailPattern,
  otpCode: Joi.string().length(6).pattern(/^\d{6}$/).required(),
  newPassword: passwordPattern
});

// Patient Registration Schema
export const patientRegistrationSchema = Joi.object({
  email: emailPattern,
  password: passwordPattern,
  fullName: Joi.string().min(2).max(100).trim().required(),
  dateOfBirth: datePattern,
  gender: Joi.string().valid('male', 'female', 'other').required(),
  nationalId: nationalIdPattern,
  insuranceProvider: Joi.string().max(100).trim().optional(),
  insuranceNumber: Joi.string().max(50).trim().optional(),
  allergies: Joi.array().items(Joi.string().max(100).trim()).default([]),
  existingConditions: Joi.array().items(Joi.string().max(100).trim()).default([]),
  emergencyContact: Joi.string().min(2).max(100).trim().required(),
  emergencyPhone: phonePattern.required(),
  phone: phonePattern
});

// Patient Update Schema
export const patientUpdateSchema = Joi.object({
  fullName: Joi.string().min(2).max(100).trim().optional(),
  dateOfBirth: datePattern.optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  nationalId: nationalIdPattern,
  insuranceProvider: Joi.string().max(100).trim().optional(),
  insuranceNumber: Joi.string().max(50).trim().optional(),
  allergies: Joi.array().items(Joi.string().max(100).trim()).optional(),
  existingConditions: Joi.array().items(Joi.string().max(100).trim()).optional(),
  emergencyContact: Joi.string().min(2).max(100).trim().optional(),
  emergencyPhone: phonePattern.optional(),
  phone: phonePattern.optional()
});

// Doctor Registration Schema
export const doctorRegistrationSchema = Joi.object({
  email: emailPattern,
  password: passwordPattern,
  fullName: Joi.string().min(2).max(100).trim().required(),
  nationalId: nationalIdPattern,
  licenseNumber: Joi.string().max(50).trim().optional(),
  specialization: Joi.string().max(100).trim().optional(),
  hospitalName: Joi.string().max(100).trim().optional(),
  phone: phonePattern
});

// Doctor Update Schema
export const doctorUpdateSchema = Joi.object({
  licenseNumber: Joi.string().max(50).trim().optional(),
  specialization: Joi.string().max(100).trim().optional(),
  hospitalName: Joi.string().max(100).trim().optional(),
  isVerified: Joi.boolean().optional()
});

// Medical Visit Schema
export const medicalVisitSchema = Joi.object({
  doctorId: uuidPattern,
  visitDate: datePattern,
  visitType: Joi.string().valid('consultation', 'emergency', 'followup').required(),
  chiefComplaint: Joi.string().min(5).max(500).trim().required(),
  symptoms: Joi.string().max(1000).trim().optional(),
  diagnosis: Joi.string().max(500).trim().optional(),
  treatmentNotes: Joi.string().max(1000).trim().optional(),
  recommendations: Joi.string().max(1000).trim().optional(),
  hospitalName: Joi.string().max(100).trim().optional(),
  vitalSigns: Joi.object({
    bloodPressure: Joi.string().pattern(/^\d{2,3}\/\d{2,3}$/).optional(),
    heartRate: Joi.number().min(30).max(200).optional(),
    temperature: Joi.number().min(95).max(110).optional(),
    weight: Joi.number().min(1).max(1000).optional(),
    height: Joi.number().min(1).max(300).optional()
  }).optional()
});

// Prescription Item Schema
export const prescriptionItemSchema = Joi.object({
  medicineName: Joi.string().min(2).max(100).trim().required(),
  dosage: Joi.string().min(1).max(50).trim().required(),
  frequency: Joi.string().min(1).max(50).trim().required(),
  quantity: Joi.number().min(1).max(1000).required(),
  instructions: Joi.string().max(200).trim().optional()
});

// Prescription Schema
export const prescriptionSchema = Joi.object({
  doctorId: uuidPattern,
  visitId: uuidPattern,
  diagnosis: Joi.string().min(5).max(500).trim().required(),
  doctorNotes: Joi.string().max(1000).trim().optional(),
  hospitalName: Joi.string().max(100).trim().optional(),
  items: Joi.array().items(prescriptionItemSchema).min(1).max(10).required()
});

// Prescription Update Schema
export const prescriptionUpdateSchema = Joi.object({
  diagnosis: Joi.string().min(5).max(500).trim().optional(),
  doctorNotes: Joi.string().max(1000).trim().optional(),
  status: Joi.string().valid('pending', 'fulfilled', 'cancelled').optional(),
  items: Joi.array().items(prescriptionItemSchema).min(1).max(10).optional()
});

// QR Code Verification Schema
export const qrCodeVerificationSchema = Joi.object({
  qrHash: Joi.string().length(32).pattern(/^[a-f0-9]+$/).required()
});

// Search Query Schema
export const searchQuerySchema = Joi.object({
  query: Joi.string().min(2).max(100).trim().required(),
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
});

// Pagination Schema
export const paginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10)
});

// Advanced Pagination Schema (with sorting)
export const advancedPaginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'fullName', 'email', 'visitDate', 'prescriptionNumber').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC')
});

// Medical History Pagination Schema
export const medicalHistoryPaginationSchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(50).default(10),
  type: Joi.string().valid('visits', 'prescriptions', 'all').default('all'),
  sortBy: Joi.string().valid('createdAt', 'visitDate', 'prescriptionNumber').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  otpCode: Joi.string().length(6).pattern(/^\d{6}$/).optional()
});

// User ID Parameter Schema
export const userIdParamSchema = Joi.object({
  userId: uuidPattern
});

// Patient ID Parameter Schema
export const patientIdParamSchema = Joi.object({
  patientId: uuidPattern
});

// Doctor ID Parameter Schema
export const doctorIdParamSchema = Joi.object({
  doctorId: uuidPattern
});

// Prescription ID Parameter Schema
export const prescriptionIdParamSchema = Joi.object({
  prescriptionId: uuidPattern
});

// Pharmacist ID Parameter Schema
export const pharmacistIdParamSchema = Joi.object({
  pharmacistId: uuidPattern
});

// National ID Parameter Schema
export const nationalIdParamSchema = Joi.object({
  nationalId: Joi.string().length(16).pattern(/^\d{16}$/).required()
});

// Email Test Schema
export const emailTestSchema = Joi.object({
  email: emailPattern,
  name: Joi.string().min(2).max(100).trim().required()
});

// OTP Verification Schema
export const otpVerificationSchema = Joi.object({
  otpCode: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// Medical history request with OTP (for POST method)
export const medicalHistoryWithOTPSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  type: Joi.string().valid('all', 'visits', 'prescriptions').default('all'),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'date').default('createdAt'),
  sortOrder: Joi.string().valid('ASC', 'DESC').default('DESC'),
  otpCode: Joi.string().length(6).pattern(/^\d{6}$/).required()
});

// Custom validation messages
export const customMessages = {
  'string.email': 'Please provide a valid email address',
  'string.min': 'This field must be at least {#limit} characters long',
  'string.max': 'This field must not exceed {#limit} characters',
  'string.pattern.base': 'Please provide a valid format for this field',
  'number.min': 'This value must be at least {#limit}',
  'number.max': 'This value must not exceed {#limit}',
  'any.required': 'This field is required',
  'any.only': 'This field must be one of: {#valids}',
  'array.min': 'At least {#limit} item(s) required',
  'array.max': 'Maximum {#limit} item(s) allowed',
  'date.max': 'Date cannot be in the future'
};

// Validation options
export const validationOptions = {
  abortEarly: false,
  allowUnknown: false,
  stripUnknown: true,
  messages: customMessages
};
