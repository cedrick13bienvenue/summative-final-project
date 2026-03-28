import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { UserRole } from '../models';

// Rate limit configuration interface
interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
}

// Custom rate limit response
const createRateLimitResponse = (message: string) => ({
  success: false,
  error: {
    message,
    statusCode: 429,
    type: 'RATE_LIMIT_EXCEEDED'
  }
});

// Helper function to safely get client IP (handles IPv6)
const getClientIP = (req: Request): string => {
  const forwarded = req.headers['x-forwarded-for'] as string;
  const ip = forwarded ? forwarded.split(',')[0] : req.ip;
  return ip || 'unknown';
};

// Get rate limit based on user role
const getRoleBasedRateLimit = (userRole: UserRole): RateLimitConfig => {
  const baseConfig = {
    windowMs: 60 * 1000, // 1 minute
    message: 'Too many requests, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  };

  switch (userRole) {
    case UserRole.ADMIN:
      return { ...baseConfig, max: 100 };
    case UserRole.DOCTOR:
      return { ...baseConfig, max: 50 };
    case UserRole.PHARMACIST:
      return { ...baseConfig, max: 30 };
    case UserRole.PATIENT:
      return { ...baseConfig, max: 20 };
    default:
      return { ...baseConfig, max: 10 };
  }
};

// Basic rate limiter for general protection
export const basicRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: createRateLimitResponse('Too many requests from this IP, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for authentication endpoints
export const authRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 auth attempts per windowMs
  message: createRateLimitResponse('Too many authentication attempts, please try again later.'),
  skipSuccessfulRequests: true, // Don't count successful requests
  standardHeaders: true,
  legacyHeaders: false,
});

// Registration rate limiter
export const registrationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 registrations per hour
  message: createRateLimitResponse('Too many registration attempts, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Password reset rate limiter
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 password reset attempts per hour
  message: createRateLimitResponse('Too many password reset attempts, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// OTP rate limiter
export const otpRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // limit each IP to 3 OTP requests per 5 minutes
  message: createRateLimitResponse('Too many OTP requests, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Prescription creation rate limiter
export const prescriptionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 prescriptions per minute
  keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
  message: createRateLimitResponse('Too many prescription operations, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// QR code scanning rate limiter
export const qrScanRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // limit each user to 20 scans per minute
  keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
  message: createRateLimitResponse('Too many QR code scans, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Pharmacy operations rate limiter
export const pharmacyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 15, // limit each user to 15 pharmacy operations per minute
  keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
  message: createRateLimitResponse('Too many pharmacy operations, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Email sending rate limiter
export const emailRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each user to 5 emails per minute
  keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
  message: createRateLimitResponse('Too many email requests, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Medical history access rate limiter
export const medicalHistoryRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each user to 10 history requests per minute
  keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
  message: createRateLimitResponse('Too many medical history requests, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Event management rate limiter (admin only)
export const eventRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // limit each user to 30 event operations per minute
  keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
  message: createRateLimitResponse('Too many event management requests, please slow down.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Dynamic rate limiter based on user role
export const createRoleBasedRateLimiter = (userRole: UserRole) => {
  const config = getRoleBasedRateLimit(userRole);
  
  return rateLimit({
    ...config,
    keyGenerator: (req: Request) => (req as any).user?.id || getClientIP(req),
    message: createRateLimitResponse(`Rate limit exceeded for ${userRole.toLowerCase()} role.`),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Strict rate limiter for sensitive operations
export const sensitiveOperationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // limit each user to 5 sensitive operations per 5 minutes
  keyGenerator: (req: Request) => `${getClientIP(req)}:${(req as any).user?.id || 'anonymous'}`,
  message: createRateLimitResponse('Too many sensitive operations, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// API key rate limiter (for future API key authentication)
export const apiKeyRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each API key to 100 requests per minute
  keyGenerator: (req: Request) => (req.headers['x-api-key'] as string) || getClientIP(req),
  message: createRateLimitResponse('API rate limit exceeded, please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limit bypass for trusted IPs (if needed)
export const createTrustedIPRateLimiter = (trustedIPs: string[]) => {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 1000, // Higher limit for trusted IPs
    keyGenerator: (req: Request) => {
      const clientIP = getClientIP(req);
      return trustedIPs.includes(clientIP) ? `trusted:${clientIP}` : clientIP;
    },
    message: createRateLimitResponse('Rate limit exceeded.'),
    standardHeaders: true,
    legacyHeaders: false,
  });
};

// Rate limit monitoring middleware
export const rateLimitMonitor = (req: Request, res: Response, next: any) => {
  const clientIP = getClientIP(req);
  const userID = (req as any).user?.id;
  const endpoint = req.path;
  const method = req.method;

  // Log rate limit information
  console.log(`Rate limit check - IP: ${clientIP}, User: ${userID}, Endpoint: ${method} ${endpoint}`);
  
  next();
};

// Export all rate limiters
export const rateLimiters = {
  basic: basicRateLimiter,
  auth: authRateLimiter,
  registration: registrationRateLimiter,
  passwordReset: passwordResetRateLimiter,
  otp: otpRateLimiter,
  prescription: prescriptionRateLimiter,
  qrScan: qrScanRateLimiter,
  pharmacy: pharmacyRateLimiter,
  email: emailRateLimiter,
  medicalHistory: medicalHistoryRateLimiter,
  event: eventRateLimiter,
  sensitive: sensitiveOperationRateLimiter,
  apiKey: apiKeyRateLimiter,
};