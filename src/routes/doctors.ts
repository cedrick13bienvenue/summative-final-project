import { Router } from 'express';
import { DoctorController } from '../controllers/doctorController';
import {
  authenticateToken,
  requireAdmin,
} from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { advancedPaginationSchema } from '../validation/schemas';

const router = Router();

// Admin only routes for doctor management
router.post('/doctors/register', authenticateToken, requireAdmin, DoctorController.registerDoctor);
router.get('/doctors', authenticateToken, requireAdmin, validateQuery(advancedPaginationSchema), DoctorController.getAllDoctors);
router.get('/doctors/:doctorId', authenticateToken, requireAdmin, DoctorController.getDoctorById);
router.put('/doctors/:doctorId', authenticateToken, requireAdmin, DoctorController.updateDoctorProfile);
router.delete('/doctors/:doctorId', authenticateToken, requireAdmin, DoctorController.deleteDoctor);

export default router;
