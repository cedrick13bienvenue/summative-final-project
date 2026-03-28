import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole, TokenBlacklist } from '../models';
import Doctor from '../models/Doctor';
import Patient from '../models/Patient';
import { LoginCredentials, RegisterData, AuthResponse, UserProfile, ChangePasswordData, JwtPayload } from '../types';
import { OTPService } from './otpService';
import { sequelize } from '../database/config/database';

export class AuthService {
  // User registration
  static async register (data: RegisterData): Promise<AuthResponse> {
    // Use database transaction to ensure both user and profile are created together
    const transaction = await sequelize.transaction();
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ where: { email: data.email } });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password before creating user
      const tempUser = new User();
      const hashedPassword = await tempUser.hashPassword(data.password);

      // Create new user with hashed password within transaction
      const user = await User.create({
        email: data.email,
        passwordHash: hashedPassword,
        fullName: data.fullName,
        role: data.role,
        phone: data.phone,
        nationalId: data.nationalId,
        isActive: true,
      }, { transaction });

      // If registering as a doctor, create doctor profile within transaction
      if (data.role === UserRole.DOCTOR) {
        await Doctor.create({
          userId: user.id,
          isVerified: false, // Not verified initially
        }, { transaction });
      }

      // Commit the transaction if everything succeeds
      await transaction.commit();

      // Generate JWT token
      const token = this.generateToken(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          role: user.role,
          phone: user.phone,
        },
        token,
      };
    } catch (error: any) {
      // Rollback the transaction if anything fails
      await transaction.rollback();
      
      console.error('Error in register:', error);
      
      // Handle specific Sequelize errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors && error.errors[0] && error.errors[0].path === 'email') {
          throw new Error('Email already exists. Please use a different email address.');
        }
        throw new Error('A record with this information already exists.');
      }
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err: any) => err.message).join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      
      throw error; // Re-throw the original error if it's not a Sequelize error
    }
  }

  // User login
  static async login (credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user by email
    const user = await User.findOne({ where: { email: credentials.email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(credentials.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Generate JWT token
    const token = this.generateToken(user);

        // Fetch patient ID if user is a patient
    let patientId: string | undefined;
    if (user.role === UserRole.PATIENT) {
      const patient = await Patient.findOne({ where: { userId: user.id } });
      if (patient) {
        patientId = patient.id;
      }
    }


    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        ...(patientId && { patientId }),
      },
      token,
    };
  }

  // Generate JWT token
  private static generateToken (user: User): string {
    const secret = process.env['JWT_SECRET'];
    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    const expiresIn = process.env['JWT_EXPIRES_IN'] || '24h';

    return jwt.sign(payload, secret, { expiresIn: expiresIn as any });
  }

  // Get user profile
  static async getProfile (userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      phone: user.phone,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }


  // Change password
  static async changePassword (userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password and update
    const hashedPassword = await user.hashPassword(newPassword);
    await user.update({ passwordHash: hashedPassword });

    return { message: 'Password updated successfully' };
  }

  // Deactivate user (admin only)
  static async deactivateUser (userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: false });
    return { message: 'User deactivated successfully' };
  }

  // Reactivate user (admin only)
  static async reactivateUser (userId: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ isActive: true });
    return { message: 'User reactivated successfully' };
  }

  // User logout - blacklist token
  static async logout (token: string, userId: string) {
    try {
      // Decode token to get expiration time
      const secret = process.env['JWT_SECRET'];
      if (!secret) {
        throw new Error('JWT_SECRET not configured');
      }

      const decoded = jwt.verify(token, secret) as any;
      const expiresAt = new Date(decoded.exp * 1000); // Convert from seconds to milliseconds

      // Add token to blacklist
      await TokenBlacklist.blacklistToken(token, userId, expiresAt);

      return { message: 'Logout successful' };
    } catch (error: any) {
      // If token is invalid or expired, we still consider logout successful
      // as the token is effectively invalidated
      if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
        return { message: 'Logout successful' };
      }
      throw error;
    }
  }

  // Check if token is blacklisted
  static async isTokenBlacklisted (token: string): Promise<boolean> {
    try {
      return await TokenBlacklist.isTokenBlacklisted(token);
    } catch (error) {
      console.warn('Error checking token blacklist:', error);
      return false; // If blacklist check fails, assume token is not blacklisted
    }
  }

  // Clean up expired tokens from blacklist
  static async cleanupExpiredTokens (): Promise<void> {
    try {
      await TokenBlacklist.cleanupExpiredTokens();
    } catch (error) {
      console.warn('Error cleaning up expired tokens:', error);
    }
  }

  // Request password reset
  static async requestPasswordReset (email: string) {
    try {
      const result = await OTPService.generateAndSendPasswordResetOTP(email);
      
      if (!result.success) {
        throw new Error(result.message);
      }

      return {
        message: result.message,
        expiresAt: result.expiresAt,
      };
    } catch (error: any) {
      console.error('Error in requestPasswordReset:', error);
      throw error;
    }
  }

  // Reset password with OTP
  static async resetPassword (email: string, otpCode: string, newPassword: string) {
    try {
      // Verify OTP first
      const otpResult = await OTPService.verifyPasswordResetOTP(otpCode, email);
      
      if (!otpResult.isValid) {
        throw new Error(otpResult.message);
      }

      // Find user by email
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user is active
      if (!user.isActive) {
        throw new Error('Account is deactivated. Please contact support.');
      }

      // Hash new password and update
      const hashedPassword = await user.hashPassword(newPassword);
      await user.update({ passwordHash: hashedPassword });

      return { message: 'Password reset successfully' };
    } catch (error: any) {
      console.error('Error in resetPassword:', error);
      throw error;
    }
  }
}
