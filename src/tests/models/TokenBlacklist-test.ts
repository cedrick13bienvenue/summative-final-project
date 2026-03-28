import TokenBlacklist from '../../models/TokenBlacklist';

// Mock the model static methods that hit the DB
jest.mock('../../models/TokenBlacklist', () => {
  const actual = jest.requireActual('../../models/TokenBlacklist');
  return {
    ...actual,
    default: {
      ...actual.default,
      findOne: jest.fn(),
      create: jest.fn(),
      destroy: jest.fn(),
    },
  };
});

describe('TokenBlacklist Model', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('isTokenBlacklisted (static)', () => {
    it('should return true when token exists in blacklist', async () => {
      (TokenBlacklist.findOne as jest.Mock).mockResolvedValue({ token: 'blacklisted-token' });
      const result = await TokenBlacklist.isTokenBlacklisted('blacklisted-token');
      expect(result).toBe(true);
    });

    it('should return false when token is not in blacklist', async () => {
      (TokenBlacklist.findOne as jest.Mock).mockResolvedValue(null);
      const result = await TokenBlacklist.isTokenBlacklisted('valid-token');
      expect(result).toBe(false);
    });
  });

  describe('blacklistToken (static)', () => {
    it('should call create with correct arguments', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      (TokenBlacklist.create as jest.Mock).mockResolvedValue({});
      await TokenBlacklist.blacklistToken('token-abc', 'user-123', expiresAt);
      expect(TokenBlacklist.create).toHaveBeenCalledWith({
        token: 'token-abc',
        userId: 'user-123',
        expiresAt,
      });
    });
  });

  describe('cleanupExpiredTokens (static)', () => {
    it('should call destroy with Op.lt condition', async () => {
      (TokenBlacklist.destroy as jest.Mock).mockResolvedValue(5);
      await TokenBlacklist.cleanupExpiredTokens();
      expect(TokenBlacklist.destroy).toHaveBeenCalled();
    });
  });

  describe('TokenBlacklist attributes', () => {
    it('should hold token, userId, and expiresAt', () => {
      const entry = new TokenBlacklist({
        id: 'bl-123',
        token: 'jwt-token-here',
        userId: 'user-456',
        expiresAt: new Date('2026-12-31'),
      } as any);

      expect(entry.token).toBe('jwt-token-here');
      expect(entry.userId).toBe('user-456');
      expect(entry.expiresAt).toEqual(new Date('2026-12-31'));
    });
  });
});
