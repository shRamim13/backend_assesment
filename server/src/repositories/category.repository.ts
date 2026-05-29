import { Types } from 'mongoose';
import { Category } from '../models/category.model';
import { ICategory, CreateCategoryDto } from '../types/category.types';

export class CategoryRepository {
  async create(dto: CreateCategoryDto & { ancestors: Types.ObjectId[] }): Promise<ICategory> {
    const category = new Category({
      name: dto.name.trim(),
      parent: dto.parentId ? new Types.ObjectId(dto.parentId) : null,
      ancestors: dto.ancestors,
    });
    return category.save();
  }

  async findAll(): Promise<ICategory[]> {
    return Category.find().sort({ createdAt: 1 }).lean() as Promise<ICategory[]>;
  }

  async findAllPaginated(page: number, limit: number): Promise<ICategory[]> {
    return Category.find()
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<ICategory[]>;
  }

  async countAll(): Promise<number> {
    return Category.countDocuments();
  }

  async findRootsPaginated(page: number, limit: number): Promise<ICategory[]> {
    return Category.find({ parent: null })
      .sort({ createdAt: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<ICategory[]>;
  }

  async countRoots(): Promise<number> {
    return Category.countDocuments({ parent: null });
  }

  async findDescendantsOfIds(ids: string[]): Promise<ICategory[]> {
    return Category.find({ ancestors: { $in: ids } }).lean() as Promise<ICategory[]>;
  }

  async findById(id: string): Promise<ICategory | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    return Category.findById(id).lean() as Promise<ICategory | null>;
  }

  async findByIds(ids: Types.ObjectId[]): Promise<ICategory[]> {
    return Category.find({ _id: { $in: ids } }).lean() as Promise<ICategory[]>;
  }

  async findDescendants(id: string): Promise<ICategory[]> {
    return Category.find({ ancestors: id }).lean() as Promise<ICategory[]>;
  }

  async findChildren(parentId: string): Promise<ICategory[]> {
    return Category.find({ parent: parentId }).lean() as Promise<ICategory[]>;
  }

  async findByName(name: string): Promise<ICategory | null> {
    return Category.findOne({ name }).lean() as Promise<ICategory | null>;
  }

  async searchByName(term: string): Promise<ICategory[]> {
    return Category.find(
      { $text: { $search: term } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .lean() as Promise<ICategory[]>;
  }

  async searchByNamePaginated(term: string, page: number, limit: number): Promise<ICategory[]> {
    return Category.find(
      { $text: { $search: term } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean() as Promise<ICategory[]>;
  }

  async countSearchResults(term: string): Promise<number> {
    return Category.countDocuments({ $text: { $search: term } });
  }

  async updateName(id: string, name: string): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(
      id,
      { name: name.trim() },
      { new: true, runValidators: true },
    ).lean() as Promise<ICategory | null>;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Category.findByIdAndDelete(id);
    return result !== null;
  }

  async deactivateMany(ids: string[]): Promise<number> {
    const result = await Category.updateMany({ _id: { $in: ids } }, { isActive: false });
    return result.modifiedCount;
  }

  async activateMany(ids: string[]): Promise<number> {
    const result = await Category.updateMany({ _id: { $in: ids } }, { isActive: true });
    return result.modifiedCount;
  }

  async activateById(id: string): Promise<ICategory | null> {
    return Category.findByIdAndUpdate(id, { isActive: true }, { new: true }).lean() as Promise<ICategory | null>;
  }

  async deleteMany(ids: string[]): Promise<number> {
    const result = await Category.deleteMany({ _id: { $in: ids } });
    return result.deletedCount;
  }

  async countChildren(parentId: string): Promise<number> {
    return Category.countDocuments({ parent: parentId });
  }
}
