import { EventService, EmailJob } from '../../services/eventService';
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

// Use fake timers to prevent setInterval from leaking
beforeAll(() => {
  jest.useFakeTimers();
});

afterAll(() => {
  jest.useRealTimers();
});

beforeEach(() => {
  jest.clearAllMocks();
  // Reset singleton so each test group gets a fresh instance
  (EventService as any).instance = undefined;
});

describe('EventService singleton', () => {
  it('should return the same instance on multiple calls', () => {
    const instance1 = EventService.getInstance();
    const instance2 = EventService.getInstance();
    expect(instance1).toBe(instance2);
  });
});

describe('EventService.emitPrescriptionCreated', () => {
  it('should emit a prescription.created event', () => {
    const instance = EventService.getInstance();
    const spy = jest.spyOn(instance, 'emit');
    const eventData = {
      prescriptionId: 'presc-001',
      patientId: 'patient-001',
      doctorId: 'doctor-001',
      prescriptionNumber: 'RX-001',
      qrCodeHash: 'hash001',
      qrCodeImage: 'data:image/png;base64,abc',
      expiresAt: new Date().toISOString(),
    };
    instance.emitPrescriptionCreated(eventData);
    expect(spy).toHaveBeenCalledWith('prescription.created', eventData);
  });
});

describe('EventService.getQueueStatus', () => {
  it('should return queue status with correct structure', () => {
    const instance = EventService.getInstance();
    const status = instance.getQueueStatus();
    expect(status).toHaveProperty('totalJobs');
    expect(status).toHaveProperty('pendingJobs');
    expect(status).toHaveProperty('processingJobs');
    expect(status).toHaveProperty('completedJobs');
    expect(status).toHaveProperty('failedJobs');
  });

  it('should count jobs by status correctly', () => {
    const instance = EventService.getInstance();
    // Add jobs with different statuses to the internal queue
    (instance as any).emailQueue = [
      { status: 'pending' },
      { status: 'processing' },
      { status: 'completed' },
      { status: 'failed' },
      { status: 'pending' },
    ];
    const status = instance.getQueueStatus();
    expect(status.totalJobs).toBe(5);
    expect(status.pendingJobs).toBe(2);
    expect(status.processingJobs).toBe(1);
    expect(status.completedJobs).toBe(1);
    expect(status.failedJobs).toBe(1);
  });
});

describe('EventService.clearCompletedJobs', () => {
  it('should remove completed jobs from the queue', () => {
    const instance = EventService.getInstance();
    (instance as any).emailQueue = [
      { id: '1', status: 'completed' },
      { id: '2', status: 'pending' },
      { id: '3', status: 'completed' },
      { id: '4', status: 'failed' },
    ];
    instance.clearCompletedJobs();
    const remaining = (instance as any).emailQueue;
    expect(remaining).toHaveLength(2);
    expect(remaining.every((j: EmailJob) => j.status !== 'completed')).toBe(true);
  });
});

describe('EventService event listeners', () => {
  it('should have listener for user.registered event', () => {
    const instance = EventService.getInstance();
    const listenerCount = instance.listenerCount('user.registered');
    expect(listenerCount).toBeGreaterThan(0);
  });

  it('should have listener for prescription.dispensed event', () => {
    const instance = EventService.getInstance();
    const listenerCount = instance.listenerCount('prescription.dispensed');
    expect(listenerCount).toBeGreaterThan(0);
  });

  it('should have listener for prescription.created event', () => {
    const instance = EventService.getInstance();
    const listenerCount = instance.listenerCount('prescription.created');
    expect(listenerCount).toBeGreaterThan(0);
  });
});

