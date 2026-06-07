import { Types } from 'mongoose';
import { ICategory, AncestorItem } from '../types/category.types';

export function createError(message: string, statusCode: number): Error {
  return Object.assign(new Error(message), { statusCode });
}

export function buildAncestorChain(
  ancestorIds: Types.ObjectId[],
  ancestorDocs: ICategory[]
): AncestorItem[] {
  const docMap = new Map(
    ancestorDocs.map((doc) => [
      doc._id.toString(),
      doc,
    ])
  );

  return ancestorIds.map((aid) => {
    const doc = docMap.get(aid.toString());

    return {
      _id: aid.toString(),
      name: doc?.name ?? 'unknown',
      isActive: doc?.isActive ?? false,
    };
  });
}