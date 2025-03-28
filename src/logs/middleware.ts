import { Request, Response, NextFunction } from 'express';
import { logger } from './logger';
import crypto from 'crypto';

export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = crypto.randomBytes(4).toString('hex');
  const start = Date.now();

  logger.debug(`[${requestId}] ${req.method} ${req.path}`, {
    ip: req.ip,
    headers: {
      'user-agent': req.headers['user-agent'],
      referer: req.headers.referer,
    },
  });

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`, {
      status: res.statusCode,
      duration,
    });
  });

  next();
}

// Mark unused parameters with underscore
export function errorLogger(err: Error, _req: Request, _res: Response, next: NextFunction): void {
  logger.error(`Error: ${err.message}`, {
    error: err,
    stack: err.stack,
  });
  next(err);
}