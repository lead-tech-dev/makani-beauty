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

  /**
   * Liveness probe — must respond fast, ZERO external dependencies.
   * Render / Koyeb / Fly use this to decide whether the container should keep
   * running; a slow or flaky upstream (Neon autopause, R2 outage, …) must not
   * cause the container to be killed and restarted, which would amplify the
   * outage.
   */
  @Get()
  @Header('Cache-Control', 'no-store')
  liveness() {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.bootedAt.getTime()) / 1000),
      bootedAt: this.bootedAt.toISOString(),
      version: process.env.SENTRY_RELEASE ?? 'dev',
    };
  }

  /**
   * Readiness probe — runs the actual DB + filesystem checks. Use this for
   * monitoring dashboards (UptimeRobot etc.) or for orchestrators that need
   * to drain traffic when a dep degrades. Returns 503 if any check fails.
   */
  @Get('ready')
  @Header('Cache-Control', 'no-store')
  async readiness() {
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
