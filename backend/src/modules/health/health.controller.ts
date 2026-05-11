import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';

/**
 * Lightweight liveness + readiness endpoint.
 *
 * Used by uptime monitoring (UptimeRobot / BetterUptime / Cloudflare Health Checks)
 * and by the deployment platform (Render, Railway, Vercel) for healthchecks.
 *
 * Excluded from the /api prefix so it's available at /health (shorter URL).
 */
@ApiExcludeController()
@Controller('health')
export class HealthController {
  private readonly bootedAt = new Date();

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  async check() {
    const checks = {
      db: await this.checkDb(),
      uploads: this.checkUploadsWritable(),
    };

    const healthy = Object.values(checks).every((c) => c.ok);
    if (!healthy) {
      throw new ServiceUnavailableException({
        status: 'unhealthy',
        checks,
        uptimeSeconds: Math.floor((Date.now() - this.bootedAt.getTime()) / 1000),
        bootedAt: this.bootedAt.toISOString(),
      });
    }

    return {
      status: 'ok',
      checks,
      uptimeSeconds: Math.floor((Date.now() - this.bootedAt.getTime()) / 1000),
      bootedAt: this.bootedAt.toISOString(),
      version: process.env.SENTRY_RELEASE ?? 'dev',
    };
  }

  private async checkDb(): Promise<{ ok: boolean; message?: string }> {
    try {
      await this.dataSource.query('SELECT 1');
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.message ?? 'unknown' };
    }
  }

  private checkUploadsWritable(): { ok: boolean; message?: string } {
    // In S3 mode the local filesystem isn't used by the storage layer; skip the probe.
    if (process.env.STORAGE_DRIVER === 's3') {
      return { ok: true, message: 'skipped: storage driver is s3' };
    }
    try {
      const dir = './uploads';
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      const probe = join(dir, '.health-probe');
      writeFileSync(probe, String(Date.now()));
      unlinkSync(probe);
      return { ok: true };
    } catch (err: any) {
      return { ok: false, message: err?.message ?? 'unknown' };
    }
  }
}
