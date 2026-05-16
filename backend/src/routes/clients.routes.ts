import { Router } from 'express';
import * as ClientsController from '../controllers/clients.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', ClientsController.getClients);
router.post('/', ClientsController.createClient);
router.get('/:id', ClientsController.getClientById);
router.put('/:id', ClientsController.updateClient);
router.delete('/:id', ClientsController.deleteClient);

export default router;
