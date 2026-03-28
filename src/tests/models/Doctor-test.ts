import Doctor from '../../models/Doctor';

describe('Doctor Model', () => {
  describe('Doctor attributes', () => {
    it('should create a Doctor instance with correct attributes', () => {
      const doctor = new Doctor({
        id: 'doctor-123',
        userId: 'user-123',
        licenseNumber: 'LIC-001',
        specialization: 'Cardiology',
        hospitalName: 'Kigali General Hospital',
        isVerified: false,
      } as any);

      expect(doctor.id).toBe('doctor-123');
      expect(doctor.userId).toBe('user-123');
      expect(doctor.licenseNumber).toBe('LIC-001');
      expect(doctor.specialization).toBe('Cardiology');
      expect(doctor.hospitalName).toBe('Kigali General Hospital');
      expect(doctor.isVerified).toBe(false);
    });

    it('should allow nullable fields', () => {
      const doctor = new Doctor({
        id: 'doctor-456',
        userId: 'user-456',
        isVerified: false,
      } as any);

      expect(doctor.licenseNumber).toBeUndefined();
      expect(doctor.specialization).toBeUndefined();
      expect(doctor.hospitalName).toBeUndefined();
    });

    it('should default isVerified to false', () => {
      const doctor = new Doctor({ userId: 'user-789' } as any);
      expect(doctor.isVerified).toBeFalsy();
    });
  });

  describe('Doctor verification', () => {
    it('should support setting isVerified to true', () => {
      const doctor = new Doctor({ userId: 'user-001', isVerified: false } as any);
      doctor.isVerified = true;
      expect(doctor.isVerified).toBe(true);
    });

    it('should support unsetting isVerified', () => {
      const doctor = new Doctor({ userId: 'user-001', isVerified: true } as any);
      doctor.isVerified = false;
      expect(doctor.isVerified).toBe(false);
    });
  });
});
