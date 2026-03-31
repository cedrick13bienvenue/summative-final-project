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
    MedicalVisit: {
      create: jest.fn(), findByPk: jest.fn(),
      findAndCountAll: jest.fn(), count: jest.fn(),
    },
    Prescription: {
      create: jest.fn(), findByPk: jest.fn(), findAndCountAll: jest.fn(),
      count: jest.fn(), generatePrescriptionNumber: jest.fn().mockReturnValue('RX-EXT-001'),
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
    count: jest.fn(), generatePrescriptionNumber: jest.fn().mockReturnValue('RX-EXT-001'),
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

// patientService imports MedicalVisit, Prescription, PrescriptionItem from '../models'
// so we use the ../../models mock objects for these
const MockPatient = Patient as jest.Mocked<typeof Patient>;
const MockUser = User as any;
const MockMedicalVisit = MedicalVisit as jest.Mocked<typeof MedicalVisit>;
const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPrescriptionItem = PrescriptionItem as jest.Mocked<typeof PrescriptionItem>;
const MockDoctor = Doctor as jest.Mocked<typeof Doctor>;

beforeEach(() => jest.clearAllMocks());

// ── getAllPatients ──────────────────────────────────────────────────────────
describe('PatientService.getAllPatients', () => {
  it('should return patients and total count', async () => {
    const mockPatient = {
      id: 'p-1', fullName: 'Jane Doe', dateOfBirth: new Date('1990-01-01'),
      gender: 'female', insuranceProvider: 'RSSB', insuranceNumber: 'INS-001',
      allergies: [], existingConditions: [], emergencyContact: 'Mom',
      emergencyPhone: '+250700000001', createdAt: new Date(), updatedAt: new Date(),
      user: { phone: '+250788001', isActive: true },
    };
    MockPatient.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockPatient as any] } as any);
    const result = await PatientService.getAllPatients(10, 0);
    expect(result.total).toBe(1);
    expect(result.patients[0].fullName).toBe('Jane Doe');
  });

  it('should return empty list when no patients', async () => {
    MockPatient.findAndCountAll.mockResolvedValue({ count: 0, rows: [] } as any);
    const result = await PatientService.getAllPatients();
    expect(result.total).toBe(0);
  });
});

// ── getPatientByNationalId - inactive user ────────────────────────────────
describe('PatientService.getPatientByNationalId', () => {
  it('should return null when user is inactive', async () => {
    MockPatient.findOne.mockResolvedValue({
      id: 'p-1',
      user: { isActive: false, nationalId: '1234', phone: '' },
    } as any);
    const result = await PatientService.getPatientByNationalId('1234');
    expect(result).toBeNull();
  });

  it('should return null when user is missing', async () => {
    MockPatient.findOne.mockResolvedValue({ id: 'p-1', user: null } as any);
    const result = await PatientService.getPatientByNationalId('1234');
    expect(result).toBeNull();
  });

  it('should return patient profile when user is active', async () => {
    MockPatient.findOne.mockResolvedValue({
      id: 'p-1', fullName: 'Jane Doe', dateOfBirth: new Date('1990-01-01'),
      gender: 'female', insuranceProvider: '', insuranceNumber: '',
      allergies: [], existingConditions: [], emergencyContact: '', emergencyPhone: '',
      createdAt: new Date(), updatedAt: new Date(),
      user: { isActive: true, nationalId: '1234', phone: '+250788001' },
    } as any);
    const result = await PatientService.getPatientByNationalId('1234');
    expect(result).not.toBeNull();
    expect(result!.fullName).toBe('Jane Doe');
  });
});

// ── getPatientById - inactive user ────────────────────────────────────────
describe('PatientService.getPatientById', () => {
  it('should return null when user is inactive', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1', user: { isActive: false, phone: '' } } as any);
    const result = await PatientService.getPatientById('p-1');
    expect(result).toBeNull();
  });

  it('should return null when user is missing', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1', user: null } as any);
    const result = await PatientService.getPatientById('p-1');
    expect(result).toBeNull();
  });
});

// ── updatePatient - with phone ────────────────────────────────────────────
describe('PatientService.updatePatient', () => {
  it('should update patient phone via User.update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    MockPatient.findByPk
      .mockResolvedValueOnce({ id: 'p-1', userId: 'u-1', update: mockUpdate } as any)
      .mockResolvedValueOnce({
        id: 'p-1', fullName: 'Jane', dateOfBirth: new Date(), gender: 'female',
        insuranceProvider: '', insuranceNumber: '', allergies: [], existingConditions: [],
        emergencyContact: '', emergencyPhone: '', createdAt: new Date(), updatedAt: new Date(),
        user: { isActive: true, phone: '+250788002' },
      } as any);
    MockUser.update.mockResolvedValue([1]);
    const result = await PatientService.updatePatient('p-1', { fullName: 'Jane', phone: '+250788002' });
    expect(MockUser.update).toHaveBeenCalled();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should throw when patient not found', async () => {
    MockPatient.findByPk.mockResolvedValue(null);
    await expect(PatientService.updatePatient('ghost', { fullName: 'X' })).rejects.toThrow('Patient not found');
  });
});

// ── getPatientMedicalHistory ──────────────────────────────────────────────
describe('PatientService.getPatientMedicalHistory', () => {
  const visitRow = {
    id: 'v-1', visitDate: new Date(), visitType: 'consultation', chiefComplaint: 'Headache',
    symptoms: '', diagnosis: '', treatmentNotes: '', recommendations: '',
    doctor: { user: { fullName: 'Dr. A', email: 'doc@t.com' } }, createdAt: new Date(),
  };
  const prescRow = {
    id: 'presc-1', prescriptionNumber: 'RX-001', diagnosis: 'Flu', doctorNotes: '',
    status: 'pending', items: [],
    doctor: { user: { fullName: 'Dr. A', email: 'doc@t.com' } }, createdAt: new Date(),
  };

  it('should return visits only when type=visits', async () => {
    MockMedicalVisit.findAndCountAll.mockResolvedValue({ count: 1, rows: [visitRow as any] } as any);
    const result = await PatientService.getPatientMedicalHistory('p-1', 1, 10, 'visits');
    expect(result.visits).toHaveLength(1);
    expect(result.prescriptions).toBeUndefined();
    expect(result.total).toBe(1);
  });

  it('should return prescriptions only when type=prescriptions', async () => {
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 1, rows: [prescRow as any] } as any);
    const result = await PatientService.getPatientMedicalHistory('p-1', 1, 10, 'prescriptions');
    expect(result.prescriptions).toHaveLength(1);
    expect(result.visits).toBeUndefined();
    expect(result.total).toBe(1);
  });

  it('should return both when type=all', async () => {
    MockMedicalVisit.findAndCountAll.mockResolvedValue({ count: 1, rows: [visitRow as any] } as any);
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 1, rows: [prescRow as any] } as any);
    MockMedicalVisit.count.mockResolvedValue(1 as any);
    MockPrescription.count.mockResolvedValue(1 as any);
    const result = await PatientService.getPatientMedicalHistory('p-1', 1, 10, 'all');
    expect(result.visits).toHaveLength(1);
    expect(result.prescriptions).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('should sort by visitDate when sortBy=visitDate and type=visits', async () => {
    MockMedicalVisit.findAndCountAll.mockResolvedValue({ count: 0, rows: [] } as any);
    const result = await PatientService.getPatientMedicalHistory('p-1', 1, 10, 'visits', 'visitDate', 'ASC');
    expect(MockMedicalVisit.findAndCountAll).toHaveBeenCalled();
    expect(result.visits).toHaveLength(0);
  });

  it('should handle hasPrevPage=true on page 2', async () => {
    MockMedicalVisit.findAndCountAll.mockResolvedValue({ count: 20, rows: [] } as any);
    MockMedicalVisit.count.mockResolvedValue(20 as any);
    MockPrescription.count.mockResolvedValue(0 as any);
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 0, rows: [] } as any);
    const result = await PatientService.getPatientMedicalHistory('p-1', 2, 10, 'all');
    expect(result.pagination.hasPrevPage).toBe(true);
  });
});

// ── getAllPrescriptions ────────────────────────────────────────────────────
describe('PatientService.getAllPrescriptions', () => {
  const mockPresc = {
    id: 'presc-1', prescriptionNumber: 'RX-001', diagnosis: 'Flu',
    doctorNotes: '', status: 'pending', qrCodeHash: 'hash',
    items: [{ id: 'i-1', medicineName: 'Med', dosage: '10mg', frequency: 'once', quantity: 1, instructions: '' }],
    doctor: {
      user: { fullName: 'Dr. A', email: 'doc@t.com', phone: '' },
      specialization: 'General', hospitalName: 'H',
    },
    patient: { id: 'p-1', fullName: 'Jane', insuranceProvider: '', insuranceNumber: '', user: { email: 'j@t.com' } },
    createdAt: new Date(), updatedAt: new Date(),
  };

  it('should return all prescriptions without status filter', async () => {
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 1, rows: [mockPresc as any] } as any);
    const result = await PatientService.getAllPrescriptions(10, 0);
    expect(result.total).toBe(1);
    expect(result.prescriptions).toHaveLength(1);
  });

  it('should filter by valid status', async () => {
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 0, rows: [] } as any);
    const result = await PatientService.getAllPrescriptions(10, 0, 'createdAt', 'DESC', 'pending');
    expect(result.total).toBe(0);
  });

  it('should ignore invalid status', async () => {
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 0, rows: [] } as any);
    await PatientService.getAllPrescriptions(10, 0, 'createdAt', 'DESC', 'bad-status');
    expect(MockPrescription.findAndCountAll).toHaveBeenCalled();
  });

  it('should handle prescription with null items', async () => {
    const prescNoItems = { ...mockPresc, items: null, doctor: { user: {} }, patient: { user: {} } };
    MockPrescription.findAndCountAll.mockResolvedValue({ count: 1, rows: [prescNoItems as any] } as any);
    const result = await PatientService.getAllPrescriptions(10, 0);
    expect(result.prescriptions[0].items).toHaveLength(0);
  });
});

// ── getPatientByUserId ────────────────────────────────────────────────────
describe('PatientService.getPatientByUserId', () => {
  it('should return patient profile when found', async () => {
    MockPatient.findOne.mockResolvedValue({
      id: 'p-1', fullName: 'Jane Doe', dateOfBirth: new Date('1990-01-01'),
      gender: 'female', insuranceProvider: '', insuranceNumber: '',
      allergies: [], existingConditions: [], emergencyContact: '', emergencyPhone: '',
      createdAt: new Date(), updatedAt: new Date(),
      user: { email: 'jane@t.com', phone: '+250788001' },
    } as any);
    const result = await PatientService.getPatientByUserId('u-1');
    expect(result).not.toBeNull();
    expect(result!.id).toBe('p-1');
  });

  it('should return null when not found', async () => {
    MockPatient.findOne.mockResolvedValue(null);
    const result = await PatientService.getPatientByUserId('ghost');
    expect(result).toBeNull();
  });
});

// ── searchPatients ────────────────────────────────────────────────────────
describe('PatientService.searchPatients', () => {
  it('should filter out inactive patients', async () => {
    MockPatient.findAll.mockResolvedValue([
      {
        id: 'p-1', fullName: 'Jane Active', dateOfBirth: new Date(), gender: 'female',
        insuranceProvider: '', insuranceNumber: '', allergies: [], existingConditions: [],
        emergencyContact: '', emergencyPhone: '', createdAt: new Date(), updatedAt: new Date(),
        user: { isActive: true, phone: '' },
      },
      { id: 'p-2', fullName: 'John Inactive', user: { isActive: false, phone: '' } },
    ] as any);
    const results = await PatientService.searchPatients('Jane');
    expect(results.some(p => p.fullName === 'Jane Active')).toBe(true);
    expect(results.every(p => p.fullName !== 'John Inactive')).toBe(true);
  });
});

// ── createMedicalVisit ────────────────────────────────────────────────────
describe('PatientService.createMedicalVisit', () => {
  it('should throw when patient not found', async () => {
    MockPatient.findByPk.mockResolvedValue(null);
    await expect(PatientService.createMedicalVisit({
      patientId: 'ghost', doctorId: 'doc-001', visitDate: new Date(),
      visitType: 'consultation' as any, chiefComplaint: 'Headache',
    })).rejects.toThrow('Patient not found');
  });

  it('should throw when doctor not found', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue(null);
    MockDoctor.findAll.mockResolvedValue([]);
    await expect(PatientService.createMedicalVisit({
      patientId: 'p-1', doctorId: 'ghost-doc', visitDate: new Date(),
      visitType: 'consultation' as any, chiefComplaint: 'Headache',
    })).rejects.toThrow('Doctor not found');
  });

  it('should create visit with hospitalName update', async () => {
    const mockDoctorUpdate = jest.fn().mockResolvedValue(undefined);
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue({
      id: 'doc-001', userId: 'u-1', update: mockDoctorUpdate,
      user: { email: 'doc@t.com', fullName: 'Dr. A', phone: '' },
    } as any);
    MockMedicalVisit.create.mockResolvedValue({ id: 'visit-001' } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({
      id: 'visit-001',
      doctor: { user: { email: 'doc@t.com', fullName: 'Dr. A', phone: '' } },
      patient: { user: { email: 'p@t.com', fullName: 'Jane' } },
    } as any);
    await PatientService.createMedicalVisit({
      patientId: 'p-1', doctorId: 'doc-001', visitDate: new Date(),
      visitType: 'consultation' as any, chiefComplaint: 'Headache', hospitalName: 'New Hospital',
    });
    expect(mockDoctorUpdate).toHaveBeenCalled();
  });

  it('should use doctor found by userId fallback', async () => {
    const mockDoctor = { id: 'doc-001', userId: 'u-1', update: jest.fn(), user: {} };
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue(null);
    MockDoctor.findAll.mockResolvedValue([mockDoctor as any]);
    MockMedicalVisit.create.mockResolvedValue({ id: 'v-1' } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({
      id: 'v-1',
      doctor: { user: {} }, patient: { user: {} },
    } as any);
    const result = await PatientService.createMedicalVisit({
      patientId: 'p-1', doctorId: 'u-1', visitDate: new Date(),
      visitType: 'consultation' as any, chiefComplaint: 'Headache',
    });
    expect(result).toBeDefined();
  });
});

// ── createPrescription ────────────────────────────────────────────────────
describe('PatientService.createPrescription', () => {
  it('should throw when patient not found', async () => {
    MockPatient.findByPk.mockResolvedValue(null);
    await expect(PatientService.createPrescription({
      patientId: 'ghost', doctorId: 'doc-001', visitId: 'v-1',
      diagnosis: 'Flu', items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
    })).rejects.toThrow('Patient not found');
  });

  it('should throw when visit not found', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: {} } as any);
    MockMedicalVisit.findByPk.mockResolvedValue(null);
    await expect(PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'doc-001', visitId: 'ghost-v',
      diagnosis: 'Flu', items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
    })).rejects.toThrow('Medical visit not found');
  });

  it('should create prescription with QR code', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com', nationalId: '123' } } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: { fullName: 'Dr. A', email: 'doc@t.com' } } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({ id: 'v-001' } as any);
    MockPrescription.create.mockResolvedValue({ id: 'presc-001', prescriptionNumber: 'RX-001', update: mockUpdate } as any);
    MockPrescriptionItem.create.mockResolvedValue({} as any);

    const { QRCodeService } = require('../../services/qrCodeService');
    QRCodeService.generateQRCode.mockResolvedValue({
      qrHash: 'qr-hash-001', qrCodeImage: 'data:image/png;base64,abc',
      expiresAt: new Date(Date.now() + 86400000),
    });

    const { eventService } = require('../../services/eventService');
    eventService.emitPrescriptionCreated.mockImplementation(() => {});

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', prescriptionNumber: 'RX-001', diagnosis: 'Flu',
      doctor: { user: { fullName: 'Dr. A', email: 'doc@t.com', phone: '' }, specialization: '', hospitalName: '' },
      patient: { user: { fullName: 'Jane', email: 'j@t.com' } }, items: [],
    } as any);

    const result = await PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'doc-001', visitId: 'v-001', diagnosis: 'Flu',
      items: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'twice', quantity: 10 }],
    });
    expect(result).toBeDefined();
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should still succeed when QR code generation fails', async () => {
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue({ id: 'doc-001', update: jest.fn(), user: {} } as any);
    MockMedicalVisit.findByPk.mockResolvedValue({ id: 'v-001' } as any);
    MockPrescription.create.mockResolvedValue({ id: 'presc-001', prescriptionNumber: 'RX-001', update: jest.fn() } as any);
    MockPrescriptionItem.create.mockResolvedValue({} as any);

    const { QRCodeService } = require('../../services/qrCodeService');
    QRCodeService.generateQRCode.mockRejectedValue(new Error('QR generation failed'));

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', doctor: { user: {} }, patient: { user: {} }, items: [],
    } as any);

    const result = await PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'doc-001', visitId: 'v-001', diagnosis: 'Flu',
      items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
    });
    expect(result).toBeDefined();
  });

  it('should use doctor fallback via findAll when findByPk returns null', async () => {
    const mockDoctor = { id: 'doc-001', update: jest.fn(), user: { fullName: 'Dr. A', email: 'doc@t.com' } };
    MockPatient.findByPk.mockResolvedValue({ id: 'p-1' } as any);
    MockDoctor.findByPk.mockResolvedValue(null);
    MockDoctor.findAll.mockResolvedValue([mockDoctor as any]);
    MockMedicalVisit.findByPk.mockResolvedValue({ id: 'v-001' } as any);
    MockPrescription.create.mockResolvedValue({ id: 'presc-001', prescriptionNumber: 'RX-001', update: jest.fn() } as any);
    MockPrescriptionItem.create.mockResolvedValue({} as any);

    const { QRCodeService } = require('../../services/qrCodeService');
    QRCodeService.generateQRCode.mockRejectedValue(new Error('fail'));

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', doctor: { user: {} }, patient: { user: {} }, items: [],
    } as any);

    const result = await PatientService.createPrescription({
      patientId: 'p-1', doctorId: 'u-1', visitId: 'v-001', diagnosis: 'Flu',
      items: [{ medicineName: 'M', dosage: 'd', frequency: 'f', quantity: 1 }],
      hospitalName: 'Hospital A',
    });
    expect(result).toBeDefined();
  });
});
