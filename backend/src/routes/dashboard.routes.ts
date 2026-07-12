import { Router } from 'express';
import { DashboardController } from '../modules/dashboard/dashboard.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(rbac(['admin', 'fleet_manager', 'financial_analyst']));

router.get('/overview', DashboardController.getOverview);
router.get('/roi', DashboardController.getVehicleROI);
router.get('/fuel-efficiency', DashboardController.getFuelEfficiency);

export default router;
