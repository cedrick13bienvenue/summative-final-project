/**
 * Covers the `|| 'default message'` right-side branches in PharmacyService error handlers:
 * - scanQRCode catch: error.message || 'Failed to scan QR code'
 * - dispensePrescription catch: error.message || 'Failed to dispense prescription'
 * - validatePrescription catch: error.message || 'Failed to validate prescription'
 * - rejectPrescription catch: error.message || 'Failed to reject prescription'
 * - logPharmacyAction catch: re-throw from PharmacyLog.create failure
 */
import { PharmacyService } from '../../services/pharmacyService';
import { Prescription, PharmacyLog, QRCode } from '../../models';
import { PrescriptionStatus } from '../../models/Prescription';

jest.mock('../../models');
jest.mock('../../services/qrCodeService', () => ({
  QRCodeService: {
    verifyQRCode: jest.fn(),
    generateQRCode: jest.fn(),
  },
}));

const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPharmacyLog = PharmacyLog as jest.Mocked<typeof PharmacyLog>;

import { QRCodeService } from '../../services/qrCodeService';
const MockQRCodeService = QRCodeService as jest.Mocked<typeof QRCodeService>;

// Error with no .message — forces the `|| 'default'` right-side branch
const noMsgErr = { code: 'ERR' };

beforeEach(() => jest.clearAllMocks());

// ── scanQRCode - catch fallback message ───────────────────────────────────
describe('PharmacyService.scanQRCode - || fallback message', () => {
  it('uses fallback message when thrown error has no .message', async () => {
    (MockQRCodeService.verifyQRCode as jest.Mock).mockRejectedValue(noMsgErr);
    const result = await PharmacyService.scanQRCode('any-hash', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toBe('Failed to scan QR code');
  });
});

// ── dispensePrescription - catch fallback message ─────────────────────────
describe('PharmacyService.dispensePrescription - || fallback message', () => {
  it('uses fallback message when thrown error has no .message', async () => {
    MockPrescription.findByPk.mockRejectedValue(noMsgErr);
    const result = await PharmacyService.dispensePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to dispense prescription');
  });
});

// ── validatePrescription - catch fallback message ─────────────────────────
describe('PharmacyService.validatePrescription - || fallback message', () => {
  it('uses fallback message when thrown error has no .message', async () => {
    MockPrescription.findByPk.mockRejectedValue(noMsgErr);
    const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to validate prescription');
  });

  it('logPharmacyAction catch fires when PharmacyLog.create rejects after update', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    // First call: SCANNED prescription (validates OK)
    MockPrescription.findByPk
      .mockResolvedValueOnce({ id: 'presc-001', status: PrescriptionStatus.SCANNED, update: mockUpdate } as any)
      .mockResolvedValue(null); // second findByPk for enhanced prescription can be null
    // PharmacyLog.create fails → logPharmacyAction catch fires → re-throws → validatePrescription catch
    MockPharmacyLog.create.mockRejectedValue(new Error('Log DB error'));

    const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
    // error.message is 'Log DB error' so left side of || is used
    expect(result.message).toBe('Log DB error');
  });
});

// ── rejectPrescription - catch fallback message ───────────────────────────
describe('PharmacyService.rejectPrescription - || fallback message', () => {
  it('uses fallback message when thrown error has no .message', async () => {
    MockPrescription.findByPk.mockRejectedValue(noMsgErr);
    const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'reason');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to reject prescription');
  });
});
