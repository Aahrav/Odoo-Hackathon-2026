import { Response, NextFunction } from 'express';
import { TripsService } from './trips.service';
import { AuthRequest } from '../../middleware/auth';

export class TripsController {
  static async getAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trips = await TripsService.getAll(req.query);
      res.json({ success: true, data: trips });
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.getById(req.params.id);
      res.json({ success: true, data: trip });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.create(req.body, req.user.id, req.user.organizationId);
      res.status(201).json({ success: true, data: trip, message: 'Draft trip created successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.update(req.params.id, req.body);
      res.json({ success: true, data: trip, message: 'Draft trip updated successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async dispatch(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.dispatch(req.params.id, req.user.id);
      res.json({ success: true, data: trip, message: 'Trip dispatched successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async complete(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.complete(req.params.id, req.body, req.user.id);
      res.json({ success: true, data: trip, message: 'Trip completed successfully' });
    } catch (error) {
      next(error);
    }
  }

  static async cancel(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const trip = await TripsService.cancel(req.params.id, req.user.id);
      res.json({ success: true, data: trip, message: 'Trip cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }
}
