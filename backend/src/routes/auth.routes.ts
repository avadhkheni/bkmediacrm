import { Router } from 'express';
import { login, refresh, logout, getMe } from '../controllers/auth.controller';
import { body } from 'express-validator';
import { authenticate, checkPermissionFreshness } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware could be extracted to a separate file, but for simplicity we keep it inline
const validateRequest = (req: any, res: any, next: any) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validateRequest
  ],
  login
);

router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required'), validateRequest],
  refresh
);

router.get('/me', authenticate, checkPermissionFreshness, getMe);
router.post('/logout', logout);

// Token refresh is public, but logout should ideally be authenticated
// For now, logout is accessible without auth (token may be expired)

export default router;
