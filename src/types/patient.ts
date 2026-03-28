import { Gender, VisitType, PrescriptionStatus } from './common';

// Patient related types
export interface PatientRegistrationData {
  email: string;
  password: string;
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  nationalId?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string[];
  existingConditions?: string[];
  emergencyContact: string;
  emergencyPhone: string;
  phone?: string;
}

export interface PatientProfile {
  id: string;
  email?: string;
  fullName: string;
  dateOfBirth: Date;
  gender: Gender;
  nationalId?: string;
  insuranceProvider?: string;
  insuranceNumber?: string;
  allergies?: string[];
  existingConditions?: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MedicalVisitData {
  patientId: string;
  doctorId: string;
  visitDate: Date;
  visitType: VisitType;
  chiefComplaint: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  recommendations?: string;
  hospitalName?: string;
}

export interface PrescriptionData {
  patientId: string;
  doctorId: string;
  visitId: string;
  diagnosis: string;
  doctorNotes?: string;
  hospitalName?: string;
  items: PrescriptionItemData[];
}

export interface PrescriptionItemData {
  medicineName: string;
  dosage: string;
  frequency: string;
  quantity: number;
  instructions?: string;
}

export interface MedicalHistory {
  visits: MedicalVisitSummary[];
  prescriptions: PrescriptionSummary[];
}

export interface MedicalVisitSummary {
  id: string;
  visitDate: Date;
  visitType: VisitType;
  chiefComplaint: string;
  symptoms?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  recommendations?: string;
  doctor: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    licenseNumber?: string;
    specialization?: string;
    hospitalName?: string;
  };
  patient: {
    id: string;
    fullName: string;
    email: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
  };
  createdAt: Date;
}

export interface PrescriptionSummary {
  id: string;
  prescriptionNumber: string;
  diagnosis: string;
  doctorNotes?: string;
  status: PrescriptionStatus;
  items: PrescriptionItemSummary[];
  doctor: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    licenseNumber?: string;
    specialization?: string;
    hospitalName?: string;
  };
  patient: {
    id: string;
    fullName: string;
    email: string;
    insuranceProvider?: string;
    insuranceNumber?: string;
  };
  createdAt: Date;
}

export interface PrescriptionItemSummary {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: string;
  quantity: number;
  instructions?: string;
}

export interface PatientListResponse {
  patients: PatientProfile[];
  total: number;
}
