import { Router } from 'express';
import { ExpensesController } from '../modules/expenses/expenses.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);

router.get('/', ExpensesController.getAll);
router.get('/:id', ExpensesController.getById);

router.post('/', rbac(['admin', 'fleet_manager', 'financial_analyst', 'driver']), ExpensesController.create);
router.patch('/:id', rbac(['admin', 'fleet_manager', 'financial_analyst']), ExpensesController.update);
router.delete('/:id', rbac(['admin', 'fleet_manager', 'financial_analyst']), ExpensesController.delete);

export default router;
