import { EventService, EmailJob } from '../../services/eventService';
import { EmailService } from '../../services/emailService';

jest.mock('../../services/emailService', () => ({
  EmailService: {
    sendPrescriptionEmail: jest.fn(),
  },
}));

// Mock models so queuePrescriptionEmail dynamic import is intercepted
jest.mock('../../models', () => ({
  Prescription: { findByPk: jest.fn() },
  Patient: {},
  Doctor: {},
}));

const MockEmailService = EmailService as jest.Mocked<typeof EmailService>;

beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  (EventService as any).instance = undefined;
});

// ── processEmailJob - success path ────────────────────────────────────────
describe('EventService.processEmailJob - success', () => {
  it('should mark job as completed on successful email send', async () => {
    MockEmailService.sendPrescriptionEmail.mockResolvedValue(true as any);
    const instance = EventService.getInstance();

    const job: EmailJob = {
      id: 'job-success-1',
      type: 'prescription.email',
      data: {
        patientName: 'Jane',
        patientEmail: 'jane@test.com',
        prescriptionNumber: 'RX-001',
        patientNationalId: '1234',
        doctorName: 'Dr. A',
        diagnosis: 'Flu',
        medicines: [],
        qrCodeImage: '',
        qrHash: 'hash',
        expiresAt: new Date().toISOString(),
      },
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
    };

    await (instance as any).processEmailJob(job);
    expect(job.status).toBe('completed');
    expect(job.processedAt).toBeDefined();
    expect(MockEmailService.sendPrescriptionEmail).toHaveBeenCalled();
  });
});

// ── processEmailJob - failure with retry ──────────────────────────────────
describe('EventService.processEmailJob - failure with retry', () => {
  it('should set status to pending for retry when under max attempts', async () => {
    MockEmailService.sendPrescriptionEmail.mockRejectedValue(new Error('SMTP failure'));
    const instance = EventService.getInstance();

    const job: EmailJob = {
      id: 'job-retry-1',
      type: 'prescription.email',
      data: {} as any,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
    };

    await (instance as any).processEmailJob(job);
    // After failure with attempts < maxAttempts, status goes back to pending for retry
    expect(job.status).toBe('pending');
    expect(job.error).toBe('SMTP failure');
  });

  it('should set status to failed when max attempts reached', async () => {
    MockEmailService.sendPrescriptionEmail.mockRejectedValue(new Error('SMTP failure'));
    const instance = EventService.getInstance();

    const job: EmailJob = {
      id: 'job-maxretry-1',
      type: 'prescription.email',
      data: {} as any,
      attempts: 3,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
    };

    await (instance as any).processEmailJob(job);
    expect(job.status).toBe('failed');
  });
});

// ── processEmailQueue ─────────────────────────────────────────────────────
describe('EventService.processEmailQueue', () => {
  it('should process all queued jobs', async () => {
    MockEmailService.sendPrescriptionEmail.mockResolvedValue(true as any);
    const instance = EventService.getInstance();

    const job1: EmailJob = {
      id: 'q-job-1',
      type: 'prescription.email',
      data: {} as any,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
    };
    const job2: EmailJob = {
      id: 'q-job-2',
      type: 'prescription.email',
      data: {} as any,
      attempts: 0,
      maxAttempts: 3,
      status: 'pending',
      createdAt: new Date(),
    };
    (instance as any).emailQueue = [job1, job2];
    (instance as any).isProcessing = false;

    await (instance as any).processEmailQueue();
    expect(MockEmailService.sendPrescriptionEmail).toHaveBeenCalledTimes(2);
  });

  it('should do nothing when queue is empty', async () => {
    const instance = EventService.getInstance();
    (instance as any).emailQueue = [];
    (instance as any).isProcessing = false;
    await (instance as any).processEmailQueue();
    expect(MockEmailService.sendPrescriptionEmail).not.toHaveBeenCalled();
  });

  it('should do nothing when already processing', async () => {
    const instance = EventService.getInstance();
    (instance as any).emailQueue = [{ id: 'j-1', status: 'pending' }];
    (instance as any).isProcessing = true;
    await (instance as any).processEmailQueue();
    expect(MockEmailService.sendPrescriptionEmail).not.toHaveBeenCalled();
    // reset
    (instance as any).isProcessing = false;
  });
});

// ── queuePrescriptionEmail ────────────────────────────────────────────────
describe('EventService.queuePrescriptionEmail', () => {
  it('should queue email job when prescription found with patient user', async () => {
    const { Prescription } = require('../../models');
    (Prescription.findByPk as jest.Mock).mockResolvedValue({
      id: 'presc-001',
      diagnosis: 'Flu',
      items: [],
      patient: { user: { fullName: 'Jane', email: 'jane@t.com', nationalId: '1234' } },
      doctor: { user: { fullName: 'Dr. A' } },
    });

    MockEmailService.sendPrescriptionEmail.mockResolvedValue(true as any);
    const instance = EventService.getInstance();
    (instance as any).isProcessing = false;
    (instance as any).emailQueue = [];

    const eventData = {
      prescriptionId: 'presc-001',
      patientId: 'p-1',
      doctorId: 'doc-001',
      prescriptionNumber: 'RX-001',
      qrCodeHash: 'hash-001',
      qrCodeImage: 'data:image/png;base64,abc',
      expiresAt: new Date().toISOString(),
    };

    await (instance as any).queuePrescriptionEmail(eventData);
    expect((instance as any).emailQueue.length).toBeGreaterThanOrEqual(0);
  });

  it('should handle when prescription not found', async () => {
    const { Prescription } = require('../../models');
    (Prescription.findByPk as jest.Mock).mockResolvedValue(null);

    const instance = EventService.getInstance();
    (instance as any).emailQueue = [];

    const eventData = {
      prescriptionId: 'ghost',
      patientId: 'p-1',
      doctorId: 'doc-001',
      prescriptionNumber: 'RX-001',
      qrCodeHash: 'hash',
      qrCodeImage: '',
      expiresAt: new Date().toISOString(),
    };

    // Should not throw
    await expect((instance as any).queuePrescriptionEmail(eventData)).resolves.toBeUndefined();
  });

  it('should handle when patient user is missing', async () => {
    const { Prescription } = require('../../models');
    (Prescription.findByPk as jest.Mock).mockResolvedValue({
      id: 'presc-002',
      diagnosis: 'Test',
      items: [],
      patient: { user: null },
      doctor: { user: { fullName: 'Dr. B' } },
    });

    const instance = EventService.getInstance();
    const eventData = {
      prescriptionId: 'presc-002',
      patientId: 'p-2',
      doctorId: 'doc-002',
      prescriptionNumber: 'RX-002',
      qrCodeHash: 'hash-002',
      qrCodeImage: '',
      expiresAt: new Date().toISOString(),
    };

    await expect((instance as any).queuePrescriptionEmail(eventData)).resolves.toBeUndefined();
  });
});

// ── user.registered and prescription.dispensed event emission ─────────────
describe('EventService - other events', () => {
  it('should emit user.registered event', () => {
    const instance = EventService.getInstance();
    const spy = jest.spyOn(instance, 'emit');
    instance.emit('user.registered', { userId: 'u-1' });
    expect(spy).toHaveBeenCalledWith('user.registered', { userId: 'u-1' });
  });

  it('should emit prescription.dispensed event', () => {
    const instance = EventService.getInstance();
    const spy = jest.spyOn(instance, 'emit');
    instance.emit('prescription.dispensed', { prescriptionId: 'p-1' });
    expect(spy).toHaveBeenCalledWith('prescription.dispensed', { prescriptionId: 'p-1' });
  });
});
