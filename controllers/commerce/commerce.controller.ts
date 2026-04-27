import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommerceService } from '../../services/commerce/commerce.service';

@ApiTags('studio')
@Controller('sessions/:id/commerce')
export class CommerceController {
  constructor(private commerceService: CommerceService) {}

  @ApiOperation({ summary: 'Pin a product to the stage for all viewers' })
  @Post('products/:productId/pin')
  async pinProduct(@Param('id') sessionId: string, @Param('productId') productId: string) {
    return await this.commerceService.pinProduct(sessionId, productId);
  }

  @ApiOperation({ summary: 'Launch a timed Flash Sale' })
  @Post('flash-sale')
  async launchFlashSale(
    @Param('id') sessionId: string,
    @Body('productId') productId: string,
    @Body('discountPct') discountPct: number,
  ) {
    return await this.commerceService.launchFlashSale(sessionId, productId, discountPct);
  }

  @ApiOperation({ summary: 'Update product goal (target and metric)' })
  @Post('products/:productId/goal')
  async updateGoal(
    @Param('productId') productId: string,
    @Body() goal: { metric?: string, target?: number },
  ) {
    return await this.commerceService.updateProductGoal(productId, goal);
  }

  @ApiOperation({ summary: 'Get products for the session campaign' })
  @Get('products')
  async getProducts(@Param('id') sessionId: string) {
    // In a real app, we'd look up the campaignId for this sessionId first
    // For now, assuming campaignId is passed or known
    return await this.commerceService.getProducts(sessionId); // Using sessionId as a placeholder
  }
}
