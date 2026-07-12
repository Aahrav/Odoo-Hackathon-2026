import { Response, NextFunction } from 'express';
import { ExpensesService } from './expenses.service';
import { AuthRequest } from '../../middleware/auth';

export class ExpensesController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expenses = await ExpensesService.getAll(req.query);
      res.json({ success: true, data: expenses });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await ExpensesService.getById(req.params.id);
      res.json({ success: true, data: expense });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await ExpensesService.create(req.body, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, data: expense, message: 'Expense logged successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const expense = await ExpensesService.update(req.params.id, req.body);
      res.json({ success: true, data: expense, message: 'Expense updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await ExpensesService.delete(req.params.id);
      res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}
