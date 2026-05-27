import { Types, Document } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  parent: Types.ObjectId | null;
  ancestors: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name: string;
}

export interface AncestorItem {
  _id: string;
  name: string;
  isActive: boolean;
}

export interface CategoryWithAncestors {
  _id: string;
  name: string;
  isActive: boolean;
  parent: string | null;
  parentCategory: AncestorItem | null;
  ancestorChain: AncestorItem[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CategoryTreeNode {
  _id: string;
  name: string;
  isActive: boolean;
  ancestors: string[];
  children: CategoryTreeNode[];
}

export interface DeactivationResult {
  deactivatedCount: number;
  categoryName: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CreateCategoryBulkDto {
  name: string;
  parentId?: string;
  children?: CreateCategoryBulkDto[];
}
