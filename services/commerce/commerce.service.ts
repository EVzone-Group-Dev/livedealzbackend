import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { StageService } from '../stage/stage.service';
import { KafkaService } from '../infra/kafka.service';

@Injectable()
export class CommerceService {
  constructor(
    private prismaService: PrismaService,
    private stageService: StageService,
    private kafkaService: KafkaService,
  ) {}

  async pinProduct(sessionId: string, productId: string) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) throw new Error('Product not found');

    // Update Stage Truth so buyers see the pinned product
    await this.stageService.updateStageTruth(sessionId, {
      activeProductId: productId,
      activeProduct: {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      },
    });

    // Notify Analytics via Kafka
    await this.kafkaService.produce('studio.commerce.pinned', {
      sessionId,
      productId,
      timestamp: new Date().toISOString(),
    });

    return product;
  }

  async launchFlashSale(
    sessionId: string,
    productId: string,
    discountPct: number,
  ) {
    const sale = await this.prismaService.flashSale.create({
      data: {
        sessionId,
        productId,
        discountPct,
        status: 'ACTIVE',
        startTime: new Date(),
        endTime: new Date(Date.now() + 600000), // 10 minutes default
      },
    });

    // Push to Stage Truth
    await this.stageService.updateStageTruth(sessionId, {
      activeFlashSale: {
        id: sale.id,
        discountPct,
        endsAt: sale.endTime,
      },
    });

    return sale;
  }

  async getProducts(sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      select: { campaignId: true },
    });

    return await this.prismaService.product.findMany({
      where: { campaignId: session?.campaignId || sessionId },
    });
  }

  async createCoupon(
    sessionId: string,
    productId?: string,
    discountPct: number = 10,
  ) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const coupon = await this.prismaService.coupon.create({
      data: {
        code,
        discountPct,
        sessionId,
        productId,
      },
    });

    // Notify buyers via Stage Truth if it's a session-wide coupon
    if (!productId) {
      await this.stageService.updateStageTruth(sessionId, {
        activeCoupon: code,
      });
    }

    return coupon;
  }

  async getCoupons(sessionId: string) {
    return await this.prismaService.coupon.findMany({
      where: { sessionId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSalesFeed(sessionId: string) {
    const orders = await this.prismaService.order.findMany({
      where: { sessionId, status: 'PAID' },
      include: {
        user: true,
        items: { include: { product: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return orders.map((o) => ({
      id: o.id,
      buyer: o.user.fullName,
      handle: o.user.handle,
      quantity: o.items.reduce((acc, item) => acc + item.quantity, 0),
      item: o.items[0]?.product.name || 'Multiple Items',
      amount: o.total,
      secondsAgo: Math.floor((Date.now() - o.createdAt.getTime()) / 1000),
    }));
  }

  async updateProductGoal(
    sessionId: string,
    productId: string,
    metric: string,
    target: number,
  ) {
    const product = await this.prismaService.product.update({
      where: { id: productId },
      data: {
        goalMetric: metric,
        goalTarget: target,
      },
    });

    // Update Stage Truth if this is the active product
    const truth = await this.stageService.getStageTruth(sessionId);
    if (truth.activeProductId === productId) {
      await this.stageService.updateStageTruth(sessionId, {
        activeProductGoal: { metric, target, current: 0 },
      });
    }

    return product;
  }

  async syncProducts(sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      select: { campaignId: true },
    });

    if (!session) throw new Error('Session not found');

    const products = await this.prismaService.product.findMany({
      where: { campaignId: session.campaignId },
    });

    await this.stageService.updateStageTruth(sessionId, {
      catalogSyncedAt: new Date().toISOString(),
      productCount: products.length,
    });

    return products;
  }

  async getSuppliers() {
    return await this.prismaService.supplier.findMany();
  }
}
