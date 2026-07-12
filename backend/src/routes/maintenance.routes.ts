import { Router } from 'express';
import { MaintenanceController } from '../modules/maintenance/maintenance.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', MaintenanceController.getAll);
router.get('/:id', MaintenanceController.getById);

router.post('/', rbac(['admin', 'fleet_manager']), MaintenanceController.create);
router.patch('/:id/close', rbac(['admin', 'fleet_manager']), MaintenanceController.close);

export default router;
