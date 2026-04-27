import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { RedisService } from '../infra/redis.service';

@Injectable()
export class CollaborationService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  async getRequests(sessionId: string) {
    return await this.prismaService.guestRequest.findMany({
      where: { sessionId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async handleRequest(sessionId: string, userId: string, note?: string) {
    const request = await this.prismaService.guestRequest.create({
      data: {
        sessionId,
        userId,
        note,
        status: 'PENDING',
      },
      include: { user: true },
    });

    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'GUEST_REQUEST_CREATED',
      data: request,
    }));

    return request;
  }

  async updateRequestStatus(sessionId: string, requestId: string, status: any) {
    const request = await this.prismaService.guestRequest.update({
      where: { id: requestId },
      data: { status },
      include: { user: true },
    });

    // If status is ONSTAGE, update Stage Truth
    if (status === 'ONSTAGE') {
      await this.redisService.hSet(`stage:truth:${sessionId}`, 'activeGuest', JSON.stringify(request));
    } else if (status === 'DECLINED' || status === 'BACKSTAGE') {
      // Clear if was onstage
      const current = await this.redisService.hGet(`stage:truth:${sessionId}`, 'activeGuest');
      if (current && JSON.parse(current).id === requestId) {
        await this.redisService.hSet(`stage:truth:${sessionId}`, 'activeGuest', '');
      }
    }

    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'GUEST_STATUS_UPDATED',
      data: request,
    }));

    return request;
  }

  async getRoster(sessionId: string) {
    return await this.prismaService.guestRequest.findMany({
      where: { 
        sessionId,
        status: { in: ['BACKSTAGE', 'WAITING', 'ONSTAGE'] }
      },
      include: { user: true },
    });
  }
}
