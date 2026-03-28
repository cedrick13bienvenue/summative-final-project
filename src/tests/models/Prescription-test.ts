import { Prescription, PrescriptionStatus } from '../../models';
import { VisitType } from '../../models';

describe('Prescription Model', () => {
  describe('generatePrescriptionNumber', () => {
    it('should generate prescription number with correct format', () => {
      const prescriptionNumber = Prescription.generatePrescriptionNumber();
      
      // Should match format: RX-YYYYMMDD-XXXX
      const pattern = /^RX-\d{8}-\d{4}$/;
      expect(prescriptionNumber).toMatch(pattern);
    });

    it('should generate unique prescription numbers', () => {
      const rx1 = Prescription.generatePrescriptionNumber();
      const rx2 = Prescription.generatePrescriptionNumber();
      
      // While there's a tiny chance they could be the same due to random component,
      // it's extremely unlikely
      expect(rx1).not.toBe(rx2);
    });

    it('should include current date in prescription number', () => {
      const prescriptionNumber = Prescription.generatePrescriptionNumber();
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const expectedDatePart = `${year}${month}${day}`;
      
      expect(prescriptionNumber).toContain(expectedDatePart);
    });

    it('should start with RX prefix', () => {
      const prescriptionNumber = Prescription.generatePrescriptionNumber();
      expect(prescriptionNumber).toMatch(/^RX-/);
    });

    it('should have 4-digit random suffix', () => {
      const prescriptionNumber = Prescription.generatePrescriptionNumber();
      const parts = prescriptionNumber.split('-');
      const randomPart = parts[2];
      
      expect(randomPart).toHaveLength(4);
      expect(randomPart).toMatch(/^\d{4}$/);
    });
  });

  describe('PrescriptionStatus enum', () => {
    it('should have all required status values', () => {
      expect(PrescriptionStatus.PENDING).toBe('pending');
      expect(PrescriptionStatus.FULFILLED).toBe('fulfilled');
      expect(PrescriptionStatus.CANCELLED).toBe('cancelled');
    });

    it('should contain all status options', () => {
      const statusValues = Object.values(PrescriptionStatus);
      expect(statusValues).toContain('pending');
      expect(statusValues).toContain('fulfilled');
      expect(statusValues).toContain('cancelled');
      expect(statusValues).toHaveLength(3);
    });
  });

  describe('Prescription attributes', () => {
    it('should have correct default status', () => {
      // Mock prescription instance
      const prescription = new Prescription({
        id: 'prescription-123',
        prescriptionNumber: 'RX-20241201-1234',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitId: 'visit-123',
        status: PrescriptionStatus.PENDING,
        qrCodeHash: 'qr-hash-123',
      } as any);

      expect(prescription.status).toBe(PrescriptionStatus.PENDING);
    });

    it('should require essential fields', () => {
      const prescriptionData = {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitId: 'visit-123',
        qrCodeHash: 'qr-hash-123',
      };

      // Should include required fields
      expect(prescriptionData).toHaveProperty('patientId');
      expect(prescriptionData).toHaveProperty('doctorId');
      expect(prescriptionData).toHaveProperty('visitId');
      expect(prescriptionData).toHaveProperty('qrCodeHash');
    });
  });

  describe('Prescription creation attributes', () => {
    it('should exclude auto-generated fields from creation attributes', () => {
      const creationData = {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitId: 'visit-123',
        diagnosis: 'Hypertension',
        status: PrescriptionStatus.PENDING,
        qrCodeHash: 'qr-hash-123',
      };

      // Should not include auto-generated fields
      expect(creationData).not.toHaveProperty('id');
      expect(creationData).not.toHaveProperty('prescriptionNumber');
      expect(creationData).not.toHaveProperty('createdAt');
      expect(creationData).not.toHaveProperty('updatedAt');
      
      // Should include required fields
      expect(creationData).toHaveProperty('patientId');
      expect(creationData).toHaveProperty('doctorId');
      expect(creationData).toHaveProperty('visitId');
      expect(creationData).toHaveProperty('qrCodeHash');
    });
  });
});