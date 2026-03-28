import { QRCodeService } from '../../services/qrCodeService';
import { QRCode as QRCodeModel, Prescription } from '../../models';
import { PrescriptionStatus } from '../../models/Prescription';

jest.mock('../../models');
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQRImageData'),
}));

const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockQRCode = QRCodeModel as jest.Mocked<typeof QRCodeModel>;

describe('QRCodeService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('generateQRCode', () => {
    const mockPrescription = {
      id: 'presc-001',
      prescriptionNumber: 'RX-2026-001',
      status: PrescriptionStatus.PENDING,
      diagnosis: 'Malaria',
      createdAt: new Date(),
      save: jest.fn(),
      patient: { user: { fullName: 'Patient One', nationalId: '1234567890123456' } },
      doctor: { user: { fullName: 'Dr. Jean' } },
      items: [{ medicineName: 'Coartem', dosage: '80mg', frequency: 'Twice daily', quantity: 6 }],
    };

    it('should generate QR code for a valid prescription', async () => {
      MockPrescription.findByPk.mockResolvedValue(mockPrescription as any);
      MockQRCode.findOne.mockResolvedValue(null);
      MockQRCode.create.mockResolvedValue({
        qrHash: 'abc123hash',
        encryptedData: 'encrypted',
        expiresAt: new Date(),
      } as any);

      const result = await QRCodeService.generateQRCode('presc-001');

      expect(result.qrHash).toBeDefined();
      expect(result.qrCodeImage).toBeDefined();
      expect(MockPrescription.findByPk).toHaveBeenCalledWith('presc-001', expect.any(Object));
    });

    it('should throw if prescription not found', async () => {
      MockPrescription.findByPk.mockResolvedValue(null);
      await expect(QRCodeService.generateQRCode('ghost-id')).rejects.toThrow('Prescription not found');
    });

    it('should throw if QR code already exists', async () => {
      MockPrescription.findByPk.mockResolvedValue(mockPrescription as any);
      MockQRCode.findOne.mockResolvedValue({ qrHash: 'existing-hash' } as any);

      await expect(QRCodeService.generateQRCode('presc-001')).rejects.toThrow();
    });
  });

  describe('verifyQRCode', () => {
    it('should return valid result for a valid QR code', async () => {
      MockQRCode.findOne.mockResolvedValue({
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000),
        encryptedData: Buffer.from(JSON.stringify({
          prescriptionId: 'presc-001',
          prescriptionNumber: 'RX-001',
          patientName: 'Patient',
          doctorName: 'Doctor',
          medicines: [],
          diagnosis: 'Test',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 3600000).toISOString(),
        })).toString('base64'),
        isExpired: jest.fn().mockReturnValue(false),
      } as any);

      const result = await QRCodeService.verifyQRCode('valid-hash');
      expect(result.isValid).toBe(true);
      expect(result.isExpired).toBe(false);
    });

    it('should return invalid for non-existent QR hash', async () => {
      MockQRCode.findOne.mockResolvedValue(null);
      const result = await QRCodeService.verifyQRCode('fake-hash');
      expect(result.isValid).toBe(false);
    });

    it('should return expired for expired QR code', async () => {
      MockQRCode.findOne.mockResolvedValue({
        isUsed: false,
        expiresAt: new Date(Date.now() - 1000),
        isExpired: jest.fn().mockReturnValue(true),
      } as any);

      const result = await QRCodeService.verifyQRCode('expired-hash');
      expect(result.isExpired).toBe(true);
      expect(result.isValid).toBe(false);
    });

    it('should return used=true for already-used QR code', async () => {
      MockQRCode.findOne.mockResolvedValue({
        isUsed: true,
        expiresAt: new Date(Date.now() + 3600000),
        isExpired: jest.fn().mockReturnValue(false),
      } as any);

      const result = await QRCodeService.verifyQRCode('used-hash');
      expect(result.isUsed).toBe(true);
    });
  });

  describe('getQRCodeStats', () => {
    it('should return stats for a QR code', async () => {
      MockQRCode.findOne.mockResolvedValue({
        qrHash: 'hash-001',
        scanCount: 3,
        isUsed: false,
        expiresAt: new Date(Date.now() + 3600000),
        prescription: { prescriptionNumber: 'RX-001', status: PrescriptionStatus.SCANNED },
      } as any);

      const result = await QRCodeService.getQRCodeStats('hash-001');
      expect(result).toBeDefined();
    });

    it('should throw if QR hash not found', async () => {
      MockQRCode.findOne.mockResolvedValue(null);
      await expect(QRCodeService.getQRCodeStats('ghost-hash')).rejects.toThrow();
    });
  });
});
