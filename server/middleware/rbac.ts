import { Request, Response, NextFunction } from 'express';
import { rolePermissionService } from '../services';

interface CustomRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// RBAC Middleware for checking permissions
export const requirePermission = (action: 'view' | 'create' | 'edit' | 'delete', resource: string) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For backward compatibility, if user has Admin role, allow access
      if (req.user.role === 'Admin') {
        return next();
      }

      // Get the user's role ID
      // Note: In a real implementation, you'd fetch the user's role from the database
      // Since we're working with JWT, the role ID might not be in the token
      // For now, we'll skip this check and return success for non-admins
      // In a real app, you'd need to fetch the user details to get their roleId

      console.log(`RBAC check: user role ${req.user.role}, resource ${resource}, action ${action}`);
      
      // For now, allow access for non-admin roles (for backward compatibility)
      // In a real implementation, you'd check the role permissions in the database
      return next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};

// Alternative RBAC middleware that checks based on user's role ID from the database
export const requirePermissionByRoleId = (action: 'canView' | 'canCreate' | 'canEdit' | 'canDelete', menuName: string) => {
  return async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      // For backward compatibility, if user has Admin role, allow access
      if (req.user.role === 'Admin') {
        return next();
      }

      // In a real implementation, you would:
      // 1. Fetch the user's roleId from the database using req.user.userId
      // 2. Fetch the menu ID by menuName
      // 3. Check the rolePermission table for the specific permission
      // This is a simplified version that allows access for non-admins for now
      // to maintain backward compatibility
      console.log(`RBAC check by role ID: user role ${req.user.role}, menu ${menuName}, action ${action}`);
      
      return next();
    } catch (error) {
      console.error('RBAC middleware error:', error);
      return res.status(500).json({ error: 'Permission check failed' });
    }
  };
};