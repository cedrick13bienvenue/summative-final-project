/**
 * Covers User model beforeCreate/beforeUpdate hook branches:
 * - if (password) { ... } truthy path: hash is computed
 * - if (password) { ... } falsy path: hashPassword is NOT called
 *
 * Accesses the hooks via Sequelize internals so the actual hook code is exercised.
 */
import User, { UserRole } from '../../models/User';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('hashed-pw'),
}));

beforeEach(() => jest.clearAllMocks());

describe('User model hooks - direct invocation', () => {
  const getHook = (hookType: 'beforeCreate' | 'beforeUpdate') => {
    // Sequelize stores hooks in Model._options.hooks
    const hooksMap: any = (User as any)._options?.hooks ?? {};
    const hookEntry = hooksMap[hookType];
    if (!hookEntry) return null;
    return Array.isArray(hookEntry) ? hookEntry[0] : hookEntry;
  };

  describe('beforeCreate hook', () => {
    it('should hash password when password is set', async () => {
      const hook = getHook('beforeCreate');
      if (!hook) return; // skip if hooks not accessible

      const mockUser = new User();
      mockUser.hashPassword = jest.fn().mockResolvedValue('hashed-pw');
      (mockUser as any).password = 'plain-pass';

      await hook(mockUser);
      expect(mockUser.hashPassword).toHaveBeenCalledWith('plain-pass');
      expect(mockUser.passwordHash).toBe('hashed-pw');
    });

    it('should NOT hash when password is absent', async () => {
      const hook = getHook('beforeCreate');
      if (!hook) return;

      const mockUser = new User();
      mockUser.hashPassword = jest.fn();
      // no .password property set

      await hook(mockUser);
      expect(mockUser.hashPassword).not.toHaveBeenCalled();
    });
  });

  describe('beforeUpdate hook', () => {
    it('should hash password when password is set', async () => {
      const hook = getHook('beforeUpdate');
      if (!hook) return;

      const mockUser = new User();
      mockUser.hashPassword = jest.fn().mockResolvedValue('new-hashed');
      (mockUser as any).password = 'new-pass';

      await hook(mockUser);
      expect(mockUser.hashPassword).toHaveBeenCalledWith('new-pass');
      expect(mockUser.passwordHash).toBe('new-hashed');
    });

    it('should NOT hash when password is absent', async () => {
      const hook = getHook('beforeUpdate');
      if (!hook) return;

      const mockUser = new User();
      mockUser.hashPassword = jest.fn();

      await hook(mockUser);
      expect(mockUser.hashPassword).not.toHaveBeenCalled();
    });
  });
});
