import { QRCodeService } from '../../services/qrCodeService';
import { QRCode as QRCodeModel, Prescription } from '../../models';

jest.mock('../../models');
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQR'),
}));

const MockQRCode = QRCodeModel as jest.Mocked<typeof QRCodeModel>;
const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;

beforeEach(() => jest.clearAllMocks());

describe('QRCodeService - extended coverage', () => {
  // ── generateQRCode - existing expired QR ──────────────────────────────────
  describe('generateQRCode - expired QR update', () => {
    it('should update expired QR code and return new code', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      MockPrescription.findByPk.mockResolvedValue({
        id: 'presc-001',
        prescriptionNumber: 'RX-001',
        diagnosis: 'Test',
        createdAt: new Date(),
        patient: { user: { fullName: 'Jane', nationalId: '1234567890123456' } },
        doctor: { user: { fullName: 'Dr. A' } },
        items: [],
      } as any);
      MockQRCode.findOne.mockResolvedValue({
        qrHash: 'old-hash',
        encryptedData: 'old-enc',
        expiresAt: new Date(Date.now() - 1000),
        isExpired: jest.fn().mockReturnValue(true),
        update: mockUpdate,
      } as any);

      const result = await QRCodeService.generateQRCode('presc-001');
      expect(mockUpdate).toHaveBeenCalled();
      expect(result.qrHash).toBeDefined();
    });
  });

  // ── markQRCodeAsUsed ──────────────────────────────────────────────────────
  describe('markQRCodeAsUsed', () => {
    it('should mark QR code as used', async () => {
      const mockMarkAsUsed = jest.fn();
      const mockSave = jest.fn().mockResolvedValue(undefined);
      MockQRCode.findOne.mockResolvedValue({
        isUsed: false,
        isExpired: jest.fn().mockReturnValue(false),
        markAsUsed: mockMarkAsUsed,
        save: mockSave,
      } as any);

      const result = await QRCodeService.markQRCodeAsUsed('valid-hash');
      expect(mockMarkAsUsed).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should throw when QR code not found', async () => {
      MockQRCode.findOne.mockResolvedValue(null);
      await expect(QRCodeService.markQRCodeAsUsed('ghost')).rejects.toThrow('Failed to mark QR code as used');
    });

    it('should throw when QR code is expired', async () => {
      MockQRCode.findOne.mockResolvedValue({
        isExpired: jest.fn().mockReturnValue(true),
      } as any);
      await expect(QRCodeService.markQRCodeAsUsed('expired-hash')).rejects.toThrow('Failed to mark QR code as used');
    });
  });

  // ── generateQRCodeImage ───────────────────────────────────────────────────
  describe('generateQRCodeImage', () => {
    it('should return base64 image data', async () => {
      const result = await QRCodeService.generateQRCodeImage('some-hash');
      expect(result).toContain('data:image/png;base64,');
    });

    it('should throw when QRCode.toDataURL fails', async () => {
      const QRCodeLib = require('qrcode');
      QRCodeLib.toDataURL.mockRejectedValue(new Error('QR generation failed'));
      await expect(QRCodeService.generateQRCodeImage('bad')).rejects.toThrow('Failed to generate QR code image');
    });
  });

  // ── getAllQRCodes ─────────────────────────────────────────────────────────
  describe('getAllQRCodes', () => {
    it('should return paginated list of QR codes', async () => {
      const mockQR = {
        id: 'qr-001',
        qrHash: 'hash-001',
        prescriptionId: 'presc-001',
        isUsed: false,
        isExpired: jest.fn().mockReturnValue(false),
        scanCount: 1,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        prescription: {
          prescriptionNumber: 'RX-001',
          diagnosis: 'Test',
          status: 'PENDING',
          patient: { user: { fullName: 'Jane', email: 'j@test.com' } },
          doctor: { user: { fullName: 'Dr. A', email: 'doc@test.com' } },
        },
      };
      MockQRCode.findAndCountAll.mockResolvedValue({ rows: [mockQR as any], count: 1 } as any);

      const result = await QRCodeService.getAllQRCodes(1, 10);
      expect(result.total).toBe(1);
      expect(result.qrCodes).toHaveLength(1);
    });

    it('should return QR code with null prescription data', async () => {
      const mockQR = {
        id: 'qr-002',
        qrHash: 'hash-002',
        prescriptionId: 'presc-002',
        isUsed: false,
        isExpired: jest.fn().mockReturnValue(false),
        scanCount: 0,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 86400000),
        prescription: null,
      };
      MockQRCode.findAndCountAll.mockResolvedValue({ rows: [mockQR as any], count: 1 } as any);

      const result = await QRCodeService.getAllQRCodes();
      expect(result.qrCodes[0].prescription).toBeNull();
    });

    it('should throw on error', async () => {
      MockQRCode.findAndCountAll.mockRejectedValue(new Error('DB error'));
      await expect(QRCodeService.getAllQRCodes()).rejects.toThrow('Failed to get QR codes');
    });
  });

  // ── getQRCodeStats - error ────────────────────────────────────────────────
  describe('getQRCodeStats - error', () => {
    it('should throw on error', async () => {
      MockQRCode.findOne.mockRejectedValue(new Error('DB error'));
      await expect(QRCodeService.getQRCodeStats('hash-001')).rejects.toThrow('Failed to get QR code stats');
    });
  });

  // ── verifyQRCode - outer catch ────────────────────────────────────────────
  describe('verifyQRCode - outer error', () => {
    it('should return invalid on unexpected error', async () => {
      MockQRCode.findOne.mockRejectedValue(new Error('DB error'));
      const result = await QRCodeService.verifyQRCode('any-hash');
      expect(result.isValid).toBe(false);
    });
  });
});
