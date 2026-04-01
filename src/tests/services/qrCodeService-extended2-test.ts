/**
 * Covers qrCodeService.verifyQRCode inner try/catch branch:
 * - encryptedData with invalid format → inner catch → { isValid: false, error: 'Invalid QR code data' }
 * - encryptedData with valid format → successful decryption → scanCount++ and save()
 */
import crypto from 'crypto';
import { QRCodeService } from '../../services/qrCodeService';
import { QRCode as QRCodeModel } from '../../models';

jest.mock('../../models');
jest.mock('qrcode', () => ({
  toDataURL: jest.fn().mockResolvedValue('data:image/png;base64,mockQR'),
}));

const MockQRCode = QRCodeModel as jest.Mocked<typeof QRCodeModel>;

beforeEach(() => jest.clearAllMocks());

// Helper: produce a valid encryptedData string using the same algorithm as the service
function makeValidEncryptedData(plaintext: string): string {
  const ENCRYPTION_KEY = process.env['QR_ENCRYPTION_KEY'] || 'default-key-change-in-production';
  const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return `${iv.toString('hex')}:${encrypted}`;
}

describe('QRCodeService.verifyQRCode - inner try/catch branches', () => {
  it('returns { isValid: false, error: "Invalid QR code data" } when encryptedData has no colon', async () => {
    const mockSave = jest.fn().mockResolvedValue(undefined);
    MockQRCode.findOne.mockResolvedValue({
      qrHash: 'test-hash',
      isUsed: false,
      isExpired: jest.fn().mockReturnValue(false),
      encryptedData: 'invalidnocolon', // parts.length !== 2 → decryptData throws
      scanCount: 0,
      save: mockSave,
    } as any);

    const result = await QRCodeService.verifyQRCode('test-hash');
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('Invalid QR code data');
    // save() should NOT be called since we returned early from inner catch
    expect(mockSave).not.toHaveBeenCalled();
  });

  it('returns isValid:true and increments scanCount when encryptedData is valid', async () => {
    const validPayload = JSON.stringify({
      prescriptionId: 'presc-001',
      prescriptionNumber: 'RX-001',
      patientName: 'Jane',
      doctorName: 'Dr. A',
      medicines: [],
      diagnosis: 'Flu',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
    const encryptedData = makeValidEncryptedData(validPayload);
    const mockSave = jest.fn().mockResolvedValue(undefined);

    MockQRCode.findOne.mockResolvedValue({
      qrHash: 'valid-hash',
      isUsed: false,
      isExpired: jest.fn().mockReturnValue(false),
      encryptedData,
      scanCount: 0,
      save: mockSave,
    } as any);

    const result = await QRCodeService.verifyQRCode('valid-hash');
    expect(result.isValid).toBe(true);
    expect(result.prescriptionData).toBeDefined();
    expect(result.prescriptionData!.prescriptionId).toBe('presc-001');
    expect(mockSave).toHaveBeenCalled();
  });
});
