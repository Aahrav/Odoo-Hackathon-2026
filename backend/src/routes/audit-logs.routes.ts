import { Router } from 'express';
import { AuditLogsController } from '../modules/audit-logs/audit-logs.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(rbac(['admin']));

router.get('/', AuditLogsController.getAll);

export default router;
