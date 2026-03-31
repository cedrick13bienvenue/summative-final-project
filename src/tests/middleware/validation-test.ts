import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateEmail,
  validatePassword,
  validateDate,
  validateUUID,
  sanitizeInput,
  validateRateLimit,
  validateFileUpload,
} from '../../middleware/validation';
import Joi from 'joi';

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

beforeEach(() => jest.clearAllMocks());

describe('validate middleware', () => {
  const schema = Joi.object({ name: Joi.string().required() });

  it('should call next with valid body data', () => {
    const middleware = validate(schema, 'body');
    const req = mockReq({ body: { name: 'John' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should return 400 with invalid body data', () => {
    const middleware = validate(schema, 'body');
    const req = mockReq({ body: {} });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('should validate query params', () => {
    const middleware = validate(schema, 'query');
    const req = mockReq({ query: { name: 'Test' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 for invalid query', () => {
    const middleware = validate(schema, 'query');
    const req = mockReq({ query: {} });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should validate route params', () => {
    const middleware = validate(schema, 'params');
    const req = mockReq({ params: { name: 'Test' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 400 for invalid params', () => {
    const middleware = validate(schema, 'params');
    const req = mockReq({ params: {} });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('validateBody / validateQuery / validateParams', () => {
  const schema = Joi.object({ id: Joi.string().required() });

  it('validateBody should pass valid body', () => {
    const req = mockReq({ body: { id: '123' } });
    const res = mockRes();
    validateBody(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('validateQuery should pass valid query', () => {
    const req = mockReq({ query: { id: '123' } });
    const res = mockRes();
    validateQuery(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('validateParams should pass valid params', () => {
    const req = mockReq({ params: { id: '123' } });
    const res = mockRes();
    validateParams(schema)(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validateEmail', () => {
  it('should return 400 if email is missing', () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    validateEmail(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('should return 400 for invalid email format', () => {
    const req = mockReq({ body: { email: 'not-an-email' } });
    const res = mockRes();
    validateEmail(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next for valid email', () => {
    const req = mockReq({ body: { email: 'valid@email.com' } });
    const res = mockRes();
    validateEmail(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validatePassword', () => {
  it('should return 400 if password is missing', () => {
    const req = mockReq({ body: {} });
    const res = mockRes();
    validatePassword(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if password is too short', () => {
    const req = mockReq({ body: { password: 'Ab1' } });
    const res = mockRes();
    validatePassword(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if password lacks required characters', () => {
    const req = mockReq({ body: { password: 'alllowercase' } });
    const res = mockRes();
    validatePassword(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next for valid password', () => {
    const req = mockReq({ body: { password: 'ValidPass1' } });
    const res = mockRes();
    validatePassword(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validateDate', () => {
  it('should return 400 if date field is missing', () => {
    const middleware = validateDate('dateOfBirth');
    const req = mockReq({ body: {} });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if date is invalid', () => {
    const middleware = validateDate('dateOfBirth');
    const req = mockReq({ body: { dateOfBirth: 'not-a-date' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if date is in the future', () => {
    const middleware = validateDate('dateOfBirth');
    const req = mockReq({ body: { dateOfBirth: '2099-01-01' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next for a valid past date', () => {
    const middleware = validateDate('dateOfBirth');
    const req = mockReq({ body: { dateOfBirth: '1990-01-01' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validateUUID', () => {
  const validUUID = '550e8400-e29b-41d4-a716-446655440000';

  it('should return 400 if UUID field is missing', () => {
    const middleware = validateUUID('userId');
    const req = mockReq({ params: {}, body: {} });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if UUID is invalid', () => {
    const middleware = validateUUID('userId');
    const req = mockReq({ params: { userId: 'not-a-uuid' } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next for valid UUID in params', () => {
    const middleware = validateUUID('userId');
    const req = mockReq({ params: { userId: validUUID } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });

  it('should call next for valid UUID in body', () => {
    const middleware = validateUUID('userId');
    const req = mockReq({ params: {}, body: { userId: validUUID } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('sanitizeInput', () => {
  it('should trim string values in body', () => {
    const req = mockReq({ body: { name: '  John  ' }, query: {} });
    const res = mockRes();
    sanitizeInput(req, res, mockNext);
    expect(req.body.name).toBe('John');
    expect(mockNext).toHaveBeenCalled();
  });

  it('should sanitize nested objects', () => {
    const req = mockReq({ body: { user: { name: '  Jane  ' } }, query: {} });
    const res = mockRes();
    sanitizeInput(req, res, mockNext);
    expect(req.body.user.name).toBe('Jane');
  });

  it('should sanitize arrays', () => {
    const req = mockReq({ body: { tags: ['  a  ', '  b  '] }, query: {} });
    const res = mockRes();
    sanitizeInput(req, res, mockNext);
    expect(req.body.tags).toEqual(['a', 'b']);
  });

  it('should pass non-string values unchanged', () => {
    const req = mockReq({ body: { count: 5, active: true }, query: {} });
    const res = mockRes();
    sanitizeInput(req, res, mockNext);
    expect(req.body.count).toBe(5);
    expect(req.body.active).toBe(true);
  });
});

describe('validateRateLimit', () => {
  it('should always call next', () => {
    const req = mockReq({});
    const res = mockRes();
    validateRateLimit(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});

describe('validateFileUpload', () => {
  it('should return 400 if no file is present', () => {
    const middleware = validateFileUpload(['image/png'], 1000000);
    const req = mockReq({});
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 for disallowed file type', () => {
    const middleware = validateFileUpload(['image/png'], 1000000);
    const req = mockReq({ file: { mimetype: 'application/pdf', size: 500 } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should return 400 if file is too large', () => {
    const middleware = validateFileUpload(['image/png'], 100);
    const req = mockReq({ file: { mimetype: 'image/png', size: 500 } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('should call next for valid file', () => {
    const middleware = validateFileUpload(['image/png'], 1000000);
    const req = mockReq({ file: { mimetype: 'image/png', size: 500 } });
    const res = mockRes();
    middleware(req, res, mockNext);
    expect(mockNext).toHaveBeenCalled();
  });
});
