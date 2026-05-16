import { Router } from 'express';
import { 
  getWarehouses, 
  createWarehouse, 
  updateWarehouse, 
  getWarehouseById,
  getMovements,
  createDispatch,
  createReturn,
  deleteWarehouse
} from '../controllers/warehouse.controller';

const router = Router();

router.get('/', getWarehouses);
router.post('/', createWarehouse);
router.patch('/:id', updateWarehouse);
router.get('/movements/all', getMovements); // Avoid conflicting with /:id
router.post('/dispatch', createDispatch);
router.post('/return', createReturn);
router.get('/:id', getWarehouseById);
router.delete('/:id', deleteWarehouse);

export default router;
