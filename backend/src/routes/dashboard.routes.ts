import { Router } from 'express';
import { DashboardController } from '../modules/dashboard/dashboard.controller';
import { authenticateJWT } from '../middleware/auth';
import { rbac } from '../middleware/rbac';

const router = Router();

router.use(authenticateJWT);
router.use(rbac(['admin', 'fleet_manager', 'financial_analyst']));

// Part 1: Operational KPIs
router.get('/kpis', DashboardController.getOverview);

// Part 2: Financial Reports (ROI & Fuel Efficiency)
router.get('/roi', DashboardController.getFinancialReports);

export default router;
