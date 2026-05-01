import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { RedisService } from '../infra/redis.service';

@Injectable()
export class TeleprompterService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  async getSegments(sessionId: string) {
    return await this.prismaService.runOfShowSegment.findMany({
      where: { sessionId },
      orderBy: { order: 'asc' },
    });
  }

  async createSegment(sessionId: string, data: any) {
    return await this.prismaService.runOfShowSegment.create({
      data: { ...data, sessionId },
    });
  }

  async updateSegment(segmentId: string, data: any) {
    return await this.prismaService.runOfShowSegment.update({
      where: { id: segmentId },
      data,
    });
  }

  async deleteSegment(segmentId: string) {
    return await this.prismaService.runOfShowSegment.delete({
      where: { id: segmentId },
    });
  }

  async activateSegment(sessionId: string, segmentId: string) {
    // 1. Reset all to UPCOMING/DONE
    await this.prismaService.runOfShowSegment.updateMany({
      where: { sessionId, status: 'LIVE' },
      data: { status: 'DONE' },
    });

    // 2. Set target to LIVE
    const segment = await this.prismaService.runOfShowSegment.update({
      where: { id: segmentId },
      data: { status: 'LIVE' },
    });

    // 3. Sync to Stage Truth
    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'activeCue',
      JSON.stringify(segment),
    );

    // 4. Broadcast
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'CUE_ACTIVATED',
        data: segment,
      }),
    );

    return segment;
  }

  async updateFullScript(sessionId: string, script: string) {
    return await this.prismaService.session.update({
      where: { id: sessionId },
      data: { teleprompter: script },
    });
  }
}
