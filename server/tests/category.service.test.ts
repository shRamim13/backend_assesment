import { Types } from 'mongoose';
import { CategoryService } from '../src/services/category.service';
import { CategoryRepository } from '../src/repositories/category.repository';
import { CacheService } from '../src/services/cache.service';
import { ICategory } from '../src/types/category.types';

const repo = CategoryRepository.prototype;
const cacheProto = CacheService.prototype;

const makeCat = (over: Partial<ICategory> = {}): ICategory =>
  ({
    _id: new Types.ObjectId(),
    name: 'Cat',
    parent: null,
    ancestors: [],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  } as unknown as ICategory);

describe('CategoryService', () => {
  let service: CategoryService;

  beforeEach(() => {
    service = new CategoryService();
    // Cache is a side concern in these tests: reads always miss, writes are no-ops.
    jest.spyOn(cacheProto, 'get').mockResolvedValue(null);
    jest.spyOn(cacheProto, 'set').mockResolvedValue();
    jest.spyOn(cacheProto, 'invalidateAll').mockResolvedValue();
  });

  afterEach(() => jest.restoreAllMocks());

  describe('createCategory', () => {
    it('creates a root with an empty ancestors array and invalidates cache', async () => {
      const createSpy = jest.spyOn(repo, 'create').mockResolvedValue(makeCat());
      await service.createCategory({ name: 'Electronics' });

      expect(createSpy.mock.calls[0][0].ancestors).toEqual([]);
      expect(cacheProto.invalidateAll).toHaveBeenCalledTimes(1);
    });

    it('builds ancestors as [...parent.ancestors, parentId]', async () => {
      const grand = new Types.ObjectId();
      const parentId = new Types.ObjectId();
      jest.spyOn(repo, 'findById').mockResolvedValue(
        makeCat({ _id: parentId, ancestors: [grand], isActive: true }),
      );
      const createSpy = jest.spyOn(repo, 'create').mockResolvedValue(makeCat());

      await service.createCategory({ name: 'Child', parentId: parentId.toString() });

      const passed = createSpy.mock.calls[0][0].ancestors.map((a) => a.toString());
      expect(passed).toEqual([grand.toString(), parentId.toString()]);
    });

    it('throws 404 when the parent does not exist', async () => {
      jest.spyOn(repo, 'findById').mockResolvedValue(null);
      await expect(
        service.createCategory({ name: 'X', parentId: new Types.ObjectId().toString() }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('throws 400 when the parent is inactive', async () => {
      jest.spyOn(repo, 'findById').mockResolvedValue(makeCat({ isActive: false }));
      await expect(
        service.createCategory({ name: 'X', parentId: new Types.ObjectId().toString() }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe('deactivateCategory (cascade)', () => {
    it('deactivates the category and all descendants', async () => {
      const id = new Types.ObjectId();
      const d1 = makeCat();
      const d2 = makeCat();
      jest.spyOn(repo, 'findById').mockResolvedValue(makeCat({ _id: id, name: 'Root' }));
      jest.spyOn(repo, 'findDescendants').mockResolvedValue([d1, d2]);
      const deactivateSpy = jest.spyOn(repo, 'deactivateMany').mockResolvedValue(3);

      const res = await service.deactivateCategory(id.toString());

      expect(deactivateSpy.mock.calls[0][0]).toEqual([
        id.toString(),
        d1._id.toString(),
        d2._id.toString(),
      ]);
      expect(res.affectedCount).toBe(3);
      expect(cacheProto.invalidateAll).toHaveBeenCalled();
    });

    it('throws 404 for a missing category', async () => {
      jest.spyOn(repo, 'findById').mockResolvedValue(null);
      await expect(
        service.deactivateCategory(new Types.ObjectId().toString()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('activateCategory (single + parent guard)', () => {
    it('activates only the single category when the parent is active', async () => {
      const id = new Types.ObjectId();
      jest.spyOn(repo, 'findById').mockResolvedValue(makeCat({ _id: id, parent: null }));
      const activateSpy = jest.spyOn(repo, 'activateMany').mockResolvedValue(1);

      const res = await service.activateCategory(id.toString());

      expect(activateSpy).toHaveBeenCalledWith([id.toString()]);
      expect(res.affectedCount).toBe(1);
    });

    it('throws 400 when the parent is inactive', async () => {
      const id = new Types.ObjectId();
      const parentId = new Types.ObjectId();
      const child = makeCat({ _id: id, name: 'Child', parent: parentId });
      const parent = makeCat({ _id: parentId, name: 'Parent', isActive: false });
      jest.spyOn(repo, 'findById').mockImplementation(async (x: string) =>
        x === id.toString() ? child : x === parentId.toString() ? parent : null,
      );

      await expect(service.activateCategory(id.toString())).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe('deleteCategory (cascade)', () => {
    it('deletes the category plus its descendants', async () => {
      const id = new Types.ObjectId();
      const d1 = makeCat();
      jest.spyOn(repo, 'findById').mockResolvedValue(makeCat({ _id: id, name: 'Root' }));
      jest.spyOn(repo, 'findDescendants').mockResolvedValue([d1]);
      const deleteSpy = jest.spyOn(repo, 'deleteMany').mockResolvedValue(2);

      const res = await service.deleteCategory(id.toString());

      expect(deleteSpy.mock.calls[0][0]).toEqual([id.toString(), d1._id.toString()]);
      expect(res.affectedCount).toBe(2);
    });
  });

  describe('getCategoryById', () => {
    it('returns the category with an ordered ancestor chain + parentCategory', async () => {
      const id = new Types.ObjectId();
      const ancestorId = new Types.ObjectId();
      jest
        .spyOn(repo, 'findById')
        .mockResolvedValue(makeCat({ _id: id, parent: ancestorId, ancestors: [ancestorId] }));
      jest.spyOn(repo, 'findByIds').mockResolvedValue([makeCat({ _id: ancestorId, name: 'Parent' })]);

      const res = await service.getCategoryById(id.toString());

      expect(res.ancestorChain).toHaveLength(1);
      expect(res.ancestorChain[0].name).toBe('Parent');
      expect(res.parentCategory?.name).toBe('Parent');
    });

    it('throws 404 when not found', async () => {
      jest.spyOn(repo, 'findById').mockResolvedValue(null);
      await expect(
        service.getCategoryById(new Types.ObjectId().toString()),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('searchCategories', () => {
    it('returns paginated results with correct pagination meta', async () => {
      jest.spyOn(repo, 'searchByNamePaginated').mockResolvedValue([makeCat({ name: 'Watch' })]);
      jest.spyOn(repo, 'countSearchResults').mockResolvedValue(1);
      jest.spyOn(repo, 'findByIds').mockResolvedValue([]);

      const res = await service.searchCategories('wat', 1, 10);

      expect(res.data).toHaveLength(1);
      expect(res.pagination).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });
  });
});
