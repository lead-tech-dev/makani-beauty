import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly config: ConfigService) {}

  @Get('site-key')
  getSiteKey(): { siteKey: string | null; enabled: boolean } {
    const siteKey = this.config.get<string>('HCAPTCHA_SITE_KEY') ?? null;
    return { siteKey, enabled: !!siteKey };
  }
}
