import { Router } from 'express';
import { 
  getRoles, 
  createRole, 
  updateRole, 
  deleteRole,
  getUsers,
  createUser,
  toggleUserStatus,
  deleteUser
} from '../controllers/roles.controller';
import { authenticate } from '../middleware/auth.middleware';
import { authorize } from '../middleware/role.middleware';

const router = Router();

// Protect all routes with auth and ADMIN authorization
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Role matrix routes
router.get('/', getRoles);
router.post('/', createRole);
router.put('/:name', updateRole);
router.delete('/:name', deleteRole);

// Login users management routes
router.get('/users', getUsers);
router.post('/users', createUser);
router.put('/users/:id/status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

export default router;
