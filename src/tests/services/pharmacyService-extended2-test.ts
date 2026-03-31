import { PharmacyService } from '../../services/pharmacyService';
import { Prescription, PharmacyLog, QRCode } from '../../models';
import { PrescriptionStatus } from '../../models/Prescription';
import { PharmacyAction } from '../../models/PharmacyLog';

jest.mock('../../models');
jest.mock('../../services/qrCodeService', () => ({
  QRCodeService: {
    verifyQRCode: jest.fn(),
    generateQRCode: jest.fn(),
  },
}));

const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPharmacyLog = PharmacyLog as jest.Mocked<typeof PharmacyLog>;

beforeEach(() => jest.clearAllMocks());

// ── validatePrescription ──────────────────────────────────────────────────
describe('PharmacyService.validatePrescription', () => {
  it('should return success:false when prescription not found', async () => {
    MockPrescription.findByPk.mockResolvedValue(null);
    const result = await PharmacyService.validatePrescription('ghost', 'pharm-001');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should return success:false when prescription is not SCANNED', async () => {
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.PENDING,
    } as any);
    const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
    expect(result.message).toContain('scanned');
  });

  it('should validate a SCANNED prescription successfully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    MockPrescription.findByPk
      .mockResolvedValueOnce({ id: 'presc-001', status: PrescriptionStatus.SCANNED, update: mockUpdate } as any)
      .mockResolvedValueOnce({
        id: 'presc-001', prescriptionNumber: 'RX-001', status: PrescriptionStatus.VALIDATED,
        doctor: { user: { fullName: 'Dr. A', email: 'doc@t.com', phone: '' }, specialization: '', hospitalName: '' },
        patient: { id: 'p-1', user: { fullName: 'Jane', email: 'j@t.com' }, insuranceProvider: '', insuranceNumber: '' },
      } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001', 'Looks good');
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle error gracefully', async () => {
    MockPrescription.findByPk.mockRejectedValue(new Error('DB error'));
    const result = await PharmacyService.validatePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
  });
});

// ── rejectPrescription ────────────────────────────────────────────────────
describe('PharmacyService.rejectPrescription', () => {
  it('should return success:false when prescription not found', async () => {
    MockPrescription.findByPk.mockResolvedValue(null);
    const result = await PharmacyService.rejectPrescription('ghost', 'pharm-001', 'Invalid');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should return success:false when prescription is FULFILLED', async () => {
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', status: PrescriptionStatus.FULFILLED,
    } as any);
    const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'Invalid');
    expect(result.success).toBe(false);
    expect(result.message).toContain('cannot be rejected');
  });

  it('should return success:false when prescription is CANCELLED', async () => {
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', status: PrescriptionStatus.CANCELLED,
    } as any);
    const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'Invalid');
    expect(result.success).toBe(false);
  });

  it('should reject a PENDING prescription successfully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue(undefined);
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001', prescriptionNumber: 'RX-001', status: PrescriptionStatus.PENDING,
      update: mockUpdate,
      patient: { user: { fullName: 'Jane' } },
      doctor: { user: { fullName: 'Dr. A' } },
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'Fake');
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should handle error gracefully', async () => {
    MockPrescription.findByPk.mockRejectedValue(new Error('DB error'));
    const result = await PharmacyService.rejectPrescription('presc-001', 'pharm-001', 'err');
    expect(result.success).toBe(false);
  });
});

// ── getPrescriptionLogs ───────────────────────────────────────────────────
describe('PharmacyService.getPrescriptionLogs', () => {
  it('should return prescription logs', async () => {
    MockPharmacyLog.findAll.mockResolvedValue([
      { id: 'log-1', action: PharmacyAction.SCAN, notes: 'test', pharmacist: { fullName: 'Ph One' }, actionTimestamp: new Date() },
    ] as any);
    const result = await PharmacyService.getPrescriptionLogs('presc-001');
    expect(result).toHaveLength(1);
    expect(result[0].action).toBe(PharmacyAction.SCAN);
  });

  it('should handle pharmacist not found in log', async () => {
    MockPharmacyLog.findAll.mockResolvedValue([
      { id: 'log-1', action: PharmacyAction.VALIDATED, notes: '', pharmacist: null, actionTimestamp: new Date() },
    ] as any);
    const result = await PharmacyService.getPrescriptionLogs('presc-001');
    expect(result[0].pharmacistName).toBe('Unknown');
  });

  it('should throw on error', async () => {
    MockPharmacyLog.findAll.mockRejectedValue(new Error('DB error'));
    await expect(PharmacyService.getPrescriptionLogs('presc-001')).rejects.toThrow('DB error');
  });
});

// ── getPharmacistHistory ──────────────────────────────────────────────────
describe('PharmacyService.getPharmacistHistory', () => {
  it('should return pharmacist history with pagination', async () => {
    MockPharmacyLog.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{
        id: 'log-1', action: PharmacyAction.DISPENSED, notes: '', actionTimestamp: new Date(),
        prescription: {
          id: 'presc-001', prescriptionNumber: 'RX-001', status: 'pending',
          patient: { user: { fullName: 'Jane' } }, doctor: { user: { fullName: 'Dr. A' } },
        },
      }],
    } as any);

    const result = await PharmacyService.getPharmacistHistory('pharm-001', 1, 10);
    expect(result.total).toBe(1);
    expect(result.logs).toHaveLength(1);
    expect(result.pagination.totalPages).toBe(1);
  });

  it('should handle missing prescription data in log', async () => {
    MockPharmacyLog.findAndCountAll.mockResolvedValue({
      count: 1,
      rows: [{ id: 'log-1', action: PharmacyAction.SCAN, notes: '', actionTimestamp: new Date(), prescription: null }],
    } as any);
    const result = await PharmacyService.getPharmacistHistory('pharm-001');
    expect(result.logs[0].prescription.patientName).toBe('');
    expect(result.logs[0].prescription.doctorName).toBe('');
  });

  it('should throw on error', async () => {
    MockPharmacyLog.findAndCountAll.mockRejectedValue(new Error('DB error'));
    await expect(PharmacyService.getPharmacistHistory('pharm-001')).rejects.toThrow('DB error');
  });
});

// ── lookupByReferenceNumber - status edge cases ───────────────────────────
describe('PharmacyService.lookupByReferenceNumber - status edge cases', () => {
  it('should return invalid when prescription is FULFILLED', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });
    MockPrescription.findOne.mockResolvedValue({
      id: 'presc-001', status: PrescriptionStatus.FULFILLED, createdAt: new Date(),
    } as any);
    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('fulfilled');
  });

  it('should return invalid when prescription is CANCELLED', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });
    MockPrescription.findOne.mockResolvedValue({
      id: 'presc-002', status: PrescriptionStatus.CANCELLED, createdAt: new Date(),
    } as any);
    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('cancelled');
  });

  it('should return invalid when patient not found', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue(null);
    const result = await PharmacyService.lookupByReferenceNumber('9999999999999999', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('not found');
  });
});
