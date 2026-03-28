import Pharmacist from '../../models/Pharmacist';

describe('Pharmacist Model', () => {
  describe('Pharmacist attributes', () => {
    it('should create a Pharmacist instance with correct attributes', () => {
      const pharmacist = new Pharmacist({
        id: 'pharmacist-123',
        userId: 'user-123',
        licenseNumber: 'PHARM-001',
        pharmacyName: 'Kigali Central Pharmacy',
        pharmacyAddress: 'KN 5 Ave, Kigali',
        isVerified: true,
      } as any);

      expect(pharmacist.id).toBe('pharmacist-123');
      expect(pharmacist.userId).toBe('user-123');
      expect(pharmacist.licenseNumber).toBe('PHARM-001');
      expect(pharmacist.pharmacyName).toBe('Kigali Central Pharmacy');
      expect(pharmacist.pharmacyAddress).toBe('KN 5 Ave, Kigali');
      expect(pharmacist.isVerified).toBe(true);
    });

    it('should allow nullable optional fields', () => {
      const pharmacist = new Pharmacist({
        userId: 'user-456',
        isVerified: false,
      } as any);

      expect(pharmacist.licenseNumber).toBeUndefined();
      expect(pharmacist.pharmacyName).toBeUndefined();
      expect(pharmacist.pharmacyAddress).toBeUndefined();
    });

    it('should default isVerified to false', () => {
      const pharmacist = new Pharmacist({ userId: 'user-789' } as any);
      expect(pharmacist.isVerified).toBeFalsy();
    });
  });

  describe('Pharmacist verification state', () => {
    it('should support verification toggle', () => {
      const pharmacist = new Pharmacist({ userId: 'user-001', isVerified: false } as any);
      pharmacist.isVerified = true;
      expect(pharmacist.isVerified).toBe(true);

      pharmacist.isVerified = false;
      expect(pharmacist.isVerified).toBe(false);
    });
  });
});
