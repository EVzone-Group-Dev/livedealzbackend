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

  async launchFlashSale(sessionId: string, productId: string, discountPct: number) {
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

  async updateProductGoal(productId: string, goal: { metric?: string, target?: number }) {
    return await this.prismaService.product.update({
      where: { id: productId },
      data: {
        goalMetric: goal.metric,
        goalTarget: goal.target,
      },
    });
  }

  async getProducts(campaignId: string) {
    return await this.prismaService.product.findMany({
      where: { campaignId },
    });
  }
}
