import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CommerceService } from '../../services/commerce/commerce.service';

@ApiTags('studio')
@Controller('sessions/:id/commerce')
export class CommerceController {
  constructor(private commerceService: CommerceService) {}

  @ApiOperation({ summary: 'Pin a product to the stage for all viewers' })
  @Post('products/:productId/pin')
  async pinProduct(
    @Param('id') sessionId: string,
    @Param('productId') productId: string,
  ) {
    return await this.commerceService.pinProduct(sessionId, productId);
  }

  @ApiOperation({ summary: 'Update product sales goal' })
  @Post('products/:productId/goal')
  async updateGoal(
    @Param('id') sessionId: string,
    @Param('productId') productId: string,
    @Body('metric') metric: string,
    @Body('target') target: number,
  ) {
    return await this.commerceService.updateProductGoal(
      sessionId,
      productId,
      metric,
      target,
    );
  }

  @ApiOperation({ summary: 'Launch a timed Flash Sale' })
  @Post('flash-sale')
  async launchFlashSale(
    @Param('id') sessionId: string,
    @Body('productId') productId: string,
    @Body('discountPct') discountPct: number,
  ) {
    return await this.commerceService.launchFlashSale(
      sessionId,
      productId,
      discountPct,
    );
  }

  @ApiOperation({ summary: 'Get products for the session campaign' })
  @Get('products')
  async getProducts(@Param('id') sessionId: string) {
    // For now, assuming campaignId is passed or known
    return await this.commerceService.getProducts(sessionId); // Using sessionId as a placeholder
  }

  @ApiOperation({ summary: 'Generate a new coupon code' })
  @Post('coupons')
  async createCoupon(
    @Param('id') sessionId: string,
    @Body('productId') productId?: string,
    @Body('discountPct') discountPct?: number,
  ) {
    return await this.commerceService.createCoupon(
      sessionId,
      productId,
      discountPct,
    );
  }

  @ApiOperation({ summary: 'Get all coupons for the session' })
  @Get('coupons')
  async getCoupons(@Param('id') sessionId: string) {
    return await this.commerceService.getCoupons(sessionId);
  }

  @ApiOperation({ summary: 'Get live sales feed for the session' })
  @Get('sales-feed')
  async getSalesFeed(@Param('id') sessionId: string) {
    return await this.commerceService.getSalesFeed(sessionId);
  }

  @ApiOperation({ summary: 'Sync session-linked items from master catalog' })
  @Post('sync')
  async sync(@Param('id') sessionId: string) {
    return await this.commerceService.syncProducts(sessionId);
  }

  @ApiOperation({ summary: 'List all available suppliers' })
  @Get('suppliers')
  async getSuppliers() {
    return await this.commerceService.getSuppliers();
  }
}
