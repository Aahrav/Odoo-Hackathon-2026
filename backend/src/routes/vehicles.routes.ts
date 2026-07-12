import { Router } from 'express';
import { VehiclesController } from '../modules/vehicles/vehicles.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', VehiclesController.getAll);
router.get('/:id', VehiclesController.getById);

// Only admins and fleet managers can create or modify vehicles
router.post('/', rbac(['admin', 'fleet_manager']), VehiclesController.create);
router.patch('/:id', rbac(['admin', 'fleet_manager']), VehiclesController.update);

export default router;
