import { Request, Response } from 'express';
import { PharmacyController } from '../../controllers/pharmacyController';
import { PharmacyService } from '../../services/pharmacyService';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/pharmacyService');
const MockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;

describe('PharmacyController', () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  const mockPharmacist = { id: 'pharm-001', role: 'pharmacist' };

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      query: {},
      user: mockPharmacist as any,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('scanQRCode', () => {
    it('should scan QR code and return result', async () => {
      mockReq.body = { qrHash: 'valid-qr-hash' };
      MockPharmacyService.scanQRCode.mockResolvedValue({
        prescription: { id: 'presc-001' },
        isValid: true,
        message: 'Scanned successfully',
        canDispense: true,
      });

      await PharmacyController.scanQRCode(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockPharmacyService.scanQRCode).toHaveBeenCalledWith('valid-qr-hash', 'pharm-001');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('should return 400 if qrHash is missing', async () => {
      mockReq.body = {};
      await PharmacyController.scanQRCode(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 if user not authenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = { qrHash: 'some-hash' };
      await PharmacyController.scanQRCode(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle service errors', async () => {
      mockReq.body = { qrHash: 'bad-hash' };
      MockPharmacyService.scanQRCode.mockRejectedValue(new Error('QR error'));
      await PharmacyController.scanQRCode(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(expect.any(Number));
    });
  });

  describe('lookupByNationalId', () => {
    it('should lookup by national ID', async () => {
      mockReq.body = { nationalId: '1234567890123456' };
      MockPharmacyService.lookupByReferenceNumber.mockResolvedValue({
        prescription: { id: 'presc-001' },
        isValid: true,
        message: 'Found',
        canDispense: true,
      });

      await PharmacyController.lookupByReferenceNumber(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 400 if nationalId is missing', async () => {
      mockReq.body = {};
      await PharmacyController.lookupByReferenceNumber(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  describe('validatePrescription', () => {
    it('should validate a prescription', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = { notes: 'All valid' };
      MockPharmacyService.validatePrescription.mockResolvedValue({
        success: true,
        message: 'Validated',
      });

      await PharmacyController.validatePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if unauthenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { prescriptionId: 'presc-001' };
      await PharmacyController.validatePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });

  describe('dispensePrescription', () => {
    it('should dispense a prescription', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = {
        items: [{ prescriptionItemId: 'item-001', dispensedQuantity: 10 }],
        notes: 'Dispensed OK',
      };
      MockPharmacyService.dispensePrescription.mockResolvedValue({
        success: true,
        message: 'Dispensed',
      });

      await PharmacyController.dispensePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('rejectPrescription', () => {
    it('should reject a prescription', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = { reason: 'Drug not available' };
      MockPharmacyService.rejectPrescription.mockResolvedValue({
        success: true,
        message: 'Rejected',
      });

      await PharmacyController.rejectPrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPrescriptionLogs', () => {
    it('should return prescription logs', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      MockPharmacyService.getPrescriptionLogs.mockResolvedValue([{ id: 'log-001' }] as any);

      await PharmacyController.getPrescriptionLogs(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('getPharmacistHistory', () => {
    it('should return pharmacist dispensing history', async () => {
      mockReq.query = { page: '1', limit: '10' };
      MockPharmacyService.getPharmacistHistory.mockResolvedValue({ logs: [], total: 0 } as any);

      await PharmacyController.getPharmacistHistory(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
