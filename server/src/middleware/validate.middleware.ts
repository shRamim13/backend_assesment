import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { ResponseBuilder } from '../utils/response.util';
import { ERR } from '../constants/messages';

const isValidObjectId = (id: string) => Types.ObjectId.isValid(id);

/** Validates request body for create and bulk endpoints. */
export const validateCreate = (req: Request, res: Response, next: NextFunction): void => {
  const { name, parentId } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.NAME_REQUIRED));
    return;
  }
  if (name.trim().length < 2) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.NAME_MIN_LENGTH));
    return;
  }
  if (name.trim().length > 100) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.NAME_MAX_LENGTH));
    return;
  }
  if (parentId !== undefined && !isValidObjectId(parentId)) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.INVALID_PARENT_ID));
    return;
  }

  next();
};

/** Validates request body for update endpoints. */
export const validateUpdate = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.NAME_REQUIRED));
    return;
  }
  if (name.trim().length > 100) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.NAME_MAX_LENGTH));
    return;
  }

  next();
};

/** Validates that a search query parameter is present. */
export const validateSearch = (req: Request, res: Response, next: NextFunction): void => {
  const { name } = req.query;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.SEARCH_QUERY_REQUIRED));
    return;
  }
  next();
};

/** Validates that a route parameter is a valid MongoDB ObjectId. */
export const validateObjectId = (req: Request, res: Response, next: NextFunction): void => {
  if (!isValidObjectId(req.params.id)) {
    res.status(400).json(ResponseBuilder.badRequest(ERR.INVALID_ID_FORMAT));
    return;
  }
  next();
};
