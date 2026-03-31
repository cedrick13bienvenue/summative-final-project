import { Request, Response } from 'express';
import { PatientController } from '../../controllers/patientController';
import { PatientService } from '../../services/patientService';
import { OTPService } from '../../services/otpService';

jest.mock('../../services/patientService');
jest.mock('../../services/otpService');
jest.mock('../../models', () => ({
  UserRole: { PATIENT: 'patient', DOCTOR: 'doctor', PHARMACIST: 'pharmacist', ADMIN: 'admin' },
}));

const MockPatientService = PatientService as jest.Mocked<typeof PatientService>;
const MockOTPService = OTPService as jest.Mocked<typeof OTPService>;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Partial<Response>;
};

beforeEach(() => jest.clearAllMocks());

describe('PatientController - extended coverage', () => {
  // ── registerPatient - validation and error paths ───────────────────────────
  describe('registerPatient - validation', () => {
    const validBody = {
      email: 'patient@test.com',
      password: 'pass123',
      fullName: 'Jane Doe',
      dateOfBirth: '1990-01-01',
      gender: 'female',
      emergencyContact: 'Mom',
      emergencyPhone: '+250700000000',
    };

    it('should return 400 when required fields are missing', async () => {
      const req: any = { body: { email: 'p@test.com' }, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid email format', async () => {
      const req: any = { body: { ...validBody, email: 'bad-email' }, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for short password', async () => {
      const req: any = { body: { ...validBody, password: 'abc' }, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid date of birth', async () => {
      const req: any = { body: { ...validBody, dateOfBirth: 'not-a-date' }, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 for SequelizeUniqueConstraintError on email', async () => {
      const uniqueError: any = new Error('Unique');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'email' }];
      MockPatientService.registerPatient.mockRejectedValue(uniqueError);
      const req: any = { body: validBody, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 409 for SequelizeUniqueConstraintError on insurance_number', async () => {
      const uniqueError: any = new Error('Unique');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'insurance_number' }];
      MockPatientService.registerPatient.mockRejectedValue(uniqueError);
      const req: any = { body: validBody, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 409 for generic SequelizeUniqueConstraintError', async () => {
      const uniqueError: any = new Error('Unique');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'other' }];
      MockPatientService.registerPatient.mockRejectedValue(uniqueError);
      const req: any = { body: validBody, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 for SequelizeValidationError', async () => {
      const valError: any = new Error('Validation');
      valError.name = 'SequelizeValidationError';
      valError.errors = [{ path: 'email', message: 'Invalid email' }];
      MockPatientService.registerPatient.mockRejectedValue(valError);
      const req: any = { body: validBody, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 for generic error', async () => {
      MockPatientService.registerPatient.mockRejectedValue(new Error('DB crash'));
      const req: any = { body: validBody, params: {}, query: {} };
      const res = makeRes();
      await PatientController.registerPatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getPatientByNationalId ─────────────────────────────────────────────────
  describe('getPatientByNationalId', () => {
    it('should return 400 when nationalId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientByNationalId(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when patient not found', async () => {
      MockPatientService.getPatientByNationalId.mockResolvedValue(null);
      const req: any = { params: { nationalId: '1234567890123456' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientByNationalId(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 200 when patient found', async () => {
      MockPatientService.getPatientByNationalId.mockResolvedValue({ id: 'p-1' } as any);
      const req: any = { params: { nationalId: '1234567890123456' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientByNationalId(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      MockPatientService.getPatientByNationalId.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { nationalId: '1234567890123456' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientByNationalId(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getPatientById ─────────────────────────────────────────────────────────
  describe('getPatientById', () => {
    it('should return 400 when patientId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when patient not found', async () => {
      MockPatientService.getPatientById.mockResolvedValue(null);
      const req: any = { params: { patientId: 'ghost' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      MockPatientService.getPatientById.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { patientId: 'p-1' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updatePatient ──────────────────────────────────────────────────────────
  describe('updatePatient', () => {
    it('should return 400 when patientId is missing', async () => {
      const req: any = { params: {}, body: { fullName: 'New Name' }, query: {} };
      const res = makeRes();
      await PatientController.updatePatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when no valid update fields provided', async () => {
      const req: any = { params: { patientId: 'p-1' }, body: { nonExistentField: 'value' }, query: {} };
      const res = makeRes();
      await PatientController.updatePatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 on successful update', async () => {
      MockPatientService.updatePatient.mockResolvedValue({ id: 'p-1', fullName: 'New Name' } as any);
      const req: any = { params: { patientId: 'p-1' }, body: { fullName: 'New Name' }, query: {} };
      const res = makeRes();
      await PatientController.updatePatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on error', async () => {
      MockPatientService.updatePatient.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { patientId: 'p-1' }, body: { fullName: 'New Name' }, query: {} };
      const res = makeRes();
      await PatientController.updatePatient(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── createMedicalVisit ────────────────────────────────────────────────────
  describe('createMedicalVisit', () => {
    const validBody = {
      doctorId: 'doc-001',
      visitDate: '2026-01-01',
      visitType: 'consultation',
      chiefComplaint: 'Headache',
    };

    it('should return 400 when required fields are missing', async () => {
      const req: any = { params: { patientId: 'p-1' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.createMedicalVisit(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid visit date', async () => {
      const req: any = {
        params: { patientId: 'p-1' },
        body: { ...validBody, visitDate: 'not-a-date' },
        query: {},
      };
      const res = makeRes();
      await PatientController.createMedicalVisit(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid visit type', async () => {
      const req: any = {
        params: { patientId: 'p-1' },
        body: { ...validBody, visitType: 'invalid-type' },
        query: {},
      };
      const res = makeRes();
      await PatientController.createMedicalVisit(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 201 on success', async () => {
      MockPatientService.createMedicalVisit.mockResolvedValue({
        id: 'visit-001',
        visitDate: new Date(),
        visitType: 'consultation',
        chiefComplaint: 'Headache',
        doctor: { user: { fullName: 'Dr. A', email: 'doc@test.com', phone: '' }, specialization: 'General', hospitalName: 'H' },
        patient: { id: 'p-1', user: { fullName: 'Jane', email: 'j@test.com' }, insuranceProvider: '', insuranceNumber: '' },
        createdAt: new Date(),
      } as any);
      const req: any = { params: { patientId: 'p-1' }, body: validBody, query: {} };
      const res = makeRes();
      await PatientController.createMedicalVisit(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 on error', async () => {
      MockPatientService.createMedicalVisit.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { patientId: 'p-1' }, body: validBody, query: {} };
      const res = makeRes();
      await PatientController.createMedicalVisit(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── getPatientMedicalHistory ───────────────────────────────────────────────
  describe('getPatientMedicalHistory', () => {
    it('should return 500 on error', async () => {
      MockPatientService.getPatientMedicalHistory.mockRejectedValue(new Error('DB error'));
      const req: any = {
        params: { patientId: 'p-1' },
        body: {},
        query: {},
        user: { id: 'u-1', role: 'doctor' },
      };
      const res = makeRes();
      await PatientController.getPatientMedicalHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should return 200 for doctor accessing patient history', async () => {
      MockPatientService.getPatientMedicalHistory.mockResolvedValue({
        visits: [],
        prescriptions: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
      } as any);
      const req: any = {
        params: { patientId: 'p-1' },
        body: {},
        query: {},
        user: { id: 'u-1', role: 'doctor' },
      };
      const res = makeRes();
      await PatientController.getPatientMedicalHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 403 for patient accessing another patient history', async () => {
      MockPatientService.getPatientByUserId.mockResolvedValue({ id: 'other-patient' } as any);
      const req: any = {
        params: { patientId: 'p-1' },
        body: {},
        query: {},
        user: { id: 'u-1', role: 'patient' },
      };
      const res = makeRes();
      await PatientController.getPatientMedicalHistory(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ── getAllPatients ─────────────────────────────────────────────────────────
  describe('getAllPatients', () => {
    it('should return 500 on error', async () => {
      MockPatientService.getAllPatients.mockRejectedValue(new Error('DB error'));
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getAllPatients(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── searchPatients ─────────────────────────────────────────────────────────
  describe('searchPatients', () => {
    it('should return 400 when query is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.searchPatients(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 with search results', async () => {
      MockPatientService.searchPatients.mockResolvedValue([] as any);
      const req: any = { params: {}, body: {}, query: { query: 'Jane' } };
      const res = makeRes();
      await PatientController.searchPatients(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      MockPatientService.searchPatients.mockRejectedValue(new Error('DB error'));
      const req: any = { params: {}, body: {}, query: { query: 'Jane' } };
      const res = makeRes();
      await PatientController.searchPatients(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── createPrescription ────────────────────────────────────────────────────
  describe('createPrescription', () => {
    const validBody = {
      doctorId: 'doc-001',
      visitId: 'visit-001',
      diagnosis: 'Flu',
      items: [{ medicineName: 'Paracetamol', dosage: '500mg', frequency: 'twice daily', quantity: 10 }],
    };

    it('should return 400 when required fields are missing', async () => {
      const req: any = { params: { patientId: 'p-1' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.createPrescription(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when items are empty', async () => {
      const req: any = { params: { patientId: 'p-1' }, body: { ...validBody, items: [] }, query: {} };
      const res = makeRes();
      await PatientController.createPrescription(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when item fields are missing', async () => {
      const req: any = {
        params: { patientId: 'p-1' },
        body: { ...validBody, items: [{ medicineName: 'Paracetamol' }] },
        query: {},
      };
      const res = makeRes();
      await PatientController.createPrescription(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 201 on success', async () => {
      MockPatientService.createPrescription.mockResolvedValue({
        id: 'presc-001',
        prescriptionNumber: 'RX-001',
        diagnosis: 'Flu',
        doctorNotes: '',
        status: 'pending',
        qrCodeHash: 'qr-hash',
        items: [],
        doctor: { user: { fullName: 'Dr. A', email: 'doc@t.com', phone: '' }, specialization: 'General', hospitalName: 'H' },
        patient: { id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com' }, insuranceProvider: '', insuranceNumber: '' },
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any);
      const req: any = { params: { patientId: 'p-1' }, body: validBody, query: {} };
      const res = makeRes();
      await PatientController.createPrescription(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 on service error', async () => {
      MockPatientService.createPrescription.mockRejectedValue(new Error('Patient not found'));
      const req: any = { params: { patientId: 'p-1' }, body: validBody, query: {} };
      const res = makeRes();
      await PatientController.createPrescription(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── getPatientPrescriptions ───────────────────────────────────────────────
  describe('getPatientPrescriptions', () => {
    it('should return 400 when patientId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientPrescriptions(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 with prescriptions', async () => {
      MockPatientService.getPatientPrescriptions.mockResolvedValue({ prescriptions: [], total: 0 } as any);
      const req: any = { params: { patientId: 'p-1' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientPrescriptions(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      MockPatientService.getPatientPrescriptions.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { patientId: 'p-1' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getPatientPrescriptions(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getAllPrescriptions ───────────────────────────────────────────────────
  describe('getAllPrescriptions', () => {
    it('should return 200 with all prescriptions', async () => {
      MockPatientService.getAllPrescriptions.mockResolvedValue({ prescriptions: [], total: 0 } as any);
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getAllPrescriptions(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      MockPatientService.getAllPrescriptions.mockRejectedValue(new Error('DB error'));
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PatientController.getAllPrescriptions(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── generateOTP ──────────────────────────────────────────────────────────
  describe('generateOTP', () => {
    it('should return 500 as this is handled by middleware', async () => {
      const req: any = { params: { patientId: 'p-1' }, body: {}, query: {} };
      const res = makeRes();
      await PatientController.generateOTP(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
