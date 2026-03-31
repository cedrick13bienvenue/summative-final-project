import { Request, Response } from 'express';
import { PharmacyController } from '../../controllers/pharmacyController';
import { PharmacyService } from '../../services/pharmacyService';
import { AuthenticatedRequest } from '../../middleware/auth';

jest.mock('../../services/pharmacyService');
const MockPharmacyService = PharmacyService as jest.Mocked<typeof PharmacyService>;

describe('PharmacyController - extended coverage', () => {
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

  // ── lookupByReferenceNumber ──────────────────────────────────────────
  describe('lookupByReferenceNumber', () => {
    it('should return 401 when unauthenticated', async () => {
      mockReq.user = undefined;
      mockReq.body = { nationalId: '1234567890123456' };
      await PharmacyController.lookupByReferenceNumber(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when lookup is invalid', async () => {
      mockReq.body = { nationalId: '1234567890123456' };
      MockPharmacyService.lookupByReferenceNumber.mockResolvedValue({
        prescription: null,
        isValid: false,
        message: 'Not found',
        canDispense: false,
      });
      await PharmacyController.lookupByReferenceNumber(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on unexpected error', async () => {
      mockReq.body = { nationalId: '1234567890123456' };
      MockPharmacyService.lookupByReferenceNumber.mockRejectedValue(new Error('DB fail'));
      await PharmacyController.lookupByReferenceNumber(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── scanQRCode ──────────────────────────────────────────────────────
  describe('scanQRCode - extended', () => {
    it('should return 400 when scan result is invalid', async () => {
      mockReq.body = { qrHash: 'invalid-hash' };
      MockPharmacyService.scanQRCode.mockResolvedValue({
        prescription: null,
        isValid: false,
        message: 'Invalid QR',
        canDispense: false,
      });
      await PharmacyController.scanQRCode(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });
  });

  // ── validatePrescription ────────────────────────────────────────────
  describe('validatePrescription - extended', () => {
    it('should return 400 when validation fails', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      MockPharmacyService.validatePrescription.mockResolvedValue({
        success: false,
        message: 'Not in SCANNED status',
      });
      await PharmacyController.validatePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      MockPharmacyService.validatePrescription.mockRejectedValue(new Error('DB error'));
      await PharmacyController.validatePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── dispensePrescription ────────────────────────────────────────────
  describe('dispensePrescription - extended', () => {
    it('should return 400 when prescriptionId is missing', async () => {
      mockReq.params = {};
      await PharmacyController.dispensePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 when unauthenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { prescriptionId: 'presc-001' };
      await PharmacyController.dispensePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when dispense fails', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      MockPharmacyService.dispensePrescription.mockResolvedValue({
        success: false,
        message: 'Not validated',
      });
      await PharmacyController.dispensePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      MockPharmacyService.dispensePrescription.mockRejectedValue(new Error('DB error'));
      await PharmacyController.dispensePrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── rejectPrescription ──────────────────────────────────────────────
  describe('rejectPrescription - extended', () => {
    it('should return 400 when prescriptionId is missing', async () => {
      mockReq.params = {};
      mockReq.body = { reason: 'some reason' };
      await PharmacyController.rejectPrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 400 when reason is missing', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = {};
      await PharmacyController.rejectPrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 401 when unauthenticated', async () => {
      mockReq.user = undefined;
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = { reason: 'No stock' };
      await PharmacyController.rejectPrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 when rejection fails', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = { reason: 'Drug shortage' };
      MockPharmacyService.rejectPrescription.mockResolvedValue({
        success: false,
        message: 'Already fulfilled',
      });
      await PharmacyController.rejectPrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      mockReq.body = { reason: 'test' };
      MockPharmacyService.rejectPrescription.mockRejectedValue(new Error('DB error'));
      await PharmacyController.rejectPrescription(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getPrescriptionLogs ─────────────────────────────────────────────
  describe('getPrescriptionLogs - extended', () => {
    it('should return 400 when prescriptionId is missing', async () => {
      mockReq.params = {};
      await PharmacyController.getPrescriptionLogs(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockReq.params = { prescriptionId: 'presc-001' };
      MockPharmacyService.getPrescriptionLogs.mockRejectedValue(new Error('DB error'));
      await PharmacyController.getPrescriptionLogs(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getPharmacistHistory ─────────────────────────────────────────────
  describe('getPharmacistHistory - extended', () => {
    it('should return 401 when unauthenticated', async () => {
      mockReq.user = undefined;
      await PharmacyController.getPharmacistHistory(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should return 500 on error', async () => {
      MockPharmacyService.getPharmacistHistory.mockRejectedValue(new Error('DB error'));
      await PharmacyController.getPharmacistHistory(mockReq as AuthenticatedRequest, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── checkScanStatus ─────────────────────────────────────────────────
  describe('checkScanStatus', () => {
    it('should return QR scan status', async () => {
      (mockReq as any).params = { qrHash: 'hash-001' };
      MockPharmacyService.checkQRScanStatus.mockResolvedValue({
        qrHash: 'hash-001',
        isScanned: true,
        scanCount: 2,
        lastScannedAt: new Date(),
        isUsed: false,
        isExpired: false,
        expiresAt: new Date(),
      } as any);
      await PharmacyController.checkScanStatus(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 404 when QR code not found', async () => {
      (mockReq as any).params = { qrHash: 'nonexistent' };
      MockPharmacyService.checkQRScanStatus.mockResolvedValue(null);
      await PharmacyController.checkScanStatus(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it('should return 400 when qrHash is missing', async () => {
      (mockReq as any).params = {};
      await PharmacyController.checkScanStatus(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      (mockReq as any).params = { qrHash: 'hash-err' };
      MockPharmacyService.checkQRScanStatus.mockRejectedValue(new Error('DB error'));
      await PharmacyController.checkScanStatus(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getDispensingHistory ────────────────────────────────────────────
  describe('getDispensingHistory', () => {
    it('should return dispensing history', async () => {
      (mockReq as any).params = { prescriptionId: 'presc-001' };
      MockPharmacyService.getDispensingHistory.mockResolvedValue([] as any);
      await PharmacyController.getDispensingHistory(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      (mockReq as any).params = { prescriptionId: 'presc-001' };
      MockPharmacyService.getDispensingHistory.mockRejectedValue(new Error('DB error'));
      await PharmacyController.getDispensingHistory(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });

  // ── getDispensingSummary ────────────────────────────────────────────
  describe('getDispensingSummary', () => {
    it('should return dispensing summary', async () => {
      (mockReq as any).params = { prescriptionId: 'presc-001' };
      MockPharmacyService.getDispensingSummary.mockResolvedValue({ totalAmount: 100 } as any);
      await PharmacyController.getDispensingSummary(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      (mockReq as any).params = { prescriptionId: 'presc-001' };
      MockPharmacyService.getDispensingSummary.mockRejectedValue(new Error('DB error'));
      await PharmacyController.getDispensingSummary(mockReq as Request, mockRes as Response);
      expect(mockRes.status).toHaveBeenCalledWith(500);
    });
  });
});
