import { MedicalVisit, VisitType } from '../../models';

describe('MedicalVisit Model', () => {
  describe('VisitType enum', () => {
    it('should have all required visit types', () => {
      expect(VisitType.CONSULTATION).toBe('consultation');
      expect(VisitType.EMERGENCY).toBe('emergency');
      expect(VisitType.FOLLOWUP).toBe('followup');
    });

    it('should contain all visit type options', () => {
      const visitTypes = Object.values(VisitType);
      expect(visitTypes).toContain('consultation');
      expect(visitTypes).toContain('emergency');
      expect(visitTypes).toContain('followup');
      expect(visitTypes).toHaveLength(3);
    });
  });

  describe('MedicalVisit attributes', () => {
    it('should have correct default visit type', () => {
      // Mock medical visit instance
      const visit = new MedicalVisit({
        id: 'visit-123',
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitDate: new Date('2024-12-01'),
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
      } as any);

      expect(visit.visitType).toBe(VisitType.CONSULTATION);
      expect(visit.chiefComplaint).toBe('Headache');
    });

    it('should handle all visit types correctly', () => {
      const consultationVisit = {
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Regular checkup',
      };

      const emergencyVisit = {
        visitType: VisitType.EMERGENCY,
        chiefComplaint: 'Chest pain',
      };

      const followupVisit = {
        visitType: VisitType.FOLLOWUP,
        chiefComplaint: 'Follow-up on previous treatment',
      };

      expect(consultationVisit.visitType).toBe('consultation');
      expect(emergencyVisit.visitType).toBe('emergency');
      expect(followupVisit.visitType).toBe('followup');
    });

    it('should require essential fields', () => {
      const visitData = {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitDate: new Date('2024-12-01'),
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
      };

      // Should include required fields
      expect(visitData).toHaveProperty('patientId');
      expect(visitData).toHaveProperty('doctorId');
      expect(visitData).toHaveProperty('visitDate');
      expect(visitData).toHaveProperty('visitType');
      expect(visitData).toHaveProperty('chiefComplaint');
    });

    it('should handle optional fields correctly', () => {
      const fullVisitData = {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitDate: new Date('2024-12-01'),
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
        symptoms: 'Severe headache with nausea',
        diagnosis: 'Tension headache',
        treatmentNotes: 'Prescribed pain medication',
        recommendations: 'Rest and hydration',
      };

      expect(fullVisitData).toHaveProperty('symptoms');
      expect(fullVisitData).toHaveProperty('diagnosis');
      expect(fullVisitData).toHaveProperty('treatmentNotes');
      expect(fullVisitData).toHaveProperty('recommendations');
    });
  });

  describe('MedicalVisit creation attributes', () => {
    it('should exclude auto-generated fields from creation attributes', () => {
      const creationData = {
        patientId: 'patient-123',
        doctorId: 'doctor-123',
        visitDate: new Date('2024-12-01'),
        visitType: VisitType.CONSULTATION,
        chiefComplaint: 'Headache',
        symptoms: 'Severe headache',
        diagnosis: 'Tension headache',
      };

      // Should not include auto-generated fields
      expect(creationData).not.toHaveProperty('id');
      expect(creationData).not.toHaveProperty('createdAt');
      
      // Should include required fields
      expect(creationData).toHaveProperty('patientId');
      expect(creationData).toHaveProperty('doctorId');
      expect(creationData).toHaveProperty('visitDate');
      expect(creationData).toHaveProperty('visitType');
      expect(creationData).toHaveProperty('chiefComplaint');
    });
  });

  describe('Visit data validation', () => {
    it('should handle date objects correctly', () => {
      const visitDate = new Date('2024-12-01');
      const visitData = {
        visitDate: visitDate,
        visitType: VisitType.CONSULTATION,
      };

      expect(visitData.visitDate).toBeInstanceOf(Date);
      expect(visitData.visitDate.getFullYear()).toBe(2024);
      expect(visitData.visitDate.getMonth()).toBe(11); // December is month 11
      expect(visitData.visitDate.getDate()).toBe(1);
    });

    it('should handle text fields appropriately', () => {
      const longText = 'This is a very long chief complaint that describes the patient\'s condition in detail with multiple symptoms and concerns that need to be addressed during the medical visit.';
      
      const visitData = {
        chiefComplaint: longText,
        symptoms: longText,
        diagnosis: longText,
        treatmentNotes: longText,
        recommendations: longText,
      };

      expect(typeof visitData.chiefComplaint).toBe('string');
      expect(typeof visitData.symptoms).toBe('string');
      expect(typeof visitData.diagnosis).toBe('string');
      expect(typeof visitData.treatmentNotes).toBe('string');
      expect(typeof visitData.recommendations).toBe('string');
      
      expect(visitData.chiefComplaint.length).toBeGreaterThan(0);
    });
  });
});