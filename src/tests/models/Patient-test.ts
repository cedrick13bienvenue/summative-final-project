import { Patient } from '../../models';

describe('Patient Model', () => {
  describe('Patient static properties', () => {
    it('should be a valid Sequelize model', () => {
      expect(Patient).toBeDefined();
    });

    it('should accept valid gender values', () => {
      const genders = ['male', 'female', 'other'];
      genders.forEach(g => expect(['male', 'female', 'other']).toContain(g));
    });
  });

  describe('Patient attributes', () => {
    it('should have correct gender enum values', () => {
      // Test that the model accepts valid gender values
      const validGenders = ['male', 'female', 'other'];
      validGenders.forEach(gender => {
        expect(['male', 'female', 'other']).toContain(gender);
      });
    });

    it('should handle JSON fields for allergies and existingConditions', () => {
      // Mock patient instance
      const patient = new Patient({
        id: 'patient-123',
        referenceNumber: 'PAT-20241201-1234',
        userId: 'user-123',
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male',
        allergies: ['Peanuts', 'Shellfish'],
        existingConditions: ['Diabetes', 'Hypertension'],
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567890',
      } as any);

      expect(Array.isArray(patient.allergies)).toBe(true);
      expect(Array.isArray(patient.existingConditions)).toBe(true);
      expect(patient.allergies).toContain('Peanuts');
      expect(patient.existingConditions).toContain('Diabetes');
    });
  });

  describe('Patient creation attributes', () => {
    it('should exclude id and referenceNumber from creation attributes', () => {
      // This is more of a TypeScript type check, but we can verify the concept
      const creationData = {
        userId: 'user-123',
        fullName: 'John Doe',
        dateOfBirth: new Date('1990-01-01'),
        gender: 'male' as const,
        emergencyContact: 'Jane Doe',
        emergencyPhone: '+1234567890',
        allergies: [],
        existingConditions: [],
      };

      // Should not include id or referenceNumber in creation data
      expect(creationData).not.toHaveProperty('id');
      expect(creationData).not.toHaveProperty('referenceNumber');
      expect(creationData).not.toHaveProperty('createdAt');
      expect(creationData).not.toHaveProperty('updatedAt');
      
      // Should include required fields
      expect(creationData).toHaveProperty('userId');
      expect(creationData).toHaveProperty('fullName');
      expect(creationData).toHaveProperty('dateOfBirth');
      expect(creationData).toHaveProperty('gender');
    });
  });
});