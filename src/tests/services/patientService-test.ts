import { PatientService } from '../../services/patientService';
import { PatientRegistrationData, MedicalVisitData, PrescriptionData } from '../../types';
import { Patient, User, MedicalVisit, Prescription, PrescriptionItem, UserRole } from '../../models';
import { VisitType } from '../../models/MedicalVisit';
import { PrescriptionStatus } from '../../models/Prescription';

// Mock all models
jest.mock('../../src/models');

const MockPatient = Patient as jest.Mocked<typeof Patient>;
const MockUser = User as jest.Mocked<typeof User>;
const MockMedicalVisit = MedicalVisit as jest.Mocked<typeof MedicalVisit>;
const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPrescriptionItem = PrescriptionItem as jest.Mocked<typeof PrescriptionItem>;

describe('PatientService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
        referenceNumber: 'PAT-20241201-1234',
        userId: 'user-123',
        fullName: mockRegistrationData.fullName,
        dateOfBirth: new Date(mockRegistrationData.dateOfBirth),
        gender: mockRegistrationData.gender,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      MockUser.create.mockResolvedValue(mockUser as any);
      MockPatient.create.mockResolvedValue(mockPatient as any);

      const result = await PatientService.registerPatient(mockRegistrationData);

      expect(MockUser.create).toHaveBeenCalledWith({
        email: mockRegistrationData.email,
        password: mockRegistrationData.password,
        fullName: mockRegistrationData.fullName,
        role: UserRole.PATIENT,
        phone: mockRegistrationData.phone,
        isActive: true,
      });

      expect(MockPatient.create).toHaveBeenCalledWith({
        userId: mockUser.id,
        fullName: mockRegistrationData.fullName,
        dateOfBirth: new Date(mockRegistrationData.dateOfBirth),
        gender: mockRegistrationData.gender,
        insuranceProvider: mockRegistrationData.insuranceProvider,
        insuranceNumber: mockRegistrationData.insuranceNumber,
        allergies: mockRegistrationData.allergies,
        existingConditions: mockRegistrationData.existingConditions,
        emergencyContact: mockRegistrationData.emergencyContact,
        emergencyPhone: mockRegistrationData.emergencyPhone,
      });

      expect(result.id).toBe(mockPatient.id);
      expect(result.referenceNumber).toBe(mockPatient.referenceNumber);
      expect(result.fullName).toBe(mockPatient.fullName);
    });

    it('should handle user creation errors', async () => {
      MockUser.create.mockRejectedValue(new Error('Email already exists'));

      await expect(PatientService.registerPatient(mockRegistrationData))
        .rejects.toThrow('Email already exists');

      expect(MockPatient.create).not.toHaveBeenCalled();
    });
  });

  describe('getPatientByReference', () => {
    it('should return patient by reference number', async () => {
      const mockPatient = {
        id: 'patient-123',
        referenceNumber: 'PAT-20241201-1234',
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        createdAt: new Date(),
        updatedAt: new Date(),
        user: {
          phone: '+1234567890',
          isActive: true,
        },
      };

      MockPatient.findOne.mockResolvedValue(mockPatient as any);

      const result = await PatientService.getPatientByReference('PAT-20241201-1234');

      expect(MockPatient.findOne).toHaveBeenCalledWith({
        where: { referenceNumber: 'PAT-20241201-1234' },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['phone', 'isActive'],
          },
        ],
      });

      expect(result).toEqual({
        id: mockPatient.id,
        referenceNumber: mockPatient.referenceNumber,
        fullName: mockPatient.fullName,
        dateOfBirth: mockPatient.dateOfBirth,
        gender: mockPatient.gender,
        phone: mockPatient.user.phone,
        createdAt: mockPatient.createdAt,
        updatedAt: mockPatient.updatedAt,
        insuranceProvider: undefined,
        insuranceNumber: undefined,
        allergies: undefined,
        existingConditions: undefined,
        emergencyContact: undefined,
        emergencyPhone: undefined,
      });
    });

    it('should return null if patient not found', async () => {
      MockPatient.findOne.mockResolvedValue(null);

      const result = await PatientService.getPatientByReference('NON-EXISTENT');

      expect(result).toBeNull();
    });

    it('should return null if user is inactive', async () => {
      const mockPatient = {
        user: {
          isActive: false,
        },
      };

      MockPatient.findOne.mockResolvedValue(mockPatient as any);

      const result = await PatientService.getPatientByReference('PAT-123');

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
      const mockDoctor = { id: 'doctor-123', role: UserRole.DOCTOR };
      const mockVisit = {
        id: 'visit-123',
        ...mockVisitData,
      };

      MockPatient.findByPk.mockResolvedValue(mockPatient as any);
      MockUser.findOne.mockResolvedValue(mockDoctor as any);
      MockMedicalVisit.create.mockResolvedValue(mockVisit as any);

      const result = await PatientService.createMedicalVisit(mockVisitData);

      expect(MockPatient.findByPk).toHaveBeenCalledWith(mockVisitData.patientId);
      expect(MockUser.findOne).toHaveBeenCalledWith({
        where: { id: mockVisitData.doctorId, role: UserRole.DOCTOR },
      });
      expect(MockMedicalVisit.create).toHaveBeenCalledWith(mockVisitData);
      expect(result.id).toBe('visit-123');
    });

    it('should throw error if patient not found', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      await expect(PatientService.createMedicalVisit(mockVisitData))
        .rejects.toThrow('Patient not found');
    });

    it('should throw error if doctor not found', async () => {
      MockPatient.findByPk.mockResolvedValue({ id: 'patient-123' } as any);
      MockUser.findOne.mockResolvedValue(null);

      await expect(PatientService.createMedicalVisit(mockVisitData))
        .rejects.toThrow('Doctor not found');
    });
  });

  describe('getPatientMedicalHistory', () => {
    it('should return patient medical history', async () => {
      const mockVisits = [
        {
          id: 'visit-123',
          visitDate: new Date(),
          visitType: VisitType.CONSULTATION,
          chiefComplaint: 'Headache',
          createdAt: new Date(),
          doctor: { fullName: 'Dr. Smith', email: 'dr.smith@hospital.com' },
        },
      ];

      const mockPrescriptions = [
        {
          id: 'prescription-123',
          prescriptionNumber: 'RX-20241201-1234',
          diagnosis: 'Tension headache',
          status: PrescriptionStatus.PENDING,
          createdAt: new Date(),
          doctor: { fullName: 'Dr. Smith', email: 'dr.smith@hospital.com' },
          items: [
            { medicineName: 'Ibuprofen', dosage: '200mg', frequency: 'Twice daily' },
          ],
        },
      ];

      MockMedicalVisit.findAll.mockResolvedValue(mockVisits as any);
      MockPrescription.findAll.mockResolvedValue(mockPrescriptions as any);

      const result = await PatientService.getPatientMedicalHistory('patient-123');

      expect(result.visits).toHaveLength(1);
      expect(result.prescriptions).toHaveLength(1);
      expect(result.visits[0].id).toBe('visit-123');
      expect(result.prescriptions[0].id).toBe('prescription-123');
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
      const mockDoctor = { id: 'doctor-123', role: UserRole.DOCTOR };
      const mockVisit = { id: 'visit-123' };
      const mockPrescription = {
        id: 'prescription-123',
        ...mockPrescriptionData,
      };

      MockPatient.findByPk.mockResolvedValue(mockPatient as any);
      MockUser.findOne.mockResolvedValue(mockDoctor as any);
      MockMedicalVisit.findByPk.mockResolvedValue(mockVisit as any);
      MockPrescription.create.mockResolvedValue(mockPrescription as any);
      MockPrescriptionItem.create.mockResolvedValue({} as any);

      const result = await PatientService.createPrescription(mockPrescriptionData);

      expect(MockPatient.findByPk).toHaveBeenCalledWith(mockPrescriptionData.patientId);
      expect(MockUser.findOne).toHaveBeenCalledWith({
        where: { id: mockPrescriptionData.doctorId, role: UserRole.DOCTOR },
      });
      expect(MockMedicalVisit.findByPk).toHaveBeenCalledWith(mockPrescriptionData.visitId);
      expect(MockPrescription.create).toHaveBeenCalled();
      expect(MockPrescriptionItem.create).toHaveBeenCalledWith({
        prescriptionId: 'prescription-123',
        medicineName: 'Lisinopril',
        dosage: '10mg',
        frequency: 'Once daily',
        quantity: 30,
        instructions: 'Take with food',
      });
      expect(result.id).toBe('prescription-123');
    });

    it('should throw error if patient not found', async () => {
      MockPatient.findByPk.mockResolvedValue(null);

      await expect(PatientService.createPrescription(mockPrescriptionData))
        .rejects.toThrow('Patient not found');
    });

    it('should throw error if doctor not found', async () => {
      MockPatient.findByPk.mockResolvedValue({ id: 'patient-123' } as any);
      MockUser.findOne.mockResolvedValue(null);

      await expect(PatientService.createPrescription(mockPrescriptionData))
        .rejects.toThrow('Doctor not found');
    });

    it('should throw error if visit not found', async () => {
      MockPatient.findByPk.mockResolvedValue({ id: 'patient-123' } as any);
      MockUser.findOne.mockResolvedValue({ id: 'doctor-123', role: UserRole.DOCTOR } as any);
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

      MockPrescription.findAll.mockResolvedValue(mockPrescriptions as any);

      const result = await PatientService.getPatientPrescriptions('patient-123');

      expect(MockPrescription.findAll).toHaveBeenCalledWith({
        where: { patientId: 'patient-123' },
        include: [
          {
            model: User,
            as: 'doctor',
            attributes: ['fullName', 'email'],
          },
          {
            model: PrescriptionItem,
            as: 'items',
          },
        ],
        order: [['createdAt', 'DESC']],
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('prescription-123');
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