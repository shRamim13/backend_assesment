import { ICategory, CategoryTreeNode } from '../types/category.types';

export function buildTreeDFS(
  categories: ICategory[],
  parentId: string | null = null
): CategoryTreeNode[] {
  const result: CategoryTreeNode[] = [];

  const directChildren = categories.filter((cat) => {
    const p = cat.parent ? cat.parent.toString() : null;
    return p === parentId;
  });

  for (const child of directChildren) {
    result.push({
      _id: child._id.toString(),
      name: child.name,
      isActive: child.isActive,
      ancestors: child.ancestors.map((a) => a.toString()),
      children: buildTreeDFS(categories, child._id.toString()),
    });
  }

  return result;
}

export function collectDescendantIdsDFS(
  categories: ICategory[],
  rootId: string
): string[] {
  const ids: string[] = [];
  const stack = [rootId];

  while (stack.length > 0) {
    const currentId = stack.pop()!;

    const children = categories.filter(
      (cat) => cat.parent?.toString() === currentId
    );

    for (const child of children) {
      const childId = child._id.toString();
      ids.push(childId);
      stack.push(childId);
    }
  }

  return ids;
}
