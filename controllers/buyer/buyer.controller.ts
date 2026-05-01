import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Query,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuyerService } from '../../services/buyer/buyer.service';
import { GuestRequestType } from '@prisma/client';

@ApiTags('Buyer')
@Controller('buyer')
export class BuyerController {
  constructor(private buyerService: BuyerService) {}

  @ApiOperation({ summary: 'Get Shoppable Feed (Following or Explore)' })
  @Get('feed')
  async getFeed(
    @Query('userId') userId: string,
    @Query('tab') tab: 'Following' | 'Explore' = 'Explore',
  ) {
    return await this.buyerService.getFeed(userId, tab);
  }

  @ApiOperation({ summary: 'Get Ad Landing Page Data' })
  @Get('adz/:id')
  async getAd(@Param('id') id: string) {
    return await this.buyerService.getAd(id);
  }

  @ApiOperation({ summary: 'Follow a Creator or Supplier' })
  @Post('follow/:id')
  async follow(@Body('userId') userId: string, @Param('id') targetId: string) {
    return await this.buyerService.followUser(userId, targetId);
  }

  @ApiOperation({ summary: 'Unfollow a Creator or Supplier' })
  @Delete('follow/:id')
  async unfollow(
    @Query('userId') userId: string,
    @Param('id') targetId: string,
  ) {
    return await this.buyerService.unfollowUser(userId, targetId);
  }

  @ApiOperation({ summary: 'Save a Session for later' })
  @Post('save/:id')
  async save(@Body('userId') userId: string, @Param('id') sessionId: string) {
    return await this.buyerService.saveSession(userId, sessionId);
  }

  @ApiOperation({ summary: 'Unsave a Session' })
  @Delete('save/:id')
  async unsave(
    @Query('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.buyerService.unsaveSession(userId, sessionId);
  }

  @ApiOperation({ summary: 'Get Watch History' })
  @Get('history')
  async getHistory(@Query('userId') userId: string) {
    return await this.buyerService.getWatchHistory(userId);
  }

  @ApiOperation({ summary: 'Record a session watch' })
  @Post('history/:id')
  async recordWatch(
    @Body('userId') userId: string,
    @Param('id') sessionId: string,
  ) {
    return await this.buyerService.recordWatch(userId, sessionId);
  }

  @ApiOperation({ summary: 'Get Giveaway Wins' })
  @Get('wins')
  async getWins(@Query('userId') userId: string) {
    return await this.buyerService.getGiveawayWins(userId);
  }

  @ApiOperation({ summary: 'Get Supplier Performance Metrics' })
  @Get('performance/:supplierId')
  async getPerformance(@Param('supplierId') supplierId: string) {
    return await this.buyerService.getSupplierPerformance(supplierId);
  }

  @ApiOperation({ summary: 'Request to join live (Audio or Video)' })
  @Post('request-live/:id')
  async requestLive(
    @Body('userId') userId: string,
    @Param('id') sessionId: string,
    @Body('type') type: GuestRequestType = 'VIDEO',
    @Body('note') note?: string,
  ) {
    return await this.buyerService.submitJoinRequest(
      userId,
      sessionId,
      type,
      note,
    );
  }

  @ApiOperation({ summary: 'Get buyer addresses' })
  @Get('addresses')
  async getAddresses(@Query('userId') userId: string) {
    return await this.buyerService.getAddresses(userId);
  }

  @ApiOperation({ summary: 'Create new address' })
  @Post('addresses')
  async createAddress(@Body('userId') userId: string, @Body() data: any) {
    return await this.buyerService.createAddress(userId, data);
  }

  @ApiOperation({ summary: 'Get order history' })
  @Get('orders')
  async getOrders(@Query('userId') userId: string) {
    return await this.buyerService.getOrders(userId);
  }

  @ApiOperation({ summary: 'Create a new order' })
  @Post('orders')
  async createOrder(
    @Body('userId') userId: string,
    @Body('sessionId') sessionId: string,
    @Body('items')
    items: { productId: string; quantity: number; price: number }[],
    @Body('total') total: number,
    @Body('addressId') addressId?: string,
  ) {
    return await this.buyerService.createOrder(
      userId,
      sessionId,
      items,
      total,
      addressId,
    );
  }

  @ApiOperation({ summary: 'Create a watch together room' })
  @Post('rooms')
  async createRoom(
    @Body('userId') userId: string,
    @Body('sessionId') sessionId: string,
  ) {
    return await this.buyerService.createWatchRoom(userId, sessionId);
  }

  @ApiOperation({ summary: 'Claim a giveaway prize' })
  @Post('giveaways/:id/claim')
  async claimGiveaway(
    @Body('userId') userId: string,
    @Param('id') giveawayId: string,
    @Body('note') claimNote?: string,
  ) {
    return await this.buyerService.claimGiveaway(userId, giveawayId, claimNote);
  }

  @ApiOperation({
    summary: 'Global search for sessions, products, and creators',
  })
  @Get('search')
  async search(
    @Query('q') query: string,
    @Query('filter') filter: 'All' | 'Live' | 'Products' = 'All',
  ) {
    return await this.buyerService.globalSearch(query, filter);
  }

  @ApiOperation({ summary: 'Update buyer preferences (theme, currency, etc)' })
  @Patch('settings')
  async updateSettings(
    @Body('userId') userId: string,
    @Body('preferences') preferences: any,
  ) {
    return await this.buyerService.updatePreferences(userId, preferences);
  }

  @ApiOperation({ summary: 'Get persistent shopping cart' })
  @Get('cart')
  async getCart(@Query('userId') userId: string) {
    return await this.buyerService.getCart(userId);
  }

  @ApiOperation({ summary: 'Add item to persistent cart' })
  @Post('cart')
  async addToCart(
    @Body('userId') userId: string,
    @Body('productId') productId: string,
    @Body('quantity') quantity?: number,
    @Body('sessionId') sessionId?: string,
  ) {
    return await this.buyerService.addToCart(
      userId,
      productId,
      quantity,
      sessionId,
    );
  }

  @ApiOperation({ summary: 'Remove item from cart' })
  @Delete('cart/:productId')
  async removeFromCart(
    @Query('userId') userId: string,
    @Param('productId') productId: string,
  ) {
    return await this.buyerService.removeFromCart(userId, productId);
  }

  @ApiOperation({ summary: 'Clear entire cart' })
  @Delete('cart')
  async clearCart(@Query('userId') userId: string) {
    return await this.buyerService.clearCart(userId);
  }

  @ApiOperation({ summary: 'Set or remove a reminder for an upcoming session' })
  @Post('reminders/:id')
  async setReminder(
    @Body('userId') userId: string,
    @Param('id') sessionId: string,
    @Body('enabled') enabled: boolean,
  ) {
    return await this.buyerService.setSessionReminder(
      userId,
      sessionId,
      enabled,
    );
  }

  @ApiOperation({ summary: 'Get all session reminders for a buyer' })
  @Get('reminders')
  async getReminders(@Query('userId') userId: string) {
    return await this.buyerService.getSessionReminders(userId);
  }
}
