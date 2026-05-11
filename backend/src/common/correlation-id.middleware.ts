import { Injectable, NestMiddleware } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import type { Request, Response, NextFunction } from 'express';

declare module 'express' {
  interface Request {
    correlationId?: string;
  }
}

/**
 * Generates a UUID for each incoming request and attaches it to:
 *   - req.correlationId (accessible everywhere via DI)
 *   - res header `x-request-id` (visible to clients for support)
 *   - all subsequent log lines via async_hooks (see StructuredLogger)
 *
 * If the client already sent x-request-id, we honor it (useful for tracing
 * across our reverse proxy / CDN).
 */
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const incoming = (req.headers['x-request-id'] as string | undefined)?.slice(0, 64);
    const id = incoming || uuid();
    req.correlationId = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
