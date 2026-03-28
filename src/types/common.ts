// Common types and enums used across the application

export enum UserRole {
  ADMIN = 'admin',
  DOCTOR = 'doctor',
  PATIENT = 'patient',
  PHARMACIST = 'pharmacist',
}

export enum VisitType {
  CONSULTATION = 'consultation',
  EMERGENCY = 'emergency',
  FOLLOWUP = 'followup',
}

export enum PrescriptionStatus {
  PENDING = 'pending',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
}

export type Gender = 'male' | 'female' | 'other';

// Common API response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    message: string;
    statusCode: number;
  };
}

// Pagination interfaces
export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationResponse {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: PaginationResponse;
}

// Search parameters
export interface SearchParams {
  query: string;
  page?: number;
  limit?: number;
}

// Pagination utility functions
export interface PaginationOptions {
  page: number;
  limit: number;
  maxLimit?: number;
}

export function calculatePagination(page: number, limit: number, maxLimit: number = 100): { offset: number; limit: number; page: number } {
  const validPage = Math.max(1, page);
  const validLimit = Math.min(Math.max(1, limit), maxLimit);
  const offset = (validPage - 1) * validLimit;
  
  return {
    offset,
    limit: validLimit,
    page: validPage
  };
}

export function createPaginationResponse(page: number, limit: number, total: number): PaginationResponse {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
}

// Base entity interface
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// User base interface
export interface UserBase {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
}
