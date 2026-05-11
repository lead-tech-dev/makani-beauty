import { ConsoleLogger, LoggerService, Injectable, Scope } from '@nestjs/common';

/**
 * Structured logger:
 *   - In production: emits JSON lines (one per call) — easy to ingest by Logtail/Loki/CloudWatch
 *   - In development: delegates to NestJS pretty-print ConsoleLogger
 *
 * Format (prod):
 *   { "ts": "2026-...", "level": "log|error|warn|debug", "ctx": "MyService",
 *     "msg": "...", "stack": "...", "data": {...} }
 *
 * Use it via NestJS Logger as usual:
 *   private readonly logger = new Logger(MyService.name);
 *   this.logger.log('something happened', 'MyService');
 */
@Injectable({ scope: Scope.TRANSIENT })
export class StructuredLogger extends ConsoleLogger implements LoggerService {
  private isProd(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  private emit(level: string, message: any, optionalParams: any[]): void {
    if (!this.isProd()) {
      // In dev, delegate to the pretty NestJS logger so we keep colors and formatting
      switch (level) {
        case 'error': super.error(message, ...optionalParams); break;
        case 'warn': super.warn(message, ...optionalParams); break;
        case 'debug': super.debug(message, ...optionalParams); break;
        case 'verbose': super.verbose(message, ...optionalParams); break;
        default: super.log(message, ...optionalParams);
      }
      return;
    }

    // Production: structured JSON
    const entry: Record<string, any> = {
      ts: new Date().toISOString(),
      level,
      ctx: optionalParams[optionalParams.length - 1] ?? this.context ?? null,
    };
    if (message instanceof Error) {
      entry.msg = message.message;
      entry.stack = message.stack;
    } else if (typeof message === 'object') {
      Object.assign(entry, message);
    } else {
      entry.msg = message;
    }
    process.stdout.write(JSON.stringify(entry) + '\n');
  }

  log(message: any, ...optionalParams: any[]): void {
    this.emit('log', message, optionalParams);
  }
  error(message: any, ...optionalParams: any[]): void {
    this.emit('error', message, optionalParams);
  }
  warn(message: any, ...optionalParams: any[]): void {
    this.emit('warn', message, optionalParams);
  }
  debug(message: any, ...optionalParams: any[]): void {
    this.emit('debug', message, optionalParams);
  }
  verbose(message: any, ...optionalParams: any[]): void {
    this.emit('verbose', message, optionalParams);
  }
}
