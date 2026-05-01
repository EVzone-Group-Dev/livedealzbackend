import { Injectable } from '@nestjs/common';
import { SessionStatus } from '@prisma/client';
import { RedisService } from '../infra/redis.service';
import { PrismaService } from '../infra/prisma.service';

@Injectable()
export class StageService {
  constructor(
    private redisService: RedisService,
    private prismaService: PrismaService,
  ) {}

  /**
   * Update the authoritative "Stage Truth" in Redis.
   * This is what 100k+ buyers see in real-time.
   */
  async updateStageTruth(sessionId: string, patch: Record<string, any>) {
    const key = `stage:truth:${sessionId}`;

    for (const [field, value] of Object.entries(patch)) {
      await this.redisService.hSet(
        key,
        field,
        typeof value === 'object' ? JSON.stringify(value) : String(value),
      );
    }

    // Broadcast update to all connected viewers (via Redis Pub/Sub for scale)
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'STAGE_TRUTH_UPDATE',
        data: patch,
      }),
    );

    return patch;
  }

  async getStageTruth(sessionId: string) {
    const key = `stage:truth:${sessionId}`;
    const truth = await this.redisService.hGetAll(key);

    // If core metadata is missing, hydrate from DB
    if (!truth.orderedDeals || !truth.themeColor) {
      const session = await this.prismaService.session.findUnique({
        where: { id: sessionId },
        include: { campaign: { include: { products: true } } },
      });

      if (session) {
        const productsJson = JSON.stringify(session.campaign?.products || []);
        const layoutJson = JSON.stringify(session.splitScreenLayout || {});
        const filtersJson = JSON.stringify(session.activeFilters || {});

        await this.redisService.hSet(key, 'orderedDeals', productsJson);
        await this.redisService.hSet(
          key,
          'themeColor',
          session.themeColor || '#f77f00',
        );
        await this.redisService.hSet(
          key,
          'category',
          session.category || 'Fashion',
        );
        await this.redisService.hSet(key, 'splitScreen', layoutJson);
        await this.redisService.hSet(key, 'activeFilters', filtersJson);

        truth.orderedDeals = productsJson;
        truth.themeColor = session.themeColor || '#f77f00';
        truth.category = session.category || 'Fashion';
        truth.splitScreen = layoutJson;
        truth.activeFilters = filtersJson;
      }
    }

    return truth;
  }

  async setSessionStatus(sessionId: string, status: string) {
    const session = await this.prismaService.session.update({
      where: { id: sessionId },
      data: { status: status as any },
    });

    await this.updateStageTruth(sessionId, { status });
    return session;
  }

  async startSession(sessionId: string) {
    const actualStart = new Date();
    const session = await this.prismaService.session.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.LIVE,
        actualStart,
        actualEnd: null,
      },
    });

    await this.updateStageTruth(sessionId, {
      status: 'LIVE',
      actualStart: actualStart.toISOString(),
    });

    return session;
  }

  async stopSession(sessionId: string) {
    const existing = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      select: { actualStart: true },
    });
    const actualEnd = new Date();
    const data: Record<string, any> = {
      status: SessionStatus.ENDED,
      actualEnd,
    };

    if (existing?.actualStart) {
      data.totalMinutes = Math.max(
        0,
        Math.round((actualEnd.getTime() - existing.actualStart.getTime()) / 60000),
      );
    }

    const session = await this.prismaService.session.update({
      where: { id: sessionId },
      data,
    });

    await this.updateStageTruth(sessionId, {
      status: 'ENDED',
      actualEnd: actualEnd.toISOString(),
    });

    return session;
  }

  async getSessionById(sessionId: string) {
    const session = await this.prismaService.session.findUnique({
      where: { id: sessionId },
      include: {
        host: true,
        campaign: { include: { supplier: true, products: true } },
      },
    });

    if (session) {
      const truth = await this.getStageTruth(sessionId);
      return { ...session, stageTruth: truth };
    }

    return null;
  }

  async getActiveSession() {
    // In a real scenario, this might be the most recent LIVE session
    // or fetched from a global "current_active_session" key in Redis.
    const session = await this.prismaService.session.findFirst({
      where: { status: { in: ['LIVE', 'REHEARSAL'] } },
      include: {
        host: true,
        campaign: { include: { supplier: true, products: true } },
      },
      orderBy: { actualStart: 'desc' },
    });

    if (session) {
      const truth = await this.getStageTruth(session.id);
      return { ...session, stageTruth: truth };
    }

    return null;
  }

  async getSessionStatus(sessionId: string) {
    // This could return real-time health metrics
    // For now, returning basic session info
    return await this.prismaService.session.findUnique({
      where: { id: sessionId },
      select: {
        status: true,
        connection: true,
        totalMinutes: true,
      },
    });
  }

  async updateTeleprompter(sessionId: string, script: string) {
    return await this.prismaService.session.update({
      where: { id: sessionId },
      data: { teleprompter: script },
    });
  }

  async setFocusProduct(sessionId: string, productId: string) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { focusProductId: productId },
    });

    return await this.updateStageTruth(sessionId, {
      focusProductId: productId,
    });
  }

  // --- Discovery ---

  async getSuppliers() {
    return await this.prismaService.supplier.findMany({
      include: {
        campaigns: {
          include: {
            products: true,
            sessions: {
              include: { host: true },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });
  }

  async getCampaigns(supplierId: string) {
    return await this.prismaService.campaign.findMany({
      where: { supplierId },
      include: {
        products: true,
        sessions: {
          include: { host: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async getSessions(campaignId: string) {
    return await this.prismaService.session.findMany({
      where: { campaignId },
      include: { host: true },
    });
  }

  // --- Settings & Persistence ---

  async updateSessionSettings(
    sessionId: string,
    settings: {
      aiEnabled?: boolean;
      ccEnabled?: boolean;
      isMuted?: boolean;
      cameraOn?: boolean;
    },
  ) {
    const session = await this.prismaService.session.update({
      where: { id: sessionId },
      data: settings,
    });

    // Also update Stage Truth for real-time sync
    await this.updateStageTruth(sessionId, settings);

    return session;
  }

  async subscribeToSessionEvents(
    sessionId: string,
    onMessage: (message: string) => void,
  ) {
    return await this.redisService.subscribe(
      `session:${sessionId}:events`,
      onMessage,
    );
  }
}
