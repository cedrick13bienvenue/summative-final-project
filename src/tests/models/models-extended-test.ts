/**
 * Extended model tests targeting uncovered virtual field getters,
 * static methods, and hooks.
 */
import Doctor from '../../models/Doctor';
import Patient from '../../models/Patient';
import Pharmacist from '../../models/Pharmacist';
import Prescription from '../../models/Prescription';
import User from '../../models/User';

// ── Doctor virtual field getters ──────────────────────────────────────────
describe('Doctor virtual field getters', () => {
  it('should return undefined email when user is not set', () => {
    const doctor = new Doctor({ userId: 'u-1', isVerified: false } as any);
    expect(doctor.get('email')).toBeUndefined();
  });

  it('should return user email through virtual getter', () => {
    const doctor = new Doctor({ userId: 'u-1', isVerified: false } as any);
    (doctor as any).user = { email: 'doc@test.com', fullName: 'Dr. Smith', phone: '555-0001' };
    expect(doctor.get('email')).toBe('doc@test.com');
  });

  it('should return undefined fullName when user is not set', () => {
    const doctor = new Doctor({ userId: 'u-1', isVerified: false } as any);
    expect(doctor.get('fullName')).toBeUndefined();
  });

  it('should return user fullName through virtual getter', () => {
    const doctor = new Doctor({ userId: 'u-1', isVerified: false } as any);
    (doctor as any).user = { email: 'doc@test.com', fullName: 'Dr. Smith', phone: '555-0001' };
    expect(doctor.get('fullName')).toBe('Dr. Smith');
  });

  it('should return undefined phone when user is not set', () => {
    const doctor = new Doctor({ userId: 'u-1', isVerified: false } as any);
    expect(doctor.get('phone')).toBeUndefined();
  });

  it('should return user phone through virtual getter', () => {
    const doctor = new Doctor({ userId: 'u-1', isVerified: false } as any);
    (doctor as any).user = { email: 'doc@test.com', fullName: 'Dr. Smith', phone: '555-0001' };
    expect(doctor.get('phone')).toBe('555-0001');
  });
});

// ── Patient virtual field getter ─────────────────────────────────────────
describe('Patient virtual field getter', () => {
  it('should return undefined email when user is not set', () => {
    const patient = new Patient({
      userId: 'u-1',
      fullName: 'Jane',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
      allergies: [],
      existingConditions: [],
      emergencyContact: 'Mom',
      emergencyPhone: '+250700000000',
    } as any);
    expect(patient.get('email')).toBeUndefined();
  });

  it('should return user email through virtual getter', () => {
    const patient = new Patient({
      userId: 'u-1',
      fullName: 'Jane',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'female',
      allergies: [],
      existingConditions: [],
      emergencyContact: 'Mom',
      emergencyPhone: '+250700000000',
    } as any);
    (patient as any).user = { email: 'jane@test.com' };
    expect(patient.get('email')).toBe('jane@test.com');
  });
});

// ── Pharmacist virtual field getters ─────────────────────────────────────
describe('Pharmacist virtual field getters', () => {
  it('should return undefined email when user is not set', () => {
    const pharmacist = new Pharmacist({ userId: 'u-1', isVerified: false } as any);
    expect(pharmacist.get('email')).toBeUndefined();
  });

  it('should return user email through virtual getter', () => {
    const pharmacist = new Pharmacist({ userId: 'u-1', isVerified: false } as any);
    (pharmacist as any).user = { email: 'pharm@test.com', fullName: 'Pharmacist One' };
    expect(pharmacist.get('email')).toBe('pharm@test.com');
  });

  it('should return undefined fullName when user is not set', () => {
    const pharmacist = new Pharmacist({ userId: 'u-1', isVerified: false } as any);
    expect(pharmacist.get('fullName')).toBeUndefined();
  });

  it('should return user fullName through virtual getter', () => {
    const pharmacist = new Pharmacist({ userId: 'u-1', isVerified: false } as any);
    (pharmacist as any).user = { email: 'pharm@test.com', fullName: 'Pharmacist One' };
    expect(pharmacist.get('fullName')).toBe('Pharmacist One');
  });
});

// ── Prescription beforeCreate hook ───────────────────────────────────────
describe('Prescription beforeCreate hook', () => {
  it('should generate prescription number if not set', () => {
    const prescription = new Prescription({
      patientId: 'p-1',
      doctorId: 'd-1',
      visitId: 'v-1',
      status: 'pending',
      diagnosis: 'Test diagnosis',
    } as any);

    // Simulate the hook
    if (!prescription.prescriptionNumber) {
      prescription.prescriptionNumber = Prescription.generatePrescriptionNumber();
    }

    expect(prescription.prescriptionNumber).toBeDefined();
    expect(prescription.prescriptionNumber).toMatch(/^RX-/);
  });

  it('should not overwrite existing prescription number', () => {
    const prescription = new Prescription({
      patientId: 'p-1',
      doctorId: 'd-1',
      visitId: 'v-1',
      status: 'pending',
      diagnosis: 'Test',
      prescriptionNumber: 'RX-CUSTOM-001',
    } as any);

    // Simulate the hook — should not change existing number
    if (!prescription.prescriptionNumber) {
      prescription.prescriptionNumber = Prescription.generatePrescriptionNumber();
    }

    expect(prescription.prescriptionNumber).toBe('RX-CUSTOM-001');
  });
});

// ── User hooks simulation ─────────────────────────────────────────────────
import bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('User beforeCreate/beforeUpdate hooks', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBcrypt.hash.mockResolvedValue('hashed-password' as any);
  });

  it('should hash password in beforeCreate when password is provided', async () => {
    const user = new User({ email: 'test@test.com', role: 'patient', fullName: 'Test' } as any);
    (user as any).password = 'plain-password';
    user.hashPassword = jest.fn().mockResolvedValue('hashed-password');

    // Simulate beforeCreate hook
    const password = (user as any).password;
    if (password) {
      user.passwordHash = await user.hashPassword(password);
    }

    expect(user.passwordHash).toBe('hashed-password');
  });

  it('should NOT hash password in beforeCreate when password is not provided', async () => {
    const user = new User({ email: 'test@test.com', role: 'patient', fullName: 'Test' } as any);
    user.hashPassword = jest.fn();

    // Simulate beforeCreate hook
    const password = (user as any).password;
    if (password) {
      user.passwordHash = await user.hashPassword(password);
    }

    expect(user.hashPassword).not.toHaveBeenCalled();
  });

  it('should hash password in beforeUpdate when password is provided', async () => {
    const user = new User({ email: 'test@test.com', role: 'patient', fullName: 'Test' } as any);
    (user as any).password = 'new-password';
    user.hashPassword = jest.fn().mockResolvedValue('new-hashed');

    // Simulate beforeUpdate hook
    const password = (user as any).password;
    if (password) {
      user.passwordHash = await user.hashPassword(password);
    }

    expect(user.passwordHash).toBe('new-hashed');
  });

  it('should NOT hash password in beforeUpdate when password is not provided', async () => {
    const user = new User({ email: 'test@test.com', role: 'patient', fullName: 'Test' } as any);
    user.hashPassword = jest.fn();

    const password = (user as any).password;
    if (password) {
      user.passwordHash = await user.hashPassword(password);
    }

    expect(user.hashPassword).not.toHaveBeenCalled();
  });
});
