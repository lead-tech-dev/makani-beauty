import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import type { Request, Response } from 'express';

/**
 * Global exception filter that:
 *   - Forwards 5xx errors to Sentry
 *   - Logs structured error info
 *   - Skips 4xx (validation errors, not found, etc.) to avoid alerting noise
 *   - Falls back to NestJS default behavior for the response
 */
@Catch()
export class SentryExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const isHttp = exception instanceof HttpException;
    const status = isHttp ? exception.getStatus() : 500;

    // Send 5xx to Sentry with request context
    if (status >= 500) {
      Sentry.withScope((scope) => {
        scope.setTag('method', req.method);
        scope.setTag('url', req.url);
        const userId = (req as any).user?.id;
        if (userId) scope.setUser({ id: userId });
        Sentry.captureException(exception);
      });
    }

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url} → ${status}: ${(exception as Error)?.message}`, (exception as Error)?.stack);
    }

    // Delegate response formatting to NestJS default (HttpException's getResponse / ExceptionsHandler)
    if (isHttp) {
      const body = exception.getResponse();
      res.status(status).json(typeof body === 'string' ? { message: body } : body);
    } else {
      res.status(500).json({ statusCode: 500, message: 'Internal server error' });
    }
  }
}
