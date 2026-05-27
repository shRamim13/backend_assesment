import { Types } from 'mongoose';
import { CategoryRepository } from '../repositories/category.repository';
import { CacheService } from './cache.service';
import { buildTreeDFS, collectDescendantIdsDFS } from '../utils/dfs.util';
import { createError, buildAncestorChain } from '../utils/helpers';
import { config } from '../config/env.config';
import { ERR } from '../constants/messages';
import {
  ICategory,
  CreateCategoryDto,
  CreateCategoryBulkDto,
  UpdateCategoryDto,
  CategoryWithAncestors,
  CategoryTreeNode,
  DeactivationResult,
  PaginationMeta,
} from '../types/category.types';

const repo = new CategoryRepository();
const cache = new CacheService();

export class CategoryService {

  /**
   * Creates a single category. If parentId is provided, validates the parent
   * exists and is active, then builds the ancestors array.
   */
  async createCategory(dto: CreateCategoryDto): Promise<ICategory> {
    let ancestors: Types.ObjectId[] = [];

    if (dto.parentId) {
      const parent = await repo.findById(dto.parentId);
      if (!parent) throw createError(ERR.PARENT_NOT_FOUND, 404);
      if (!parent.isActive) throw createError(ERR.PARENT_INACTIVE, 400);
      ancestors = [...parent.ancestors, parent._id as Types.ObjectId];
    }

    const category = await repo.create({ ...dto, ancestors });
    await cache.invalidateAll();
    return category;
  }

  /**
   * Recursively creates a category and its nested children in one shot.
   * Each child is linked to its parent via the auto-generated _id.
   */
  async createCategoryInBulk(dto: CreateCategoryBulkDto, parentId?: string): Promise<ICategory> {
    const created = await this.createCategory({ name: dto.name, parentId });
    const createdId = created._id.toString();
    if (dto.children && dto.children.length > 0) {
      for (const child of dto.children) {
        await this.createCategoryInBulk(child, createdId);
      }
    }
    return created;
  }

  /**
   * Unified handler for listing categories:
   * - With name: searches and returns paginated results with ancestor info
   * - With page/limit: returns paginated flat list
   * - With no params: returns all categories (flat, unpaginated)
   */
  async getCategories(name?: string, page?: number, limit?: number): Promise<{ data: ICategory[] | CategoryWithAncestors[]; pagination?: PaginationMeta }> {
    if (name) {
      const searchPage = page || 1;
      const searchLimit = limit || 10;
      return this.searchCategories(name, searchPage, searchLimit);
    }

    if (page && limit) {
      const data = await repo.findAllPaginated(page, limit);
      const total = await repo.countAll();
      const enriched = await this.enrichWithAncestors(data);
      return { data: enriched, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    const data = await repo.findAll();
    return { data };
  }

  /**
   * Returns the full category tree with nested children.
   * If an id is provided, returns only the subtree rooted at that category.
   * Full tree is cached in Redis.
   */
  async getCategoryTree(id?: string): Promise<CategoryTreeNode[]> {
    if (id) {
      const category = await repo.findById(id);
      if (!category) throw createError(ERR.CATEGORY_NOT_FOUND, 404);
      const descendants = await repo.findDescendants(id);
      const all = [category, ...descendants];
      const parentId = category.parent?.toString() ?? null;
      const tree = buildTreeDFS(all, parentId);
      const matched = tree.find((n) => n._id === category._id.toString());
      return matched ? [matched] : [];
    }

    const cached = await cache.get<CategoryTreeNode[]>(cache.keys.all);
    if (cached) return cached;

    const all = await repo.findAll();
    const tree = buildTreeDFS(all);
    await cache.set(cache.keys.all, tree);
    return tree;
  }

  /**
   * Fetches a single category by ID with its full ancestor chain.
   * Results are cached in Redis.
   */
  async getCategoryById(id: string): Promise<CategoryWithAncestors> {
    const cacheKey = cache.keys.one(id);
    const cached = await cache.get<CategoryWithAncestors>(cacheKey);
    if (cached) return cached;

    const category = await repo.findById(id);
    if (!category) throw createError(ERR.CATEGORY_NOT_FOUND, 404);

    const ancestorDocs = await repo.findByIds(category.ancestors);
    const orderedAncestors = buildAncestorChain(category.ancestors, ancestorDocs);

    const result: CategoryWithAncestors = {
      _id: category._id.toString(),
      name: category.name,
      isActive: category.isActive,
      parent: category.parent?.toString() ?? null,
      parentCategory: orderedAncestors[orderedAncestors.length - 1] ?? null,
      ancestorChain: orderedAncestors,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };

    await cache.set(cacheKey, result, config.cache.ttlSingle);
    return result;
  }

  /**
   * Enriches raw ICategory documents with full ancestor chain info.
   */
  async enrichWithAncestors(categories: ICategory[]): Promise<CategoryWithAncestors[]> {
    if (categories.length === 0) return [];

    const ancestorIds = categories.reduce((ids: Types.ObjectId[], cat) => {
      for (const a of cat.ancestors) {
        if (!ids.find((id) => id.toString() === a.toString())) ids.push(a);
      }
      return ids;
    }, []);
    const ancestorDocs = ancestorIds.length > 0 ? await repo.findByIds(ancestorIds) : [];

    return categories.map((cat) => {
      const chain = buildAncestorChain(cat.ancestors, ancestorDocs);
      return {
        _id: cat._id.toString(),
        name: cat.name,
        isActive: cat.isActive,
        parent: cat.parent?.toString() ?? null,
        parentCategory: chain[chain.length - 1] ?? null,
        ancestorChain: chain,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });
  }

  /**
   * Searches categories by name using regex. Returns matching categories
   * with their parent and full ancestor chain. Supports pagination.
   */
  async searchCategories(term: string, page?: number, limit?: number): Promise<{ data: CategoryWithAncestors[]; pagination?: PaginationMeta }> {
    if (page && limit) {
      const results = await repo.searchByNamePaginated(term, page, limit);
      if (results.length === 0) {
        const total = await repo.countSearchResults(term);
        return { data: [], pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
      }

      const ancestorIds = results.reduce((ids: Types.ObjectId[], cat) => {
        for (const a of cat.ancestors) {
          if (!ids.find((id) => id.toString() === a.toString())) ids.push(a);
        }
        return ids;
      }, []);
      const ancestorDocs = await repo.findByIds(ancestorIds);
      const data = results.map((cat) => {
        const chain = buildAncestorChain(cat.ancestors, ancestorDocs);
        return {
          _id: cat._id.toString(),
          name: cat.name,
          isActive: cat.isActive,
          parent: cat.parent?.toString() ?? null,
          parentCategory: chain[chain.length - 1] ?? null,
          ancestorChain: chain,
          createdAt: cat.createdAt,
          updatedAt: cat.updatedAt,
        };
      });
      const total = await repo.countSearchResults(term);
      return { data, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    }

    const cacheKey = cache.keys.search(term);
    const cached = await cache.get<CategoryWithAncestors[]>(cacheKey);
    if (cached) return { data: cached };

    const results = await repo.searchByName(term);
    if (results.length === 0) return { data: [] };

    const ancestorIds = results.reduce((ids: Types.ObjectId[], cat) => {
      for (const a of cat.ancestors) {
        if (!ids.find((id) => id.toString() === a.toString())) ids.push(a);
      }
      return ids;
    }, []);

    const ancestorDocs = await repo.findByIds(ancestorIds);
    const data: CategoryWithAncestors[] = results.map((cat) => {
      const chain = buildAncestorChain(cat.ancestors, ancestorDocs);
      return {
        _id: cat._id.toString(),
        name: cat.name,
        isActive: cat.isActive,
        parent: cat.parent?.toString() ?? null,
        parentCategory: chain[chain.length - 1] ?? null,
        ancestorChain: chain,
        createdAt: cat.createdAt,
        updatedAt: cat.updatedAt,
      };
    });

    await cache.set(cacheKey, data);
    return { data };
  }

  /**
   * Updates the name of a category by ID. Invalidates cache.
   */
  async updateCategory(id: string, dto: UpdateCategoryDto): Promise<ICategory> {
    const exists = await repo.findById(id);
    if (!exists) throw createError(ERR.CATEGORY_NOT_FOUND, 404);

    const updated = await repo.updateName(id, dto.name);
    await cache.invalidateAll();
    return updated!;
  }

  /**
   * Deletes a category and all its descendants (cascade).
   * Uses iterative DFS to collect all descendant IDs.
   */
  async deleteCategory(id: string): Promise<void> {
    const category = await repo.findById(id);
    if (!category) throw createError(ERR.CATEGORY_NOT_FOUND, 404);

    const descendants = await repo.findDescendants(id);
    const descendantIds = collectDescendantIdsDFS(descendants, id);
    await repo.deleteMany([id, ...descendantIds]);
    await cache.invalidateAll();
  }

  /**
   * Creates a category if the name does not exist, otherwise returns
   * the existing category (idempotent by name).
   */
  async upsertCategory(dto: CreateCategoryDto): Promise<ICategory> {
    const existing = await repo.findByName(dto.name);
    if (existing) {
      return this.updateCategory(existing._id.toString(), { name: dto.name });
    }
    return this.createCategory(dto);
  }

  /**
   * Deactivates a category and all its descendants (cascade).
   * Returns the count of deactivated categories.
   */
  async deactivateCategory(id: string): Promise<DeactivationResult> {
    const category = await repo.findById(id);
    if (!category) throw createError(ERR.CATEGORY_NOT_FOUND, 404);

    const descendants = await repo.findDescendants(id);
    const descendantIds = collectDescendantIdsDFS(descendants, id);
    const count = await repo.deactivateMany([id, ...descendantIds]);

    await cache.invalidateAll();
    return { affectedCount: count, categoryName: category.name };
  }

  /**
   * Activates a single category.
   * Returns an error if the parent category is inactive.
   * Does NOT cascade to descendants — only deactivation cascades down.
   */
  async activateCategory(id: string): Promise<DeactivationResult> {
    const category = await repo.findById(id);
    if (!category) throw createError(ERR.CATEGORY_NOT_FOUND, 404);

    if (category.parent) {
      const parent = await repo.findById(category.parent.toString());
      if (parent && !parent.isActive) {
        throw createError(ERR.PARENT_INACTIVE_ACTIVATE(category.name, parent.name), 400);
      }
    }

    await repo.activateMany([id]);

    await cache.invalidateAll();
    return { affectedCount: 1, categoryName: category.name };
  }
}
