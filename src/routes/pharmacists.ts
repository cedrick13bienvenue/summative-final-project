import { Router } from 'express';
import { PharmacistController } from '../controllers/pharmacistController';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { validateQuery, validateParams } from '../middleware/validation';
import { advancedPaginationSchema, pharmacistIdParamSchema } from '../validation/schemas';

const router = Router();

// Admin only routes for pharmacist management
router.post('/pharmacists/register', authenticateToken, requireAdmin, PharmacistController.registerPharmacist);
router.get('/pharmacists', authenticateToken, requireAdmin, validateQuery(advancedPaginationSchema), PharmacistController.getAllPharmacists);
router.get('/pharmacists/:pharmacistId', authenticateToken, requireAdmin, validateParams(pharmacistIdParamSchema), PharmacistController.getPharmacistById);
router.put('/pharmacists/:pharmacistId', authenticateToken, requireAdmin, validateParams(pharmacistIdParamSchema), PharmacistController.updatePharmacist);
router.delete('/pharmacists/:pharmacistId', authenticateToken, requireAdmin, validateParams(pharmacistIdParamSchema), PharmacistController.deletePharmacist);
router.put('/pharmacists/:pharmacistId/verify', authenticateToken, requireAdmin, validateParams(pharmacistIdParamSchema), PharmacistController.verifyPharmacist);
router.put('/pharmacists/:pharmacistId/unverify', authenticateToken, requireAdmin, validateParams(pharmacistIdParamSchema), PharmacistController.unverifyPharmacist);

export default router;
