import { Request, Response } from 'express';
import { PatientController } from '../../controllers/patientController';
import { PatientService } from '../../services/patientService';
import { PatientRegistrationData, MedicalVisitData, PrescriptionData } from '../../types';
import { VisitType } from '../../models/MedicalVisit';

// Mock the PatientService
jest.mock('../../services/patientService');

const MockPatientService = PatientService as jest.Mocked<typeof PatientService>;

describe('PatientController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('registerPatient', () => {
    it('should successfully register a patient', async () => {
      const patientData: PatientRegistrationData = {
        email: 'patient@example.com',
        password: 'password123',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        phone: '+1234567890',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567891',
      };

      const mockPatient = {
        id: 'patient-123',
        referenceNumber: 'PAT-20241201-1234',
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
      };

      mockReq.body = patientData;
      MockPatientService.registerPatient.mockResolvedValue(mockPatient as any);

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(MockPatientService.registerPatient).toHaveBeenCalledWith(patientData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Patient registered successfully',
        data: mockPatient,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        email: 'patient@example.com',
        // missing password, fullName, dateOfBirth, gender, emergencyContact, emergencyPhone
      };

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email, password, full name, date of birth, gender, emergency contact, and emergency phone are required',
          statusCode: 400,
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567891',
      };

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid email format',
          statusCode: 400,
        },
      });
    });

    it('should return 400 for weak password', async () => {
      mockReq.body = {
        email: 'patient@example.com',
        password: '123', // too short
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567891',
      };

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Password must be at least 6 characters long',
          statusCode: 400,
        },
      });
    });

    it('should return 400 for invalid date format', async () => {
      mockReq.body = {
        email: 'patient@example.com',
        password: 'password123',
        fullName: 'John Doe',
        dateOfBirth: 'invalid-date',
        gender: 'male',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567891',
      };

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid date of birth format',
          statusCode: 400,
        },
      });
    });

    it('should handle service errors', async () => {
      mockReq.body = {
        email: 'patient@example.com',
        password: 'password123',
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567891',
      };

      MockPatientService.registerPatient.mockRejectedValue(new Error('Email already exists'));

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ statusCode: 500 }),
      }));
    });
  });

  describe('getPatientById', () => {
    it('should successfully get patient by ID', async () => {
      const mockPatient = {
        id: 'patient-123',
        fullName: 'John Doe',
      };

      mockReq.params = { patientId: 'patient-123' };
      MockPatientService.getPatientById.mockResolvedValue(mockPatient as any);

      await PatientController.getPatientById(mockReq as Request, mockRes as Response);

      expect(MockPatientService.getPatientById).toHaveBeenCalledWith('patient-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPatient,
      });
    });

    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};

      await PatientController.getPatientById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient ID is required',
          statusCode: 400,
        },
      });
    });

    it('should return 404 if patient not found', async () => {
      mockReq.params = { patientId: 'non-existent' };
      MockPatientService.getPatientById.mockResolvedValue(null);

      await PatientController.getPatientById(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient not found',
          statusCode: 404,
        },
      });
    });
  });

  describe('updatePatient', () => {
    it('should successfully update patient', async () => {
      const updateData = {
        fullName: 'John Updated',
        phone: '+9999999999',
      };

      const mockUpdatedPatient = {
        id: 'patient-123',
        fullName: 'John Updated',
        phone: '+9999999999',
      };

      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = updateData;
      MockPatientService.updatePatient.mockResolvedValue(mockUpdatedPatient as any);

      await PatientController.updatePatient(mockReq as Request, mockRes as Response);

      expect(MockPatientService.updatePatient).toHaveBeenCalledWith('patient-123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Patient updated successfully',
        data: mockUpdatedPatient,
      });
    });

    it('should return 400 if no valid fields to update', async () => {
      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = {
        invalidField: 'value',
      };

      await PatientController.updatePatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'No valid fields to update',
          statusCode: 400,
        },
      });
    });

    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};
      mockReq.body = { fullName: 'Updated Name' };

      await PatientController.updatePatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient ID is required',
          statusCode: 400,
        },
      });
    });
  });

  describe('createMedicalVisit', () => {
    it('should successfully create medical visit', async () => {
      const visitBody = {
        doctorId: 'doctor-123',
        visitDate: new Date('2024-12-01'),
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
        symptoms: 'Severe headache for 2 days',
      };

      const mockVisit = {
        id: 'visit-123',
        doctor: { user: { fullName: 'Dr. Smith', email: 'dr@hospital.com', phone: null }, specialization: null, hospitalName: null },
        patient: { id: 'patient-123', user: { fullName: 'John', email: 'j@example.com' }, insuranceProvider: null, insuranceNumber: null },
        visitDate: visitBody.visitDate,
        visitType: visitBody.visitType,
        chiefComplaint: visitBody.chiefComplaint,
        createdAt: new Date(),
      };

      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = visitBody;
      MockPatientService.createMedicalVisit.mockResolvedValue(mockVisit as any);

      await PatientController.createMedicalVisit(mockReq as Request, mockRes as Response);

      expect(MockPatientService.createMedicalVisit).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Medical visit created successfully',
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = {
        // missing doctorId, visitDate, visitType, chiefComplaint
      };

      await PatientController.createMedicalVisit(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        error: expect.objectContaining({ statusCode: 400 }),
      }));
    });

    it('should return 400 for invalid visit date', async () => {
      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = {
        doctorId: 'doctor-123',
        visitDate: 'invalid-date',
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
      };

      await PatientController.createMedicalVisit(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid visit date format',
          statusCode: 400,
        },
      });
    });
  });

  describe('getPatientMedicalHistory', () => {
    it('should successfully get patient medical history', async () => {
      const mockHistory = {
        visits: [
          {
            id: 'visit-123',
            visitType: VisitType.CONSULTATION,
            chiefComplaint: 'Headache',
          },
        ],
        prescriptions: [
          {
            id: 'prescription-123',
            diagnosis: 'Tension headache',
          },
        ],
        total: 2,
        pagination: { page: 1, limit: 10, totalPages: 1 },
      };

      mockReq.params = { patientId: 'patient-123' };
      mockReq = { ...mockReq, user: { id: 'user-123', role: 'doctor' } } as any;
      MockPatientService.getPatientMedicalHistory.mockResolvedValue(mockHistory);

      await PatientController.getPatientMedicalHistory(mockReq as Request, mockRes as Response);

      expect(MockPatientService.getPatientMedicalHistory).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};

      await PatientController.getPatientMedicalHistory(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient ID is required',
          statusCode: 400,
        },
      });
    });
  });

  describe('createPrescription', () => {
    it('should successfully create prescription', async () => {
      const prescriptionBody = {
        doctorId: 'doctor-123',
        visitId: 'visit-123',
        diagnosis: 'Hypertension',
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

      const mockPrescription = {
        id: 'prescription-123',
        prescriptionNumber: 'RX-001',
        diagnosis: 'Hypertension',
        status: 'pending',
        items: prescriptionBody.items,
        doctor: { user: { fullName: 'Dr. Smith', email: 'dr@hospital.com', phone: null }, specialization: null, hospitalName: null },
        patient: { id: 'patient-123', user: { fullName: 'John', email: 'j@example.com' }, insuranceProvider: null, insuranceNumber: null },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = prescriptionBody;
      MockPatientService.createPrescription.mockResolvedValue(mockPrescription as any);

      await PatientController.createPrescription(mockReq as Request, mockRes as Response);

      expect(MockPatientService.createPrescription).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: 'Prescription created successfully',
      }));
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = {
        // missing doctorId, visitId, diagnosis, items
      };

      await PatientController.createPrescription(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient ID, doctor ID, visit ID, diagnosis, and prescription items are required',
          statusCode: 400,
        },
      });
    });

    it('should return 400 if prescription items are invalid', async () => {
      mockReq.params = { patientId: 'patient-123' };
      mockReq.body = {
        doctorId: 'doctor-123',
        visitId: 'visit-123',
        diagnosis: 'Hypertension',
        items: [
          {
            medicineName: 'Lisinopril',
            // missing dosage, frequency, quantity
          },
        ],
      };

      await PatientController.createPrescription(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Each prescription item must have medicine name, dosage, frequency, and quantity',
          statusCode: 400,
        },
      });
    });
  });

  describe('getPatientPrescriptions', () => {
    it('should successfully get patient prescriptions', async () => {
      const mockResult = {
        prescriptions: [
          {
            id: 'prescription-123',
            diagnosis: 'Hypertension',
            items: [
              { medicineName: 'Lisinopril', dosage: '10mg' },
            ],
          },
        ],
        total: 1,
      };

      mockReq.params = { patientId: 'patient-123' };
      MockPatientService.getPatientPrescriptions.mockResolvedValue(mockResult as any);

      await PatientController.getPatientPrescriptions(mockReq as Request, mockRes as Response);

      expect(MockPatientService.getPatientPrescriptions).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if patient ID is missing', async () => {
      mockReq.params = {};

      await PatientController.getPatientPrescriptions(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient ID is required',
          statusCode: 400,
        },
      });
    });
  });

  describe('searchPatients', () => {
    it('should successfully search patients', async () => {
      const mockPatients = [
        {
          id: 'patient-123',
          fullName: 'John Doe',
          referenceNumber: 'PAT-20241201-1234',
        },
      ];

      mockReq.query = { query: 'John' };
      MockPatientService.searchPatients.mockResolvedValue(mockPatients as any);

      await PatientController.searchPatients(mockReq as Request, mockRes as Response);

      expect(MockPatientService.searchPatients).toHaveBeenCalledWith('John');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPatients,
      });
    });

    it('should return 400 if search query is missing', async () => {
      mockReq.query = {};

      await PatientController.searchPatients(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Search query is required',
          statusCode: 400,
        },
      });
    });

    it('should return 400 if search query is not a string', async () => {
      mockReq.query = { query: ['invalid'] };

      await PatientController.searchPatients(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Search query is required',
          statusCode: 400,
        },
      });
    });
  });
});