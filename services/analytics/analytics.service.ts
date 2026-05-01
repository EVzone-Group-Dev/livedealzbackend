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
    const likes = await this.redisService.hGet(
      `stage:truth:${sessionId}`,
      'likeCount',
    );
    const viewers =
      (await this.redisService.hGet(
        `stage:truth:${sessionId}`,
        'viewerCount',
      )) || '0';

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
    const data = await Promise.resolve([
      {
        id: '1',
        handle: 'crypto_king',
        spent: 1500000,
        avatar: 'https://i.pravatar.cc/150?u=1',
      },
      {
        id: '2',
        handle: 'shopaholic_jane',
        spent: 1200000,
        avatar: 'https://i.pravatar.cc/150?u=2',
      },
      {
        id: '3',
        handle: 'tech_guru',
        spent: 900000,
        avatar: 'https://i.pravatar.cc/150?u=3',
      },
    ]);
    return data;
  }

  async getSessionHandoff(sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      include: {
        campaign: { select: { name: true } },
        analytics: { take: 5 }, // Recent events
      },
    });

    if (!session) return null;

    // In a production environment, this would be computed by an AI summarization job
    // for this version, we aggregate high-level metrics and session context.
    return {
      campaignName: session.campaign?.name || 'Live Campaign',
      sessionName: session.name,
      productName: 'Focus Product Selection', // Placeholder
      summary: `The session for ${session.name} reached peak engagement with significant spikes during product reveals. User sentiment was positive across all active regions.`,
      recommendedNextAction:
        'Restock the top-selling SKU and prepare a follow-up flash sale for remaining inventory.',
      planNote: session.note || 'Regular broadcast cycle.',
      highlights: [
        {
          id: 'h1',
          label: 'Flash Sale Peak',
          createdAtMs: Date.now() - 3600000,
          source: 'commerce',
        },
        {
          id: 'h2',
          label: 'Audience Poll Launched',
          createdAtMs: Date.now() - 1800000,
          source: 'audience',
        },
      ],
      spikes: [
        {
          id: 's1',
          atMs: Date.now() - 3000000,
          label: 'Add to Cart Wave',
          eventCount: 120,
        },
      ],
    };
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
    const data = await Promise.resolve({
      dominantLocale: 'en-US',
      dominantDevice: 'iPhone',
      translationCoverage: '98%',
      qualityHint: 'High quality AI translation active',
    });
    return data;
  }

  async toggleLanguageFeature(
    sessionId: string,
    feature: 'ai' | 'cc',
    enabled: boolean,
  ) {
    const field = feature === 'ai' ? 'aiEnabled' : 'ccEnabled';

    // Persist to DB
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { [field]: enabled },
    });

    // Update Stage Truth
    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      field,
      String(enabled),
    );

    // Broadcast change to all viewers
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'LANGUAGE_FEATURE_TOGGLE',
        data: { feature, enabled },
      }),
    );

    return { feature, enabled };
  }

  async getHighlights(sessionId: string) {
    return await this.prismaService.analyticsEvent.findMany({
      where: {
        sessionId,
        name: {
          in: [
            'PRODUCT_PINNED',
            'GIVEAWAY_WINNER',
            'POLL_LAUNCHED',
            'GUEST_ONSTAGE',
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEngagementSpikes(sessionId: string) {
    // This would typically involve windowed counts from Redis or Clickhouse
    // For now, we return mock high-intensity moments
    return [
      {
        id: '1',
        atMs: Date.now() - 600000,
        label: 'Massive Like Spike',
        eventCount: 450,
      },
      {
        id: '2',
        atMs: Date.now() - 300000,
        label: 'Cart Addition Peak',
        eventCount: 120,
      },
    ];
  }

  async exportData(sessionId: string, format: 'json' | 'csv') {
    const events = await this.prismaService.analyticsEvent.findMany({
      where: { sessionId },
    });

    if (format === 'json') {
      return JSON.stringify(events, null, 2);
    }

    // Basic CSV conversion
    const header = 'id,name,payload,timestamp\n';
    const rows = events
      .map(
        (e) =>
          `${e.id},${e.name},"${JSON.stringify(e.payload).replace(/"/g, '""')}",${e.createdAt.toISOString()}`,
      )
      .join('\n');
    return header + rows;
  }

  async updateLanguageMix(sessionId: string, mix: string) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { languageMix: mix },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'LANGUAGE_MIX_UPDATED',
        data: { mix },
      }),
    );

    return { success: true, mix };
  }
}
