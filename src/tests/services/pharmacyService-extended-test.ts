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
const MockQRCode = QRCode as jest.Mocked<typeof QRCode>;

import { QRCodeService } from '../../services/qrCodeService';
const MockQRCodeService = QRCodeService as jest.Mocked<typeof QRCodeService>;

beforeEach(() => jest.clearAllMocks());

describe('PharmacyService.dispensePrescription', () => {
  it('should return success:false if prescription not found', async () => {
    MockPrescription.findByPk.mockResolvedValue(null);
    const result = await PharmacyService.dispensePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should return success:false if prescription is not VALIDATED', async () => {
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.PENDING,
    } as any);
    const result = await PharmacyService.dispensePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
    expect(result.message).toContain('validated');
  });

  it('should dispense a VALIDATED prescription successfully', async () => {
    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockGetQrCode = jest.fn().mockResolvedValue(null);
    MockPrescription.findByPk
      .mockResolvedValueOnce({
        id: 'presc-001',
        status: PrescriptionStatus.VALIDATED,
        update: mockUpdate,
        items: [],
        getQrCode: mockGetQrCode,
      } as any)
      .mockResolvedValueOnce({
        id: 'presc-001',
        prescriptionNumber: 'RX-001',
        status: PrescriptionStatus.DISPENSED,
        doctor: { user: { fullName: 'Dr. A', email: 'doc@test.com', phone: '' }, specialization: '', hospitalName: '' },
        patient: { id: 'p-1', user: { fullName: 'Jane', email: 'jane@test.com' }, insuranceProvider: '', insuranceNumber: '' },
        items: [],
      } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.dispensePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('should process dispensing items and calculate total amount', async () => {
    const mockItemUpdate = jest.fn().mockResolvedValue({});
    const mockUpdate = jest.fn().mockResolvedValue({});
    const mockQrCode = { markAsUsed: jest.fn(), save: jest.fn().mockResolvedValue({}) };
    const mockGetQrCode = jest.fn().mockResolvedValue(mockQrCode);

    MockPrescription.findByPk
      .mockResolvedValueOnce({
        id: 'presc-001',
        status: PrescriptionStatus.VALIDATED,
        update: mockUpdate,
        getQrCode: mockGetQrCode,
        items: [
          { id: 'item-1', update: mockItemUpdate },
          { id: 'item-2', update: mockItemUpdate },
        ],
      } as any)
      .mockResolvedValueOnce({
        id: 'presc-001',
        prescriptionNumber: 'RX-001',
        status: PrescriptionStatus.DISPENSED,
        doctor: { user: { fullName: 'Dr. A', email: '', phone: '' } },
        patient: { id: 'p-1', user: { fullName: 'Jane', email: '' } },
        items: [],
      } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.dispensePrescription('presc-001', 'pharm-001', {
      dispensingItems: [
        { dispensedQuantity: 10, unitPrice: 5, batchNumber: 'B001', expiryDate: new Date('2027-01-01') },
        { dispensedQuantity: 20, unitPrice: 2, batchNumber: 'B002', expiryDate: new Date('2027-06-01') },
      ],
    });
    expect(result.success).toBe(true);
    expect(mockItemUpdate).toHaveBeenCalledTimes(2);
    expect(mockQrCode.markAsUsed).toHaveBeenCalled();
  });

  it('should handle errors gracefully', async () => {
    MockPrescription.findByPk.mockRejectedValue(new Error('DB error'));
    const result = await PharmacyService.dispensePrescription('presc-001', 'pharm-001');
    expect(result.success).toBe(false);
  });
});

describe('PharmacyService.scanQRCode - edge cases', () => {
  it('should return invalid when prescription is not found after QR verification', async () => {
    (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
      isValid: true,
      isExpired: false,
      isUsed: false,
      prescriptionData: { prescriptionId: 'ghost-presc' },
    });
    MockPrescription.findByPk.mockResolvedValue(null);
    const result = await PharmacyService.scanQRCode('some-hash', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('should return invalid when QR code is expired', async () => {
    (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-001' },
    });
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.PENDING,
      qrCode: { isExpired: jest.fn().mockReturnValue(true) },
    } as any);
    const result = await PharmacyService.scanQRCode('some-hash', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('expired');
  });

  it('should return invalid for FULFILLED prescription', async () => {
    (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-001' },
    });
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.FULFILLED,
      qrCode: { isExpired: jest.fn().mockReturnValue(false) },
    } as any);
    const result = await PharmacyService.scanQRCode('some-hash', 'pharm-001');
    expect(result.isValid).toBe(false);
  });

  it('should return invalid for CANCELLED prescription', async () => {
    (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-001' },
    });
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.CANCELLED,
      qrCode: { isExpired: jest.fn().mockReturnValue(false) },
    } as any);
    const result = await PharmacyService.scanQRCode('some-hash', 'pharm-001');
    expect(result.isValid).toBe(false);
  });

  it('should return canDispense true for already SCANNED prescription', async () => {
    (MockQRCodeService.verifyQRCode as jest.Mock).mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-001' },
    });
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.SCANNED,
      qrCode: { isExpired: jest.fn().mockReturnValue(false), qrHash: 'h', isUsed: false, scanCount: 1, expiresAt: new Date() },
      patient: { user: { fullName: 'Jane' } },
      doctor: { user: { fullName: 'Dr. A' } },
      items: [],
      prescriptionNumber: 'RX-001',
      diagnosis: 'Test',
      doctorNotes: '',
      createdAt: new Date(),
    } as any);
    const result = await PharmacyService.scanQRCode('some-hash', 'pharm-001');
    expect(result.isValid).toBe(true);
    expect(result.canDispense).toBe(true);
  });
});

describe('PharmacyService.checkQRScanStatus', () => {
  it('should return null when QR code is not found', async () => {
    MockQRCode.findOne.mockResolvedValue(null);
    const result = await PharmacyService.checkQRScanStatus('nonexistent-hash');
    expect(result).toBeNull();
  });

  it('should return scan status for existing QR code', async () => {
    const now = new Date();
    MockQRCode.findOne.mockResolvedValue({
      qrHash: 'hash-001',
      scanCount: 2,
      isUsed: false,
      expiresAt: new Date(Date.now() + 86400000),
      updatedAt: now,
      createdAt: now,
    } as any);
    const result = await PharmacyService.checkQRScanStatus('hash-001');
    expect(result).not.toBeNull();
    expect(result.isScanned).toBe(true);
    expect(result.scanCount).toBe(2);
  });

  it('should return isExpired true for expired QR code', async () => {
    MockQRCode.findOne.mockResolvedValue({
      qrHash: 'hash-002',
      scanCount: 0,
      isUsed: false,
      expiresAt: new Date(Date.now() - 1000),
      updatedAt: new Date(),
      createdAt: new Date(),
    } as any);
    const result = await PharmacyService.checkQRScanStatus('hash-002');
    expect(result.isExpired).toBe(true);
  });

  it('should throw on error', async () => {
    MockQRCode.findOne.mockRejectedValue(new Error('DB error'));
    await expect(PharmacyService.checkQRScanStatus('hash-003')).rejects.toThrow();
  });
});

describe('PharmacyService.getDispensingHistory', () => {
  it('should return dispensing logs', async () => {
    MockPharmacyLog.findAll.mockResolvedValue([
      { id: 'log-1', action: PharmacyAction.DISPENSED },
    ] as any);
    const result = await PharmacyService.getDispensingHistory('presc-001');
    expect(result).toBeDefined();
    expect(MockPharmacyLog.findAll).toHaveBeenCalled();
  });

  it('should throw on error', async () => {
    MockPharmacyLog.findAll.mockRejectedValue(new Error('DB error'));
    await expect(PharmacyService.getDispensingHistory('presc-001')).rejects.toThrow();
  });
});

describe('PharmacyService.getDispensingSummary', () => {
  it('should throw if prescription is not found', async () => {
    MockPrescription.findByPk.mockResolvedValue(null);
    await expect(PharmacyService.getDispensingSummary('ghost-id')).rejects.toThrow('not found');
  });

  it('should return summary with dispensed items', async () => {
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      items: [
        { isDispensed: true, dispensedQuantity: 10, unitPrice: 5, medicineName: 'Med', batchNumber: 'B1', expiryDate: new Date() },
        { isDispensed: false },
      ],
    } as any);
    MockPharmacyLog.findOne.mockResolvedValue({
      insuranceCoverage: 100,
      patientPayment: 50,
      actionTimestamp: new Date(),
    } as any);
    const result = await PharmacyService.getDispensingSummary('presc-001');
    expect(result).toBeDefined();
    expect(result.totalAmount).toBe(50);
    expect(result.dispensedItems).toHaveLength(1);
  });

  it('should handle missing dispensing log', async () => {
    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      items: [],
    } as any);
    MockPharmacyLog.findOne.mockResolvedValue(null);
    const result = await PharmacyService.getDispensingSummary('presc-001');
    expect(result).toBeDefined();
    expect(result.totalAmount).toBe(0);
  });
});

describe('PharmacyService.lookupByReferenceNumber - with patient found', () => {
  it('should return prescription when patient and prescription are found', async () => {
    const mockPatient = { id: 'patient-1' };
    const mockPrescription = {
      id: 'presc-001',
      prescriptionNumber: 'RX-001',
      status: PrescriptionStatus.PENDING,
      createdAt: new Date(),
      diagnosis: 'Test',
      doctorNotes: '',
      patient: { user: { fullName: 'Jane' } },
      doctor: { user: { fullName: 'Dr. A' } },
      items: [],
      qrCode: { qrHash: 'h', isUsed: false, scanCount: 1, expiresAt: new Date() },
    };

    // Mock the dynamic import by intercepting Prescription.findOne
    MockPrescription.findOne.mockResolvedValue(mockPrescription as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    // We need to mock the dynamic import of Patient
    // The method uses: const { Patient, User } = await import('../models');
    // Since models is already mocked, we need Patient.findOne
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue(mockPatient);

    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result).toBeDefined();
  });

  it('should return expired prescription message when prescription is over 30 days old', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });

    const oldDate = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    MockPrescription.findOne.mockResolvedValue({
      id: 'presc-001',
      status: PrescriptionStatus.PENDING,
      createdAt: oldDate,
    } as any);

    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.message).toContain('expired');
  });

  it('should return null prescription if no valid prescription exists', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });
    MockPrescription.findOne.mockResolvedValue(null);

    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(false);
    expect(result.prescription).toBeNull();
  });
});
