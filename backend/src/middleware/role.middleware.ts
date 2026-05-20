import { Response, NextFunction } from 'express';
import { AuthRequest, checkPermissionFreshness } from './auth.middleware';
import { prisma } from '../utils/prisma';

export const authorize = (allowedRoles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      // First check if permissions need refreshing
      await new Promise<void>((resolve, reject) => {
        checkPermissionFreshness(req, res, () => resolve());
      });
      
      // If response was already sent (needs refresh), return
      if (res.headersSent) {
        return;
      }

      if (!req.user) {
        res.status(401).json({ message: 'Authentication required' });
        return;
      }

      const { role } = req.user;

      // 1. ADMIN bypasses all dynamic checks to prevent accidental lockouts
      if (role === 'ADMIN') {
        return next();
      }

      // 2. Fallback basic role validation to ensure the role exists in route config
      if (!allowedRoles.includes(role)) {
        res.status(403).json({ message: `Forbidden: Role ${role} is not authorized for this resource.` });
        return;
      }

      // 3. Dynamic Database Permission Verification
      const url = req.baseUrl || req.originalUrl || '';
      let matchedModule: string | null = null;

      if (url.includes('/inquiries')) {
        matchedModule = 'INQUIRIES';
      } else if (url.includes('/clients')) {
        matchedModule = 'CLIENTS';
      } else if (url.includes('/availability')) {
        matchedModule = 'AVAILABILITY';
      } else if (url.includes('/assignments') || url.includes('/teams')) {
        matchedModule = 'WORK_TEAMS';
      } else if (
        url.includes('/dispatch') || 
        url.includes('/warehouse') || 
        url.includes('/led') || 
        url.includes('/video') || 
        url.includes('/sound') || 
        url.includes('/vendors')
      ) {
        matchedModule = 'WAREHOUSE';
      } else if (
        url.includes('/staff') || 
        url.includes('/roles') || 
        url.includes('/vehicles')
      ) {
        matchedModule = 'STAFF';
      } else if (url.includes('/invoices') || url.includes('/expense')) {
        matchedModule = 'FINANCE';
      } else if (url.includes('/dashboard') || url.includes('/analytics')) {
        matchedModule = 'DASHBOARD';
      }

      if (matchedModule) {
        // Resolve target action from HTTP method
        let action: 'canRead' | 'canCreate' | 'canUpdate' | 'canDelete' = 'canRead';
        if (req.method === 'POST') {
          action = 'canCreate';
        } else if (req.method === 'PUT' || req.method === 'PATCH') {
          action = 'canUpdate';
        } else if (req.method === 'DELETE') {
          action = 'canDelete';
        }

        // Fetch user permissions for this role and module
        const permission = await prisma.rolePermission.findUnique({
          where: {
            roleName_module: {
              roleName: role,
              module: matchedModule,
            },
          },
        });

        if (!permission || !permission[action]) {
          console.warn(`[Authorize Blocked] User ID: ${req.user.userId}, Role: ${role}, Module: ${matchedModule}, Action: ${action}, Route: ${url}`);
          res.status(403).json({ 
            message: `Forbidden: Your role (${role}) does not have permission to ${action.replace('can', '').toLowerCase()} ${matchedModule.toLowerCase()} resources.` 
          });
          return;
        }
      }

      next();
    } catch (error) {
      console.error('Authorization middleware error:', error);
      res.status(500).json({ message: 'Internal authorization validation error' });
    }
  };
};

