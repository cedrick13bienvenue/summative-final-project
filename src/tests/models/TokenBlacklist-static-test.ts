/**
 * Tests for TokenBlacklist static methods using spies
 * (not mocking the whole module, so actual code gets coverage)
 */
import TokenBlacklist from '../../models/TokenBlacklist';

describe('TokenBlacklist static methods (code coverage)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('isTokenBlacklisted', () => {
    it('should return true when token is found', async () => {
      jest.spyOn(TokenBlacklist, 'findOne').mockResolvedValue({ token: 'tok' } as any);
      const result = await TokenBlacklist.isTokenBlacklisted('tok');
      expect(result).toBe(true);
      expect(TokenBlacklist.findOne).toHaveBeenCalledWith({ where: { token: 'tok' } });
    });

    it('should return false when token is not found', async () => {
      jest.spyOn(TokenBlacklist, 'findOne').mockResolvedValue(null);
      const result = await TokenBlacklist.isTokenBlacklisted('not-blacklisted');
      expect(result).toBe(false);
    });
  });

  describe('blacklistToken', () => {
    it('should call create with token, userId, and expiresAt', async () => {
      jest.spyOn(TokenBlacklist, 'create').mockResolvedValue({} as any);
      const expiresAt = new Date(Date.now() + 3600000);
      await TokenBlacklist.blacklistToken('token-abc', 'user-123', expiresAt);
      expect(TokenBlacklist.create).toHaveBeenCalledWith({
        token: 'token-abc',
        userId: 'user-123',
        expiresAt,
      });
    });
  });

  describe('cleanupExpiredTokens', () => {
    it('should call destroy with expired tokens condition', async () => {
      jest.spyOn(TokenBlacklist, 'destroy').mockResolvedValue(0 as any);
      await TokenBlacklist.cleanupExpiredTokens();
      expect(TokenBlacklist.destroy).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ expiresAt: expect.any(Object) }) })
      );
    });
  });
});
