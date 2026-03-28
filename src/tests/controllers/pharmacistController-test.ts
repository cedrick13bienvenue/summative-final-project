import { Request, Response } from 'express';
import { PharmacistController } from '../../controllers/pharmacistController';
import { PharmacistService } from '../../services/pharmacistService';

jest.mock('../../services/pharmacistService');
const MockPharmacistService = PharmacistService as jest.Mocked<typeof PharmacistService>;

describe('PharmacistController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = { body: {}, params: {}, query: {} };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('registerPharmacist', () => {
    it('should register a pharmacist and return 201', async () => {
      mockReq.body = {
        email: 'pharm@rw.rw',
        password: 'pass123',
        fullName: 'Jean Pharm',
        licenseNumber: 'PHARM-001',
        pharmacyName: 'Test Pharmacy',
        pharmacyAddress: 'KN 1 Ave',
      };
      MockPharmacistService.createPharmacistProfile.mockResolvedValue({ pharmacistId: 'ph-001' } as any);

      await PharmacistController.registerPharmacist(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return error on failure', async () => {
      mockReq.body = { email: 'fail@rw.rw' };
      MockPharmacistService.createPharmacistProfile.mockRejectedValue(new Error('Failed'));

      await PharmacistController.registerPharmacist(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('getPharmacistById', () => {
    it('should return a pharmacist profile', async () => {
      mockReq.params = { pharmacistId: 'ph-001' };
      MockPharmacistService.getPharmacistById.mockResolvedValue({ id: 'ph-001' } as any);

      await PharmacistController.getPharmacistById(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return error when not found', async () => {
      mockReq.params = { pharmacistId: 'ghost' };
      MockPharmacistService.getPharmacistById.mockRejectedValue(new Error('Not found'));

      await PharmacistController.getPharmacistById(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('getAllPharmacists', () => {
    it('should return list of pharmacists', async () => {
      mockReq.query = { page: '1', limit: '10' };
      MockPharmacistService.getAllPharmacists.mockResolvedValue({ pharmacists: [], total: 0 } as any);

      await PharmacistController.getAllPharmacists(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('verifyPharmacist', () => {
    it('should verify a pharmacist', async () => {
      mockReq.params = { pharmacistId: 'ph-001' };
      MockPharmacistService.verifyPharmacist.mockResolvedValue(undefined as any);

      await PharmacistController.verifyPharmacist(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('unverifyPharmacist', () => {
    it('should unverify a pharmacist', async () => {
      mockReq.params = { pharmacistId: 'ph-001' };
      MockPharmacistService.unverifyPharmacist.mockResolvedValue(undefined as any);

      await PharmacistController.unverifyPharmacist(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('deletePharmacist', () => {
    it('should delete a pharmacist', async () => {
      mockReq.params = { pharmacistId: 'ph-001' };
      MockPharmacistService.deletePharmacist.mockResolvedValue(undefined as any);

      await PharmacistController.deletePharmacist(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('updatePharmacist', () => {
    it('should update pharmacist profile', async () => {
      mockReq.params = { pharmacistId: 'ph-001' };
      mockReq.body = { pharmacyName: 'Updated Pharmacy' };
      MockPharmacistService.updatePharmacist.mockResolvedValue({ id: 'ph-001' } as any);

      await PharmacistController.updatePharmacist(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
