export const ERR = {
  CATEGORY_NOT_FOUND: 'Category not found',
  PARENT_NOT_FOUND: 'Parent category not found',
  PARENT_INACTIVE: 'Cannot add a child to an inactive parent category',
  PARENT_INACTIVE_ACTIVATE: (child: string, parent: string) => `Cannot activate "${child}": parent "${parent}" is inactive. Activate the parent first.`,
  NAME_REQUIRED: 'Category name is required',
  NAME_MIN_LENGTH: 'Name must be at least 2 characters',
  NAME_MAX_LENGTH: 'Name cannot exceed 100 characters',
  INVALID_PARENT_ID: 'Invalid parentId format',
  INVALID_ID_FORMAT: 'Invalid category ID format',
  SEARCH_QUERY_REQUIRED: 'Search query "name" is required',
  ROUTE_NOT_FOUND: (method: string, url: string) => `Route ${method} ${url} not found`,
  DUPLICATE_NAME: (name: string) => `Category "${name}" already exists`,
} as const;

export const MSG = {
  CATEGORIES_FETCHED: 'Categories fetched successfully',
  CATEGORY_FETCHED: 'Category fetched successfully',
  CATEGORY_TREE_FETCHED: 'Category tree fetched successfully',
  CATEGORY_CREATED: 'Category created successfully',
  CATEGORIES_CREATED: 'Categories created successfully',
  CATEGORY_UPSERTED: 'Category upserted successfully',
  CATEGORY_UPDATED: 'Category updated successfully',
  CATEGORY_DELETED: (name: string, count: number) => {
    const childCount = count - 1;
    return childCount > 0
      ? `"${name}" and ${childCount} children deleted`
      : `"${name}" deleted`;
  },
  CATEGORY_DEACTIVATED: (name: string, count: number) => {
    const childCount = count - 1;
    return childCount > 0 
      ? `"${name}" and ${childCount} children deactivated`
      : `"${name}" deactivated`;
  },
  CATEGORY_ACTIVATED: (name: string) => `"${name}" activated successfully`,
  SEARCH_RESULTS: 'Search results fetched successfully',
} as const;
