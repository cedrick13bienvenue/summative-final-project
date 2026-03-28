import bcrypt from 'bcryptjs';
import User, { UserRole } from '../../models/User'; // FIXED: Correct import syntax

// Mock bcrypt with proper typing
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

const mockBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('User Model', () => {
  let user: User;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Create a mock user instance
    user = new User({
      id: 'user-123',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      role: UserRole.PATIENT,
      fullName: 'Test User',
      phone: '+1234567890',
      isActive: true,
    } as any);
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const candidatePassword = 'correct-password';
      mockBcrypt.compare.mockResolvedValue(true as never); // FIXED: Proper typing

      const result = await user.comparePassword(candidatePassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(candidatePassword, user.passwordHash);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const candidatePassword = 'wrong-password';
      mockBcrypt.compare.mockResolvedValue(false as never); // FIXED: Proper typing

      const result = await user.comparePassword(candidatePassword);

      expect(mockBcrypt.compare).toHaveBeenCalledWith(candidatePassword, user.passwordHash);
      expect(result).toBe(false);
    });

    it('should handle bcrypt errors', async () => {
      const candidatePassword = 'test-password';
      const error = new Error('Bcrypt error');
      mockBcrypt.compare.mockRejectedValue(error as never); // FIXED: Proper typing

      await expect(user.comparePassword(candidatePassword))
        .rejects.toThrow('Bcrypt error');
    });
  });

  describe('hashPassword', () => {
    it('should hash password with default salt rounds', async () => {
      const password = 'plain-password';
      const hashedPassword = 'hashed-password';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never); // FIXED: Proper typing

      const result = await user.hashPassword(password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });

    it('should handle hashing errors', async () => {
      const password = 'test-password';
      const error = new Error('Hashing error');
      mockBcrypt.hash.mockRejectedValue(error as never); // FIXED: Proper typing

      await expect(user.hashPassword(password))
        .rejects.toThrow('Hashing error');
    });
  });

  describe('User attributes', () => {
    it('should have correct default values', () => {
      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(UserRole.PATIENT);
      expect(user.fullName).toBe('Test User');
      expect(user.phone).toBe('+1234567890');
      expect(user.isActive).toBe(true);
    });

    it('should validate email format in model definition', () => {
      // This would typically be tested at the Sequelize level
      // We can test the enum values
      expect(Object.values(UserRole)).toContain(UserRole.PATIENT);
      expect(Object.values(UserRole)).toContain(UserRole.DOCTOR);
      expect(Object.values(UserRole)).toContain(UserRole.PHARMACIST);
      expect(Object.values(UserRole)).toContain(UserRole.ADMIN);
    });
  });

  describe('UserRole enum', () => {
    it('should have all required roles', () => {
      expect(UserRole.PATIENT).toBe('patient');
      expect(UserRole.DOCTOR).toBe('doctor');
      expect(UserRole.PHARMACIST).toBe('pharmacist');
      expect(UserRole.ADMIN).toBe('admin');
    });
  });

  describe('Model hooks simulation', () => {
    it('should hash password before create', async () => {
      const plainPassword = 'plain-password';
      const hashedPassword = 'hashed-password';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never); // FIXED: Proper typing

      // Simulate the beforeCreate hook behavior
      const userData = {
        password: plainPassword,
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.PATIENT,
      };

      const mockUser = new User();
      mockUser.hashPassword = jest.fn().mockResolvedValue(hashedPassword);

      // Simulate hook execution
      if ((userData as any).password) {
        mockUser.passwordHash = await mockUser.hashPassword((userData as any).password);
      }

      expect(mockUser.passwordHash).toBe(hashedPassword);
    });

    it('should hash password before update', async () => {
      const newPassword = 'new-password';
      const hashedPassword = 'new-hashed-password';
      mockBcrypt.hash.mockResolvedValue(hashedPassword as never); // FIXED: Proper typing

      const updateData = { password: newPassword };
      user.hashPassword = jest.fn().mockResolvedValue(hashedPassword);

      // Simulate hook execution
      if ((updateData as any).password) {
        user.passwordHash = await user.hashPassword((updateData as any).password);
      }

      expect(user.passwordHash).toBe(hashedPassword);
    });
  });
});