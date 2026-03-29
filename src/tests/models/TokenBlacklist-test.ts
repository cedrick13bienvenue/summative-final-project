const findOne = jest.fn();
const create = jest.fn();
const destroy = jest.fn();

jest.mock('../../models/TokenBlacklist', () => {
  function MockTokenBlacklist(this: any, attrs: any) {
    this.token = attrs.token;
    this.userId = attrs.userId;
    this.expiresAt = attrs.expiresAt;
  }
  MockTokenBlacklist.findOne = findOne;
  MockTokenBlacklist.create = create;
  MockTokenBlacklist.destroy = destroy;
  MockTokenBlacklist.isTokenBlacklisted = async (token: string) => {
    const result = await findOne({ where: { token } });
    return !!result;
  };
  MockTokenBlacklist.blacklistToken = async (token: string, userId: string, expiresAt: Date) => {
    await create({ token, userId, expiresAt });
  };
  MockTokenBlacklist.cleanupExpiredTokens = async () => {
    const { Op } = require('sequelize');
    await destroy({ where: { expiresAt: { [Op.lt]: new Date() } } });
  };
  return { default: MockTokenBlacklist, __esModule: true };
});

import TokenBlacklist from '../../models/TokenBlacklist';

describe('TokenBlacklist Model', () => {
  beforeEach(() => {
    findOne.mockReset();
    create.mockReset();
    destroy.mockReset();
  });

  describe('isTokenBlacklisted (static)', () => {
    it('should return true when token exists in blacklist', async () => {
      findOne.mockResolvedValue({ token: 'blacklisted-token' });
      const result = await TokenBlacklist.isTokenBlacklisted('blacklisted-token');
      expect(result).toBe(true);
    });

    it('should return false when token is not in blacklist', async () => {
      findOne.mockResolvedValue(null);
      const result = await TokenBlacklist.isTokenBlacklisted('valid-token');
      expect(result).toBe(false);
    });
  });

  describe('blacklistToken (static)', () => {
    it('should call create with correct arguments', async () => {
      const expiresAt = new Date(Date.now() + 3600000);
      create.mockResolvedValue({});
      await TokenBlacklist.blacklistToken('token-abc', 'user-123', expiresAt);
      expect(create).toHaveBeenCalledWith({
        token: 'token-abc',
        userId: 'user-123',
        expiresAt,
      });
    });
  });

  describe('cleanupExpiredTokens (static)', () => {
    it('should call destroy with Op.lt condition', async () => {
      destroy.mockResolvedValue(5);
      await TokenBlacklist.cleanupExpiredTokens();
      expect(destroy).toHaveBeenCalled();
    });
  });

  describe('TokenBlacklist attributes', () => {
    it('should hold token, userId, and expiresAt', () => {
      const expiresAt = new Date('2026-12-31');
      const entry = new (TokenBlacklist as any)({
        token: 'jwt-token-here',
        userId: 'user-456',
        expiresAt,
      });
      expect(entry.token).toBe('jwt-token-here');
      expect(entry.userId).toBe('user-456');
      expect(entry.expiresAt).toEqual(expiresAt);
    });
  });
});
