import { Request, Response } from 'express';
import { PatientService } from '../services/patientService';
import { OTPService } from '../services/otpService';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../models';
import { PatientRegistrationData, MedicalVisitData, PrescriptionData } from '../types';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { 
  patientRegistrationSchema, 
  patientUpdateSchema, 
  medicalVisitSchema, 
  prescriptionSchema, 
  searchQuerySchema, 
  paginationSchema,
  medicalHistoryPaginationSchema,
  patientIdParamSchema,
} from '../validation/schemas';

export class PatientController {

  // Get all patients (doctor-only)
static async getAllPatients (req: Request, res: Response) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const patients = await PatientService.getAllPatients(limitNum, offset);

    res.status(200).json({
      success: true,
      data: patients.patients,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: patients.total,
        totalPages: Math.ceil(patients.total / limitNum),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        statusCode: 500,
      },
    });
  }
}

  // Patient registration
  static async registerPatient (req: Request, res: Response) {
    try {
      const data: PatientRegistrationData = req.body;

      // Basic validation
      if (!data.email || !data.password || !data.fullName || !data.dateOfBirth || !data.gender || !data.emergencyContact || !data.emergencyPhone) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Email, password, full name, date of birth, gender, emergency contact, and emergency phone are required',
            statusCode: 400,
          },
        });
      }

      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid email format',
            statusCode: 400,
          },
        });
      }

      // Password strength validation
      if (data.password.length < 6) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Password must be at least 6 characters long',
            statusCode: 400,
          },
        });
      }

      // Date validation
      const birthDate = new Date(data.dateOfBirth);
      if (isNaN(birthDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid date of birth format',
            statusCode: 400,
          },
        });
      }

      const patient = await PatientService.registerPatient(data);

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: patient,
      });
    } catch (error: any) {
      console.error('Patient registration error:', error);
      
      // Handle specific database constraint errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        const constraintErrors = error.errors || [];
        
        for (const constraintError of constraintErrors) {
          if (constraintError.path === 'email') {
            return res.status(409).json({
              success: false,
              error: {
                message: 'This email address is already registered. Please use a different email.',
                statusCode: 409,
                field: 'email',
                code: 'EMAIL_EXISTS'
              },
            });
          }
          if (constraintError.path === 'insurance_number') {
            return res.status(409).json({
              success: false,
              error: {
                message: 'This insurance number is already registered. Please use a different insurance number.',
                statusCode: 409,
                field: 'insuranceNumber',
                code: 'INSURANCE_NUMBER_EXISTS'
              },
            });
          }
        }
        
        return res.status(409).json({
          success: false,
          error: {
            message: 'A record with this information already exists. Please check your details and try again.',
            statusCode: 409,
            code: 'DUPLICATE_RECORD'
          },
        });
      }
      
      // Handle validation errors
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors || [];
        const fieldErrors = validationErrors.map((err: any) => ({
          field: err.path,
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed. Please check your input data.',
            statusCode: 400,
            code: 'VALIDATION_ERROR',
            details: fieldErrors
          },
        });
      }
      
      // Handle other errors
      res.status(500).json({
        success: false,
        error: {
          message: error.message || 'Patient registration failed. Please try again later.',
          statusCode: 500,
          code: 'INTERNAL_ERROR'
        },
      });
    }
  }

  // Get patient by National ID (cross-hospital lookup)
  static async getPatientByNationalId (req: Request, res: Response) {
    try {
      const { nationalId } = req.params;

      if (!nationalId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'National ID is required',
            statusCode: 400,
          },
        });
      }

      const patient = await PatientService.getPatientByNationalId(nationalId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Patient not found',
            statusCode: 404,
          },
        });
      }

      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 500,
        },
      });
    }
  }

  // Get patient by ID
  static async getPatientById (req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Patient ID is required',
            statusCode: 400,
          },
        });
      }

      const patient = await PatientService.getPatientById(patientId);

      if (!patient) {
        return res.status(404).json({
          success: false,
          error: {
            message: 'Patient not found',
            statusCode: 404,
          },
        });
      }

      res.status(200).json({
        success: true,
        data: patient,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 500,
        },
      });
    }
  }

  // Update patient profile
  static async updatePatient (req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const updateData = req.body;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Patient ID is required',
            statusCode: 400,
          },
        });
      }

      const allowedFields = ['fullName', 'dateOfBirth', 'gender', 'insuranceProvider', 'insuranceNumber', 'allergies', 'existingConditions', 'emergencyContact', 'emergencyPhone', 'phone'];
      const filteredData: any = {};

      // Only allow specific fields to be updated
      allowedFields.forEach(field => {
        if (updateData[field] !== undefined) {
          filteredData[field] = updateData[field];
        }
      });

      if (Object.keys(filteredData).length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'No valid fields to update',
            statusCode: 400,
          },
        });
      }

      const updatedPatient = await PatientService.updatePatient(patientId, filteredData);

      res.status(200).json({
        success: true,
        message: 'Patient updated successfully',
        data: updatedPatient,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 400,
        },
      });
    }
  }

  // Create medical visit
  static async createMedicalVisit (req: Request, res: Response) {
    try {
      const data: MedicalVisitData = req.body;
      const patientId = req.params.patientId;

      // Basic validation with specific field checking
      const missingFields = [];
      if (!patientId) missingFields.push('patientId');
      if (!data.doctorId) missingFields.push('doctorId');
      if (!data.visitDate) missingFields.push('visitDate');
      if (!data.visitType) missingFields.push('visitType');
      if (!data.chiefComplaint) missingFields.push('chiefComplaint');

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Missing required fields: ${missingFields.join(', ')}`,
            statusCode: 400,
            missingFields: missingFields,
          },
        });
      }

      // Date validation
      const visitDate = new Date(data.visitDate);
      if (isNaN(visitDate.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Invalid visit date format',
            statusCode: 400,
          },
        });
      }

      // Visit type validation
      const validVisitTypes = ['consultation', 'emergency', 'followup'];
      if (!validVisitTypes.includes(data.visitType)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid visit type. Must be one of: ${validVisitTypes.join(', ')}`,
            statusCode: 400,
          },
        });
      }

      const visit = await PatientService.createMedicalVisit({
        ...data,
        patientId: patientId,
      });

      // Format the response to match the expected structure
      const visitData = visit as any; // Type assertion for the included data
      const formattedVisit = {
        id: visitData.id,
        visitDate: visitData.visitDate,
        visitType: visitData.visitType,
        chiefComplaint: visitData.chiefComplaint,
        symptoms: visitData.symptoms,
        diagnosis: visitData.diagnosis,
        treatmentNotes: visitData.treatmentNotes,
        recommendations: visitData.recommendations,
        doctor: {
          fullName: visitData.doctor?.user?.fullName || visitData.doctor?.fullName,
          email: visitData.doctor?.user?.email || visitData.doctor?.email,
          phone: visitData.doctor?.user?.phone || visitData.doctor?.phone,
          specialization: visitData.doctor?.specialization,
          hospitalName: visitData.doctor?.hospitalName
        },
        patient: {
          id: visitData.patient?.id,
          fullName: visitData.patient?.user?.fullName || visitData.patient?.fullName,
          email: visitData.patient?.user?.email || visitData.patient?.email,
          insuranceProvider: visitData.patient?.insuranceProvider,
          insuranceNumber: visitData.patient?.insuranceNumber
        },
        createdAt: visitData.createdAt
      };

      res.status(201).json({
        success: true,
        message: 'Medical visit created successfully',
        data: formattedVisit,
      });
    } catch (error: any) {
      console.error('Medical visit creation error:', error);
      res.status(400).json({
        success: false,
        error: {
          message: error.message || 'Medical visit creation failed',
          statusCode: 400,
        },
      });
    }
  }

  // Get patient medical history
  static async getPatientMedicalHistory (req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const user = (req as any).user; // Get authenticated user

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Patient ID is required',
            statusCode: 400,
          },
        });
      }

      // Security check: Patients can only view their own medical history
      // Note: OTP verification is handled by middleware for PATIENT role
      if (user.role === UserRole.PATIENT) {
        // Find the patient record for this user
        const patient = await PatientService.getPatientByUserId(user.id);
        if (!patient || patient.id !== patientId) {
          return res.status(403).json({
            success: false,
            error: {
              message: 'Access denied: You can only view your own medical history',
              statusCode: 403,
            },
          });
        }
      }

      const { page = 1, limit = 10, type = 'all', sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const history = await PatientService.getPatientMedicalHistory(
        patientId, 
        pageNum, 
        limitNum, 
        type as 'visits' | 'prescriptions' | 'all',
        sortBy as string,
        sortOrder as 'ASC' | 'DESC'
      );

      res.status(200).json({
        success: true,
        data: {
          visits: history.visits,
          prescriptions: history.prescriptions,
        },
        pagination: history.pagination,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 500,
        },
      });
    }
  }

  // Create prescription
  static async createPrescription (req: Request, res: Response) {
    try {
      const data: PrescriptionData = req.body;
      const patientId = req.params.patientId;

      // Basic validation
      if (!patientId || !data.doctorId || !data.visitId || !data.diagnosis || !data.items || data.items.length === 0) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Patient ID, doctor ID, visit ID, diagnosis, and prescription items are required',
            statusCode: 400,
          },
        });
      }

      // Validate prescription items
      for (const item of data.items) {
        if (!item.medicineName || !item.dosage || !item.frequency || !item.quantity) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Each prescription item must have medicine name, dosage, frequency, and quantity',
              statusCode: 400,
            },
          });
        }
      }

      const prescription = await PatientService.createPrescription({
        ...data,
        patientId: patientId,
      });

      // Format the response to match the expected structure
      const prescriptionData = prescription as any; // Type assertion for the included data
      const formattedPrescription = {
        id: prescriptionData.id,
        prescriptionNumber: prescriptionData.prescriptionNumber,
        diagnosis: prescriptionData.diagnosis,
        doctorNotes: prescriptionData.doctorNotes,
        status: prescriptionData.status,
        qrCodeHash: prescriptionData.qrCodeHash,
        items: prescriptionData.items?.map((item: any) => ({
          id: item.id,
          medicineName: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          quantity: item.quantity,
          instructions: item.instructions
        })) || [],
        doctor: {
          fullName: prescriptionData.doctor?.user?.fullName || prescriptionData.doctor?.fullName,
          email: prescriptionData.doctor?.user?.email || prescriptionData.doctor?.email,
          phone: prescriptionData.doctor?.user?.phone || prescriptionData.doctor?.phone,
          specialization: prescriptionData.doctor?.specialization,
          hospitalName: prescriptionData.doctor?.hospitalName
        },
        patient: {
          id: prescriptionData.patient?.id,
          fullName: prescriptionData.patient?.user?.fullName || prescriptionData.patient?.fullName,
          email: prescriptionData.patient?.user?.email || prescriptionData.patient?.email,
          insuranceProvider: prescriptionData.patient?.insuranceProvider,
          insuranceNumber: prescriptionData.patient?.insuranceNumber
        },
        createdAt: prescriptionData.createdAt,
        updatedAt: prescriptionData.updatedAt
      };

      res.status(201).json({
        success: true,
        message: 'Prescription created successfully',
        data: formattedPrescription,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 400,
        },
      });
    }
  }

  // Get patient prescriptions
  static async getPatientPrescriptions (req: Request, res: Response) {
    try {
      const { patientId } = req.params;
      const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC' } = req.query;
      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Patient ID is required',
            statusCode: 400,
          },
        });
      }

      const result = await PatientService.getPatientPrescriptions(patientId, pageNum, limitNum, sortBy as string, sortOrder as 'ASC' | 'DESC');

      res.status(200).json({
        success: true,
        data: result.prescriptions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: result.total,
          totalPages: Math.ceil(result.total / limitNum),
          hasNextPage: pageNum < Math.ceil(result.total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 500,
        },
      });
    }
  }

  // Get all prescriptions (doctor and admin only)
static async getAllPrescriptions(req: Request, res: Response) {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'DESC', status } = req.query;
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const result = await PatientService.getAllPrescriptions(
      limitNum, 
      offset, 
      sortBy as string, 
      sortOrder as 'ASC' | 'DESC',
      status as string | undefined
    );

    res.status(200).json({
      success: true,
      data: result.prescriptions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: result.total,
        totalPages: Math.ceil(result.total / limitNum),
        hasNextPage: pageNum < Math.ceil(result.total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        message: error.message,
        statusCode: 500,
      },
    });
  }
}


  // Search patients
  static async searchPatients (req: Request, res: Response) {
    try {
      const { query } = req.query;

      if (!query || typeof query !== 'string') {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Search query is required',
            statusCode: 400,
          },
        });
      }

      const patients = await PatientService.searchPatients(query);

      res.status(200).json({
        success: true,
        data: patients,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          message: error.message,
          statusCode: 500,
        },
      });
    }
  }

  // Generate OTP for medical history access (handled by middleware)
  static async generateOTP (req: Request, res: Response) {
    // This method is handled by the generateOTPForPatient middleware
    // The middleware will send the response, so this method is not called
    res.status(500).json({
      success: false,
      error: {
        message: 'OTP generation should be handled by middleware',
        statusCode: 500,
      },
    });
  }
}
