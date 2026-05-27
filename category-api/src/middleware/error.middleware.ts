import { Request, Response, NextFunction } from 'express';
import { ResponseBuilder } from '../utils/response.util';
import { config } from '../config/env.config';
import { ERR } from '../constants/messages';

interface AppError extends Error {
  statusCode?: number;
  code?: number;
  keyValue?: Record<string, string>;
  errors?: Record<string, { message: string }>;
}

/** Global error handler. Catches all errors forwarded via next(err). */
export const errorMiddleware = (err: AppError, req: Request, res: Response, _next: NextFunction): void => {
  if (config.isDev) {
    console.error(`\n[${req.method}] ${req.originalUrl}`);
    console.error(err.stack);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    const value = (err.keyValue?.[field] as string) || 'unknown';
    res.status(409).json(ResponseBuilder.conflict(ERR.DUPLICATE_NAME(value)));
    return;
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    res.status(400).json(ResponseBuilder.badRequest(messages.join(', ')));
    return;
  }

  if (err.name === 'CastError') {
    res.status(400).json(ResponseBuilder.badRequest(ERR.INVALID_ID_FORMAT));
    return;
  }

  if (err.statusCode) {
    res.status(err.statusCode).json(ResponseBuilder.error(err.message, err.statusCode));
    return;
  }

  res.status(500).json(ResponseBuilder.error(config.isDev ? err.message : 'Internal Server Error'));
};
