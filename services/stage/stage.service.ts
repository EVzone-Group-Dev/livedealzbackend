import { Injectable } from '@nestjs/common';
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
      await this.redisService.hSet(key, field, typeof value === 'object' ? JSON.stringify(value) : String(value));
    }

    // Broadcast update to all connected viewers (via Redis Pub/Sub for scale)
    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'STAGE_TRUTH_UPDATE',
      data: patch,
    }));

    return patch;
  }

  async getStageTruth(sessionId: string) {
    const key = `stage:truth:${sessionId}`;
    return await this.redisService.hGetAll(key);
  }

  async setSessionStatus(sessionId: string, status: string) {
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { status: status as any },
    });

    await this.updateStageTruth(sessionId, { status });
  }

  async getActiveSession() {
    // In a real scenario, this might be the most recent LIVE session
    // or fetched from a global "current_active_session" key in Redis.
    const session = await this.prismaService.session.findFirst({
      where: { status: 'LIVE' },
      include: { 
        host: true,
        campaign: { include: { supplier: true } }
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
      }
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

    return await this.updateStageTruth(sessionId, { focusProductId: productId });
  }
}
