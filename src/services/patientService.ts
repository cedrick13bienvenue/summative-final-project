import { Patient, User, MedicalVisit, Prescription, PrescriptionItem, UserRole } from '../models';
import Doctor from '../models/Doctor';
import { VisitType } from '../models/MedicalVisit';
import { PrescriptionStatus } from '../models/Prescription';
import { QRCodeService } from './qrCodeService';
import { EmailService } from './emailService';
import { eventService } from './eventService';
import { sequelize } from '../database/config/database';
import { 
  PatientRegistrationData, 
  PatientProfile, 
  MedicalVisitData, 
  PrescriptionData, 
  PrescriptionItemData,
  MedicalHistory,
  MedicalVisitSummary,
  PrescriptionSummary,
  PrescriptionItemSummary,
  PatientListResponse
} from '../types';

export class PatientService {

  // Get all patients with pagination (doctor-only)
static async getAllPatients (limit: number = 10, offset: number = 0): Promise<{ patients: PatientProfile[], total: number }> {
  const { count, rows: patients } = await Patient.findAndCountAll({
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['phone', 'isActive'],
        where: { isActive: true },
      },
    ],
    limit,
    offset,
    order: [['createdAt', 'DESC']],
  });

  const patientProfiles = patients.map(patient => {
    const userData = (patient as any).user;
    return {
      id: patient.id,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      allergies: patient.allergies,
      existingConditions: patient.existingConditions,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      phone: userData?.phone,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    } as PatientProfile;
  });

  return {
    patients: patientProfiles,
    total: count,
  };
}

  // Patient registration
  static async registerPatient (data: PatientRegistrationData): Promise<PatientProfile> {
    // Use database transaction to ensure both user and patient are created together
    const transaction = await sequelize.transaction();

    try {
      // Hash password before creating user
      const tempUser = new User();
      const hashedPassword = await tempUser.hashPassword(data.password);

      // Create user account first within transaction
      const user = await User.create({
        email: data.email,
        passwordHash: hashedPassword,
        fullName: data.fullName,
        role: UserRole.PATIENT,
        phone: data.phone,
        nationalId: data.nationalId,
        isActive: true,
      }, { transaction });

      // Create patient profile within transaction
      const patient = await Patient.create({
        userId: user.id,
        fullName: data.fullName,
        dateOfBirth: new Date(data.dateOfBirth),
        gender: data.gender,
        insuranceProvider: data.insuranceProvider,
        insuranceNumber: data.insuranceNumber,
        allergies: data.allergies || [],
        existingConditions: data.existingConditions || [],
        emergencyContact: data.emergencyContact,
        emergencyPhone: data.emergencyPhone,
      }, { transaction });

      // Commit the transaction if everything succeeds
      await transaction.commit();

      return {
        id: patient.id,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        insuranceProvider: patient.insuranceProvider,
        insuranceNumber: patient.insuranceNumber,
        allergies: patient.allergies,
        existingConditions: patient.existingConditions,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        phone: data.phone,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      };
    } catch (error: any) {
      // Rollback the transaction if anything fails
      await transaction.rollback();
      
      console.error('Error in registerPatient:', error);
      
      // Handle specific Sequelize errors
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors && error.errors[0] && error.errors[0].path === 'email') {
          throw new Error('Email already exists. Please use a different email address.');
        }
        if (error.errors && error.errors[0] && error.errors[0].path === 'insurance_number') {
          throw new Error('Insurance number already exists. Please use a different insurance number.');
        }
        throw new Error('A record with this information already exists.');
      }
      
      if (error.name === 'SequelizeValidationError') {
        const validationErrors = error.errors.map((err: any) => err.message).join(', ');
        throw new Error(`Validation failed: ${validationErrors}`);
      }
      
      throw new Error(`Patient registration failed: ${error.message}`);
    }
  }

  // Get patient by National ID (cross-hospital lookup)
  static async getPatientByNationalId (nationalId: string): Promise<PatientProfile | null> {
    const patient = await Patient.findOne({
      include: [
        {
          model: User,
          as: 'user',
          where: { nationalId },
          attributes: ['phone', 'isActive', 'nationalId'],
        },
      ],
    });

    if (!patient) {
      return null;
    }

    const userData = (patient as any).user;
    if (!userData || !userData.isActive) {
      return null;
    }

    return {
      id: patient.id,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      nationalId: userData.nationalId,
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      allergies: patient.allergies,
      existingConditions: patient.existingConditions,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      phone: userData.phone,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  // Get patient by ID
  static async getPatientById (patientId: string): Promise<PatientProfile | null> {
    const patient = await Patient.findByPk(patientId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['phone', 'isActive'],
        },
      ],
    });

    if (!patient) {
      return null;
    }

    // Access the included user data using type assertion
    const userData = (patient as any).user;
    if (!userData || !userData.isActive) {
      return null;
    }

    return {
      id: patient.id,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      allergies: patient.allergies,
      existingConditions: patient.existingConditions,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      phone: userData.phone,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }

  // Update patient profile
  static async updatePatient (patientId: string, updateData: Partial<PatientProfile>): Promise<PatientProfile> {
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Filter out fields that shouldn't be updated directly
    const { phone, ...patientUpdateData } = updateData;

    // Update patient data
    await patient.update(patientUpdateData);

    // Update user data if needed
    if (phone) {
      await User.update(
        { phone },
        { where: { id: patient.userId } },
      );
    }

    return this.getPatientById(patientId) as Promise<PatientProfile>;
  }

  // Create medical visit
  static async createMedicalVisit (data: MedicalVisitData): Promise<MedicalVisit> {
    // Verify patient exists
    const patient = await Patient.findByPk(data.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify doctor exists - handle both doctor ID and user ID
    let doctor = await Doctor.findByPk(data.doctorId, {
      include: [{
        association: 'user',
        attributes: ['email', 'fullName', 'phone', 'nationalId']
      }]
    });
    
    // If not found by doctor ID, try to find by user ID
    if (!doctor) {
      // Find all doctors for this user and pick the one with specialization or the most recent one
      const doctors = await Doctor.findAll({
        where: { userId: data.doctorId },
        include: [{
          association: 'user',
          attributes: ['email', 'fullName', 'phone', 'nationalId']
        }],
        order: [
          ['specialization', 'DESC NULLS LAST'], // Prefer doctors with specialization
          ['createdAt', 'DESC'] // Then by most recent
        ]
      });
      
      doctor = doctors[0]; // Take the first one (best match)
    }
    
    if (!doctor) {
      throw new Error('Doctor not found');
    }


    const visit = await MedicalVisit.create({
      patientId: data.patientId,
      doctorId: doctor.id, // Use the actual doctor ID, not the input
      visitDate: data.visitDate,
      visitType: data.visitType,
      chiefComplaint: data.chiefComplaint,
      symptoms: data.symptoms,
      diagnosis: data.diagnosis,
      treatmentNotes: data.treatmentNotes,
      recommendations: data.recommendations,
    });


    // If hospitalName is provided, update the doctor's hospitalName
    if (data.hospitalName) {
      await doctor.update({ hospitalName: data.hospitalName });
    }

    // Return visit with enhanced doctor and patient information
    const visitWithDoctor = await MedicalVisit.findByPk(visit.id, {
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: User,
            as: 'user',
            attributes: ['email', 'fullName', 'phone', 'nationalId']
          }]
        },
        {
          model: Patient,
          as: 'patient',
          include: [{
            model: User,
            as: 'user',
            attributes: ['email', 'fullName']
          }]
        }
      ]
    });


    if (!visitWithDoctor) {
      throw new Error('Failed to retrieve medical visit');
    }

    return visitWithDoctor;
  }

  // Get patient medical history with pagination
  static async getPatientMedicalHistory (patientId: string, page: number = 1, limit: number = 10, type: 'visits' | 'prescriptions' | 'all' = 'all', sortBy: string = 'createdAt', sortOrder: 'ASC' | 'DESC' = 'DESC'): Promise<{ visits?: any[], prescriptions?: any[], total: number, pagination: any }> {
    const offset = (page - 1) * limit;
    let visits: any[] = [];
    let prescriptions: any[] = [];
    let total = 0;

    if (type === 'visits' || type === 'all') {
      const visitsResult = await MedicalVisit.findAndCountAll({
      where: { patientId },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: User,
            as: 'user',
            attributes: ['fullName', 'email']
          }]
        },
      ],
        order: [[sortBy === 'visitDate' ? 'visitDate' : 'createdAt', sortOrder]],
        limit: type === 'visits' ? limit : undefined,
        offset: type === 'visits' ? offset : undefined,
      });

      visits = visitsResult.rows.map(visit => ({
        id: visit.id,
        visitDate: visit.visitDate,
        visitType: visit.visitType,
        chiefComplaint: visit.chiefComplaint,
        symptoms: visit.symptoms,
        diagnosis: visit.diagnosis,
        treatmentNotes: visit.treatmentNotes,
        recommendations: visit.recommendations,
        doctor: (visit as any).doctor,
        createdAt: visit.createdAt,
      }));

      if (type === 'visits') {
        total = visitsResult.count;
      }
    }

    if (type === 'prescriptions' || type === 'all') {
      const prescriptionsResult = await Prescription.findAndCountAll({
      where: { patientId },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: User,
            as: 'user',
            attributes: ['fullName', 'email']
          }]
        },
        {
          model: PrescriptionItem,
          as: 'items',
        },
      ],
        order: [[sortBy === 'prescriptionNumber' ? 'prescriptionNumber' : 'createdAt', sortOrder]],
        limit: type === 'prescriptions' ? limit : undefined,
        offset: type === 'prescriptions' ? offset : undefined,
      });

      prescriptions = prescriptionsResult.rows.map(prescription => ({
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        diagnosis: prescription.diagnosis,
        doctorNotes: prescription.doctorNotes,
        status: prescription.status,
        items: (prescription as any).items,
        doctor: (prescription as any).doctor,
        createdAt: prescription.createdAt,
      }));

      if (type === 'prescriptions') {
        total = prescriptionsResult.count;
      }
    }

    if (type === 'all') {
      // For 'all' type, we need to get the total count of both visits and prescriptions
      const [visitsCount, prescriptionsCount] = await Promise.all([
        MedicalVisit.count({ where: { patientId } }),
        Prescription.count({ where: { patientId } })
      ]);
      total = visitsCount + prescriptionsCount;
    }

    return {
      visits: type === 'visits' || type === 'all' ? visits : undefined,
      prescriptions: type === 'prescriptions' || type === 'all' ? prescriptions : undefined,
      total,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  }

  // Create prescription
  static async createPrescription (data: PrescriptionData): Promise<Prescription> {
    // Verify patient exists
    const patient = await Patient.findByPk(data.patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Verify doctor exists - handle both doctor ID and user ID
    let doctor = await Doctor.findByPk(data.doctorId, {
      include: [{
        association: 'user',
        attributes: ['email', 'fullName', 'phone', 'nationalId']
      }]
    });
    
    // If not found by doctor ID, try to find by user ID
    if (!doctor) {
      // Find all doctors for this user and pick the one with specialization or the most recent one
      const doctors = await Doctor.findAll({
        where: { userId: data.doctorId },
        include: [{
          association: 'user',
          attributes: ['email', 'fullName', 'phone', 'nationalId']
        }],
        order: [
          ['specialization', 'DESC NULLS LAST'], // Prefer doctors with specialization
          ['createdAt', 'DESC'] // Then by most recent
        ]
      });
      
      doctor = doctors[0]; // Take the first one (best match)
    }
    
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // Verify visit exists
    const visit = await MedicalVisit.findByPk(data.visitId);
    if (!visit) {
      throw new Error('Medical visit not found');
    }

    // Create prescription
    const prescription = await Prescription.create({
      prescriptionNumber: Prescription.generatePrescriptionNumber(), // Explicitly generate prescription number
      patientId: data.patientId,
      doctorId: doctor.id, // Use the actual doctor ID, not the input
      visitId: data.visitId,
      diagnosis: data.diagnosis,
      doctorNotes: data.doctorNotes,
      status: PrescriptionStatus.PENDING,
      qrCodeHash: `QR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Temporary placeholder
    });

    // If hospitalName is provided, update the doctor's hospitalName
    if (data.hospitalName) {
      await doctor.update({ hospitalName: data.hospitalName });
    }

    // Create prescription items
    for (const itemData of data.items) {
      await PrescriptionItem.create({
        prescriptionId: prescription.id,
        medicineName: itemData.medicineName,
        dosage: itemData.dosage,
        frequency: itemData.frequency,
        quantity: itemData.quantity,
        instructions: itemData.instructions || '',
      });
    }

    // Generate QR code for the prescription
    try {
      const qrResult = await QRCodeService.generateQRCode(prescription.id);
      
      // Update prescription with QR code hash
      await prescription.update({
        qrCodeHash: qrResult.qrHash
      });

      // Emit prescription created event for background email processing
      try {
        eventService.emitPrescriptionCreated({
          prescriptionId: prescription.id,
          patientId: data.patientId,
          doctorId: data.doctorId,
          prescriptionNumber: prescription.prescriptionNumber || '',
          qrCodeHash: qrResult.qrHash,
          qrCodeImage: qrResult.qrCodeImage,
          expiresAt: qrResult.expiresAt.toISOString()
        });
        console.log(`📧 Prescription created event emitted for prescription: ${prescription.id}`);
      } catch (eventError) {
        console.error('❌ Failed to emit prescription created event:', eventError);
        
        // Fallback: Send email directly if event system fails
        try {
          const patientWithUser = await Patient.findByPk(data.patientId, {
            include: [{ association: 'user' }]
          });

          if (patientWithUser && (patientWithUser as any).user) {
            const emailData = {
              patientName: (patientWithUser as any).user.fullName,
              patientEmail: (patientWithUser as any).user.email,
              prescriptionNumber: prescription.prescriptionNumber || '',
              patientNationalId: (patientWithUser as any).user?.nationalId || '',
              doctorName: (doctor as any).user.fullName,
              diagnosis: prescription.diagnosis,
              medicines: data.items.map(item => ({
                name: item.medicineName,
                dosage: item.dosage,
                frequency: item.frequency,
                quantity: item.quantity,
                instructions: item.instructions
              })),
              qrCodeImage: qrResult.qrCodeImage,
              qrHash: qrResult.qrHash,
              expiresAt: qrResult.expiresAt.toISOString()
            };

            await EmailService.sendPrescriptionEmail(emailData);
            console.log(`✅ Prescription email sent directly (fallback) to ${(patientWithUser as any).user.email}`);
          }
        } catch (emailError) {
          console.error('❌ Failed to send prescription email (fallback):', emailError);
          // Don't throw error - prescription is still created successfully
        }
      }
    } catch (qrError) {
      console.error('❌ Failed to generate QR code:', qrError);
      // Don't throw error - prescription is still created successfully
    }

    // Return prescription with enhanced doctor and patient information
    const prescriptionWithDoctor = await Prescription.findByPk(prescription.id, {
      include: [
        {
          model: Doctor,
          as: 'doctor',
          attributes: ['specialization', 'hospitalName'],
          include: [{
            model: User,
            as: 'user',
            attributes: ['email', 'fullName', 'phone', 'nationalId']
          }]
        },
        {
          model: Patient,
          as: 'patient',
          include: [{
            model: User,
            as: 'user',
            attributes: ['email', 'fullName']
          }]
        },
        {
          model: PrescriptionItem,
          as: 'items'
        }
      ]
    });

    if (!prescriptionWithDoctor) {
      throw new Error('Failed to retrieve prescription');
    }

    return prescriptionWithDoctor;
  }

  // Get patient prescriptions with pagination
  static async getPatientPrescriptions (patientId: string, page: number = 1, limit: number = 10, sortBy: string = 'createdAt', sortOrder: 'ASC' | 'DESC' = 'DESC'): Promise<{ prescriptions: any[], total: number }> {
    const offset = (page - 1) * limit;
    
    const { count, rows: prescriptions } = await Prescription.findAndCountAll({
      where: { patientId },
      include: [
        {
          model: Doctor,
          as: 'doctor',
          include: [{
            model: User,
            as: 'user',
            attributes: ['fullName', 'email']
          }]
        },
        {
          model: PrescriptionItem,
          as: 'items',
        },
      ],
      order: [[sortBy, sortOrder]],
      limit,
      offset,
    });

    const prescriptionData = prescriptions.map(prescription => ({
      id: prescription.id,
      prescriptionNumber: prescription.prescriptionNumber,
      diagnosis: prescription.diagnosis,
      doctorNotes: prescription.doctorNotes,
      status: prescription.status,
      items: (prescription as any).items,
      doctor: (prescription as any).doctor,
      createdAt: prescription.createdAt,
    }));

    return {
      prescriptions: prescriptionData,
      total: count,
    };
  }

  // Get all prescriptions with pagination (doctor and admin only)
static async getAllPrescriptions(
  limit: number = 10, 
  offset: number = 0, 
  sortBy: string = 'createdAt', 
  sortOrder: 'ASC' | 'DESC' = 'DESC',
  status?: string
): Promise<{ prescriptions: any[], total: number }> {
  const whereClause: any = {};
  
  // Filter by status if provided
  if (status && ['pending', 'fulfilled', 'cancelled'].includes(status)) {
    whereClause.status = status;
  }

  const { count, rows: prescriptions } = await Prescription.findAndCountAll({
    where: whereClause,
    include: [
      {
        model: Doctor,
        as: 'doctor',
        attributes: ['specialization', 'hospitalName'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['fullName', 'email', 'phone']
        }]
      },
      {
        model: Patient,
        as: 'patient',
        attributes: ['fullName', 'insuranceProvider', 'insuranceNumber'],
        include: [{
          model: User,
          as: 'user',
          attributes: ['email']
        }]
      },
      {
        model: PrescriptionItem,
        as: 'items',
      },
    ],
    order: [[sortBy, sortOrder]],
    limit,
    offset,
  });

  const prescriptionData = prescriptions.map(prescription => ({
    id: prescription.id,
    prescriptionNumber: prescription.prescriptionNumber,
    diagnosis: prescription.diagnosis,
    doctorNotes: prescription.doctorNotes,
    status: prescription.status,
    qrCodeHash: prescription.qrCodeHash,
    items: (prescription as any).items?.map((item: any) => ({
      id: item.id,
      medicineName: item.medicineName,
      dosage: item.dosage,
      frequency: item.frequency,
      quantity: item.quantity,
      instructions: item.instructions
    })) || [],
    doctor: {
      fullName: (prescription as any).doctor?.user?.fullName,
      email: (prescription as any).doctor?.user?.email,
      phone: (prescription as any).doctor?.user?.phone,
      specialization: (prescription as any).doctor?.specialization,
      hospitalName: (prescription as any).doctor?.hospitalName
    },
    patient: {
      id: (prescription as any).patient?.id,
      fullName: (prescription as any).patient?.fullName,
      email: (prescription as any).patient?.user?.email,
      insuranceProvider: (prescription as any).patient?.insuranceProvider,
      insuranceNumber: (prescription as any).patient?.insuranceNumber
    },
    createdAt: prescription.createdAt,
    updatedAt: prescription.updatedAt
  }));

  return {
    prescriptions: prescriptionData,
    total: count,
  };
}

  // Search patients by name
  static async searchPatients (query: string): Promise<PatientProfile[]> {
    const { Op } = require('sequelize');

    const patients = await Patient.findAll({
      where: {
        fullName: { [Op.iLike]: `%${query}%` },
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['phone', 'isActive'],
        },
      ],
      limit: 20,
    });

    return patients
      .filter(patient => (patient as any).user.isActive)
      .map(patient => ({
        id: patient.id,
        fullName: patient.fullName,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        insuranceProvider: patient.insuranceProvider,
        insuranceNumber: patient.insuranceNumber,
        allergies: patient.allergies,
        existingConditions: patient.existingConditions,
        emergencyContact: patient.emergencyContact,
        emergencyPhone: patient.emergencyPhone,
        phone: (patient as any).user.phone,
        createdAt: patient.createdAt,
        updatedAt: patient.updatedAt,
      }));
  }

  // Get patient by user ID
  static async getPatientByUserId (userId: string): Promise<PatientProfile | null> {
    const patient = await Patient.findOne({
      where: { userId },
      include: [{
        association: 'user',
        attributes: ['email', 'phone']
      }]
    });

    if (!patient) {
      return null;
    }

    return {
      id: patient.id,
      email: (patient as any).user?.email,
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth,
      gender: patient.gender,
      insuranceProvider: patient.insuranceProvider,
      insuranceNumber: patient.insuranceNumber,
      allergies: patient.allergies,
      existingConditions: patient.existingConditions,
      emergencyContact: patient.emergencyContact,
      emergencyPhone: patient.emergencyPhone,
      phone: (patient as any).user?.phone,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}
