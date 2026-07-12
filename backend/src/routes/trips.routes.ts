import { Router } from 'express';
import { TripsController } from '../modules/trips/trips.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', TripsController.getAll);
router.get('/:id', TripsController.getById);

// Creation and modification
router.post('/', rbac(['admin', 'fleet_manager', 'driver']), TripsController.create);
router.patch('/:id', rbac(['admin', 'fleet_manager', 'driver']), TripsController.update);

// State Machine transitions
router.post('/:id/dispatch', rbac(['admin', 'fleet_manager']), TripsController.dispatch);
router.post('/:id/complete', rbac(['admin', 'fleet_manager', 'driver']), TripsController.complete);
router.post('/:id/cancel', rbac(['admin', 'fleet_manager']), TripsController.cancel);

export default router;
