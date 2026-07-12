import { Router } from 'express';
import { FuelController } from '../modules/fuel/fuel.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', FuelController.getAll);
router.get('/:id', FuelController.getById);

// Admin, Fleet Manager, Financial Analyst, and Driver can log fuel
router.post('/', rbac(['admin', 'fleet_manager', 'financial_analyst', 'driver']), FuelController.create);

export default router;
