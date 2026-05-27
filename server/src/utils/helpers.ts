import { Types } from 'mongoose';
import { ICategory, AncestorItem } from '../types/category.types';

export function createError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode });
}

export function buildAncestorChain(
  ancestorIds: Types.ObjectId[],
  ancestorDocs: ICategory[]
): AncestorItem[] {
  return ancestorIds.map((aid) => {
    const doc = ancestorDocs.find((a) => a._id.toString() === aid.toString());
    return {
      _id: aid.toString(),
      name: doc?.name ?? 'unknown',
      isActive: doc?.isActive ?? false,
    };
  });
}
