import { Module } from '@nestjs/common';
import { AnalyticsController } from '../../controllers/analytics/analytics.controller';
import { AnalyticsService } from '../../services/analytics/analytics.service';
import { PrismaService } from '../../services/infra/prisma.service';
import { RedisService } from '../../services/infra/redis.service';
import { KafkaService } from '../../services/infra/kafka.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
