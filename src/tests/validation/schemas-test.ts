import {
  userRegistrationSchema,
  userLoginSchema,
  passwordChangeSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  patientRegistrationSchema,
  patientUpdateSchema,
  doctorRegistrationSchema,
  doctorUpdateSchema,
  medicalVisitSchema,
  prescriptionItemSchema,
  prescriptionSchema,
  prescriptionUpdateSchema,
  qrCodeVerificationSchema,
  searchQuerySchema,
  paginationSchema,
  advancedPaginationSchema,
  medicalHistoryPaginationSchema,
  userIdParamSchema,
  patientIdParamSchema,
  doctorIdParamSchema,
  prescriptionIdParamSchema,
  pharmacistIdParamSchema,
  nationalIdParamSchema,
  emailTestSchema,
  otpVerificationSchema,
  medicalHistoryWithOTPSchema,
  validationOptions,
  customMessages,
} from '../../validation/schemas';

jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
}));

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_NATIONAL_ID = '1234567890123456';

describe('validationOptions', () => {
  it('should have abortEarly false', () => {
    expect(validationOptions.abortEarly).toBe(false);
  });

  it('should have allowUnknown false', () => {
    expect(validationOptions.allowUnknown).toBe(false);
  });

  it('should have stripUnknown true', () => {
    expect(validationOptions.stripUnknown).toBe(true);
  });
});

describe('customMessages', () => {
  it('should define custom error messages', () => {
    expect(customMessages['string.email']).toBeDefined();
    expect(customMessages['any.required']).toBeDefined();
  });
});

describe('userLoginSchema', () => {
  it('should pass with valid data', () => {
    const { error } = userLoginSchema.validate({ email: 'a@b.com', password: 'pass123' });
    expect(error).toBeUndefined();
  });

  it('should fail without email', () => {
    const { error } = userLoginSchema.validate({ password: 'pass123' });
    expect(error).toBeDefined();
  });

  it('should fail without password', () => {
    const { error } = userLoginSchema.validate({ email: 'a@b.com' });
    expect(error).toBeDefined();
  });

  it('should fail with invalid email', () => {
    const { error } = userLoginSchema.validate({ email: 'not-email', password: 'pass' });
    expect(error).toBeDefined();
  });
});

describe('userRegistrationSchema', () => {
  const valid = {
    email: 'test@test.com',
    password: 'Password1',
    fullName: 'Test User',
    role: 'patient',
  };

  it('should pass with valid data', () => {
    const { error } = userRegistrationSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail without role', () => {
    const { error } = userRegistrationSchema.validate({ ...valid, role: undefined });
    expect(error).toBeDefined();
  });

  it('should fail with invalid role', () => {
    const { error } = userRegistrationSchema.validate({ ...valid, role: 'superadmin' });
    expect(error).toBeDefined();
  });

  it('should fail with short fullName', () => {
    const { error } = userRegistrationSchema.validate({ ...valid, fullName: 'A' });
    expect(error).toBeDefined();
  });

  it('should pass with optional phone', () => {
    const { error } = userRegistrationSchema.validate({ ...valid, phone: '+250788000000' });
    expect(error).toBeUndefined();
  });
});

describe('passwordChangeSchema', () => {
  it('should pass with valid data', () => {
    const { error } = passwordChangeSchema.validate({ currentPassword: 'old', newPassword: 'NewPass1' });
    expect(error).toBeUndefined();
  });

  it('should fail without currentPassword', () => {
    const { error } = passwordChangeSchema.validate({ newPassword: 'NewPass1' });
    expect(error).toBeDefined();
  });
});

describe('passwordResetRequestSchema', () => {
  it('should pass with valid email', () => {
    const { error } = passwordResetRequestSchema.validate({ email: 'a@b.com' });
    expect(error).toBeUndefined();
  });

  it('should fail with invalid email', () => {
    const { error } = passwordResetRequestSchema.validate({ email: 'bad' });
    expect(error).toBeDefined();
  });
});

describe('passwordResetSchema', () => {
  it('should pass with valid data', () => {
    const { error } = passwordResetSchema.validate({
      email: 'a@b.com',
      otpCode: '123456',
      newPassword: 'NewPass1',
    });
    expect(error).toBeUndefined();
  });

  it('should fail with invalid otpCode', () => {
    const { error } = passwordResetSchema.validate({ email: 'a@b.com', otpCode: '12', newPassword: 'NewPass1' });
    expect(error).toBeDefined();
  });
});

describe('patientRegistrationSchema', () => {
  const valid = {
    email: 'p@test.com',
    password: 'Password1',
    fullName: 'Patient Name',
    dateOfBirth: '1990-01-01',
    gender: 'male',
    emergencyContact: 'Emergency Person',
    emergencyPhone: '+250788000001',
  };

  it('should pass with valid data', () => {
    const { error } = patientRegistrationSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail without gender', () => {
    const { error } = patientRegistrationSchema.validate({ ...valid, gender: undefined });
    expect(error).toBeDefined();
  });

  it('should fail with invalid gender', () => {
    const { error } = patientRegistrationSchema.validate({ ...valid, gender: 'unknown' });
    expect(error).toBeDefined();
  });

  it('should fail with future dateOfBirth', () => {
    const { error } = patientRegistrationSchema.validate({ ...valid, dateOfBirth: '2099-01-01' });
    expect(error).toBeDefined();
  });

  it('should pass with optional allergies array', () => {
    const { error } = patientRegistrationSchema.validate({ ...valid, allergies: ['penicillin'] });
    expect(error).toBeUndefined();
  });
});

describe('patientUpdateSchema', () => {
  it('should pass with all optional fields', () => {
    const { error } = patientUpdateSchema.validate({ fullName: 'Updated Name' });
    expect(error).toBeUndefined();
  });

  it('should pass with empty object', () => {
    const { error } = patientUpdateSchema.validate({});
    expect(error).toBeUndefined();
  });
});

describe('doctorRegistrationSchema', () => {
  const valid = {
    email: 'd@test.com',
    password: 'Password1',
    fullName: 'Dr. Doctor',
  };

  it('should pass with valid data', () => {
    const { error } = doctorRegistrationSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail without email', () => {
    const { error } = doctorRegistrationSchema.validate({ ...valid, email: undefined });
    expect(error).toBeDefined();
  });
});

describe('doctorUpdateSchema', () => {
  it('should pass with valid optional fields', () => {
    const { error } = doctorUpdateSchema.validate({ specialization: 'Cardiology' });
    expect(error).toBeUndefined();
  });

  it('should pass with empty object', () => {
    const { error } = doctorUpdateSchema.validate({});
    expect(error).toBeUndefined();
  });

  it('should fail with invalid isVerified type', () => {
    const { error } = doctorUpdateSchema.validate({ isVerified: 'yes' });
    expect(error).toBeDefined();
  });
});

describe('medicalVisitSchema', () => {
  const valid = {
    doctorId: VALID_UUID,
    visitDate: '2023-01-01',
    visitType: 'consultation',
    chiefComplaint: 'Head hurts badly',
  };

  it('should pass with valid data', () => {
    const { error } = medicalVisitSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail with invalid visitType', () => {
    const { error } = medicalVisitSchema.validate({ ...valid, visitType: 'invalid' });
    expect(error).toBeDefined();
  });

  it('should fail with short chiefComplaint', () => {
    const { error } = medicalVisitSchema.validate({ ...valid, chiefComplaint: 'X' });
    expect(error).toBeDefined();
  });

  it('should pass with optional vitalSigns', () => {
    const { error } = medicalVisitSchema.validate({
      ...valid,
      vitalSigns: { heartRate: 72, temperature: 98.6 },
    });
    expect(error).toBeUndefined();
  });
});

describe('prescriptionItemSchema', () => {
  const valid = {
    medicineName: 'Paracetamol',
    dosage: '500mg',
    frequency: 'twice daily',
    quantity: 10,
  };

  it('should pass with valid data', () => {
    const { error } = prescriptionItemSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail without quantity', () => {
    const { error } = prescriptionItemSchema.validate({ ...valid, quantity: undefined });
    expect(error).toBeDefined();
  });

  it('should fail with quantity over 1000', () => {
    const { error } = prescriptionItemSchema.validate({ ...valid, quantity: 1001 });
    expect(error).toBeDefined();
  });
});

describe('prescriptionSchema', () => {
  const valid = {
    doctorId: VALID_UUID,
    visitId: VALID_UUID,
    diagnosis: 'Acute migraine headache',
    items: [{ medicineName: 'Ibuprofen', dosage: '400mg', frequency: 'daily', quantity: 5 }],
  };

  it('should pass with valid data', () => {
    const { error } = prescriptionSchema.validate(valid);
    expect(error).toBeUndefined();
  });

  it('should fail with empty items array', () => {
    const { error } = prescriptionSchema.validate({ ...valid, items: [] });
    expect(error).toBeDefined();
  });

  it('should fail without diagnosis', () => {
    const { error } = prescriptionSchema.validate({ ...valid, diagnosis: undefined });
    expect(error).toBeDefined();
  });
});

describe('prescriptionUpdateSchema', () => {
  it('should pass with optional status', () => {
    const { error } = prescriptionUpdateSchema.validate({ status: 'fulfilled' });
    expect(error).toBeUndefined();
  });

  it('should fail with invalid status', () => {
    const { error } = prescriptionUpdateSchema.validate({ status: 'unknown' });
    expect(error).toBeDefined();
  });
});

describe('qrCodeVerificationSchema', () => {
  it('should pass with valid 32-char hex hash', () => {
    const { error } = qrCodeVerificationSchema.validate({ qrHash: 'a'.repeat(32) });
    expect(error).toBeUndefined();
  });

  it('should fail with wrong length', () => {
    const { error } = qrCodeVerificationSchema.validate({ qrHash: 'abc' });
    expect(error).toBeDefined();
  });

  it('should fail with non-hex characters', () => {
    const { error } = qrCodeVerificationSchema.validate({ qrHash: 'Z'.repeat(32) });
    expect(error).toBeDefined();
  });
});

describe('searchQuerySchema', () => {
  it('should pass with valid query', () => {
    const { error } = searchQuerySchema.validate({ query: 'diabetes' });
    expect(error).toBeUndefined();
  });

  it('should fail with too short query', () => {
    const { error } = searchQuerySchema.validate({ query: 'a' });
    expect(error).toBeDefined();
  });

  it('should apply default page and limit', () => {
    const { value } = searchQuerySchema.validate({ query: 'test query' });
    expect(value.page).toBe(1);
    expect(value.limit).toBe(10);
  });
});

describe('paginationSchema', () => {
  it('should apply defaults', () => {
    const { value } = paginationSchema.validate({});
    expect(value.page).toBe(1);
    expect(value.limit).toBe(10);
  });

  it('should fail with limit over 100', () => {
    const { error } = paginationSchema.validate({ limit: 101 });
    expect(error).toBeDefined();
  });
});

describe('advancedPaginationSchema', () => {
  it('should pass with valid sortBy', () => {
    const { error } = advancedPaginationSchema.validate({ sortBy: 'createdAt' });
    expect(error).toBeUndefined();
  });

  it('should fail with invalid sortBy', () => {
    const { error } = advancedPaginationSchema.validate({ sortBy: 'invalidField' });
    expect(error).toBeDefined();
  });
});

describe('medicalHistoryPaginationSchema', () => {
  it('should pass with defaults', () => {
    const { value } = medicalHistoryPaginationSchema.validate({});
    expect(value.type).toBe('all');
  });

  it('should fail with invalid type', () => {
    const { error } = medicalHistoryPaginationSchema.validate({ type: 'notes' });
    expect(error).toBeDefined();
  });
});

describe('ID parameter schemas', () => {
  it('userIdParamSchema should pass with valid UUID', () => {
    const { error } = userIdParamSchema.validate({ userId: VALID_UUID });
    expect(error).toBeUndefined();
  });

  it('patientIdParamSchema should pass with valid UUID', () => {
    const { error } = patientIdParamSchema.validate({ patientId: VALID_UUID });
    expect(error).toBeUndefined();
  });

  it('doctorIdParamSchema should pass with valid UUID', () => {
    const { error } = doctorIdParamSchema.validate({ doctorId: VALID_UUID });
    expect(error).toBeUndefined();
  });

  it('prescriptionIdParamSchema should pass with valid UUID', () => {
    const { error } = prescriptionIdParamSchema.validate({ prescriptionId: VALID_UUID });
    expect(error).toBeUndefined();
  });

  it('pharmacistIdParamSchema should pass with valid UUID', () => {
    const { error } = pharmacistIdParamSchema.validate({ pharmacistId: VALID_UUID });
    expect(error).toBeUndefined();
  });

  it('nationalIdParamSchema should pass with 16-digit ID', () => {
    const { error } = nationalIdParamSchema.validate({ nationalId: VALID_NATIONAL_ID });
    expect(error).toBeUndefined();
  });

  it('nationalIdParamSchema should fail with non-16-digit ID', () => {
    const { error } = nationalIdParamSchema.validate({ nationalId: '12345' });
    expect(error).toBeDefined();
  });
});

describe('emailTestSchema', () => {
  it('should pass with valid data', () => {
    const { error } = emailTestSchema.validate({ email: 'a@b.com', name: 'Test Name' });
    expect(error).toBeUndefined();
  });

  it('should fail without name', () => {
    const { error } = emailTestSchema.validate({ email: 'a@b.com' });
    expect(error).toBeDefined();
  });
});

describe('otpVerificationSchema', () => {
  it('should pass with 6-digit code', () => {
    const { error } = otpVerificationSchema.validate({ otpCode: '123456' });
    expect(error).toBeUndefined();
  });

  it('should fail with non-numeric code', () => {
    const { error } = otpVerificationSchema.validate({ otpCode: 'abc123' });
    expect(error).toBeDefined();
  });

  it('should fail with wrong length', () => {
    const { error } = otpVerificationSchema.validate({ otpCode: '123' });
    expect(error).toBeDefined();
  });
});

describe('medicalHistoryWithOTPSchema', () => {
  it('should pass with required otpCode', () => {
    const { error } = medicalHistoryWithOTPSchema.validate({ otpCode: '654321' });
    expect(error).toBeUndefined();
  });

  it('should fail without otpCode', () => {
    const { error } = medicalHistoryWithOTPSchema.validate({});
    expect(error).toBeDefined();
  });
});
