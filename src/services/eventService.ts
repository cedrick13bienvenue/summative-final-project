import { EventEmitter } from 'events';
import { EmailService } from './emailService';
import { PrescriptionEmailData } from './emailService';

// Define event types
export interface PrescriptionCreatedEvent {
  type: 'prescription.created';
  data: {
    prescriptionId: string;
    patientId: string;
    doctorId: string;
    prescriptionNumber: string;
    qrCodeHash: string;
    qrCodeImage: string;
    expiresAt: string;
  };
}

export interface EmailJob {
  id: string;
  type: 'prescription.email';
  data: PrescriptionEmailData;
  attempts: number;
  maxAttempts: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}

export class EventService extends EventEmitter {
  private static instance: EventService;
  private emailQueue: EmailJob[] = [];
  private isProcessing = false;
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 5000; // 5 seconds

  private constructor() {
    super();
    this.setupEventListeners();
    this.startEmailProcessor();
  }

  public static getInstance(): EventService {
    if (!EventService.instance) {
      EventService.instance = new EventService();
    }
    return EventService.instance;
  }

  /**
   * Emit prescription created event
   */
  public emitPrescriptionCreated(eventData: PrescriptionCreatedEvent['data']): void {
    console.log('📧 Emitting prescription created event:', eventData.prescriptionId);
    this.emit('prescription.created', eventData);
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    this.on('prescription.created', async (data: PrescriptionCreatedEvent['data']) => {
      console.log('📧 Received prescription created event:', data.prescriptionId);
      await this.queuePrescriptionEmail(data);
    });

    // Handle other events in the future
    this.on('user.registered', (data: any) => {
      console.log('👤 User registered event:', data);
      // Queue welcome email
    });

    this.on('prescription.dispensed', (data: any) => {
      console.log('💊 Prescription dispensed event:', data);
      // Queue dispense notification email
    });
  }

  /**
   * Queue prescription email for background processing
   */
  private async queuePrescriptionEmail(eventData: PrescriptionCreatedEvent['data']): Promise<void> {
    try {
      // Import models here to avoid circular dependencies
      const { Prescription, Patient, Doctor } = await import('../models');
      
      // Get prescription with all related data
      const prescription = await Prescription.findByPk(eventData.prescriptionId, {
        include: [
          { association: 'patient', include: [{ association: 'user' }] },
          { association: 'doctor', include: [{ association: 'user' }] },
          { association: 'items' }
        ]
      });

      if (!prescription) {
        console.error('❌ Prescription not found for email:', eventData.prescriptionId);
        return;
      }

      const patient = (prescription as any).patient;
      const doctor = (prescription as any).doctor;

      if (!patient?.user) {
        console.error('❌ Patient user not found for email:', eventData.prescriptionId);
        return;
      }

      // Prepare email data
      const emailData: PrescriptionEmailData = {
        patientName: patient.user.fullName,
        patientEmail: patient.user.email,
        prescriptionNumber: eventData.prescriptionNumber,
        patientNationalId: (patient as any).user?.nationalId || '',
        doctorName: doctor?.user?.fullName || '',
        diagnosis: prescription.diagnosis,
        medicines: ((prescription as any).items || []).map((item: any) => ({
          name: item.medicineName,
          dosage: item.dosage,
          frequency: item.frequency,
          quantity: item.quantity,
          instructions: item.instructions
        })),
        qrCodeImage: eventData.qrCodeImage,
        qrHash: eventData.qrCodeHash,
        expiresAt: eventData.expiresAt
      };

      // Create email job
      const emailJob: EmailJob = {
        id: `email_${eventData.prescriptionId}_${Date.now()}`,
        type: 'prescription.email',
        data: emailData,
        attempts: 0,
        maxAttempts: this.MAX_RETRY_ATTEMPTS,
        status: 'pending',
        createdAt: new Date()
      };

      // Add to queue
      this.emailQueue.push(emailJob);
      console.log('📧 Email job queued:', emailJob.id);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processEmailQueue();
      }

    } catch (error) {
      console.error('❌ Error queuing prescription email:', error);
    }
  }

  /**
   * Start email queue processor
   */
  private startEmailProcessor(): void {
    // Process queue every 2 seconds
    setInterval(() => {
      if (!this.isProcessing && this.emailQueue.length > 0) {
        this.processEmailQueue();
      }
    }, 2000);
  }

  /**
   * Process email queue
   */
  private async processEmailQueue(): Promise<void> {
    if (this.isProcessing || this.emailQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`📧 Processing email queue: ${this.emailQueue.length} jobs`);

    while (this.emailQueue.length > 0) {
      const job = this.emailQueue.shift();
      if (!job) break;

      await this.processEmailJob(job);
    }

    this.isProcessing = false;
  }

  /**
   * Process individual email job
   */
  private async processEmailJob(job: EmailJob): Promise<void> {
    try {
      console.log(`📧 Processing email job: ${job.id} (attempt ${job.attempts + 1})`);
      
      job.status = 'processing';
      job.attempts++;

      // Send email
      await EmailService.sendPrescriptionEmail(job.data);
      
      // Mark as completed
      job.status = 'completed';
      job.processedAt = new Date();
      console.log(`✅ Email job completed: ${job.id}`);

    } catch (error: any) {
      console.error(`❌ Email job failed: ${job.id}`, error);
      
      job.status = 'failed';
      job.error = error.message;

      // Retry if under max attempts
      if (job.attempts < job.maxAttempts) {
        console.log(`🔄 Retrying email job: ${job.id} in ${this.RETRY_DELAY}ms`);
        job.status = 'pending';
        
        // Re-queue with delay
        setTimeout(() => {
          this.emailQueue.push(job);
        }, this.RETRY_DELAY);
      } else {
        console.error(`💀 Email job permanently failed: ${job.id} after ${job.attempts} attempts`);
      }
    }
  }

  /**
   * Get queue status
   */
  public getQueueStatus(): {
    totalJobs: number;
    pendingJobs: number;
    processingJobs: number;
    completedJobs: number;
    failedJobs: number;
  } {
    const totalJobs = this.emailQueue.length;
    const pendingJobs = this.emailQueue.filter(job => job.status === 'pending').length;
    const processingJobs = this.emailQueue.filter(job => job.status === 'processing').length;
    const completedJobs = this.emailQueue.filter(job => job.status === 'completed').length;
    const failedJobs = this.emailQueue.filter(job => job.status === 'failed').length;

    return {
      totalJobs,
      pendingJobs,
      processingJobs,
      completedJobs,
      failedJobs
    };
  }

  /**
   * Clear completed jobs from queue
   */
  public clearCompletedJobs(): void {
    this.emailQueue = this.emailQueue.filter(job => job.status !== 'completed');
    console.log('🧹 Cleared completed email jobs');
  }
}

// Export singleton instance
export const eventService = EventService.getInstance();
