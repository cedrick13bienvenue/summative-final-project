import { Request, Response } from 'express';
import { DoctorController } from '../../controllers/doctorController';
import { DoctorService } from '../../services/doctorService';
import { AuthService } from '../../services/authService';

jest.mock('../../services/doctorService');
jest.mock('../../services/authService');
const MockDoctorService = DoctorService as jest.Mocked<typeof DoctorService>;
const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Partial<Response>;
};

beforeEach(() => jest.clearAllMocks());

describe('DoctorController - extended coverage', () => {
  // ── registerDoctor - validation errors ────────────────────────────────────
  describe('registerDoctor - validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const req: any = { body: { email: 'doc@test.com' }, params: {}, query: {} };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid email format', async () => {
      const req: any = {
        body: { email: 'invalid-email', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for short password', async () => {
      const req: any = {
        body: { email: 'doc@test.com', password: 'abc', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 409 for SequelizeUniqueConstraintError on license_number', async () => {
      MockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'doc@test.com', fullName: 'Dr', role: 'doctor' as any, phone: undefined },
        token: 'tok',
      });
      const uniqueError: any = new Error('Unique');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'license_number' }];
      MockDoctorService.createDoctorProfile.mockRejectedValue(uniqueError);

      const req: any = {
        body: { email: 'doc@test.com', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 409 for SequelizeUniqueConstraintError on email', async () => {
      MockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'doc@test.com', fullName: 'Dr', role: 'doctor' as any, phone: undefined },
        token: 'tok',
      });
      const uniqueError: any = new Error('Unique');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'email' }];
      MockDoctorService.createDoctorProfile.mockRejectedValue(uniqueError);

      const req: any = {
        body: { email: 'doc@test.com', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 409 for generic SequelizeUniqueConstraintError', async () => {
      MockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'doc@test.com', fullName: 'Dr', role: 'doctor' as any, phone: undefined },
        token: 'tok',
      });
      const uniqueError: any = new Error('Unique');
      uniqueError.name = 'SequelizeUniqueConstraintError';
      uniqueError.errors = [{ path: 'other_field' }];
      MockDoctorService.createDoctorProfile.mockRejectedValue(uniqueError);

      const req: any = {
        body: { email: 'doc@test.com', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(409);
    });

    it('should return 400 for SequelizeValidationError', async () => {
      MockAuthService.register.mockResolvedValue({
        user: { id: 'u-1', email: 'doc@test.com', fullName: 'Dr', role: 'doctor' as any, phone: undefined },
        token: 'tok',
      });
      const valError: any = new Error('Validation');
      valError.name = 'SequelizeValidationError';
      valError.errors = [{ path: 'email', message: 'Invalid email' }];
      MockDoctorService.createDoctorProfile.mockRejectedValue(valError);

      const req: any = {
        body: { email: 'doc@test.com', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 for generic error', async () => {
      MockAuthService.register.mockRejectedValue(new Error('DB crash'));
      const req: any = {
        body: { email: 'doc@test.com', password: 'pass123', fullName: 'Dr', licenseNumber: 'L', specialization: 'S', hospitalName: 'H' },
        params: {}, query: {},
      };
      const res = makeRes();
      await DoctorController.registerDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getAllDoctors error ────────────────────────────────────────────────────
  describe('getAllDoctors', () => {
    it('should return 500 on error', async () => {
      MockDoctorService.getAllDoctors.mockRejectedValue(new Error('DB error'));
      const req: any = { body: {}, params: {}, query: {} };
      const res = makeRes();
      await DoctorController.getAllDoctors(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getDoctorById - missing ID, not found, error ──────────────────────────
  describe('getDoctorById', () => {
    it('should return 400 when doctorId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.getDoctorById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when doctor not found', async () => {
      MockDoctorService.getDoctorById.mockResolvedValue(null);
      const req: any = { params: { doctorId: 'ghost-id' }, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.getDoctorById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      MockDoctorService.getDoctorById.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { doctorId: 'doc-001' }, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.getDoctorById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updateDoctorProfile ───────────────────────────────────────────────────
  describe('updateDoctorProfile', () => {
    it('should return 400 when doctorId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.updateDoctorProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when doctor not found', async () => {
      MockDoctorService.updateDoctorProfile.mockResolvedValue(null);
      const req: any = { params: { doctorId: 'ghost-id' }, body: { specialization: 'X' }, query: {} };
      const res = makeRes();
      await DoctorController.updateDoctorProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 on error', async () => {
      MockDoctorService.updateDoctorProfile.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { doctorId: 'doc-001' }, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.updateDoctorProfile(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── deleteDoctor ──────────────────────────────────────────────────────────
  describe('deleteDoctor', () => {
    it('should return 400 when doctorId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.deleteDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when doctor not found', async () => {
      MockDoctorService.deleteDoctor.mockResolvedValue(false as any);
      const req: any = { params: { doctorId: 'ghost-id' }, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.deleteDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      MockDoctorService.deleteDoctor.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { doctorId: 'doc-001' }, body: {}, query: {} };
      const res = makeRes();
      await DoctorController.deleteDoctor(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
