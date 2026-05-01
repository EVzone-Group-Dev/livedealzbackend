import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';

@Injectable()
export class SupplierService {
  constructor(private prismaService: PrismaService) {}

  async getPerformance(supplierId: string) {
    // 1. Fetch current metrics
    const performance = await this.prismaService.supplierPerformance.findUnique(
      {
        where: { supplierId },
      },
    );

    if (!performance) {
      // Initialize if missing
      return await this.prismaService.supplierPerformance.create({
        data: { supplierId },
      });
    }

    return performance;
  }

  async recalculateMetrics(supplierId: string) {
    // In a real system, we'd query Orders, Shipments, and Reviews
    // Example: average (shipDate - paidDate) for onTimeDelivery
    // Example: count(refundedOrders) / count(totalOrders) for refundRate

    const orders = await this.prismaService.order.findMany({
      where: {
        items: {
          some: {
            product: {
              campaign: {
                supplierId,
              },
            },
          },
        },
      },
      include: { items: true },
    });

    if (orders.length === 0) return await this.getPerformance(supplierId);

    const refundCount = orders.filter((o) => o.status === 'REFUNDED').length;
    const refundRate = refundCount / orders.length;

    // Mocking onTimeDelivery and responseTime based on order volume for demo
    const onTimeDelivery = 0.95 + Math.random() * 0.04;
    const responseTime = 5 + Math.floor(Math.random() * 10);
    const overallScore = 4.5 + Math.random() * 0.5;

    return await this.prismaService.supplierPerformance.update({
      where: { supplierId },
      data: {
        refundRate,
        onTimeDelivery,
        responseTime,
        overallScore,
      },
    });
  }
}
