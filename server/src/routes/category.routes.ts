import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import {
  validateCreate,
  validateUpdate,
  validateObjectId,
} from '../middleware/validate.middleware';

const router = Router();
const categoryController = new CategoryController();

router.get('/', categoryController.getCategories);
router.get('/tree', categoryController.getCategoryTree);
router.get('/:id', validateObjectId, categoryController.getCategoryById);
router.post('/', validateCreate, categoryController.createCategory);
router.post('/bulk', validateCreate, categoryController.createCategoryInBulk);
router.put('/:id', validateObjectId, validateUpdate, categoryController.updateCategory);
router.delete('/:id', validateObjectId, categoryController.deleteCategory);
router.patch('/:id/deactivate', validateObjectId, categoryController.deactivateCategory);
router.patch('/:id/activate', validateObjectId, categoryController.activateCategory);

export default router;
