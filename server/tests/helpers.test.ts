import { Types } from 'mongoose';
import { buildAncestorChain, createError } from '../src/utils/helpers';
import { ICategory } from '../src/types/category.types';

const doc = (id: Types.ObjectId, name: string, isActive = true): ICategory =>
  ({ _id: id, name, isActive } as unknown as ICategory);

describe('buildAncestorChain', () => {
  it('returns an empty chain when there are no ancestors', () => {
    expect(buildAncestorChain([], [])).toEqual([]);
  });

  it('preserves ancestor order (root -> direct parent)', () => {
    const root = new Types.ObjectId();
    const mid = new Types.ObjectId();
    const docs = [doc(mid, 'Mid'), doc(root, 'Root')]; // docs unordered on purpose
    const chain = buildAncestorChain([root, mid], docs);
    expect(chain.map((c) => c.name)).toEqual(['Root', 'Mid']);
  });

  it('falls back to "unknown"/inactive when an ancestor doc is missing', () => {
    const missing = new Types.ObjectId();
    const chain = buildAncestorChain([missing], []);
    expect(chain[0]).toMatchObject({ name: 'unknown', isActive: false });
    expect(chain[0]._id).toBe(missing.toString());
  });

  it('carries through the isActive flag of each ancestor', () => {
    const a = new Types.ObjectId();
    const chain = buildAncestorChain([a], [doc(a, 'Inactive', false)]);
    expect(chain[0].isActive).toBe(false);
  });
});

describe('createError', () => {
  it('attaches a statusCode to the Error', () => {
    const err = createError('nope', 404) as Error & { statusCode: number };
    expect(err.message).toBe('nope');
    expect(err.statusCode).toBe(404);
  });
});
