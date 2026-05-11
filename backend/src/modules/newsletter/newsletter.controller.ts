import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { NewsletterService } from './newsletter.service';
import { SubscribeDto } from './dto/subscribe.dto';

@ApiTags('Newsletter')
@Controller('newsletter')
export class NewsletterController {
  constructor(private readonly service: NewsletterService) {}

  @Post('subscribe')
  @ApiOperation({ summary: 'Subscribe to the newsletter (sends a double opt-in email)' })
  subscribe(@Body() dto: SubscribeDto) {
    return this.service.subscribe(dto.email, dto.source);
  }

  @Get('confirm')
  @ApiOperation({ summary: 'Confirm a newsletter subscription via email link (issues a -5% welcome promo)' })
  confirm(@Query('token') token: string) {
    return this.service.confirm(token);
  }

  @Get('unsubscribe')
  @ApiOperation({ summary: 'Unsubscribe from the newsletter via signed token' })
  unsubscribe(@Query('token') token: string) {
    return this.service.unsubscribe(token);
  }
}
