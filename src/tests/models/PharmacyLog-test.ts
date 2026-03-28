import PharmacyLog, { PharmacyAction } from '../../models/PharmacyLog';

describe('PharmacyLog Model', () => {
  describe('PharmacyAction enum', () => {
    it('should have all required action values', () => {
      expect(PharmacyAction.SCAN).toBe('scan');
      expect(PharmacyAction.SCANNED).toBe('scanned');
      expect(PharmacyAction.VALIDATED).toBe('validated');
      expect(PharmacyAction.DISPENSED).toBe('dispensed');
      expect(PharmacyAction.FULFILLED).toBe('fulfilled');
    });
  });

  describe('PharmacyLog attributes', () => {
    it('should create a PharmacyLog with core fields', () => {
      const log = new PharmacyLog({
        id: 'log-123',
        prescriptionId: 'presc-123',
        pharmacistId: 'pharm-123',
        action: PharmacyAction.DISPENSED,
        notes: 'Dispensed all items',
        actionTimestamp: new Date('2026-01-01T10:00:00Z'),
      } as any);

      expect(log.id).toBe('log-123');
      expect(log.prescriptionId).toBe('presc-123');
      expect(log.pharmacistId).toBe('pharm-123');
      expect(log.action).toBe(PharmacyAction.DISPENSED);
      expect(log.notes).toBe('Dispensed all items');
    });

    it('should support financial fields', () => {
      const log = new PharmacyLog({
        prescriptionId: 'presc-456',
        pharmacistId: 'pharm-456',
        action: PharmacyAction.DISPENSED,
        totalAmount: 5000,
        insuranceCoverage: 3000,
        patientPayment: 2000,
        insuranceProvider: 'Mutuelle',
        insuranceNumber: 'MUT-001',
        insuranceApprovalCode: 'APR-9999',
      } as any);

      expect(log.totalAmount).toBe(5000);
      expect(log.insuranceCoverage).toBe(3000);
      expect(log.patientPayment).toBe(2000);
      expect(log.insuranceProvider).toBe('Mutuelle');
      expect(log.insuranceApprovalCode).toBe('APR-9999');
    });

    it('should support batch and expiry fields', () => {
      const log = new PharmacyLog({
        prescriptionId: 'presc-789',
        pharmacistId: 'pharm-789',
        action: PharmacyAction.DISPENSED,
        batchNumber: 'BATCH-2026-01',
        expiryDate: new Date('2027-12-31'),
      } as any);

      expect(log.batchNumber).toBe('BATCH-2026-01');
      expect(log.expiryDate).toEqual(new Date('2027-12-31'));
    });
  });

  describe('PharmacyLog action types', () => {
    it('should create a SCAN log entry', () => {
      const log = new PharmacyLog({
        prescriptionId: 'presc-001',
        pharmacistId: 'pharm-001',
        action: PharmacyAction.SCAN,
      } as any);
      expect(log.action).toBe('scan');
    });

    it('should create a VALIDATED log entry', () => {
      const log = new PharmacyLog({
        prescriptionId: 'presc-001',
        pharmacistId: 'pharm-001',
        action: PharmacyAction.VALIDATED,
      } as any);
      expect(log.action).toBe('validated');
    });

    it('should create a FULFILLED log entry', () => {
      const log = new PharmacyLog({
        prescriptionId: 'presc-001',
        pharmacistId: 'pharm-001',
        action: PharmacyAction.FULFILLED,
      } as any);
      expect(log.action).toBe('fulfilled');
    });
  });
});
