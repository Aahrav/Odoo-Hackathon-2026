import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const rbac = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User role not found' } });
      return;
    }

    if (allowedRoles.includes(req.user.role)) {
      next();
    } else {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'You do not have permission to access this resource' }
      });
    }
  };
};
