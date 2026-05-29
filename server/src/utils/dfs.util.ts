import { ICategory, CategoryTreeNode } from '../types/category.types';

export function buildTreeDFS(
  categories: ICategory[],
  rootParentId: string | null = null
): CategoryTreeNode[] {
  // Build adjacency list for O(N) grouping
  const adjacencyList = new Map<string | null, ICategory[]>();
  
  for (const cat of categories) {
    const pId = cat.parent ? cat.parent.toString() : null;
    if (!adjacencyList.has(pId)) {
      adjacencyList.set(pId, []);
    }
    adjacencyList.get(pId)!.push(cat);
  }

  // Inner recursive traverse utilizing O(1) Map lookups
  function traverse(parentId: string | null): CategoryTreeNode[] {
    const children = adjacencyList.get(parentId) || [];
    return children.map((child) => ({
      _id: child._id.toString(),
      name: child.name,
      isActive: child.isActive,
      ancestors: child.ancestors.map((a) => a.toString()),
      children: traverse(child._id.toString()),
    }));
  }

  return traverse(rootParentId);
}
