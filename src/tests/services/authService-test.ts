import { Request, Response } from 'express';
import { AuthController } from '../../controllers/authController';
import { AuthService } from '../../services/authService';
import { UserRole } from '../../models';
import { AuthenticatedRequest } from '../../middleware/auth';

// Mock the AuthService
jest.mock('../../services/authService');

const MockAuthService = AuthService as jest.Mocked<typeof AuthService>;

describe('AuthController', () => {
  let mockReq: Partial<Request | AuthenticatedRequest>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a user', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.PATIENT,
      };

      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: userData.email,
          fullName: userData.fullName,
          role: userData.role,
        },
        token: 'mock-token',
      };

      mockReq.body = userData;
      MockAuthService.register.mockResolvedValue(mockAuthResponse);

      await AuthController.register(mockReq as Request, mockRes as Response);

      expect(MockAuthService.register).toHaveBeenCalledWith(userData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User registered successfully',
        data: mockAuthResponse,
      });
    });

    it('should return 400 if required fields are missing', async () => {
      mockReq.body = {
        email: 'test@example.com',
        // missing password, fullName, role
      };

      await AuthController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email, password, full name, and role are required',
          statusCode: 400,
        },
      });
    });

    it('should return 400 for invalid email format', async () => {
      mockReq.body = {
        email: 'invalid-email',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.PATIENT,
      };

      await AuthController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid email format',
          statusCode: 400,
        },
      });
    });

    it('should return 400 for weak password', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: '123', // too short
        fullName: 'Test User',
        role: UserRole.PATIENT,
      };

      await AuthController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Password must be at least 6 characters long',
          statusCode: 400,
        },
      });
    });

    it('should handle AuthService errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'password123',
        fullName: 'Test User',
        role: UserRole.PATIENT,
      };

      MockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      await AuthController.register(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email already exists',
          statusCode: 400,
        },
      });
    });
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const mockAuthResponse = {
        user: {
          id: 'user-123',
          email: credentials.email,
          fullName: 'Test User',
          role: UserRole.PATIENT,
        },
        token: 'mock-token',
      };

      mockReq.body = credentials;
      MockAuthService.login.mockResolvedValue(mockAuthResponse);

      await AuthController.login(mockReq as Request, mockRes as Response);

      expect(MockAuthService.login).toHaveBeenCalledWith(credentials);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: mockAuthResponse,
      });
    });

    it('should return 400 if credentials are missing', async () => {
      mockReq.body = {
        email: 'test@example.com',
        // missing password
      };

      await AuthController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Email and password are required',
          statusCode: 400,
        },
      });
    });

    it('should handle authentication errors', async () => {
      mockReq.body = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      MockAuthService.login.mockRejectedValue(new Error('Invalid email or password'));

      await AuthController.login(mockReq as Request, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Invalid email or password',
          statusCode: 401,
        },
      });
    });
  });

  describe('getProfile', () => {
    it('should successfully get user profile', async () => {
      // FIXED: Added all required properties to match AuthService.getProfile return type
      const mockProfile = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Test User',
        role: UserRole.PATIENT,
        phone: '+1234567890',
        isActive: true,
        createdAt: new Date(),
      };

      (mockReq as AuthenticatedRequest).user = { id: 'user-123' } as any;
      MockAuthService.getProfile.mockResolvedValue(mockProfile);

      await AuthController.getProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockAuthService.getProfile).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockProfile,
      });
    });

    it('should return 401 if user not authenticated', async () => {
      (mockReq as AuthenticatedRequest).user = undefined;

      await AuthController.getProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Authentication required',
          statusCode: 401,
        },
      });
    });
  });

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const updateData = {
        fullName: 'Updated Name',
        phone: '+1234567890',
      };

      // FIXED: Added all required properties to match AuthService.updateProfile return type
      const mockUpdatedProfile = {
        id: 'user-123',
        email: 'test@example.com',
        fullName: 'Updated Name',
        role: UserRole.PATIENT,
        phone: '+1234567890',
        isActive: true,
        updatedAt: new Date(),
      };

      (mockReq as AuthenticatedRequest).user = { id: 'user-123' } as any;
      mockReq.body = updateData;
      MockAuthService.updateProfile.mockResolvedValue(mockUpdatedProfile);

      await AuthController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockAuthService.updateProfile).toHaveBeenCalledWith('user-123', updateData);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: mockUpdatedProfile,
      });
    });

    it('should return 400 if no valid fields to update', async () => {
      (mockReq as AuthenticatedRequest).user = { id: 'user-123' } as any;
      mockReq.body = {
        invalidField: 'value',
      };

      await AuthController.updateProfile(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'No valid fields to update',
          statusCode: 400,
        },
      });
    });
  });

  describe('changePassword', () => {
    it('should successfully change password', async () => {
      const passwordData = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123',
      };

      (mockReq as AuthenticatedRequest).user = { id: 'user-123' } as any;
      mockReq.body = passwordData;
      MockAuthService.changePassword.mockResolvedValue({ message: 'Password updated successfully' });

      await AuthController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockAuthService.changePassword).toHaveBeenCalledWith('user-123', 'oldPassword', 'newPassword123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'Password updated successfully',
      });
    });

    it('should return 400 if passwords are missing', async () => {
      (mockReq as AuthenticatedRequest).user = { id: 'user-123' } as any;
      mockReq.body = {
        currentPassword: 'oldPassword',
        // missing newPassword
      };

      await AuthController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'Current password and new password are required',
          statusCode: 400,
        },
      });
    });

    it('should return 400 if new password is too short', async () => {
      (mockReq as AuthenticatedRequest).user = { id: 'user-123' } as any;
      mockReq.body = {
        currentPassword: 'oldPassword',
        newPassword: '123', // too short
      };

      await AuthController.changePassword(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'New password must be at least 6 characters long',
          statusCode: 400,
        },
      });
    });
  });

  describe('deactivateUser', () => {
    it('should successfully deactivate user', async () => {
      (mockReq as AuthenticatedRequest).user = { id: 'admin-123' } as any;
      mockReq.params = { userId: 'user-123' };
      MockAuthService.deactivateUser.mockResolvedValue({ message: 'User deactivated successfully' });

      await AuthController.deactivateUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockAuthService.deactivateUser).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User deactivated successfully',
      });
    });

    it('should return 400 if userId is missing', async () => {
      (mockReq as AuthenticatedRequest).user = { id: 'admin-123' } as any;
      mockReq.params = {};

      await AuthController.deactivateUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: {
          message: 'User ID is required',
          statusCode: 400,
        },
      });
    });
  });

  describe('reactivateUser', () => {
    it('should successfully reactivate user', async () => {
      (mockReq as AuthenticatedRequest).user = { id: 'admin-123' } as any;
      mockReq.params = { userId: 'user-123' };
      MockAuthService.reactivateUser.mockResolvedValue({ message: 'User reactivated successfully' });

      await AuthController.reactivateUser(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(MockAuthService.reactivateUser).toHaveBeenCalledWith('user-123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        message: 'User reactivated successfully',
      });
    });
  });
});