import { AuthService } from '../../services/authService';
import { User, TokenBlacklist } from '../../models';
import { UserRole } from '../../models/User';
import { sequelize } from '../../database/config/database';

jest.mock('../../models/User', () => ({
  UserRole: {
    ADMIN: 'admin',
    DOCTOR: 'doctor',
    PATIENT: 'patient',
    PHARMACIST: 'pharmacist',
  },
  default: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
  },
  __esModule: true,
}));
jest.mock('../../models', () => {
  const UserMock: any = jest.fn().mockImplementation(() => ({
    hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
  }));
  UserMock.findOne = jest.fn();
  UserMock.findByPk = jest.fn();
  UserMock.create = jest.fn();
  UserMock.hasOne = jest.fn();
  return {
    User: UserMock,
    TokenBlacklist: {
      isTokenBlacklisted: jest.fn(),
      blacklistToken: jest.fn(),
      cleanupExpiredTokens: jest.fn(),
    },
    UserRole: {
      ADMIN: 'admin',
      DOCTOR: 'doctor',
      PATIENT: 'patient',
      PHARMACIST: 'pharmacist',
    },
  };
});
jest.mock('../../models/Doctor', () => ({
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  __esModule: true,
}));
jest.mock('../../models/Patient', () => ({
  default: {
    create: jest.fn(),
    findOne: jest.fn(),
    findByPk: jest.fn(),
  },
  __esModule: true,
}));
jest.mock('../../database/config/database', () => ({
  sequelize: {
    transaction: jest.fn(),
  },
}));
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ id: 'user-123', role: 'doctor' }),
}));
jest.mock('../../services/otpService', () => ({
  OTPService: {
    generateAndSendPasswordResetOTP: jest.fn(),
    verifyPasswordResetOTP: jest.fn(),
  },
}));

const MockUser = User as jest.Mocked<typeof User>;
const MockTokenBlacklist = TokenBlacklist as jest.Mocked<typeof TokenBlacklist>;

const mockTransaction = {
  commit: jest.fn(),
  rollback: jest.fn(),
};

// Set required env vars
process.env['JWT_SECRET'] = 'test-jwt-secret-for-unit-tests';

describe('AuthService - Unit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (sequelize.transaction as jest.Mock).mockResolvedValue(mockTransaction);
  });

  describe('register', () => {
    it('should register a new patient user successfully', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = {
        hashPassword: jest.fn().mockResolvedValue('hashed-pw'),
      };
      // Mock new User() instance
      (User as any).mockImplementation(() => mockUserInstance);

      const mockCreatedUser = {
        id: 'user-001',
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.PATIENT,
        phone: '+250789000001',
      };
      MockUser.create.mockResolvedValue(mockCreatedUser as any);

      const result = await AuthService.register({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.PATIENT,
        phone: '+250789000001',
      });

      expect(MockUser.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(MockUser.create).toHaveBeenCalled();
      expect(mockTransaction.commit).toHaveBeenCalled();
      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw if email already exists', async () => {
      MockUser.findOne.mockResolvedValue({ id: 'existing-user' } as any);

      await expect(
        AuthService.register({
          email: 'taken@example.com',
          password: 'password123',
          fullName: 'Someone',
          role: UserRole.PATIENT,
        })
      ).rejects.toThrow('User with this email already exists');

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });

    it('should create Doctor profile when role is DOCTOR', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed-pw') };
      (User as any).mockImplementation(() => mockUserInstance);

      MockUser.create.mockResolvedValue({
        id: 'doc-user-001',
        email: 'doc@example.com',
        fullName: 'Dr. Smith',
        role: UserRole.DOCTOR,
      } as any);
      require('../../models/Doctor').default.create.mockResolvedValue({} as any);

      await AuthService.register({
        email: 'doc@example.com',
        password: 'password123',
        fullName: 'Dr. Smith',
        role: UserRole.DOCTOR,
      });

      expect(require('../../models/Doctor').default.create).toHaveBeenCalledWith(
        expect.objectContaining({ isVerified: false }),
        expect.objectContaining({ transaction: mockTransaction })
      );
    });

    it('should rollback transaction on DB error', async () => {
      MockUser.findOne.mockResolvedValue(null);
      const mockUserInstance = { hashPassword: jest.fn().mockResolvedValue('hashed-pw') };
      (User as any).mockImplementation(() => mockUserInstance);
      MockUser.create.mockRejectedValue(new Error('DB error'));

      await expect(
        AuthService.register({
          email: 'fail@example.com',
          password: 'password123',
          fullName: 'Fail User',
          role: UserRole.PATIENT,
        })
      ).rejects.toThrow();

      expect(mockTransaction.rollback).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      const mockUser = {
        id: 'user-001',
        email: 'user@example.com',
        fullName: 'Test User',
        role: UserRole.DOCTOR,
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(true),
      };
      MockUser.findOne.mockResolvedValue(mockUser as any);

      const result = await AuthService.login({
        email: 'user@example.com',
        password: 'correct-password',
      });

      expect(mockUser.comparePassword).toHaveBeenCalledWith('correct-password');
      expect(result.token).toBe('mock-jwt-token');
    });

    it('should throw if user not found', async () => {
      MockUser.findOne.mockResolvedValue(null);
      await expect(
        AuthService.login({ email: 'notfound@example.com', password: 'pw' })
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw if user is inactive', async () => {
      MockUser.findOne.mockResolvedValue({ isActive: false } as any);
      await expect(
        AuthService.login({ email: 'inactive@example.com', password: 'pw' })
      ).rejects.toThrow();
    });

    it('should throw if password is wrong', async () => {
      MockUser.findOne.mockResolvedValue({
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      } as any);
      await expect(
        AuthService.login({ email: 'user@example.com', password: 'wrong' })
      ).rejects.toThrow('Invalid email or password');
    });
  });

  describe('logout', () => {
    it('should blacklist the token on logout', async () => {
      MockTokenBlacklist.blacklistToken = jest.fn().mockResolvedValue(undefined);
      const mockUser = {
        id: 'user-001',
        email: 'user@example.com',
        role: UserRole.PATIENT,
      };
      MockUser.findByPk.mockResolvedValue(mockUser as any);

      await AuthService.logout('jwt-token', 'user-001');
      expect(MockTokenBlacklist.blacklistToken).toHaveBeenCalledWith(
        'jwt-token',
        'user-001',
        expect.any(Date)
      );
    });
  });

  describe('isTokenBlacklisted', () => {
    it('should return true for blacklisted token', async () => {
      MockTokenBlacklist.isTokenBlacklisted = jest.fn().mockResolvedValue(true);
      const result = await AuthService.isTokenBlacklisted('bad-token');
      expect(result).toBe(true);
    });

    it('should return false for valid token', async () => {
      MockTokenBlacklist.isTokenBlacklisted = jest.fn().mockResolvedValue(false);
      const result = await AuthService.isTokenBlacklisted('good-token');
      expect(result).toBe(false);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      MockUser.findByPk.mockResolvedValue({
        id: 'user-001',
        email: 'user@example.com',
        fullName: 'Test User',
        role: UserRole.PATIENT,
        isActive: true,
      } as any);

      const profile = await AuthService.getProfile('user-001');
      expect(profile.email).toBe('user@example.com');
    });

    it('should throw if user not found', async () => {
      MockUser.findByPk.mockResolvedValue(null);
      await expect(AuthService.getProfile('ghost-id')).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = {
        comparePassword: jest.fn().mockResolvedValue(true),
        hashPassword: jest.fn().mockResolvedValue('new-hash'),
        save: jest.fn().mockResolvedValue(undefined),
        update: jest.fn().mockResolvedValue(undefined),
        passwordHash: 'old-hash',
      };
      MockUser.findByPk.mockResolvedValue(mockUser as any);

      await AuthService.changePassword('user-001', 'oldPw', 'newPw123');
      expect(mockUser.comparePassword).toHaveBeenCalledWith('oldPw');
      expect(mockUser.update).toHaveBeenCalled();
    });

    it('should throw if current password is wrong', async () => {
      const mockUser = { comparePassword: jest.fn().mockResolvedValue(false) };
      MockUser.findByPk.mockResolvedValue(mockUser as any);
      await expect(
        AuthService.changePassword('user-001', 'wrongPw', 'newPw123')
      ).rejects.toThrow();
    });
  });
});
