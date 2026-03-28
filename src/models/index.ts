// Import all models
import User from './User';
import Patient from './Patient';
import Doctor from './Doctor';
import Pharmacist from './Pharmacist';
import MedicalVisit from './MedicalVisit';
import Prescription from './Prescription';
import PrescriptionItem from './PrescriptionItem';
import QRCode from './QRCode';
import PharmacyLog from './PharmacyLog';
import TokenBlacklist from './TokenBlacklist';
import OTPVerification from './OTPVerification';

// Export all models
export {
  User,
  Patient,
  Doctor,
  Pharmacist,
  MedicalVisit,
  Prescription,
  PrescriptionItem,
  QRCode,
  PharmacyLog,
  TokenBlacklist,
  OTPVerification,
};

// Export enums and types
export { UserRole } from './User';
export { VisitType } from './MedicalVisit';
export { PrescriptionStatus } from './Prescription';
export { PharmacyAction } from './PharmacyLog';

// This file ensures all models are loaded and associations are established
export default {
  User,
  Patient,
  Doctor,
  Pharmacist,
  MedicalVisit,
  Prescription,
  PrescriptionItem,
  QRCode,
  PharmacyLog,
  TokenBlacklist,
  OTPVerification,
};
