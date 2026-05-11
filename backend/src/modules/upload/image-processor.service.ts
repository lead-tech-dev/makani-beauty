import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import sharp from 'sharp';
import { StorageService } from '../storage/storage.service';

const SIZES = [480, 800, 1600];
const QUALITY = 78;
const LQIP_WIDTH = 32;

export interface ProcessedImage {
  /** Largest variant URL (default src) */
  url: string;
  /** Comma-separated srcset like "url-480.webp 480w, url-800.webp 800w, ..." */
  srcset: string;
  /** Tiny base64 data URI for blur-up placeholder */
  lqip: string;
  /** Original image width in px */
  width: number;
  /** Original image height in px */
  height: number;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly storage: StorageService) {}

  async process(buffer: Buffer, baseUrl: string): Promise<ProcessedImage> {
    const id = uuid();
    const original = sharp(buffer, { failOn: 'error' }).rotate();
    const meta = await original.metadata();
    const origWidth = meta.width ?? 1600;
    const origHeight = meta.height ?? 1600;

    const variantWidths = SIZES.filter((w) => w <= origWidth);
    if (variantWidths.length === 0) variantWidths.push(origWidth);

    const srcsetParts: string[] = [];
    let largestUrl = '';

    for (const w of variantWidths) {
      const key = `${id}-${w}.webp`;
      const webp = await sharp(buffer)
        .rotate()
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
      const url = await this.storage.put(key, webp, 'image/webp', baseUrl);
      srcsetParts.push(`${url} ${w}w`);
      largestUrl = url;
    }

    const lqipBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: LQIP_WIDTH })
      .webp({ quality: 40 })
      .toBuffer();
    const lqip = `data:image/webp;base64,${lqipBuffer.toString('base64')}`;

    return {
      url: largestUrl,
      srcset: srcsetParts.join(', '),
      lqip,
      width: origWidth,
      height: origHeight,
    };
  }
}
