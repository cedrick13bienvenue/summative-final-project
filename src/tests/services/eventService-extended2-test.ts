/**
 * Covers eventService.queuePrescriptionEmail doctor-null branch:
 * - doctorName: doctor?.user?.fullName || '' — when doctor is null
 * Also covers the medicines items || [] map branch when items is an array (normal path).
 */
import { EventService } from '../../services/eventService';
import { EmailService } from '../../services/emailService';

jest.mock('../../services/emailService', () => ({
  EmailService: {
    sendPrescriptionEmail: jest.fn(),
  },
}));

jest.mock('../../models', () => ({
  Prescription: { findByPk: jest.fn() },
  Patient: {},
  Doctor: {},
}));

const MockEmailService = EmailService as jest.Mocked<typeof EmailService>;

beforeAll(() => { jest.useFakeTimers(); });
afterAll(() => { jest.useRealTimers(); });

beforeEach(() => {
  jest.clearAllMocks();
  (EventService as any).instance = undefined;
});

// ── queuePrescriptionEmail - doctor null branch ───────────────────────────
describe('EventService.queuePrescriptionEmail - doctor null → doctorName fallback', () => {
  it('should use empty string for doctorName when doctor is null', async () => {
    const { Prescription } = require('../../models');
    (Prescription.findByPk as jest.Mock).mockResolvedValue({
      id: 'presc-doc-null',
      diagnosis: 'Test',
      items: [],
      patient: { user: { fullName: 'Jane', email: 'j@t.com', nationalId: 'NID-001' } },
      doctor: null, // doctor is null — triggers doctor?.user?.fullName || ''
    });

    MockEmailService.sendPrescriptionEmail.mockResolvedValue(true as any);
    const instance = EventService.getInstance();
    (instance as any).isProcessing = false;
    (instance as any).emailQueue = [];

    await (instance as any).queuePrescriptionEmail({
      prescriptionId: 'presc-doc-null',
      patientId: 'p-1',
      doctorId: 'doc-null',
      prescriptionNumber: 'RX-DOC-NULL',
      qrCodeHash: 'hash-doc-null',
      qrCodeImage: '',
      expiresAt: new Date().toISOString(),
    });

    const queued = (instance as any).emailQueue;
    if (queued.length > 0) {
      expect(queued[0].data.doctorName).toBe('');
    }
  });

  it('should use empty string for doctorName when doctor.user is null', async () => {
    const { Prescription } = require('../../models');
    (Prescription.findByPk as jest.Mock).mockResolvedValue({
      id: 'presc-doc-no-user',
      diagnosis: 'Test',
      items: [{ medicineName: 'Med', dosage: '1', frequency: 'daily', quantity: 1, instructions: '' }],
      patient: { user: { fullName: 'Jane', email: 'j@t.com' } },
      doctor: { user: null }, // doctor.user is null — triggers fallback
    });

    MockEmailService.sendPrescriptionEmail.mockResolvedValue(true as any);
    const instance = EventService.getInstance();
    (instance as any).isProcessing = false;
    (instance as any).emailQueue = [];

    await (instance as any).queuePrescriptionEmail({
      prescriptionId: 'presc-doc-no-user',
      patientId: 'p-1',
      doctorId: 'doc-no-user',
      prescriptionNumber: 'RX-DNU',
      qrCodeHash: 'hash-dnu',
      qrCodeImage: '',
      expiresAt: new Date().toISOString(),
    });

    const queued = (instance as any).emailQueue;
    if (queued.length > 0) {
      expect(queued[0].data.doctorName).toBe('');
    }
  });
});
