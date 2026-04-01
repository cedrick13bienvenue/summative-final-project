/**
 * Extended patientService tests - covers remaining branch gaps:
 * - createPrescription event system failure fallback (lines 547-570)
 * - createPrescription null prescriptionWithDoctor (line 609)
 * - createMedicalVisit null visitWithDoctor (line 330)
 * - registerPatient SequelizeUniqueConstraintError sub-branches
 */
import { PatientService } from '../../services/patientService';

jest.mock('../../models', () => {
  const UserMock: any = jest.fn().mockImplementation(() => ({
    hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
  }));
  UserMock.findOne = jest.fn();
  UserMock.findByPk = jest.fn();
  UserMock.create = jest.fn();
  UserMock.update = jest.fn();
  return {
    Patient: {
      create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(),
      findAll: jest.fn(), findAndCountAll: jest.fn(), update: jest.fn(), count: jest.fn(),
    },
    User: UserMock,
    MedicalVisit: { create: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(), count: jest.fn() },
    Prescription: {
      create: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(),
      count: jest.fn(), generatePrescriptionNumber: jest.fn().mockReturnValue('RX-EXT2-001'),
    },
    PrescriptionItem: { create: jest.fn() },
    UserRole: { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient', PHARMACIST: 'pharmacist' },
  };
});

jest.mock('../../models/Doctor', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  __esModule: true,
}));

jest.mock('../../models/MedicalVisit', () => ({
  default: { create: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(), count: jest.fn() },
  VisitType: { CONSULTATION: 'consultation', EMERGENCY: 'emergency', FOLLOWUP: 'followup' },
  __esModule: true,
}));

jest.mock('../../models/Prescription', () => ({
  default: {
    create: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(),
    count: jest.fn(), generatePrescriptionNumber: jest.fn().mockReturnValue('RX-EXT2-001'),
  },
  PrescriptionStatus: {
    PENDING: 'pending', FULFILLED: 'fulfilled', CANCELLED: 'cancelled',
    SCANNED: 'scanned', VALIDATED: 'validated', DISPENSED: 'dispensed', REJECTED: 'rejected',
  },
  __esModule: true,
}));

jest.mock('../../models/Patient', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
  __esModule: true,
}));

jest.mock('../../models/PrescriptionItem', () => ({
  default: { create: jest.fn() },
  __esModule: true,
}));

jest.mock('../../services/qrCodeService', () => ({
  QRCodeService: { generateQRCode: jest.fn() },
}));

jest.mock('../../services/emailService', () => ({
  EmailService: { sendPrescriptionEmail: jest.fn() },
}));

jest.mock('../../services/eventService', () => ({
  eventService: { emitPrescriptionCreated: jest.fn() },
}));

jest.mock('../../database/config/database', () => ({
  sequelize: {
    transaction: jest.fn().mockResolvedValue({
      commit: jest.fn().mockResolvedValue(undefined),
      rollback: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

import { Patient, User, MedicalVisit, Prescription, PrescriptionItem } from '../../models';
import Doctor from '../../models/Doctor';

const MockPatient = Patient as jest.Mocked<typeof Patient>;
const MockUser = User as any;
const MockMedicalVisit = MedicalVisit as jest.Mocked<typeof MedicalVisit>;
const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPrescriptionItem = PrescriptionItem as jest.Mocked<typeof PrescriptionItem>;
const MockDoctor = Doctor as jest.Mocked<typeof Doctor>;

beforeEach(() => jest.clearAllMocks());

// ── registerPatient - SequelizeUniqueConstraintError sub-branches ──────────
describe('PatientService.registerPatient - error branches', () => {
  const baseData = {
    email: 'test@test.com', password: 'password123', fullName: 'Test User',
    dateOfBirth: '1990-01-01', gender: 'male' as any, emergencyContact: 'Mom', emergencyPhone: '+250700000001',
  };

  it('should throw "Email already exists" for email constraint', async () => {
    const err: any = new Error('unique');
    err.name = 'SequelizeUniqueConstraintError';
    err.errors = [{ path: 'email' }];
    MockUser.create.mockRejectedValue(err);
    await expect(PatientService.registerPatient(baseData)).rejects.toThrow('Email already exists');
  });

  it('should throw "Insurance number already exists" for insurance constraint', async () => {
    const err: any = new Error('unique');
    err.name = 'SequelizeUniqueConstraintError';
    err.errors = [{ path: 'insurance_number' }];
    MockUser.create.mockRejectedValue(err);
    await expect(PatientService.registerPatient(baseData)).rejects.toThrow('Insurance number already exists');
  });

  it('should throw generic "already exists" for other unique constraints', async () => {
    const err: any = new Error('unique');
    err.name = 'SequelizeUniqueConstraintError';
    err.errors = [{ path: 'phone' }];
    MockUser.create.mockRejectedValue(err);
    await expect(PatientService.registerPatient(baseData)).rejects.toThrow('A record with this information already exists');
  });

  it('should throw "Validation failed" for SequelizeValidationError', async () => {
    const err: any = new Error('validation');
    err.name = 'SequelizeValidationError';
    err.errors = [{ message: 'email must be valid' }, { message: 'too short' }];
    MockUser.create.mockRejectedValue(err);
    await expect(PatientService.registerPatient(baseData)).rejects.toThrow('Validation failed');
  });

  it('should throw "Patient registration failed" for generic errors', async () => {
    MockUser.create.mockRejectedValue(new Error('DB crash'));
    await expect(PatientService.registerPatient(baseData)).rejects.toThrow('Patient registration failed');
  });

  it('should throw for SequelizeUniqueConstraintError with empty errors array', async () => {
    const err: any = new Error('unique');
    err.name = 'SequelizeUniqueConstraintError';
    err.errors = []; // empty - path check will fail gracefully
    MockUser.create.mockRejectedValue(err);
    await expect(PatientService.registerPatient(baseData)).rejects.toThrow('A record with this information already exists');
  });
});

// ── createMedicalVisit - null visitWithDoctor ─────────────────────────────
describe('PatientService.createMedicalVisit - null visitWithDoctor', () => {
  it('should throw when MedicalVisit.findByPk returns null', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: {} } as any);
    MockMedicalVisit.create.mockResolvedValue({ id: 'v-001' } as any);
    MockMedicalVisit.findByPk.mockResolvedValue(null); // null → throw

    await expect(PatientService.createMedicalVisit({
      patientId: 'p-1', doctorId: 'doc-001', visitDate: new Date(),
      visitType: 'consultation' as any, chiefComplaint: 'Test',
    })).rejects.toThrow('Failed to retrieve medical visit');
  });
});

// ── createPrescription - event system failure fallback ────────────────────
describe('PatientService.createPrescription - event fallback', () => {
  it('should send email directly when eventService throws', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    MockPatient.findByPk.mockResolvedValue({
      id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com', nationalId: '123' },
    } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: { fullName: 'Dr. A' } } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({ id: 'v-001' } as any);
    MockPrescription.create.mockResolvedValue({
      id: 'presc-001', prescriptionNumber: 'RX-001', update: mockUpdate,
    } as any);
    MockPrescriptionItem.create.mockResolvedValue({} as any);

    const { QRCodeService } = require('../../services/qrCodeService');
    QRCodeService.generateQRCode.mockResolvedValue({
      qrHash: 'qr-hash', qrCodeImage: 'data:image/png;base64,abc',
      expiresAt: new Date(Date.now() + 86400000),
    });

    // eventService throws → triggers fallback email
    const { eventService } = require('../../services/eventService');
    eventService.emitPrescriptionCreated.mockImplementation(() => {
      throw new Error('EventEmitter failed');
    });

    // fallback: Patient.findByPk for the email
    MockPatient.findByPk
      .mockResolvedValueOnce({
        id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com', nationalId: '123' },
      } as any) // first call: verify patient exists
      .mockResolvedValueOnce({
        id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com', nationalId: '123' },
      } as any); // second call: fallback email

    const { EmailService } = require('../../services/emailService');
    EmailService.sendPrescriptionEmail.mockResolvedValue(true);

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', doctor: { user: { fullName: 'Dr. A' } }, patient: { user: {} }, items: [],
    } as any);

    const result = await PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'doc-001', visitId: 'v-001', diagnosis: 'Flu',
      items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
    });
    expect(result).toBeDefined();
    expect(EmailService.sendPrescriptionEmail).toHaveBeenCalled();
  });

  it('should handle fallback email failure gracefully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    MockPatient.findByPk.mockResolvedValue({
      id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com', nationalId: '123' },
    } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: { fullName: 'Dr. A' } } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({ id: 'v-001' } as any);
    MockPrescription.create.mockResolvedValue({
      id: 'presc-001', prescriptionNumber: 'RX-001', update: mockUpdate,
    } as any);
    MockPrescriptionItem.create.mockResolvedValue({} as any);

    const { QRCodeService } = require('../../services/qrCodeService');
    QRCodeService.generateQRCode.mockResolvedValue({
      qrHash: 'qr-hash', qrCodeImage: 'img', expiresAt: new Date(Date.now() + 86400000),
    });

    const { eventService } = require('../../services/eventService');
    eventService.emitPrescriptionCreated.mockImplementation(() => {
      throw new Error('event failed');
    });

    // fallback also fails
    const { EmailService } = require('../../services/emailService');
    EmailService.sendPrescriptionEmail.mockRejectedValue(new Error('SMTP down'));

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', doctor: { user: {} }, patient: { user: {} }, items: [],
    } as any);

    // Should still succeed - fallback email failure is swallowed
    const result = await PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'doc-001', visitId: 'v-001', diagnosis: 'Flu',
      items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
    });
    expect(result).toBeDefined();
  });
});

// ── createPrescription - null prescriptionWithDoctor ─────────────────────
describe('PatientService.createPrescription - null prescriptionWithDoctor', () => {
  it('should throw when Prescription.findByPk returns null at end', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: {} } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({ id: 'v-001' } as any);
    MockPrescription.create.mockResolvedValue({
      id: 'presc-001', prescriptionNumber: 'RX-001', update: jest.fn(),
    } as any);
    MockPrescriptionItem.create.mockResolvedValue({} as any);

    const { QRCodeService } = require('../../services/qrCodeService');
    QRCodeService.generateQRCode.mockRejectedValue(new Error('QR fail'));

    // Final findByPk returns null → throws
    MockPrescription.findByPk.mockResolvedValue(null);

    await expect(PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'doc-001', visitId: 'v-001', diagnosis: 'Flu',
      items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
    })).rejects.toThrow('Failed to retrieve prescription');
  });
});
