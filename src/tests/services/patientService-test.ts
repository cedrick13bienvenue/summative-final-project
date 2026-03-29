import { PatientService } from '../../services/patientService';
import { PatientRegistrationData, MedicalVisitData, PrescriptionData } from '../../types';
import { Patient, User, MedicalVisit, Prescription, PrescriptionItem, UserRole } from '../../models';
import { VisitType } from '../../models/MedicalVisit';
import { PrescriptionStatus } from '../../models/Prescription';
import { sequelize } from '../../database/config/database';

// Mock all models and dependencies
jest.mock('../../models', () => {
  const UserMock: any = jest.fn().mockImplementation(() => ({
    hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
  }));
  UserMock.findOne = jest.fn();
  UserMock.findByPk = jest.fn();
  UserMock.create = jest.fn();
  UserMock.update = jest.fn();
  return {
    Patient: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), update: jest.fn() },
    User: UserMock,
    MedicalVisit: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
    Prescription: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
    PrescriptionItem: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() },
    UserRole: { ADMIN: 'admin', DOCTOR: 'doctor', PATIENT: 'patient', PHARMACIST: 'pharmacist' },
  };
});
jest.mock('../../models/Doctor', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() },
  __esModule: true,
}));
jest.mock('../../models/MedicalVisit', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn(), count: jest.fn() },
  VisitType: { CONSULTATION: 'consultation', EMERGENCY: 'emergency', FOLLOWUP: 'followup' },
  __esModule: true,
}));
jest.mock('../../models/Prescription', () => ({
  default: {
    create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(),
    findAndCountAll: jest.fn(), count: jest.fn(), generatePrescriptionNumber: jest.fn().mockReturnValue('RX-001'),
  },
  PrescriptionStatus: { PENDING: 'pending', SCANNED: 'scanned', VALIDATED: 'validated', DISPENSED: 'dispensed', REJECTED: 'rejected', FULFILLED: 'fulfilled', CANCELLED: 'cancelled' },
  __esModule: true,
}));
jest.mock('../../models/Patient', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn(), findAll: jest.fn(), findAndCountAll: jest.fn() },
  __esModule: true,
}));
jest.mock('../../models/PrescriptionItem', () => ({
  default: { create: jest.fn(), findOne: jest.fn(), findByPk: jest.fn() },
  __esModule: true,
}));
jest.mock('../../database/config/database', () => ({
  sequelize: { transaction: jest.fn() },
}));
jest.mock('../../services/qrCodeService', () => ({
  QRCodeService: { generateQRCode: jest.fn(), getQRCodeForPrescription: jest.fn() },
}));
jest.mock('../../services/emailService', () => ({
  EmailService: { sendPrescriptionEmail: jest.fn(), sendWelcomeEmail: jest.fn() },
}));
jest.mock('../../services/eventService', () => ({
  eventService: { emit: jest.fn() },
}));

const MockPatient = Patient as jest.Mocked<typeof Patient>;
const MockUser = User as jest.Mocked<typeof User>;
const MockMedicalVisit = MedicalVisit as jest.Mocked<typeof MedicalVisit>;
const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPrescriptionItem = PrescriptionItem as jest.Mocked<typeof PrescriptionItem>;
const MockDoctor = require('../../models/Doctor').default;

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe('PatientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('registerPatient', () => {
    const mockRegistrationData: PatientRegistrationData = {
      email: 'patient@example.com',
      password: 'password123',
      fullName: 'John Doe',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      phone: '+1234567890',
      insuranceProvider: 'Health Insurance Co',
      insuranceNumber: 'INS123456',
      allergies: ['Peanuts'],
      existingConditions: ['Diabetes'],
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+0987654321',
    };

    it('should successfully register a patient', async () => {
      const mockUser = {
        id: 'user-123',
        email: mockRegistrationData.email,
        fullName: mockRegistrationData.fullName,
        role: UserRole.PATIENT,
      };

      const mockPatient = {
        id: 'patient-123',
        userId: 'user-123',
        fullName: mockRegistrationData.fullName,
        dateOfBirth: new Date(mockRegistrationData.dateOfBirth),
        gender: mockRegistrationData.gender,
        insuranceProvider: mockRegistrationData.insuranceProvider,
        insuranceNumber: mockRegistrationData.insuranceNumber,
        allergies: mockRegistrationData.allergies,
        existingConditions: mockRegistrationData.existingConditions,
        emergencyContact: mockRegistrationData.emergencyContact,
        emergencyPhone: mockRegistrationData.emergencyPhone,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      MockUser.create.mockResolvedValue(mockUser as any);
      MockPatient.create.mockResolvedValue(mockPatient as any);

      const result = await PatientService.registerPatient(mockRegistrationData);

      expect(MockUser.create).toHaveBeenCalled();
      expect(MockPatient.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result.id).toBe(mockPatient.id);
      expect(result.fullName).toBe(mockPatient.fullName);
    });

    it('should handle user creation errors', async () => {
      MockUser.create.mockRejectedValue(new Error('Email already exists'));

      await expect(PatientService.registerPatient(mockRegistrationData))
        .rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('getPatientByNationalId', () => {
    it('should return patient by national ID', async () => {
      const mockPatient = {
        id: 'patient-123',
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          phone: '+1234567890',
          isActive: true,
          nationalId: '1199000123456789',
        },
      };

      MockPatient.findOne.mockResolvedValue(mockPatient as any);

      const result = await PatientService.getPatientByNationalId('1199000123456789');

      expect(MockPatient.findOne).toHaveBeenCalled();
      expect(result).toBeTruthy();
      expect(result!.id).toBe(mockPatient.id);
    });

    it('should return null if patient not found', async () => {
      MockPatient.findOne.mockResolvedValue(null);

      const result = await PatientService.getPatientByNationalId('NON-EXISTENT');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const mockPatient = {
        id: 'patient-123',
        fullName: 'John Doe',
        user: {
          isActive: false,
        },
      };

      MockPatient.findOne.mockResolvedValue(mockPatient as any);

      const result = await PatientService.getPatientByNationalId('1234567890123456');

      expect(result).toBeNull();
    });
  });

  describe('getPatientById', () => {
    it('should return patient by ID', async () => {
      const mockPatient = {
        id: 'patient-123',
        referenceNumber: 'PAT-20241201-1234',
        fullName: 'John Doe',
        user: {
          phone: '+1234567890',
          isActive: true,
        },
      };

      MockPatient.findByPk.mockResolvedValue(mockPatient as any);

      const result = await PatientService.getPatientById('patient-123');

      expect(MockPatient.findByPk).toHaveBeenCalledWith('patient-123', {
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['phone', 'isActive'],
          },
        ],
      });

      expect(result).toBeTruthy();
      expect(result!.id).toBe(mockPatient.id);
    });

    it('should return null if patient not found', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      const result = await PatientService.getPatientById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('updatePatient', () => {
    it('should successfully update patient profile', async () => {
      const mockPatient = {
        id: 'patient-123',
        userId: 'user-123',
        update: jest.fn().mockResolvedValue(undefined),
      };

      const updateData = {
        fullName: 'John Updated',
        phone: '+9999999999',
      };

      MockPatient.findByPk.mockResolvedValue(mockPatient as any);
      MockUser.update.mockResolvedValue([1] as any);

      // Mock the getPatientById call that happens after update
      const updatedPatient = {
        id: 'patient-123',
        fullName: 'John Updated',
        phone: '+9999999999',
      };
      
      jest.spyOn(PatientService, 'getPatientById').mockResolvedValue(updatedPatient as any);

      const result = await PatientService.updatePatient('patient-123', updateData);

      expect(mockPatient.update).toHaveBeenCalledWith({ fullName: 'John Updated' });
      expect(MockUser.update).toHaveBeenCalledWith(
        { phone: '+9999999999' },
        { where: { id: 'user-123' } }
      );
      expect(result.fullName).toBe('John Updated');
    });

    it('should throw error if patient not found', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      await expect(PatientService.updatePatient('non-existent', {}))
        .rejects.toThrow('Patient not found');
    });
  });

  describe('createMedicalVisit', () => {
    const mockVisitData: MedicalVisitData = {
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      visitDate: new Date('2024-12-01'),
      visitType: VisitType.CONSULTATION,
      chiefComplaint: 'Headache',
      symptoms: 'Severe headache for 2 days',
      diagnosis: 'Tension headache',
    };

    it('should successfully create medical visit', async () => {
      const mockPatient = { id: 'patient-123' };
      const mockDoctor = { id: 'doctor-123', userId: 'user-123', update: jest.fn() };
      const mockVisit = { id: 'visit-123', ...mockVisitData };
      const mockVisitWithDoctor = { id: 'visit-123', doctor: {}, patient: {} };

      MockPatient.findByPk.mockResolvedValue(mockPatient as any);
      MockDoctor.findByPk.mockResolvedValue(mockDoctor as any);
      MockMedicalVisit.create.mockResolvedValue(mockVisit as any);
      MockMedicalVisit.findByPk.mockResolvedValue(mockVisitWithDoctor as any);

      const result = await PatientService.createMedicalVisit(mockVisitData);

      expect(MockPatient.findByPk).toHaveBeenCalledWith(mockVisitData.patientId);
      expect(MockDoctor.findByPk).toHaveBeenCalled();
      expect(MockMedicalVisit.create).toHaveBeenCalled();
      expect(result.id).toBe('visit-123');
    });

    it('should throw error if patient not found', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      await expect(PatientService.createMedicalVisit(mockVisitData))
        .rejects.toThrow('Patient not found');
    });

    it('should throw error if doctor not found', async () => {
      MockPatient.findByPk.mockResolvedValue({ id: 'patient-123' } as any);
      MockDoctor.findByPk.mockResolvedValue(null);
      MockDoctor.findAll.mockResolvedValue([]);

      await expect(PatientService.createMedicalVisit(mockVisitData))
        .rejects.toThrow('Doctor not found');
    });
  });

  describe('getPatientMedicalHistory', () => {
    it('should return patient medical history', async () => {
      const mockVisitRows = [
        {
          id: 'visit-123',
          visitDate: new Date(),
          visitType: VisitType.CONSULTATION,
          chiefComplaint: 'Headache',
          createdAt: new Date(),
          doctor: { fullName: 'Dr. Smith', email: 'dr.smith@hospital.com' },
        },
      ];

      const mockPrescriptionRows = [
        {
          id: 'prescription-123',
          prescriptionNumber: 'RX-20241201-1234',
          diagnosis: 'Tension headache',
          status: PrescriptionStatus.PENDING,
          createdAt: new Date(),
          doctor: { fullName: 'Dr. Smith', email: 'dr.smith@hospital.com' },
          items: [{ medicineName: 'Ibuprofen', dosage: '200mg', frequency: 'Twice daily' }],
        },
      ];

      MockMedicalVisit.findAndCountAll.mockResolvedValue({ rows: mockVisitRows, count: 1 } as any);
      MockPrescription.findAndCountAll.mockResolvedValue({ rows: mockPrescriptionRows, count: 1 } as any);
      (MockMedicalVisit as any).count = jest.fn().mockResolvedValue(1);
      (MockPrescription as any).count = jest.fn().mockResolvedValue(1);

      const result = await PatientService.getPatientMedicalHistory('patient-123');

      expect(result.visits!).toHaveLength(1);
      expect(result.prescriptions!).toHaveLength(1);
      expect(result.visits![0].id).toBe('visit-123');
      expect(result.prescriptions![0].id).toBe('prescription-123');
    });
  });

  describe('createPrescription', () => {
    const mockPrescriptionData: PrescriptionData = {
      patientId: 'patient-123',
      doctorId: 'doctor-123',
      visitId: 'visit-123',
      diagnosis: 'Hypertension',
      doctorNotes: 'Monitor blood pressure',
      items: [
        {
          medicineName: 'Lisinopril',
          dosage: '10mg',
          frequency: 'Once daily',
          quantity: 30,
          instructions: 'Take with food',
        },
      ],
    };

    it('should successfully create prescription', async () => {
      const mockPatient = { id: 'patient-123' };
      const mockDoctor = { id: 'doctor-123', userId: 'user-123' };
      const mockVisit = { id: 'visit-123' };
      const mockPrescription = {
        id: 'prescription-123',
        update: jest.fn().mockResolvedValue(undefined),
        ...mockPrescriptionData,
      };

      MockPatient.findByPk.mockResolvedValue(mockPatient as any);
      MockDoctor.findByPk.mockResolvedValue(mockDoctor as any);
      MockMedicalVisit.findByPk.mockResolvedValue(mockVisit as any);
      MockPrescription.create.mockResolvedValue(mockPrescription as any);
      MockPrescriptionItem.create.mockResolvedValue({} as any);
      (MockPrescription as any).generatePrescriptionNumber = jest.fn().mockReturnValue('RX-001');

      // Mock QRCodeService
      const { QRCodeService } = require('../../services/qrCodeService');
      QRCodeService.generateQRCode.mockResolvedValue({ qrHash: 'QR-HASH-001', qrCodeImage: 'data:image/png;base64,abc', expiresAt: new Date() });

      // Mock final Prescription.findByPk retrieval
      MockPrescription.findByPk.mockResolvedValue(mockPrescription as any);

      const result = await PatientService.createPrescription(mockPrescriptionData);

      expect(MockPatient.findByPk).toHaveBeenCalledWith(mockPrescriptionData.patientId);
      expect(MockDoctor.findByPk).toHaveBeenCalled();
      expect(MockMedicalVisit.findByPk).toHaveBeenCalledWith(mockPrescriptionData.visitId);
      expect(MockPrescription.create).toHaveBeenCalled();
      expect(MockPrescriptionItem.create).toHaveBeenCalled();
      expect(result.id).toBe('prescription-123');
    });

    it('should throw error if patient not found', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      await expect(PatientService.createPrescription(mockPrescriptionData))
        .rejects.toThrow('Patient not found');
    });

    it('should throw error if doctor not found', async () => {
      MockPatient.findByPk.mockResolvedValue({ id: 'patient-123' } as any);
      MockDoctor.findByPk.mockResolvedValue(null);
      MockDoctor.findAll.mockResolvedValue([]);

      await expect(PatientService.createPrescription(mockPrescriptionData))
        .rejects.toThrow('Doctor not found');
    });

    it('should throw error if visit not found', async () => {
      MockPatient.findByPk.mockResolvedValue({ id: 'patient-123' } as any);
      MockDoctor.findByPk.mockResolvedValue({ id: 'doctor-123', userId: 'user-123' } as any);
      MockMedicalVisit.findByPk.mockResolvedValue(null);

      await expect(PatientService.createPrescription(mockPrescriptionData))
        .rejects.toThrow('Medical visit not found');
    });
  });

  describe('getPatientPrescriptions', () => {
    it('should return patient prescriptions', async () => {
      const mockPrescriptions = [
        {
          id: 'prescription-123',
          prescriptionNumber: 'RX-20241201-1234',
          diagnosis: 'Hypertension',
          status: PrescriptionStatus.PENDING,
          createdAt: new Date(),
          doctor: { fullName: 'Dr. Smith', email: 'dr.smith@hospital.com' },
          items: [
            { medicineName: 'Lisinopril', dosage: '10mg', frequency: 'Once daily' },
          ],
        },
      ];

      MockPrescription.findAndCountAll.mockResolvedValue({ rows: mockPrescriptions, count: 1 } as any);

      const result = await PatientService.getPatientPrescriptions('patient-123');

      expect(MockPrescription.findAndCountAll).toHaveBeenCalled();
      expect(result.prescriptions).toHaveLength(1);
      expect(result.prescriptions[0].id).toBe('prescription-123');
    });
  });

  describe('searchPatients', () => {
    it('should search patients by name', async () => {
      const mockPatients = [
        {
          id: 'patient-123',
          referenceNumber: 'PAT-20241201-1234',
          fullName: 'John Doe',
          user: { phone: '+1234567890', isActive: true },
        },
      ];

      MockPatient.findAll.mockResolvedValue(mockPatients as any);

      const result = await PatientService.searchPatients('John');

      expect(MockPatient.findAll).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe('John Doe');
    });

    it('should filter out inactive users', async () => {
      const mockPatients = [
        {
          id: 'patient-123',
          fullName: 'Active Patient',
          user: { isActive: true },
        },
        {
          id: 'patient-456',
          fullName: 'Inactive Patient',
          user: { isActive: false },
        },
      ];

      MockPatient.findAll.mockResolvedValue(mockPatients as any);

      const result = await PatientService.searchPatients('Patient');

      expect(result).toHaveLength(1);
      expect(result[0].fullName).toBe('Active Patient');
    });
  });
});