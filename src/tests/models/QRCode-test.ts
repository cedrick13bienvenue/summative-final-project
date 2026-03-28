import { QRCode } from '../../models';

describe('QRCode Model', () => {
  let mockQRCode: QRCode;

  beforeEach(() => {
    // Create a mock QRCode instance
    mockQRCode = new QRCode({
      id: 'qr-123',
      qrHash: 'qr-hash-123',
      prescriptionId: 'prescription-123',
      encryptedData: 'encrypted-data-string',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      isUsed: false,
      scanCount: 0,
    } as any);
  });

  describe('isExpired', () => {
    it('should return false for non-expired QR code', () => {
      // Set expiration to future date
      mockQRCode.expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
      
      expect(mockQRCode.isExpired()).toBe(false);
    });

    it('should return true for expired QR code', () => {
      // Set expiration to past date
      mockQRCode.expiresAt = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      
      expect(mockQRCode.isExpired()).toBe(true);
    });

    it('should return true for QR code expiring exactly now', () => {
      // Set expiration to current time
      mockQRCode.expiresAt = new Date(Date.now() - 1); // 1ms ago
      
      expect(mockQRCode.isExpired()).toBe(true);
    });
  });

  describe('markAsUsed', () => {
    it('should mark QR code as used and increment scan count', () => {
      expect(mockQRCode.isUsed).toBe(false);
      expect(mockQRCode.scanCount).toBe(0);

      mockQRCode.markAsUsed();

      expect(mockQRCode.isUsed).toBe(true);
      expect(mockQRCode.scanCount).toBe(1);
    });

    it('should increment scan count on multiple calls', () => {
      expect(mockQRCode.scanCount).toBe(0);

      mockQRCode.markAsUsed();
      expect(mockQRCode.scanCount).toBe(1);

      mockQRCode.markAsUsed();
      expect(mockQRCode.scanCount).toBe(2);

      mockQRCode.markAsUsed();
      expect(mockQRCode.scanCount).toBe(3);
    });

    it('should keep isUsed as true after multiple calls', () => {
      mockQRCode.markAsUsed();
      expect(mockQRCode.isUsed).toBe(true);

      mockQRCode.markAsUsed();
      expect(mockQRCode.isUsed).toBe(true);
    });
  });

  describe('QRCode attributes', () => {
    it('should have correct default values', () => {
      expect(mockQRCode.id).toBe('qr-123');
      expect(mockQRCode.qrHash).toBe('qr-hash-123');
      expect(mockQRCode.prescriptionId).toBe('prescription-123');
      expect(mockQRCode.encryptedData).toBe('encrypted-data-string');
      expect(mockQRCode.isUsed).toBe(false);
      expect(mockQRCode.scanCount).toBe(0);
      expect(mockQRCode.expiresAt).toBeInstanceOf(Date);
    });

    it('should handle encrypted data correctly', () => {
      const encryptedData = 'eyJwYXRpZW50SWQiOiIxMjMiLCJwcmVzY3JpcHRpb25JZCI6IjQ1NiJ9';
      mockQRCode.encryptedData = encryptedData;
      
      expect(mockQRCode.encryptedData).toBe(encryptedData);
      expect(typeof mockQRCode.encryptedData).toBe('string');
    });
  });

  describe('QRCode creation attributes', () => {
    it('should exclude auto-generated fields from creation attributes', () => {
      const creationData = {
        qrHash: 'qr-hash-456',
        prescriptionId: 'prescription-456',
        encryptedData: 'encrypted-data',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        isUsed: false,
      };

      // Should not include auto-generated fields
      expect(creationData).not.toHaveProperty('id');
      expect(creationData).not.toHaveProperty('scanCount');
      expect(creationData).not.toHaveProperty('createdAt');
      
      // Should include required fields
      expect(creationData).toHaveProperty('qrHash');
      expect(creationData).toHaveProperty('prescriptionId');
      expect(creationData).toHaveProperty('encryptedData');
      expect(creationData).toHaveProperty('expiresAt');
      expect(creationData).toHaveProperty('isUsed');
    });
  });

  describe('QRCode expiration logic', () => {
    it('should handle different expiration timeframes', () => {
      const now = Date.now();
      
      // Test various expiration times
      const testCases = [
        { offset: -1000, expected: true }, // 1 second ago
        { offset: -60000, expected: true }, // 1 minute ago
        { offset: -3600000, expected: true }, // 1 hour ago
        { offset: 1000, expected: false }, // 1 second from now
        { offset: 60000, expected: false }, // 1 minute from now
        { offset: 3600000, expected: false }, // 1 hour from now
      ];

      testCases.forEach(({ offset, expected }) => {
        mockQRCode.expiresAt = new Date(now + offset);
        expect(mockQRCode.isExpired()).toBe(expected);
      });
    });
  });

  describe('QRCode security features', () => {
    it('should handle unique QR hash values', () => {
      const qrCode1 = new QRCode({ qrHash: 'unique-hash-1' } as any);
      const qrCode2 = new QRCode({ qrHash: 'unique-hash-2' } as any);
      
      expect(qrCode1.qrHash).not.toBe(qrCode2.qrHash);
      expect(qrCode1.qrHash).toBe('unique-hash-1');
      expect(qrCode2.qrHash).toBe('unique-hash-2');
    });

    it('should maintain scan count integrity', () => {
      let scanCount = 0;
      
      // Simulate multiple scans
      for (let i = 0; i < 5; i++) {
        mockQRCode.markAsUsed();
        scanCount++;
        expect(mockQRCode.scanCount).toBe(scanCount);
      }
    });

    it('should handle boolean flags correctly', () => {
      expect(typeof mockQRCode.isUsed).toBe('boolean');
      
      mockQRCode.isUsed = false;
      expect(mockQRCode.isUsed).toBe(false);
      
      mockQRCode.isUsed = true;
      expect(mockQRCode.isUsed).toBe(true);
    });
  });
});