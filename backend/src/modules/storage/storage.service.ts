import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';

type StorageDriver = 'filesystem' | 's3';

/**
 * Single abstraction over local filesystem (dev) and Cloudflare R2 / any S3-compatible
 * bucket (prod). Returns publicly retrievable URLs so callers can persist them in DB
 * without caring about the underlying provider.
 *
 * Env:
 *   STORAGE_DRIVER=filesystem | s3              (default filesystem)
 *   R2_ENDPOINT=https://<account>.r2.cloudflarestorage.com
 *   R2_ACCESS_KEY_ID=<token id>
 *   R2_SECRET_ACCESS_KEY=<token secret>
 *   R2_BUCKET=<bucket name>
 *   R2_PUBLIC_URL=https://pub-<hash>.r2.dev  (or custom domain)
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: StorageDriver;
  private client?: S3Client;
  private bucket?: string;
  private publicUrl?: string;
  private readonly localDir = './uploads';

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('STORAGE_DRIVER') ?? 'filesystem';
    this.driver = raw === 's3' ? 's3' : 'filesystem';
  }

  onModuleInit() {
    if (this.driver === 's3') {
      const endpoint = this.config.get<string>('R2_ENDPOINT');
      const accessKeyId = this.config.get<string>('R2_ACCESS_KEY_ID');
      const secretAccessKey = this.config.get<string>('R2_SECRET_ACCESS_KEY');
      const bucket = this.config.get<string>('R2_BUCKET');
      const publicUrl = this.config.get<string>('R2_PUBLIC_URL');

      const missing: string[] = [];
      if (!endpoint) missing.push('R2_ENDPOINT');
      if (!accessKeyId) missing.push('R2_ACCESS_KEY_ID');
      if (!secretAccessKey) missing.push('R2_SECRET_ACCESS_KEY');
      if (!bucket) missing.push('R2_BUCKET');
      if (!publicUrl) missing.push('R2_PUBLIC_URL');
      if (missing.length > 0) {
        throw new Error(
          `StorageService driver=s3 requires env vars: ${missing.join(', ')}`,
        );
      }

      this.client = new S3Client({
        region: 'auto',
        endpoint,
        credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
      });
      this.bucket = bucket!;
      this.publicUrl = publicUrl!.replace(/\/$/, '');
      this.logger.log(`Storage driver: s3 (bucket=${this.bucket})`);
    } else {
      if (!fsSync.existsSync(this.localDir)) {
        fsSync.mkdirSync(this.localDir, { recursive: true });
      }
      this.logger.log(`Storage driver: filesystem (${this.localDir})`);
    }
  }

  isS3(): boolean {
    return this.driver === 's3';
  }

  /**
   * Persist bytes under `key` and return a publicly retrievable URL.
   *
   * - S3 mode  → absolute URL (`https://pub-…/key`).
   * - Filesystem mode → `${baseUrl}/uploads/${key}` if `baseUrl` provided,
   *   otherwise relative `/uploads/${key}` (served by ServeStaticModule).
   */
  async put(
    key: string,
    body: Buffer | Uint8Array,
    contentType: string,
    baseUrl?: string,
  ): Promise<string> {
    if (this.driver === 's3') {
      await this.client!.send(
        new PutObjectCommand({
          Bucket: this.bucket!,
          Key: key,
          Body: body,
          ContentType: contentType,
        }),
      );
      return `${this.publicUrl}/${key}`;
    }

    const fullPath = path.join(this.localDir, key);
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, body);
    return baseUrl ? `${baseUrl}/uploads/${key}` : `/uploads/${key}`;
  }

  /**
   * Read bytes back by storage key (NOT URL — use {@link keyFromUrl} first).
   */
  async get(key: string): Promise<Buffer> {
    if (this.driver === 's3') {
      const response = await this.client!.send(
        new GetObjectCommand({ Bucket: this.bucket!, Key: key }),
      );
      const bytes = await response.Body!.transformToByteArray();
      return Buffer.from(bytes);
    }
    return fs.readFile(path.join(this.localDir, key));
  }

  /**
   * Strip the public URL prefix (or `/uploads/`) from a stored URL and return
   * the bare storage key suitable for {@link get}.
   */
  keyFromUrl(url: string): string {
    if (this.driver === 's3' && this.publicUrl && url.startsWith(this.publicUrl)) {
      return url.slice(this.publicUrl.length).replace(/^\//, '');
    }
    const marker = '/uploads/';
    const idx = url.indexOf(marker);
    if (idx !== -1) return url.slice(idx + marker.length);
    return url;
  }
}
