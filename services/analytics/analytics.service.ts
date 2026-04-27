import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { RedisService } from '../infra/redis.service';
import { KafkaService } from '../infra/kafka.service';

@Injectable()
export class AnalyticsService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
    private kafkaService: KafkaService,
  ) {}

  async getLiveKPIs(sessionId: string) {
    const likes = await this.redisService.hGet(`stage:truth:${sessionId}`, 'likeCount');
    const viewers = await this.redisService.hGet(`stage:truth:${sessionId}`, 'viewerCount') || '0';
    
    // In a real system, we'd fetch "Reach" and "Shares" from Redis or Kafka stream aggregators
    return {
      viewers: parseInt(viewers),
      likes: parseInt(likes || '0'),
      shares: Math.floor(parseInt(viewers) * 0.1), // Mock
      reach: parseInt(viewers) * 2, // Mock
    };
  }

  async getLeaderboard(sessionId: string) {
    // Mock top buyers
    return [
      { id: '1', handle: 'crypto_king', spent: 1500000, avatar: 'https://i.pravatar.cc/150?u=1' },
      { id: '2', handle: 'shopaholic_jane', spent: 1200000, avatar: 'https://i.pravatar.cc/150?u=2' },
      { id: '3', handle: 'tech_guru', spent: 900000, avatar: 'https://i.pravatar.cc/150?u=3' },
    ];
  }

  async getTimeline(sessionId: string) {
    return await this.prismaService.analyticsEvent.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async trackEvent(sessionId: string, name: string, payload: any) {
    // Produce to Kafka for async processing and long-term storage
    // The KafkaConsumerService will handle saving this to the database.
    return await this.kafkaService.produce('studio.analytics.events', {
      sessionId,
      name,
      payload,
      timestamp: new Date().toISOString(),
    });
  }

  async getLanguageSignals(sessionId: string) {
    // In a real system, these would be aggregated from live viewer telemetry in Redis
    return {
      dominantLocale: 'en-US',
      dominantDevice: 'iPhone',
      translationCoverage: '98%',
      qualityHint: 'High quality AI translation active',
    };
  }

  async toggleLanguageFeature(sessionId: string, feature: 'ai' | 'cc', enabled: boolean) {
    // Broadcast change to all viewers so their UI updates
    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'LANGUAGE_FEATURE_TOGGLE',
      data: { feature, enabled },
    }));

    return { feature, enabled };
  }
}
