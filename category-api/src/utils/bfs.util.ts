import { ICategory, CategoryTreeNode } from '../types/category.types';

export function buildTreeBFS(categories: ICategory[]): CategoryTreeNode[] {
  const nodeMap = new Map<string, CategoryTreeNode>();
  for (const cat of categories) {
    nodeMap.set(cat._id.toString(), {
      _id: cat._id.toString(),
      name: cat.name,
      isActive: cat.isActive,
      ancestors: cat.ancestors.map((a) => a.toString()),
      children: [],
    });
  }

  const roots: CategoryTreeNode[] = [];
  const queue: ICategory[] = [];

  for (const cat of categories) {
    if (cat.parent === null) {
      roots.push(nodeMap.get(cat._id.toString())!);
      queue.push(cat);
    }
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentNode = nodeMap.get(current._id.toString())!;

    const children = categories.filter(
      (c) => c.parent?.toString() === current._id.toString()
    );

    for (const child of children) {
      currentNode.children.push(nodeMap.get(child._id.toString())!);
      queue.push(child);
    }
  }

  return roots;
}
