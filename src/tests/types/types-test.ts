// Tests for types/index.ts re-exports and types/common.ts utility functions
import { calculatePagination, createPaginationResponse, UserRole, VisitType, PrescriptionStatus } from '../../types/common';

// Trigger import of types/index.ts (re-exports all types)
import * as TypesIndex from '../../types/index';

describe('types/index.ts - re-exports', () => {
  it('should export UserRole', () => {
    expect(TypesIndex.UserRole).toBeDefined();
  });

  it('should export calculatePagination', () => {
    expect(typeof TypesIndex.calculatePagination).toBe('function');
  });

  it('should export createPaginationResponse', () => {
    expect(typeof TypesIndex.createPaginationResponse).toBe('function');
  });
});

describe('calculatePagination', () => {
  it('should calculate correct offset for page 1', () => {
    const result = calculatePagination(1, 10);
    expect(result.offset).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
  });

  it('should calculate correct offset for page 3 with limit 10', () => {
    const result = calculatePagination(3, 10);
    expect(result.offset).toBe(20);
  });

  it('should enforce minimum page of 1 for page 0', () => {
    const result = calculatePagination(0, 10);
    expect(result.page).toBe(1);
    expect(result.offset).toBe(0);
  });

  it('should enforce minimum page of 1 for negative page', () => {
    const result = calculatePagination(-5, 10);
    expect(result.page).toBe(1);
  });

  it('should cap limit at maxLimit (default 100)', () => {
    const result = calculatePagination(1, 200);
    expect(result.limit).toBe(100);
  });

  it('should cap limit at custom maxLimit', () => {
    const result = calculatePagination(1, 50, 20);
    expect(result.limit).toBe(20);
  });

  it('should enforce minimum limit of 1', () => {
    const result = calculatePagination(1, 0);
    expect(result.limit).toBe(1);
  });
});

describe('createPaginationResponse', () => {
  it('should create correct pagination for page 1 of 3', () => {
    const result = createPaginationResponse(1, 10, 25);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(10);
    expect(result.total).toBe(25);
    expect(result.totalPages).toBe(3);
    expect(result.hasNextPage).toBe(true);
    expect(result.hasPrevPage).toBe(false);
  });

  it('should have hasPrevPage true for page 2', () => {
    const result = createPaginationResponse(2, 10, 25);
    expect(result.hasPrevPage).toBe(true);
    expect(result.hasNextPage).toBe(true);
  });

  it('should have hasNextPage false on last page', () => {
    const result = createPaginationResponse(3, 10, 25);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(true);
  });

  it('should handle single page result', () => {
    const result = createPaginationResponse(1, 10, 5);
    expect(result.totalPages).toBe(1);
    expect(result.hasNextPage).toBe(false);
    expect(result.hasPrevPage).toBe(false);
  });
});

describe('UserRole enum', () => {
  it('should have correct values', () => {
    expect(UserRole.ADMIN).toBe('admin');
    expect(UserRole.DOCTOR).toBe('doctor');
    expect(UserRole.PATIENT).toBe('patient');
    expect(UserRole.PHARMACIST).toBe('pharmacist');
  });
});

describe('VisitType enum', () => {
  it('should have correct values', () => {
    expect(VisitType.CONSULTATION).toBe('consultation');
    expect(VisitType.EMERGENCY).toBe('emergency');
    expect(VisitType.FOLLOWUP).toBe('followup');
  });
});

describe('PrescriptionStatus enum', () => {
  it('should have correct values', () => {
    expect(PrescriptionStatus.PENDING).toBe('pending');
    expect(PrescriptionStatus.FILLED).toBe('filled');
    expect(PrescriptionStatus.CANCELLED).toBe('cancelled');
  });
});
