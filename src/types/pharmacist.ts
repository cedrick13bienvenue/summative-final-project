import { UserRole } from '../models';

export interface PharmacistRegistrationData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  licenseNumber: string;
  pharmacyName: string;
  pharmacyAddress?: string;
}

export interface PharmacistProfile {
  id: string;
  userId: string;
  email: string;
  fullName: string;
  phone?: string;
  nationalId?: string;
  role: UserRole;
  licenseNumber?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface PharmacistCreationData {
  userId: string;
  licenseNumber: string;
  pharmacyName: string;
  pharmacyAddress?: string;
}

export interface PharmacistUpdateData {
  licenseNumber?: string;
  pharmacyName?: string;
  pharmacyAddress?: string;
}

export interface PharmacistListResponse {
  pharmacists: PharmacistProfile[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PharmacistDetailResponse {
  pharmacist: PharmacistProfile;
}

export interface PharmacistRegistrationResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    phone?: string;
  };
  pharmacist: {
    id: string;
    licenseNumber: string;
    pharmacyName: string;
    pharmacyAddress?: string;
    isVerified: boolean;
  };
}
