import { Request, Response } from 'express';
import { PatientController } from '../../controllers/patientController';
import { PatientService } from '../../services/patientService';
import { PatientRegistrationData, MedicalVisitData, PrescriptionData } from '../../types';
import { VisitType } from '../../models/MedicalVisit';

// Mock the PatientService
jest.mock('../../src/services/patientService');

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
        // missing password, fullName, dateOfBirth, gender
      };

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email, password, full name, date of birth, and gender are required',
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
      };

      MockPatientService.registerPatient.mockRejectedValue(new Error('Email already exists'));

      await PatientController.registerPatient(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email already exists',
          statusCode: 400,
        },
      });
    });
  });

  describe('getPatientByReference', () => {
    it('should successfully get patient by reference number', async () => {
      const mockPatient = {
        id: 'patient-123',
        referenceNumber: 'PAT-20241201-1234',
        fullName: 'John Doe',
      };

      mockReq.params = { referenceNumber: 'PAT-20241201-1234' };
      MockPatientService.getPatientByReference.mockResolvedValue(mockPatient as any);

      await PatientController.getPatientByReference(mockReq as Request, mockRes as Response);

      expect(MockPatientService.getPatientByReference).toHaveBeenCalledWith('PAT-20241201-1234');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPatient,
      });
    });

    it('should return 400 if reference number is missing', async () => {
      mockReq.params = {};

      await PatientController.getPatientByReference(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Reference number is required',
          statusCode: 400,
        },
      });
    });

    it('should return 404 if patient not found', async () => {
      mockReq.params = { referenceNumber: 'NON-EXISTENT' };
      MockPatientService.getPatientByReference.mockResolvedValue(null);

      await PatientController.getPatientByReference(mockReq as Request, mockRes as Response);

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
      const visitData: MedicalVisitData = {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitDate: new Date('2024-12-01'),
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
        symptoms: 'Severe headache for 2 days',
      };

      const mockVisit = {
        id: 'visit-123',
        ...visitData,
      };

      mockReq.body = visitData;
      MockPatientService.createMedicalVisit.mockResolvedValue(mockVisit as any);

      await PatientController.createMedicalVisit(mockReq as Request, mockRes as Response);

      expect(MockPatientService.createMedicalVisit).toHaveBeenCalledWith(visitData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Medical visit created successfully',
        data: mockVisit,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        patientId: 'patient-123',
        // missing doctorId, visitDate, visitType, chiefComplaint
      };

      await PatientController.createMedicalVisit(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Patient ID, doctor ID, visit date, visit type, and chief complaint are required',
          statusCode: 400,
        },
      });
    });

    it('should return 400 for invalid visit date', async () => {
      mockReq.body = {
        patientId: 'patient-123',
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
      };

      mockReq.params = { patientId: 'patient-123' };
      MockPatientService.getPatientMedicalHistory.mockResolvedValue(mockHistory);

      await PatientController.getPatientMedicalHistory(mockReq as Request, mockRes as Response);

      expect(MockPatientService.getPatientMedicalHistory).toHaveBeenCalledWith('patient-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockHistory,
      });
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
      const prescriptionData: PrescriptionData = {
        patientId: 'patient-123',
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
        ...prescriptionData,
      };

      mockReq.body = prescriptionData;
      MockPatientService.createPrescription.mockResolvedValue(mockPrescription as any);

      await PatientController.createPrescription(mockReq as Request, mockRes as Response);

      expect(MockPatientService.createPrescription).toHaveBeenCalledWith(prescriptionData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Prescription created successfully',
        data: mockPrescription,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        patientId: 'patient-123',
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
      mockReq.body = {
        patientId: 'patient-123',
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
      const mockPrescriptions = [
        {
          id: 'prescription-123',
          diagnosis: 'Hypertension',
          items: [
            { medicineName: 'Lisinopril', dosage: '10mg' },
          ],
        },
      ];

      mockReq.params = { patientId: 'patient-123' };
      MockPatientService.getPatientPrescriptions.mockResolvedValue(mockPrescriptions);

      await PatientController.getPatientPrescriptions(mockReq as Request, mockRes as Response);

      expect(MockPatientService.getPatientPrescriptions).toHaveBeenCalledWith('patient-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockPrescriptions,
      });
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