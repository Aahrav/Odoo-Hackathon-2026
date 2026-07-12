import { Router } from 'express';
import { DriversController } from '../modules/drivers/drivers.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', DriversController.getAll);
router.get('/:id', DriversController.getById);

// Admins and fleet managers can create and update drivers
router.post('/', rbac(['admin', 'fleet_manager']), DriversController.create);
router.patch('/:id', rbac(['admin', 'fleet_manager']), DriversController.update);

// Safety score updates restricted to Safety Officer and Admin
router.patch('/:id/safety-score', rbac(['admin', 'safety_officer']), DriversController.updateSafetyScore);

export default router;
