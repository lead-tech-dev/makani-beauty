import { Controller, Get, Header, NotFoundException, Query } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { PrerenderService } from './prerender.service';

@ApiExcludeController()
@Controller('_prerender')
export class PrerenderController {
  constructor(private readonly service: PrerenderService) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'public, max-age=300')
  @Header('X-Robots-Tag', 'index, follow')
  async render(@Query('url') url: string): Promise<string> {
    if (!url) throw new NotFoundException('Missing url query parameter');
    return this.service.renderForPath(url);
  }
}
