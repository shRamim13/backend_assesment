export interface Category {
  _id: string;
  name: string;
  isActive: boolean;
  parent: string | null;
  ancestors: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CategoryTreeNode {
  _id: string;
  name: string;
  isActive: boolean;
  ancestors: string[];
  children: CategoryTreeNode[];
}

export interface CategoryWithAncestors extends Category {
  parentCategory: { _id: string; name: string; isActive: boolean } | null;
  ancestorChain: { _id: string; name: string; isActive: boolean }[];
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  pagination?: PaginationMeta;
  timestamp: string;
}

export interface DeactivationResult {
  affectedCount: number;
  categoryName: string;
}

export interface CreateCategoryDto {
  name: string;
  parentId?: string;
}

export interface BulkCreateDto {
  name: string;
  parentId?: string;
  children?: BulkCreateDto[];
}

export interface HealthStatus {
  status: string;
  environment: string;
  uptime: string;
  services: { mongodb: string; redis: string };
}
