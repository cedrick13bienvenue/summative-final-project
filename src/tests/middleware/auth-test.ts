import { authenticateToken, requireRole } from '../../middleware/auth';
import { UserRole } from '../../models';
import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('../../models', () => ({
  UserRole: {
    PATIENT: 'patient',
    DOCTOR: 'doctor',
    PHARMACIST: 'pharmacist',
    ADMIN: 'admin',
  },
  TokenBlacklist: {
    isTokenBlacklisted: jest.fn(),
  },
}));

import { TokenBlacklist } from '../../models';
const MockTokenBlacklist = TokenBlacklist as jest.Mocked<typeof TokenBlacklist>;
const mockJwt = jwt as jest.Mocked<typeof jwt>;

const mockReq = (overrides: any = {}) => ({
  headers: {},
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

beforeEach(() => {
  jest.clearAllMocks();
  process.env['JWT_SECRET'] = 'test-secret';
});

describe('authenticateToken', () => {
  it('should return 401 when no token provided', async () => {
    const req = mockReq({ headers: {} });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should return 401 when authorization header has no bearer token', async () => {
    const req = mockReq({ headers: { authorization: 'NotBearer' } });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 when token is blacklisted', async () => {
    MockTokenBlacklist.isTokenBlacklisted.mockResolvedValue(true);
    const req = mockReq({ headers: { authorization: 'Bearer blacklisted-token' } });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should call next and set req.user when token is valid', async () => {
    MockTokenBlacklist.isTokenBlacklisted.mockResolvedValue(false);
    (mockJwt.verify as jest.Mock).mockReturnValue({
      id: 'user-1',
      email: 'test@test.com',
      role: 'patient',
      fullName: 'Test User',
    });
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(req.user).toEqual({
      id: 'user-1',
      email: 'test@test.com',
      role: 'patient',
      fullName: 'Test User',
    });
  });

  it('should return 403 when JWT verification fails', async () => {
    MockTokenBlacklist.isTokenBlacklisted.mockResolvedValue(false);
    (mockJwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('invalid token');
    });
    const req = mockReq({ headers: { authorization: 'Bearer bad-token' } });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should continue if blacklist check throws an error', async () => {
    MockTokenBlacklist.isTokenBlacklisted.mockRejectedValue(new Error('DB error'));
    (mockJwt.verify as jest.Mock).mockReturnValue({
      id: 'user-1',
      email: 'test@test.com',
      role: 'patient',
      fullName: 'Test User',
    });
    const req = mockReq({ headers: { authorization: 'Bearer valid-token' } });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 403 when JWT_SECRET is not configured', async () => {
    delete process.env['JWT_SECRET'];
    MockTokenBlacklist.isTokenBlacklisted.mockResolvedValue(false);
    const req = mockReq({ headers: { authorization: 'Bearer some-token' } });
    const res = mockRes();
    await authenticateToken(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('requireRole', () => {
  it('should return 401 when req.user is not set', () => {
    const middleware = requireRole(UserRole.ADMIN);
    const req = mockReq({});
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should return 403 when user has wrong role', () => {
    const middleware = requireRole(UserRole.ADMIN);
    const req = mockReq({ user: { id: '1', role: 'patient', email: 'x@x.com', fullName: 'X' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('should call next when user has correct role', () => {
    const middleware = requireRole(UserRole.PATIENT);
    const req = mockReq({ user: { id: '1', role: 'patient', email: 'x@x.com', fullName: 'X' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should allow access when user role is in array of allowed roles', () => {
    const middleware = requireRole([UserRole.DOCTOR, UserRole.ADMIN]);
    const req = mockReq({ user: { id: '1', role: 'doctor', email: 'x@x.com', fullName: 'X' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should deny access when user role is not in array of allowed roles', () => {
    const middleware = requireRole([UserRole.DOCTOR, UserRole.ADMIN]);
    const req = mockReq({ user: { id: '1', role: 'patient', email: 'x@x.com', fullName: 'X' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(403);
  });
});
