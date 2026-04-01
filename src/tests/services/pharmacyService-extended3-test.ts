/**
 * Extra branch coverage for PharmacyService:
 * - item dispensing field conditional branches (dispensedQuantity, unitPrice, batchNumber, expiryDate)
 * - qrCode-absent branch in lookupByReferenceNumber
 */
import { PharmacyService } from '../../services/pharmacyService';
import { Prescription, PharmacyLog, QRCode } from '../../models';
import { PrescriptionStatus } from '../../models/Prescription';

jest.mock('../../models');
jest.mock('../../services/qrCodeService', () => ({
  QRCodeService: {
    verifyQRCode: jest.fn(),
    generateQRCode: jest.fn().mockResolvedValue({ qrHash: 'new-hash' }),
  },
}));

const MockPrescription = Prescription as jest.Mocked<typeof Prescription>;
const MockPharmacyLog = PharmacyLog as jest.Mocked<typeof PharmacyLog>;
const MockQRCode = QRCode as jest.Mocked<typeof QRCode>;

import { QRCodeService } from '../../services/qrCodeService';
const MockQRCodeService = QRCodeService as jest.Mocked<typeof QRCodeService>;

beforeEach(() => jest.clearAllMocks());

// ── lookupByReferenceNumber - items with dispensing fields ────────────────
describe('PharmacyService.lookupByReferenceNumber - item field branches', () => {
  it('should include dispensedQuantity, unitPrice, batchNumber, expiryDate when set', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });

    const itemWithFields = {
      id: 'item-1',
      prescriptionId: 'presc-001',
      medicineName: 'Amoxicillin',
      dosage: '500mg',
      frequency: 'thrice daily',
      quantity: 21,
      instructions: 'After food',
      isDispensed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      dispensedQuantity: 21,
      unitPrice: 2.5,
      batchNumber: 'BATCH-001',
      expiryDate: new Date('2028-01-01'),
    };

    MockPrescription.findOne.mockResolvedValue({
      id: 'presc-001',
      prescriptionNumber: 'RX-001',
      status: PrescriptionStatus.PENDING,
      createdAt: new Date(),
      diagnosis: 'Infection',
      doctorNotes: '',
      patient: { user: { fullName: 'Jane' } },
      doctor: { user: { fullName: 'Dr. A' } },
      items: [itemWithFields],
      qrCode: { qrHash: 'h', isUsed: false, scanCount: 0, expiresAt: new Date(Date.now() + 86400000) },
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(true);
    const item = result.prescription.items[0];
    expect(item.dispensedQuantity).toBe(21);
    expect(item.unitPrice).toBe(2.5);
    expect(item.batchNumber).toBe('BATCH-001');
    expect(item.expiryDate).toBeDefined();
  });

  it('should NOT include dispensing fields when they are null', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });

    const itemNullFields = {
      id: 'item-2',
      prescriptionId: 'presc-002',
      medicineName: 'Paracetamol',
      dosage: '500mg',
      frequency: 'twice daily',
      quantity: 10,
      instructions: '',
      isDispensed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      dispensedQuantity: null,
      unitPrice: null,
      batchNumber: null,
      expiryDate: null,
    };

    MockPrescription.findOne.mockResolvedValue({
      id: 'presc-002',
      prescriptionNumber: 'RX-002',
      status: PrescriptionStatus.PENDING,
      createdAt: new Date(),
      diagnosis: 'Pain',
      doctorNotes: '',
      patient: { user: { fullName: 'John' } },
      doctor: { user: { fullName: 'Dr. B' } },
      items: [itemNullFields],
      qrCode: { qrHash: 'h2', isUsed: false, scanCount: 0, expiresAt: new Date(Date.now() + 86400000) },
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(true);
    const item = result.prescription.items[0];
    expect(item.dispensedQuantity).toBeUndefined();
    expect(item.unitPrice).toBeUndefined();
    expect(item.batchNumber).toBeUndefined();
    expect(item.expiryDate).toBeUndefined();
  });

  it('should generate QR code when prescription has no qrCode', async () => {
    const { Patient } = await import('../../models');
    (Patient.findOne as jest.Mock).mockResolvedValue({ id: 'patient-1' });

    const basePrescription = {
      id: 'presc-003',
      prescriptionNumber: 'RX-003',
      status: PrescriptionStatus.PENDING,
      createdAt: new Date(),
      diagnosis: 'Headache',
      doctorNotes: '',
      patient: { user: { fullName: 'Jane' } },
      doctor: { user: { fullName: 'Dr. A' } },
      items: [],
      qrCode: null, // no QR code — triggers generation branch
    };

    MockPrescription.findOne.mockResolvedValue(basePrescription as any);
    // After generateQRCode, findByPk reloads the prescription
    MockPrescription.findByPk.mockResolvedValue({
      ...basePrescription,
      qrCode: { qrHash: 'new-hash', isUsed: false, scanCount: 0, expiresAt: new Date(Date.now() + 86400000) },
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.lookupByReferenceNumber('1234567890123456', 'pharm-001');
    expect(result.isValid).toBe(true);
    expect(MockQRCodeService.generateQRCode).toHaveBeenCalledWith('presc-003');
  });
});

// ── scanQRCode - items with dispensing fields ─────────────────────────────
describe('PharmacyService.scanQRCode - item field branches', () => {
  it('should include dispensing fields on items when set', async () => {
    MockQRCodeService.verifyQRCode.mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-001' },
    } as any);

    const itemWithFields = {
      id: 'item-s1',
      prescriptionId: 'presc-001',
      medicineName: 'Ibuprofen',
      dosage: '400mg',
      frequency: 'thrice daily',
      quantity: 15,
      instructions: 'With food',
      isDispensed: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      dispensedQuantity: 15,
      unitPrice: 1.5,
      batchNumber: 'BATCH-S01',
      expiryDate: new Date('2027-06-01'),
    };

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-001',
      prescriptionNumber: 'RX-001',
      status: PrescriptionStatus.PENDING,
      diagnosis: 'Pain',
      doctorNotes: '',
      update: jest.fn().mockResolvedValue(undefined),
      qrCode: { isExpired: jest.fn().mockReturnValue(false), qrHash: 'h', isUsed: false, scanCount: 1, expiresAt: new Date(Date.now() + 86400000) },
      patient: { user: { fullName: 'Jane' } },
      doctor: { user: { fullName: 'Dr. A' } },
      items: [itemWithFields],
      createdAt: new Date(),
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.scanQRCode('valid-hash', 'pharm-001');
    expect(result.isValid).toBe(true);
    const item = result.prescription.items[0];
    expect(item.dispensedQuantity).toBe(15);
    expect(item.unitPrice).toBe(1.5);
    expect(item.batchNumber).toBe('BATCH-S01');
    expect(item.expiryDate).toBeDefined();
  });

  it('should NOT include dispensing fields when they are null on scanQRCode', async () => {
    MockQRCodeService.verifyQRCode.mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-s2' },
    } as any);

    const itemNullFields = {
      id: 'item-s2',
      prescriptionId: 'presc-s2',
      medicineName: 'Aspirin',
      dosage: '100mg',
      frequency: 'daily',
      quantity: 30,
      instructions: '',
      isDispensed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      dispensedQuantity: null,
      unitPrice: null,
      batchNumber: null,
      expiryDate: null,
    };

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-s2',
      prescriptionNumber: 'RX-S2',
      status: PrescriptionStatus.PENDING,
      diagnosis: 'Prevention',
      doctorNotes: '',
      update: jest.fn().mockResolvedValue(undefined),
      qrCode: { isExpired: jest.fn().mockReturnValue(false), qrHash: 'h2', isUsed: false, scanCount: 0, expiresAt: new Date(Date.now() + 86400000) },
      patient: { user: { fullName: 'Mark' } },
      doctor: { user: { fullName: 'Dr. C' } },
      items: [itemNullFields],
      createdAt: new Date(),
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.scanQRCode('valid-hash-2', 'pharm-001');
    expect(result.isValid).toBe(true);
    const item = result.prescription.items[0];
    expect(item.dispensedQuantity).toBeUndefined();
    expect(item.unitPrice).toBeUndefined();
  });

  it('should handle items as null/undefined (|| [] branch)', async () => {
    MockQRCodeService.verifyQRCode.mockResolvedValue({
      isValid: true,
      prescriptionData: { prescriptionId: 'presc-s3' },
    } as any);

    MockPrescription.findByPk.mockResolvedValue({
      id: 'presc-s3',
      prescriptionNumber: 'RX-S3',
      status: PrescriptionStatus.SCANNED,
      diagnosis: 'Test',
      doctorNotes: '',
      qrCode: { isExpired: jest.fn().mockReturnValue(false), qrHash: 'h3', isUsed: false, scanCount: 1, expiresAt: new Date(Date.now() + 86400000) },
      patient: { user: { fullName: 'Sue' } },
      doctor: { user: { fullName: 'Dr. D' } },
      items: null,
      createdAt: new Date(),
    } as any);
    MockPharmacyLog.create.mockResolvedValue({} as any);

    const result = await PharmacyService.scanQRCode('hash-3', 'pharm-001');
    expect(result.isValid).toBe(true);
    expect(result.prescription.items).toEqual([]);
  });
});
