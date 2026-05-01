import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { SessionKind, SessionStatus, GuestRequestType } from '@prisma/client';
import { SupplierService } from './supplier.service';

@Injectable()
export class BuyerService {
  constructor(
    private prismaService: PrismaService,
    private supplierService: SupplierService,
  ) {}

  async getFeed(userId: string, tab: 'Following' | 'Explore') {
    if (tab === 'Following') {
      const following = await this.prismaService.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);

      return await this.prismaService.session.findMany({
        where: {
          hostId: { in: followingIds },
          status: { not: 'ENDED' },
        },
        include: {
          host: true,
          campaign: { include: { supplier: true, products: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Explore: Return all active/scheduled sessions (Mix of LIVE and AD)
    return await this.prismaService.session.findMany({
      where: {
        status: { not: 'ENDED' },
      },
      include: {
        host: true,
        campaign: { include: { supplier: true, products: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async getAd(adId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: adId },
      include: {
        host: true,
        campaign: { include: { supplier: true, products: true } },
      },
    });

    if (!session) return null;

    // Map products to featuredItems for the UI
    return {
      ...session,
      featuredItems: session.campaign?.products || [],
    };
  }

  async followUser(followerId: string, followingId: string) {
    return await this.prismaService.follow.upsert({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      update: {},
      create: { followerId, followingId },
    });
  }

  async unfollowUser(followerId: string, followingId: string) {
    return await this.prismaService.follow.delete({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });
  }

  async saveSession(userId: string, sessionId: string) {
    return await this.prismaService.savedSession.upsert({
      where: {
        userId_sessionId: { userId, sessionId },
      },
      update: {},
      create: { userId, sessionId },
    });
  }

  async unsaveSession(userId: string, sessionId: string) {
    return await this.prismaService.savedSession.delete({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });
  }

  async getWatchHistory(userId: string) {
    return await this.prismaService.watchHistory.findMany({
      where: { userId },
      include: {
        session: {
          include: {
            host: true,
            campaign: { include: { supplier: true, products: true } },
          },
        },
      },
      orderBy: { lastWatched: 'desc' },
    });
  }

  async recordWatch(userId: string, sessionId: string) {
    return await this.prismaService.watchHistory.upsert({
      where: {
        userId_sessionId: { userId, sessionId },
      },
      update: { lastWatched: new Date() },
      create: { userId, sessionId },
    });
  }

  async getGiveawayWins(userId: string) {
    return await this.prismaService.giveawayWinner.findMany({
      where: { userId },
      include: {
        giveaway: {
          include: {
            session: { include: { host: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSupplierPerformance(supplierId: string) {
    return await this.supplierService.recalculateMetrics(supplierId);
  }

  async submitJoinRequest(
    userId: string,
    sessionId: string,
    type: GuestRequestType,
    note?: string,
  ) {
    return await this.prismaService.guestRequest.create({
      data: {
        userId,
        sessionId,
        type,
        note,
        status: 'PENDING',
      },
    });
  }

  async getAddresses(userId: string) {
    return await this.prismaService.address.findMany({
      where: { userId },
      orderBy: { isDefault: 'desc' },
    });
  }

  async createAddress(userId: string, data: any) {
    if (data.isDefault) {
      await this.prismaService.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }
    return await this.prismaService.address.create({
      data: { ...data, userId },
    });
  }

  async getOrders(userId: string) {
    return await this.prismaService.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
        address: true,
        session: { include: { host: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createOrder(
    userId: string,
    sessionId: string,
    items: any[],
    total: number,
    addressId?: string,
  ) {
    return await this.prismaService.order.create({
      data: {
        userId,
        sessionId,
        total,
        addressId,
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })),
        },
      },
      include: { items: true },
    });
  }

  async createWatchRoom(userId: string, sessionId: string) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    return await this.prismaService.watchRoom.create({
      data: {
        code,
        sessionId,
        hostId: userId,
        participants: { connect: { id: userId } },
      },
    });
  }

  async claimGiveaway(userId: string, giveawayId: string, claimNote?: string) {
    return await this.prismaService.giveawayWinner.update({
      where: { userId_giveawayId: { userId, giveawayId } },
      data: {
        status: 'Claimed',
        claimNote,
      },
    });
  }

  async globalSearch(
    query: string,
    filter: 'All' | 'Live' | 'Products' = 'All',
  ) {
    const term = query.toLowerCase();

    const results: any = {
      sessions: [],
      products: [],
      creators: [],
    };

    if (filter === 'All' || filter === 'Live') {
      results.sessions = await this.prismaService.session.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { note: { contains: term, mode: 'insensitive' } },
          ],
          status: { not: 'ENDED' },
        },
        include: { host: true, campaign: true },
        take: 10,
      });
    }

    if (filter === 'All' || filter === 'Products') {
      results.products = await this.prismaService.product.findMany({
        where: {
          OR: [
            { name: { contains: term, mode: 'insensitive' } },
            { description: { contains: term, mode: 'insensitive' } },
          ],
        },
        include: { campaign: true },
        take: 10,
      });
    }

    if (filter === 'All') {
      results.creators = await this.prismaService.user.findMany({
        where: {
          OR: [
            { fullName: { contains: term, mode: 'insensitive' } },
            { handle: { contains: term, mode: 'insensitive' } },
          ],
          role: { in: ['CREATOR', 'SUPPLIER'] },
        },
        take: 10,
      });
    }

    return results;
  }

  async updatePreferences(userId: string, preferences: any) {
    return await this.prismaService.user.update({
      where: { id: userId },
      data: { preferences },
    });
  }

  async getCart(userId: string) {
    return await this.prismaService.cartItem.findMany({
      where: { userId },
      include: { product: true },
    });
  }

  async addToCart(
    userId: string,
    productId: string,
    quantity: number = 1,
    sessionId?: string,
  ) {
    return await this.prismaService.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      update: {
        quantity: { increment: quantity },
        sessionId: sessionId || undefined,
      },
      create: {
        userId,
        productId,
        quantity,
        sessionId,
      },
      include: { product: true },
    });
  }

  async removeFromCart(userId: string, productId: string) {
    return await this.prismaService.cartItem.delete({
      where: { userId_productId: { userId, productId } },
    });
  }

  async clearCart(userId: string) {
    return await this.prismaService.cartItem.deleteMany({
      where: { userId },
    });
  }

  async setSessionReminder(
    userId: string,
    sessionId: string,
    enabled: boolean,
  ) {
    if (enabled) {
      return await this.prismaService.sessionReminder.upsert({
        where: { userId_sessionId: { userId, sessionId } },
        update: {},
        create: { userId, sessionId },
      });
    } else {
      return await this.prismaService.sessionReminder
        .delete({
          where: { userId_sessionId: { userId, sessionId } },
        })
        .catch(() => null); // Ignore if already deleted
    }
  }

  async getSessionReminders(userId: string) {
    return await this.prismaService.sessionReminder.findMany({
      where: { userId },
      include: { session: true },
    });
  }
}
