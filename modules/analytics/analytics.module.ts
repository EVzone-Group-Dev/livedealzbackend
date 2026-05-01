import { Module } from '@nestjs/common';
import { AnalyticsController } from '../../controllers/analytics/analytics.controller';
import { AnalyticsService } from '../../services/analytics/analytics.service';

@Module({
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
