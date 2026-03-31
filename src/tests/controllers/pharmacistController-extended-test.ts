import { Request, Response } from 'express';
import { PharmacistController } from '../../controllers/pharmacistController';
import { PharmacistService } from '../../services/pharmacistService';
import { AuthService } from '../../services/authService';

jest.mock('../../services/pharmacistService');
jest.mock('../../services/authService');
const MockPharmacistService = PharmacistService as jest.Mocked<typeof PharmacistService>;
const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Partial<Response>;
};

beforeEach(() => jest.clearAllMocks());

describe('PharmacistController - extended coverage', () => {
  // ── registerPharmacist - validation ────────────────────────────────────────
  describe('registerPharmacist - validation', () => {
    it('should return 400 when required fields are missing', async () => {
      const req: any = { body: { email: 'p@test.com' }, params: {}, query: {} };
      const res = makeRes();
      await PharmacistController.registerPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for invalid email format', async () => {
      const req: any = {
        body: { email: 'bad-email', password: 'pass123', fullName: 'Ph', licenseNumber: 'L', pharmacyName: 'P' },
        params: {}, query: {},
      };
      const res = makeRes();
      await PharmacistController.registerPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 for short password', async () => {
      const req: any = {
        body: { email: 'p@test.com', password: 'abc', fullName: 'Ph', licenseNumber: 'L', pharmacyName: 'P' },
        params: {}, query: {},
      };
      const res = makeRes();
      await PharmacistController.registerPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 on generic error', async () => {
      MockAuthService.register.mockRejectedValue(new Error('Registration failed'));
      const req: any = {
        body: { email: 'p@test.com', password: 'pass123', fullName: 'Ph', licenseNumber: 'L', pharmacyName: 'P' },
        params: {}, query: {},
      };
      const res = makeRes();
      await PharmacistController.registerPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── getAllPharmacists ──────────────────────────────────────────────────────
  describe('getAllPharmacists', () => {
    it('should return 500 on error', async () => {
      MockPharmacistService.getAllPharmacists.mockRejectedValue(new Error('DB error'));
      const req: any = { body: {}, params: {}, query: {} };
      const res = makeRes();
      await PharmacistController.getAllPharmacists(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getPharmacistById ──────────────────────────────────────────────────────
  describe('getPharmacistById', () => {
    it('should return 400 when pharmacistId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.getPharmacistById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 404 when pharmacist not found', async () => {
      MockPharmacistService.getPharmacistById.mockResolvedValue(null);
      const req: any = { params: { pharmacistId: 'ghost' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.getPharmacistById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return 500 on error', async () => {
      MockPharmacistService.getPharmacistById.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.getPharmacistById(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  // ── updatePharmacist ───────────────────────────────────────────────────────
  describe('updatePharmacist', () => {
    it('should return 400 when pharmacistId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.updatePharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 on error', async () => {
      MockPharmacistService.updatePharmacist.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.updatePharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── deletePharmacist ───────────────────────────────────────────────────────
  describe('deletePharmacist', () => {
    it('should return 400 when pharmacistId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.deletePharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 on error', async () => {
      MockPharmacistService.deletePharmacist.mockRejectedValue(new Error('DB error'));
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.deletePharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── verifyPharmacist ───────────────────────────────────────────────────────
  describe('verifyPharmacist', () => {
    it('should return 400 when pharmacistId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.verifyPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 on success', async () => {
      MockPharmacistService.verifyPharmacist.mockResolvedValue({ id: 'ph-001', isVerified: true } as any);
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.verifyPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on error', async () => {
      MockPharmacistService.verifyPharmacist.mockRejectedValue(new Error('Not found'));
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.verifyPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ── unverifyPharmacist ─────────────────────────────────────────────────────
  describe('unverifyPharmacist', () => {
    it('should return 400 when pharmacistId is missing', async () => {
      const req: any = { params: {}, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.unverifyPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should return 200 on success', async () => {
      MockPharmacistService.unverifyPharmacist.mockResolvedValue({ id: 'ph-001', isVerified: false } as any);
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.unverifyPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 on error', async () => {
      MockPharmacistService.unverifyPharmacist.mockRejectedValue(new Error('Not found'));
      const req: any = { params: { pharmacistId: 'ph-001' }, body: {}, query: {} };
      const res = makeRes();
      await PharmacistController.unverifyPharmacist(req as Request, res as Response);
      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});
