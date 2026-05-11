import { BadRequestException, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

const HCAPTCHA_VERIFY_URL = 'https://api.hcaptcha.com/siteverify';

/**
 * hCaptcha verification.
 *
 * Privacy-friendly alternative to reCAPTCHA — no Google, RGPD-compliant by default.
 *
 * Mock mode (always passes) when HCAPTCHA_SECRET is not set.
 */
@Injectable()
export class CaptchaService implements OnModuleInit {
  private readonly logger = new Logger(CaptchaService.name);
  private secret: string | null = null;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.secret = this.config.get<string>('HCAPTCHA_SECRET') ?? null;
    if (!this.secret) {
      this.logger.warn(
        'hCaptcha running in MOCK mode — set HCAPTCHA_SECRET in .env to enable verification.',
      );
    }
  }

  get isEnabled(): boolean {
    return !!this.secret;
  }

  /**
   * Verify a hCaptcha token. Throws BadRequestException if invalid.
   * In mock mode, always succeeds (useful for dev/staging without keys).
   */
  async verify(token: string | undefined, remoteIp?: string): Promise<void> {
    if (!this.isEnabled) return; // mock mode

    if (!token) {
      throw new BadRequestException('Captcha manquant');
    }

    try {
      const params = new URLSearchParams({
        secret: this.secret!,
        response: token,
      });
      if (remoteIp) params.set('remoteip', remoteIp);

      const res = await fetch(HCAPTCHA_VERIFY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = (await res.json()) as { success: boolean; 'error-codes'?: string[] };
      if (!data.success) {
        this.logger.warn(`hCaptcha verification failed: ${data['error-codes']?.join(',')}`);
        throw new BadRequestException('Captcha invalide — réessayez');
      }
    } catch (err: any) {
      if (err instanceof BadRequestException) throw err;
      this.logger.warn(`hCaptcha network error: ${err.message}`);
      // Fail-open in case of hCaptcha service outage — better than blocking all signups
    }
  }
}
