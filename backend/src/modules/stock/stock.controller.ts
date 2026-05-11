import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { StockService } from './stock.service';
import { StockMovement } from './stock-movement.entity';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';

@ApiTags('Stock')
@Controller('products/:productId/stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Get()
  @ApiOperation({ summary: 'Get stock movement history for a product' })
  @ApiResponse({ status: 200, type: [StockMovement] })
  getHistory(@Param('productId') productId: string): Promise<StockMovement[]> {
    return this.stockService.getHistory(productId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a stock movement (in / out / adjustment)' })
  @ApiResponse({ status: 201, type: StockMovement })
  addMovement(
    @Param('productId') productId: string,
    @Body() dto: CreateStockMovementDto,
  ): Promise<StockMovement> {
    return this.stockService.addMovement(productId, dto);
  }
}
