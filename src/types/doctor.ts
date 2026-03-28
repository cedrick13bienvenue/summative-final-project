import { UserRole } from './common';

// Doctor related types
export interface DoctorRegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  licenseNumber: string;
  specialization: string;
  hospitalName: string;
}

export interface DoctorProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  nationalId?: string;
  licenseNumber?: string;
  specialization?: string;
  hospitalName?: string;
  isVerified: boolean;
  phone?: string;
  createdAt: Date;
}

export interface DoctorCreationData {
  userId: string;
  licenseNumber: string;
  specialization: string;
  hospitalName: string;
}

export interface DoctorUpdateData {
  licenseNumber?: string;
  specialization?: string;
  hospitalName?: string;
}

export interface DoctorListResponse {
  doctors: DoctorProfile[];
  total: number;
}

export interface DoctorDetailResponse {
  doctor: DoctorProfile;
}

export interface DoctorRegistrationResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  };
  doctor: {
    id: string;
    licenseNumber?: string;
    specialization?: string;
    hospitalName?: string;
    isVerified: boolean;
  };
}

export interface DoctorUpdateResponse {
  doctor: DoctorProfile;
}
