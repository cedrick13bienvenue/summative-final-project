import { Router } from 'express';
import authRoutes from './auth';
import patientRoutes from './patients';
import doctorRoutes from './doctors';
import pharmacistRoutes from './pharmacists';
import pharmacyRoutes from './pharmacy';
import qrCodeRoutes from './qrCodes';
import eventRoutes from './events';

const routers = Router();

const allRoutes = [authRoutes, patientRoutes, doctorRoutes, pharmacistRoutes, pharmacyRoutes, qrCodeRoutes, eventRoutes];

routers.use('/', ...allRoutes);

export { routers };