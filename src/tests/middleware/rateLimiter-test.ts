import {
  basicRateLimiter,
  authRateLimiter,
  registrationRateLimiter,
  passwordResetRateLimiter,
  otpRateLimiter,
  prescriptionRateLimiter,
  qrScanRateLimiter,
  pharmacyRateLimiter,
  emailRateLimiter,
  medicalHistoryRateLimiter,
  eventRateLimiter,
  sensitiveOperationRateLimiter,
  apiKeyRateLimiter,
  createRoleBasedRateLimiter,
  createTrustedIPRateLimiter,
  rateLimitMonitor,
  rateLimiters,
} from '../../middleware/rateLimiter';
import { UserRole } from '../../models';

jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
}));

const mockReq = (overrides: any = {}) => ({
  headers: {},
  ip: '127.0.0.1',
  path: '/test',
  method: 'GET',
  params: {},
  query: {},
  body: {},
  ...overrides,
}) as any;

const mockRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = jest.fn();

beforeEach(() => jest.clearAllMocks());

describe('Rate limiters are defined', () => {
  it('basicRateLimiter should be a function', () => {
    expect(typeof basicRateLimiter).toBe('function');
  });

  it('authRateLimiter should be a function', () => {
    expect(typeof authRateLimiter).toBe('function');
  });

  it('registrationRateLimiter should be a function', () => {
    expect(typeof registrationRateLimiter).toBe('function');
  });

  it('passwordResetRateLimiter should be a function', () => {
    expect(typeof passwordResetRateLimiter).toBe('function');
  });

  it('otpRateLimiter should be a function', () => {
    expect(typeof otpRateLimiter).toBe('function');
  });

  it('prescriptionRateLimiter should be a function', () => {
    expect(typeof prescriptionRateLimiter).toBe('function');
  });

  it('qrScanRateLimiter should be a function', () => {
    expect(typeof qrScanRateLimiter).toBe('function');
  });

  it('pharmacyRateLimiter should be a function', () => {
    expect(typeof pharmacyRateLimiter).toBe('function');
  });

  it('emailRateLimiter should be a function', () => {
    expect(typeof emailRateLimiter).toBe('function');
  });

  it('medicalHistoryRateLimiter should be a function', () => {
    expect(typeof medicalHistoryRateLimiter).toBe('function');
  });

  it('eventRateLimiter should be a function', () => {
    expect(typeof eventRateLimiter).toBe('function');
  });

  it('sensitiveOperationRateLimiter should be a function', () => {
    expect(typeof sensitiveOperationRateLimiter).toBe('function');
  });

  it('apiKeyRateLimiter should be a function', () => {
    expect(typeof apiKeyRateLimiter).toBe('function');
  });
});

describe('rateLimiters object', () => {
  it('should export all limiters', () => {
    expect(rateLimiters).toHaveProperty('basic');
    expect(rateLimiters).toHaveProperty('auth');
    expect(rateLimiters).toHaveProperty('registration');
    expect(rateLimiters).toHaveProperty('passwordReset');
    expect(rateLimiters).toHaveProperty('otp');
    expect(rateLimiters).toHaveProperty('prescription');
    expect(rateLimiters).toHaveProperty('qrScan');
    expect(rateLimiters).toHaveProperty('pharmacy');
    expect(rateLimiters).toHaveProperty('email');
    expect(rateLimiters).toHaveProperty('medicalHistory');
    expect(rateLimiters).toHaveProperty('event');
    expect(rateLimiters).toHaveProperty('sensitive');
    expect(rateLimiters).toHaveProperty('apiKey');
  });
});

describe('createRoleBasedRateLimiter', () => {
  it('should return a middleware function for ADMIN role', () => {
    const limiter = createRoleBasedRateLimiter(UserRole.ADMIN);
    expect(typeof limiter).toBe('function');
  });

  it('should return a middleware function for DOCTOR role', () => {
    const limiter = createRoleBasedRateLimiter(UserRole.DOCTOR);
    expect(typeof limiter).toBe('function');
  });

  it('should return a middleware function for PHARMACIST role', () => {
    const limiter = createRoleBasedRateLimiter(UserRole.PHARMACIST);
    expect(typeof limiter).toBe('function');
  });

  it('should return a middleware function for PATIENT role', () => {
    const limiter = createRoleBasedRateLimiter(UserRole.PATIENT);
    expect(typeof limiter).toBe('function');
  });
});

describe('createTrustedIPRateLimiter', () => {
  it('should return a middleware function', () => {
    const limiter = createTrustedIPRateLimiter(['127.0.0.1', '192.168.1.1']);
    expect(typeof limiter).toBe('function');
  });
});

describe('rateLimitMonitor', () => {
  it('should call next', () => {
    const req = mockReq({ user: { id: 'user-1' } });
    const res = mockRes();
    rateLimitMonitor(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next with x-forwarded-for header', () => {
    const req = mockReq({ headers: { 'x-forwarded-for': '10.0.0.1,10.0.0.2' } });
    const res = mockRes();
    rateLimitMonitor(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next without a user', () => {
    const req = mockReq({});
    const res = mockRes();
    rateLimitMonitor(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should handle missing ip', () => {
    const req = mockReq({ ip: undefined, headers: {} });
    const res = mockRes();
    rateLimitMonitor(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
