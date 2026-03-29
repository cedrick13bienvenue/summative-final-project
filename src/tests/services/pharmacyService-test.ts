import { PharmacyService } from '../../services/pharmacyService';
import { Prescription, PharmacyLog, QRCode, PrescriptionItem } from '../../models';
import { PrescriptionStatus } from '../../models/Prescription';
import { PharmacyAction } from '../../models/PharmacyLog';

jest.mock('../../models');
jest.mock('../../services/qrCodeService', () => ({
  QRCodeService: {
    verifyQRCode: jest.fn(),
  },
}));

const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPharmacyLog = PharmacyLog as jest.Mocked<typeof PharmacyLog>;
const MockQRCode = QRCode as jest.Mocked<typeof QRCode>;

import { QRCodeService } from '../../services/qrCodeService';
const MockQRCodeService = QRCodeService as jest.Mocked<typeof QRCodeService>;

describe('PharmacyService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('scanQRCode', () => {
    it('should scan a valid QR code and update prescription to SCANNED', async () => {
      (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
        isValid: true,
        isExpired: false,
        isUsed: false,
        prescriptionData: { prescriptionId: 'presc-001' },
      });

      const mockUpdate = jest.fn().mockResolvedValue({});
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        status: PrescriptionStatus.PENDING,
        update: mockUpdate,
        patient: { user: { fullName: 'Patient One', nationalId: '1234567890123456' } },
        doctor: { user: { fullName: 'Dr. Jean' } },
        items: [],
        visit: null,
        qrCode: { qrHash: 'hash-001', isExpired: jest.fn().mockReturnValue(false) },
      } as any);

      MockPharmacyLog.create.mockResolvedValue({} as any);

      const result = await PharmacyService.scanQRCode('hash-001', 'pharm-001');
      expect(result.isValid).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
      expect(MockPharmacyLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ action: PharmacyAction.SCANNED })
      );
    });

    it('should return invalid for expired QR code', async () => {
      (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
        isValid: false,
        isExpired: true,
        isUsed: false,
      });

      const result = await PharmacyService.scanQRCode('expired-hash', 'pharm-001');
      expect(result.isValid).toBe(false);
    });

    it('should return invalid for already-used QR code', async () => {
      (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
        isValid: false,
        isExpired: false,
        isUsed: true,
      });

      const result = await PharmacyService.scanQRCode('used-hash', 'pharm-001');
      expect(result.isValid).toBe(false);
    });
  });

  describe('validatePrescription', () => {
    it('should validate a SCANNED prescription', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        status: PrescriptionStatus.SCANNED,
        update: mockUpdate,
        patient: { user: { fullName: 'Patient' } },
        doctor: { user: { fullName: 'Doctor' } },
        items: [],
      } as any);
      MockPharmacyLog.create.mockResolvedValue({} as any);

      const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001', 'All good');
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should return success:false if prescription not in SCANNED status', async () => {
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        status: PrescriptionStatus.PENDING,
      } as any);

      const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001', '');
      expect(result.success).toBe(false);
    });

    it('should return success:false if prescription not found', async () => {
      MockPrescription.findByPk.mockResolvedValue(null);
      const result = await PharmacyService.validatePrescription('ghost-id', 'pharm-001', '');
      expect(result.success).toBe(false);
    });
  });

  describe('rejectPrescription', () => {
    it('should reject a SCANNED prescription', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        status: PrescriptionStatus.SCANNED,
        update: mockUpdate,
        prescriptionNumber: 'RX-001',
      } as any);
      MockPharmacyLog.create.mockResolvedValue({} as any);

      const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'Wrong patient');
      expect(result.success).toBe(true);
      expect(mockUpdate).toHaveBeenCalled();
    });

    it('should reject a VALIDATED prescription', async () => {
      const mockUpdate = jest.fn().mockResolvedValue({});
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        status: PrescriptionStatus.VALIDATED,
        update: mockUpdate,
        prescriptionNumber: 'RX-001',
      } as any);
      MockPharmacyLog.create.mockResolvedValue({} as any);

      const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'Drug unavailable');
      expect(result.success).toBe(true);
    });

    it('should return success:false if prescription is not in a rejectable state', async () => {
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        status: PrescriptionStatus.FULFILLED,
      } as any);

      const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'reason');
      expect(result.success).toBe(false);
    });
  });

  describe('getPrescriptionLogs', () => {
    it('should return logs for a prescription', async () => {
      MockPharmacyLog.findAll.mockResolvedValue([
        { id: 'log-001', action: PharmacyAction.SCAN },
        { id: 'log-002', action: PharmacyAction.VALIDATED },
      ] as any);

      const result = await PharmacyService.getPrescriptionLogs('presc-001');
      expect(result).toHaveLength(2);
    });
  });

  describe('getPharmacistHistory', () => {
    it('should return paginated pharmacist history', async () => {
      MockPharmacyLog.findAndCountAll.mockResolvedValue({
        rows: [{ id: 'log-001' }],
        count: 1,
      } as any);

      const result = await PharmacyService.getPharmacistHistory('pharm-001', 1, 10);
      expect(result).toBeDefined();
    });
  });

  describe('lookupByReferenceNumber (National ID)', () => {
    it('should return not found for unknown national ID', async () => {
      // dynamic import mock
      jest.doMock('../../models', () => ({
        Patient: { findOne: jest.fn().mockResolvedValue(null) },
        User: {},
      }));

      const result = await PharmacyService.lookupByReferenceNumber('9999999999999999', 'pharm-001');
      expect(result.isValid).toBe(false);
      expect(result.prescription).toBeNull();
    });
  });
});
