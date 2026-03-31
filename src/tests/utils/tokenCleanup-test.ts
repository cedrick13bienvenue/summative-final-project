import { TokenCleanup } from '../../utils/tokenCleanup';
import { AuthService } from '../../services/authService';

jest.mock('../../services/authService', () => ({
  AuthService: {
    cleanupExpiredTokens: jest.fn(),
  },
}));

const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

const mockProcessExit = jest.spyOn(process, 'exit').mockImplementation((() => {}) as any);

beforeEach(() => {
  jest.clearAllMocks();
});

afterAll(() => {
  mockProcessExit.mockRestore();
});

describe('TokenCleanup.cleanupExpiredTokens', () => {
  it('should call AuthService.cleanupExpiredTokens', async () => {
    MockAuthService.cleanupExpiredTokens.mockResolvedValue(undefined);
    await TokenCleanup.cleanupExpiredTokens();
    expect(MockAuthService.cleanupExpiredTokens).toHaveBeenCalled();
  });

  it('should throw when AuthService.cleanupExpiredTokens throws', async () => {
    MockAuthService.cleanupExpiredTokens.mockRejectedValue(new Error('DB error'));
    await expect(TokenCleanup.cleanupExpiredTokens()).rejects.toThrow('DB error');
  });
});

describe('TokenCleanup.run', () => {
  it('should call process.exit(0) on success', async () => {
    MockAuthService.cleanupExpiredTokens.mockResolvedValue(undefined);
    await TokenCleanup.run();
    expect(mockProcessExit).toHaveBeenCalledWith(0);
  });

  it('should call process.exit(1) on failure', async () => {
    MockAuthService.cleanupExpiredTokens.mockRejectedValue(new Error('Failed'));
    await TokenCleanup.run();
    expect(mockProcessExit).toHaveBeenCalledWith(1);
  });
});
