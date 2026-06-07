import { buildTreeDFS } from '../src/utils/dfs.util';
import { ICategory } from '../src/types/category.types';

// buildTreeDFS only reads _id / parent / name / isActive / ancestors and calls
// .toString() on the id fields, so plain strings stand in for ObjectIds here.
const cat = (id: string, parent: string | null, name = id): ICategory =>
  ({ _id: id, name, parent, ancestors: [], isActive: true } as unknown as ICategory);

describe('buildTreeDFS', () => {
  it('returns an empty array for no categories', () => {
    expect(buildTreeDFS([])).toEqual([]);
  });

  it('returns flat roots when nothing has a parent', () => {
    const tree = buildTreeDFS([cat('a', null), cat('b', null)]);
    expect(tree).toHaveLength(2);
    expect(tree.every((n) => n.children.length === 0)).toBe(true);
  });

  it('nests children under their parent', () => {
    // a -> b -> c
    const tree = buildTreeDFS([cat('a', null), cat('b', 'a'), cat('c', 'b')]);
    expect(tree).toHaveLength(1);
    expect(tree[0]._id).toBe('a');
    expect(tree[0].children[0]._id).toBe('b');
    expect(tree[0].children[0].children[0]._id).toBe('c');
  });

  it('handles multiple children under one parent', () => {
    const tree = buildTreeDFS([cat('root', null), cat('x', 'root'), cat('y', 'root')]);
    expect(tree[0].children.map((c) => c._id).sort()).toEqual(['x', 'y']);
  });

  it('builds only the subtree when given a rootParentId', () => {
    // full set: a -> b -> c, but ask for the subtree rooted under "a"
    const all = [cat('a', null), cat('b', 'a'), cat('c', 'b')];
    const sub = buildTreeDFS(all, 'a');
    expect(sub).toHaveLength(1);
    expect(sub[0]._id).toBe('b');
    expect(sub[0].children[0]._id).toBe('c');
  });

  it('does not lose nodes regardless of input order (deep nesting)', () => {
    // intentionally shuffled, 5 levels deep
    const all = [cat('e', 'd'), cat('a', null), cat('c', 'b'), cat('d', 'c'), cat('b', 'a')];
    const tree = buildTreeDFS(all);
    let node = tree[0];
    const ids = [node._id];
    while (node.children.length) {
      node = node.children[0];
      ids.push(node._id);
    }
    expect(ids).toEqual(['a', 'b', 'c', 'd', 'e']);
  });
});
