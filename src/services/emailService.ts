import nodemailer from 'nodemailer';
import { UserRole } from '../models';
import { QRCodeData } from './qrCodeService';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface PrescriptionEmailData {
  patientName: string;
  patientEmail: string;
  prescriptionNumber: string;
  patientNationalId: string;
  doctorName: string;
  diagnosis?: string;
  medicines: Array<{
    name: string;
    dosage: string;
    frequency: string;
    quantity: number;
    instructions?: string;
  }>;
  qrCodeImage: string; // Base64 encoded QR code
  qrHash: string;
  expiresAt: string;
}

export interface WelcomeEmailData {
  userName: string;
  userEmail: string;
  userRole: UserRole;
  loginUrl: string;
}

export interface OTPEmailData {
  patientName: string;
  patientEmail: string;
  otpCode: string;
  expiresAt: Date;
}

export interface PasswordResetOTPEmailData {
  userName: string;
  userEmail: string;
  otpCode: string;
  expiresAt: Date;
}

export class EmailService {
  private static transporter: nodemailer.Transporter | null = null;

  /**
   * Initialize email transporter
   */
  private static async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const config: EmailConfig = {
      host: process.env['SMTP_HOST'] || 'smtp.gmail.com',
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'] || '',
        pass: process.env['SMTP_PASS'] || ''
      }
    };

    this.transporter = nodemailer.createTransport(config);

    // Verify connection
    try {
      if (this.transporter) {
        await this.transporter.verify();
        console.log('✅ Email service configured successfully');
      }
    } catch (error) {
      console.error('❌ Email service configuration failed:', error);
      throw new Error('Email service configuration failed');
    }

    return this.transporter!;
  }

  /**
   * Send prescription email with QR code
   */
  static async sendPrescriptionEmail(data: PrescriptionEmailData): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = this.generatePrescriptionEmailHTML(data);
      const textContent = this.generatePrescriptionEmailText(data);

      const mailOptions = {
        from: `"MedConnect Prescriptions" <${process.env['SMTP_USER']}>`,
        to: data.patientEmail,
        subject: `Your Prescription - ${data.prescriptionNumber}`,
        text: textContent,
        html: htmlContent,
        attachments: [
          {
            filename: `prescription-${data.prescriptionNumber}-qr.png`,
            content: data.qrCodeImage.split(',')[1], // Remove data:image/png;base64, prefix
            encoding: 'base64',
            cid: 'qr-code' // Content ID for embedding in HTML
          }
        ]
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Prescription email sent successfully:', result.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send prescription email:', error);
      throw new Error(`Failed to send prescription email: ${error.message}`);
    }
  }

  /**
   * Send welcome email to new users
   */
  static async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = this.generateWelcomeEmailHTML(data);
      const textContent = this.generateWelcomeEmailText(data);

      const mailOptions = {
        from: `"MedConnect Team" <${process.env['SMTP_USER']}>`,
        to: data.userEmail,
        subject: `Welcome to MedConnect - ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)} Account`,
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully:', result.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send welcome email:', error);
      throw new Error(`Failed to send welcome email: ${error.message}`);
    }
  }

  /**
   * Send OTP email for medical history access
   */
  static async sendOTPEmail(data: OTPEmailData): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = this.generateOTPEmailHTML(data);
      const textContent = this.generateOTPEmailText(data);

      const mailOptions = {
        from: `"MedConnect Security" <${process.env['SMTP_USER']}>`,
        to: data.patientEmail,
        subject: 'Medical History Access - OTP Verification',
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ OTP email sent successfully:', result.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send OTP email:', error);
      throw new Error(`Failed to send OTP email: ${error.message}`);
    }
  }

  /**
   * Send password reset OTP email
   */
  static async sendPasswordResetOTPEmail(data: PasswordResetOTPEmailData): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const htmlContent = this.generatePasswordResetOTPEmailHTML(data);
      const textContent = this.generatePasswordResetOTPEmailText(data);

      const mailOptions = {
        from: `"MedConnect Security" <${process.env['SMTP_USER']}>`,
        to: data.userEmail,
        subject: 'Password Reset - OTP Verification',
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset OTP email sent successfully:', result.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send password reset OTP email:', error);
      throw new Error(`Failed to send password reset OTP email: ${error.message}`);
    }
  }

  /**
   * Send password reset email (legacy method with token)
   */
  static async sendPasswordResetEmail(userEmail: string, resetToken: string, userName: string): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();

      const resetUrl = `${process.env['FRONTEND_URL'] || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>You requested a password reset for your MedConnect account.</p>
          <p>Click the button below to reset your password:</p>
          <a href="${resetUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>MedConnect Team</p>
        </div>
      `;

      const textContent = `
        Password Reset Request
        
        Hello ${userName},
        
        You requested a password reset for your MedConnect account.
        
        Click the link below to reset your password:
        ${resetUrl}
        
        This link will expire in 1 hour.
        
        If you didn't request this reset, please ignore this email.
        
        Best regards,
        MedConnect Team
      `;

      const mailOptions = {
        from: `"MedConnect Security" <${process.env['SMTP_USER']}>`,
        to: userEmail,
        subject: 'Password Reset Request - MedConnect',
        text: textContent,
        html: htmlContent
      };

      const result = await transporter.sendMail(mailOptions);
      console.log('✅ Password reset email sent successfully:', result.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send password reset email:', error);
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  /**
   * Generate HTML content for prescription email
   */
  private static generatePrescriptionEmailHTML(data: PrescriptionEmailData): string {
    const medicinesList = data.medicines.map(medicine => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #000000;">${medicine.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #000000;">${medicine.dosage}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #000000;">${medicine.frequency}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #000000;">${medicine.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; color: #000000;">${medicine.instructions || 'As directed'}</td>
      </tr>
    `).join('');

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">MedConnect Prescription</h1>
          <p style="margin: 5px 0 0 0;">Digital Prescription System</p>
        </div>
        
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #2c3e50;">Hello ${data.patientName},</h2>
          <p style="color: #000000;">Your prescription has been created and is ready for pickup at any participating pharmacy.</p>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Prescription Details</h3>
            <p style="color: #000000;"><strong>Prescription Number:</strong> ${data.prescriptionNumber}</p>
            <p style="color: #000000;"><strong>Doctor:</strong> ${data.doctorName}</p>
            ${data.diagnosis ? `<p style="color: #000000;"><strong>Diagnosis:</strong> ${data.diagnosis}</p>` : ''}
            <p style="color: #000000;"><strong>Valid Until:</strong> ${new Date(data.expiresAt).toLocaleDateString()}</p>
          </div>

          <h3 style="color: #2c3e50;">Medications</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 10px 0;">
            <thead>
              <tr style="background-color: #34495e; color: white;">
                <th style="padding: 10px; text-align: left;">Medicine</th>
                <th style="padding: 10px; text-align: left;">Dosage</th>
                <th style="padding: 10px; text-align: left;">Frequency</th>
                <th style="padding: 10px; text-align: left;">Quantity</th>
                <th style="padding: 10px; text-align: left;">Instructions</th>
              </tr>
            </thead>
            <tbody>
              ${medicinesList}
            </tbody>
          </table>

          <div style="text-align: center; margin: 30px 0;">
            <h3 style="color: #2c3e50;">QR Code for Pharmacy</h3>
            <p style="color: #000000;">Show this QR code to the pharmacist to retrieve your prescription:</p>
            <img src="cid:qr-code" alt="Prescription QR Code" style="max-width: 200px; border: 2px solid #bdc3c7; border-radius: 5px;">
            <p style="font-size: 12px; color: #7f8c8d; margin-top: 10px;">
              QR Code expires on ${new Date(data.expiresAt).toLocaleDateString()}
            </p>
          </div>

          <div style="text-align: center; margin: 20px 0;">
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; display: inline-block;">
              <p style="color: #6c757d; margin: 0;"><strong>National ID:</strong> ${data.patientNationalId}</p>
            </div>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #27ae60;">Important Instructions</h4>
            <ul style="margin: 0; padding-left: 20px; color: #000000;">
              <li>Present this QR code at any participating pharmacy</li>
              <li>Bring a valid ID for verification</li>
              <li>Keep this email for your records</li>
              <li>Contact your doctor if you have any questions about your medication</li>
            </ul>
          </div>

          <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message from MedConnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate text content for prescription email
   */
  private static generatePrescriptionEmailText(data: PrescriptionEmailData): string {
    const medicinesList = data.medicines.map(medicine => 
      `- ${medicine.name}: ${medicine.dosage}, ${medicine.frequency}, Qty: ${medicine.quantity}${medicine.instructions ? ` (${medicine.instructions})` : ''}`
    ).join('\n');

    return `
MedConnect Prescription

Hello ${data.patientName},

Your prescription has been created and is ready for pickup at any participating pharmacy.

PRESCRIPTION DETAILS:
- Prescription Number: ${data.prescriptionNumber}
- Doctor: ${data.doctorName}
${data.diagnosis ? `- Diagnosis: ${data.diagnosis}` : ''}
- Valid Until: ${new Date(data.expiresAt).toLocaleDateString()}

MEDICATIONS:
${medicinesList}

PHARMACY INSTRUCTIONS:
- Show the QR code in this email to the pharmacist
- Bring a valid ID for verification
- Keep this email for your records
- Contact your doctor if you have any questions

QR Code expires on: ${new Date(data.expiresAt).toLocaleDateString()}

National ID: ${data.patientNationalId}

This is an automated message from MedConnect. Please do not reply to this email.
    `.trim();
  }

  /**
   * Generate HTML content for welcome email
   */
  private static generateWelcomeEmailHTML(data: WelcomeEmailData): string {
    const roleSpecificMessage = this.getRoleSpecificWelcomeMessage(data.userRole);

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Welcome to MedConnect</h1>
          <p style="margin: 5px 0 0 0;">Digital Prescription & Patient Records System</p>
        </div>
        
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #2c3e50;">Hello ${data.userName},</h2>
          <p>Welcome to MedConnect! Your ${data.userRole} account has been successfully created.</p>
          
          <div style="background-color: #ecf0f1; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2c3e50;">Account Information</h3>
            <p><strong>Email:</strong> ${data.userEmail}</p>
            <p><strong>Role:</strong> ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}</p>
            <p><strong>Login URL:</strong> <a href="${data.loginUrl}">${data.loginUrl}</a></p>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #27ae60;">Getting Started</h4>
            ${roleSpecificMessage}
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.loginUrl}" style="background-color: #3498db; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Login to MedConnect</a>
          </div>

          <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated message from MedConnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate text content for welcome email
   */
  private static generateWelcomeEmailText(data: WelcomeEmailData): string {
    const roleSpecificMessage = this.getRoleSpecificWelcomeMessage(data.userRole);

    return `
Welcome to MedConnect

Hello ${data.userName},

Welcome to MedConnect! Your ${data.userRole} account has been successfully created.

ACCOUNT INFORMATION:
- Email: ${data.userEmail}
- Role: ${data.userRole.charAt(0).toUpperCase() + data.userRole.slice(1)}
- Login URL: ${data.loginUrl}

GETTING STARTED:
${roleSpecificMessage}

Login to your account: ${data.loginUrl}

This is an automated message from MedConnect. Please do not reply to this email.
    `.trim();
  }

  /**
   * Generate HTML content for OTP email
   */
  private static generateOTPEmailHTML(data: OTPEmailData): string {
    const expiryTime = data.expiresAt.toLocaleString();
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">MedConnect Security</h1>
          <p style="margin: 5px 0 0 0;">Medical History Access Verification</p>
        </div>
        
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #2c3e50;">Hello ${data.patientName},</h2>
          <p style="color: #000000;">You have requested access to your medical history. Please use the OTP code below to verify your identity:</p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #2c3e50;">Your OTP Code</h3>
            <div style="background-color: #2c3e50; color: white; font-size: 32px; font-weight: bold; padding: 15px; border-radius: 5px; letter-spacing: 5px; display: inline-block; margin: 10px 0;">
              ${data.otpCode}
            </div>
            <p style="color: #7f8c8d; font-size: 14px; margin: 10px 0 0 0;">
              This code will expire at ${expiryTime}
            </p>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #27ae60;">Security Information</h4>
            <ul style="margin: 0; padding-left: 20px; color: #000000;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Use this code only for medical history access</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this access, please contact support immediately</li>
            </ul>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Important</h4>
            <p style="margin: 0; color: #856404;">
              For your security, this OTP can only be used once. After successful verification, 
              you will be able to access your medical history for the current session.
            </p>
          </div>

          <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated security message from MedConnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate text content for OTP email
   */
  private static generateOTPEmailText(data: OTPEmailData): string {
    const expiryTime = data.expiresAt.toLocaleString();
    
    return `
MedConnect Security - Medical History Access Verification

Hello ${data.patientName},

You have requested access to your medical history. Please use the OTP code below to verify your identity:

YOUR OTP CODE: ${data.otpCode}

This code will expire at ${expiryTime}

SECURITY INFORMATION:
- This OTP is valid for 10 minutes only
- Use this code only for medical history access
- Do not share this code with anyone
- If you didn't request this access, please contact support immediately

IMPORTANT:
For your security, this OTP can only be used once. After successful verification, 
you will be able to access your medical history for the current session.

This is an automated security message from MedConnect. Please do not reply to this email.
    `.trim();
  }

  /**
   * Generate HTML content for password reset OTP email
   */
  private static generatePasswordResetOTPEmailHTML(data: PasswordResetOTPEmailData): string {
    const expiryTime = data.expiresAt.toLocaleString();
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
        <div style="background-color: #2c3e50; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">MedConnect Security</h1>
          <p style="margin: 5px 0 0 0;">Password Reset Verification</p>
        </div>
        
        <div style="padding: 20px; background-color: white;">
          <h2 style="color: #2c3e50;">Hello ${data.userName},</h2>
          <p style="color: #000000;">You have requested to reset your password for your MedConnect account. Please use the OTP code below to verify your identity:</p>
          
          <div style="background-color: #ecf0f1; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <h3 style="margin-top: 0; color: #2c3e50;">Your Password Reset OTP</h3>
            <div style="background-color: #2c3e50; color: white; font-size: 32px; font-weight: bold; padding: 15px; border-radius: 5px; letter-spacing: 5px; display: inline-block; margin: 10px 0;">
              ${data.otpCode}
            </div>
            <p style="color: #7f8c8d; font-size: 14px; margin: 10px 0 0 0;">
              This code will expire at ${expiryTime}
            </p>
          </div>

          <div style="background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h4 style="margin-top: 0; color: #27ae60;">Security Information</h4>
            <ul style="margin: 0; padding-left: 20px; color: #000000;">
              <li>This OTP is valid for 10 minutes only</li>
              <li>Use this code only for password reset</li>
              <li>Do not share this code with anyone</li>
              <li>If you didn't request this password reset, please contact support immediately</li>
            </ul>
          </div>

          <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h4 style="margin-top: 0; color: #856404;">Important</h4>
            <p style="margin: 0; color: #856404;">
              For your security, this OTP can only be used once. After successful verification, 
              you will be able to set a new password for your account.
            </p>
          </div>

          <p style="color: #7f8c8d; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated security message from MedConnect. Please do not reply to this email.
          </p>
        </div>
      </div>
    `;
  }

  /**
   * Generate text content for password reset OTP email
   */
  private static generatePasswordResetOTPEmailText(data: PasswordResetOTPEmailData): string {
    const expiryTime = data.expiresAt.toLocaleString();
    
    return `
MedConnect Security - Password Reset Verification

Hello ${data.userName},

You have requested to reset your password for your MedConnect account. Please use the OTP code below to verify your identity:

YOUR PASSWORD RESET OTP: ${data.otpCode}

This code will expire at ${expiryTime}

SECURITY INFORMATION:
- This OTP is valid for 10 minutes only
- Use this code only for password reset
- Do not share this code with anyone
- If you didn't request this password reset, please contact support immediately

IMPORTANT:
For your security, this OTP can only be used once. After successful verification, 
you will be able to set a new password for your account.

This is an automated security message from MedConnect. Please do not reply to this email.
    `.trim();
  }

  /**
   * Get role-specific welcome message
   */
  private static getRoleSpecificWelcomeMessage(role: UserRole): string {
    switch (role) {
      case UserRole.PATIENT:
        return `
          <ul style="margin: 0; padding-left: 20px;">
            <li>View your medical history and prescriptions</li>
            <li>Access your QR codes for pharmacy visits</li>
            <li>Update your personal information and emergency contacts</li>
            <li>Receive email notifications for new prescriptions</li>
          </ul>
        `;
      case UserRole.DOCTOR:
        return `
          <ul style="margin: 0; padding-left: 20px;">
            <li>Register and manage patients</li>
            <li>Create medical visits and prescriptions</li>
            <li>Generate QR codes for prescriptions</li>
            <li>View patient medical history</li>
          </ul>
        `;
      case UserRole.PHARMACIST:
        return `
          <ul style="margin: 0; padding-left: 20px;">
            <li>Scan QR codes to retrieve prescriptions</li>
            <li>Dispense medications and update prescription status</li>
            <li>View prescription details and patient information</li>
            <li>Track prescription fulfillment</li>
          </ul>
        `;
      case UserRole.ADMIN:
        return `
          <ul style="margin: 0; padding-left: 20px;">
            <li>Manage users and system settings</li>
            <li>Monitor system activity and logs</li>
            <li>Access all system features</li>
            <li>Manage user roles and permissions</li>
          </ul>
        `;
      default:
        return `
          <ul style="margin: 0; padding-left: 20px;">
            <li>Access your account features</li>
            <li>Contact support if you need assistance</li>
          </ul>
        `;
    }
  }
}
