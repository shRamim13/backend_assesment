import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env.config';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  blue: '\x1b[34m',
};

const statusColor = (s: number) =>
  s >= 500 ? colors.red : s >= 400 ? colors.yellow : s >= 300 ? colors.cyan : colors.green;

const methodColor = (m: string) =>
  ({ GET: colors.green, POST: colors.blue, PUT: colors.yellow, PATCH: colors.cyan, DELETE: colors.red }[m] ?? colors.reset);

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  if (config.nodeEnv === 'test') { next(); return; }

  const start = Date.now();

  res.on('finish', () => {
    const ms = Date.now() - start;
    const cached = res.getHeader('X-Cache') === 'HIT';

    console.log(
      `${colors.gray}[${new Date().toISOString()}]${colors.reset} ` +
      `${methodColor(req.method)}${req.method.padEnd(6)}${colors.reset} ` +
      `${req.originalUrl.padEnd(45)} ` +
      `${statusColor(res.statusCode)}${res.statusCode}${colors.reset} ` +
      `${colors.gray}(${ms}ms)${colors.reset}` +
      `${cached ? ` ${colors.cyan}[CACHE HIT]${colors.reset}` : ''}`
    );
  });

  next();
};
