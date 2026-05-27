import { Request, Response, NextFunction } from 'express';
import { CategoryService } from '../services/category.service';
import { ResponseBuilder } from '../utils/response.util';
import { MSG } from '../constants/messages';

const service = new CategoryService();

export class CategoryController {

  /**
   * GET /api/categories
   * Returns a flat list of categories. Supports pagination via ?page=&limit=
   * and search via ?name=. When no params given, returns all categories.
   */
  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const name = req.query.name as string | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit? Math.min(Number(req.query.limit) || 10, 100): undefined;
      const { data, pagination } = await service.getCategories(name, page, limit);
      if (pagination) {
        res.status(200).json(ResponseBuilder.paginated(data, pagination, MSG.CATEGORIES_FETCHED));
      } else {
        res.status(200).json(ResponseBuilder.success(data, MSG.CATEGORIES_FETCHED));
      }
    } catch (err) { next(err); }
  };

  /**
   * GET /api/categories/tree
   * Returns the full category tree. Use ?id= to filter a subtree.
   */
  getCategoryTree = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.query.id as string | undefined;
      const data = await service.getCategoryTree(id);
      res.status(200).json(ResponseBuilder.success(data, MSG.CATEGORY_TREE_FETCHED));
    } catch (err) { next(err); }
  };

  /**
   * GET /api/categories/:id
   * Returns a single category with its ancestor chain. Cached in Redis.
   */
  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.getCategoryById(req.params.id);
      res.status(200).json(ResponseBuilder.success(data, MSG.CATEGORY_FETCHED));
    } catch (err) { next(err); }
  };

  /**
   * POST /api/categories
   * Creates a new category. Accepts optional parentId for nesting.
   */
  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.createCategory(req.body);
      res.status(201).json(ResponseBuilder.created(data, MSG.CATEGORY_CREATED));
    } catch (err) { next(err); }
  };

  /**
   * POST /api/categories/bulk
   * Creates a category (or array of categories) with nested children in one shot.
   */
  createCategoryInBulk = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = req.body;
      if (Array.isArray(body)) {
        const results = [];
        for (const item of body) {
          const created = await service.createCategoryInBulk(item, item.parentId);
          results.push(created);
        }
        res.status(201).json(ResponseBuilder.created(results, MSG.CATEGORIES_CREATED));
      } else {
        const data = await service.createCategoryInBulk(body, body.parentId);
        res.status(201).json(ResponseBuilder.created(data, MSG.CATEGORIES_CREATED));
      }
    } catch (err) { next(err); }
  };

  /**
   * PUT /api/categories/upsert
   * Creates a category by name if it doesn't exist, otherwise returns existing.
   */
  upsertCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.upsertCategory(req.body);
      res.status(200).json(ResponseBuilder.success(data, MSG.CATEGORY_UPSERTED));
    } catch (err) { next(err); }
  };

  /**
   * PUT /api/categories/:id
   * Updates the name of a category by ID.
   */
  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await service.updateCategory(req.params.id, { name: req.body.name });
      res.status(200).json(ResponseBuilder.success(data, MSG.CATEGORY_UPDATED));
    } catch (err) { next(err); }
  };

  /**
   * DELETE /api/categories/:id
   * Deletes a category and all its descendants (cascade).
   */
  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await service.deleteCategory(req.params.id);
      res.status(200).json(ResponseBuilder.success(null, MSG.CATEGORY_DELETED));
    } catch (err) { next(err); }
  };

  /**
   * PATCH /api/categories/:id/deactivate
   * Deactivates a category and all its descendants (cascade).
   */
  deactivateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.deactivateCategory(req.params.id);
      res.status(200).json(ResponseBuilder.success(
        result,
        MSG.CATEGORY_DEACTIVATED(result.categoryName, result.deactivatedCount)
      ));
    } catch (err) { next(err); }
  };

  /**
   * PATCH /api/categories/:id/activate
   * Activates a category and all its descendants (cascade).
   */
  activateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await service.activateCategory(req.params.id);
      res.status(200).json(ResponseBuilder.success(
        result,
        MSG.CATEGORY_ACTIVATED(result.categoryName, result.deactivatedCount)
      ));
    } catch (err) { next(err); }
  };
}
