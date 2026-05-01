import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { RedisService } from '../infra/redis.service';
import { StageService } from '../stage/stage.service';

@Injectable()
export class CollaborationService {
  constructor(
    private prismaService: PrismaService,
    private redisService: RedisService,
    private stageService: StageService,
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

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GUEST_REQUEST_CREATED',
        data: request,
      }),
    );

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
      await this.redisService.hSet(
        `stage:truth:${sessionId}`,
        'activeGuest',
        JSON.stringify(request),
      );
    } else if (status !== 'ONSTAGE') {
      // Clear stage truth if this guest was the active one but moved away
      const current = await this.redisService.hGet(
        `stage:truth:${sessionId}`,
        'activeGuest',
      );
      if (current) {
        try {
          const parsed = JSON.parse(current);
          if (parsed && parsed.id === requestId) {
            await this.redisService.hDel(
              `stage:truth:${sessionId}`,
              'activeGuest',
            );
          }
        } catch (e) {}
      }
    }

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GUEST_STATUS_UPDATED',
        data: request,
      }),
    );

    return request;
  }

  async assignRequest(
    sessionId: string,
    requestId: string,
    role?: string,
    participantId?: string,
  ) {
    const request = await this.prismaService.guestRequest.update({
      where: { id: requestId },
      data: {
        assignedToRole: role,
        assignedToParticipantId: participantId,
      },
      include: { user: true },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GUEST_ASSIGNMENT_UPDATED',
        data: request,
      }),
    );

    return request;
  }

  async updateFollowUpNote(sessionId: string, requestId: string, note: string) {
    const request = await this.prismaService.guestRequest.update({
      where: { id: requestId },
      data: { followUpNote: note },
      include: { user: true },
    });

    return request;
  }

  async inviteGuest(
    sessionId: string,
    userId: string,
    role: string,
    note?: string,
  ) {
    const request = await this.prismaService.guestRequest.create({
      data: {
        sessionId,
        userId,
        status: 'INVITED',
        assignedToRole: role,
        note,
      },
      include: { user: true },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GUEST_INVITED',
        data: request,
      }),
    );

    return request;
  }

  async handoffHost(sessionId: string, newHostId: string) {
    // 1. Update Session in DB
    const session = await this.prismaService.session.update({
      where: { id: sessionId },
      data: { hostId: newHostId },
      include: { host: true },
    });

    // 2. Update Stage Truth in Redis
    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'host',
      JSON.stringify(session.host),
    );

    // 3. Broadcast event
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'HOST_HANDOFF',
        data: { hostId: newHostId, host: session.host },
      }),
    );

    return session;
  }

  async getRoster(sessionId: string) {
    // 1. Get active guests from Redis (those on stage)
    const truth = await this.stageService.getStageTruth(sessionId);
    const activeGuest = truth.activeGuest
      ? JSON.parse(truth.activeGuest)
      : null;

    // 2. Get guest requests (invited, backstage, etc)
    const requests = await this.prismaService.guestRequest.findMany({
      where: {
        sessionId,
        status: { in: ['INVITED', 'BACKSTAGE', 'WAITING', 'ONSTAGE'] },
      },
      include: { user: true },
    });

    // 3. Get metadata from DB (readiness, notes)
    const participants = await this.prismaService.rosterParticipant.findMany({
      where: { sessionId },
    });

    return {
      activeGuest,
      requests,
      participants,
    };
  }

  async updateSplitScreenLayout(sessionId: string, layout: any) {
    // 1. Update Session in DB
    await this.prismaService.session.update({
      where: { id: sessionId },
      data: { splitScreenLayout: layout },
    });

    // 2. Update Stage Truth in Redis
    await this.stageService.updateStageTruth(sessionId, {
      splitScreen: layout,
    });
    return layout;
  }

  async muteParticipant(
    sessionId: string,
    participantId: string,
    isMuted: boolean,
  ) {
    const key = `stage:truth:${sessionId}`;
    const mutedJson =
      (await this.redisService.hGet(key, 'mutedCastIds')) || '[]';
    const mutedIds: string[] = JSON.parse(mutedJson);

    if (isMuted && !mutedIds.includes(participantId)) {
      mutedIds.push(participantId);
    } else if (!isMuted) {
      const index = mutedIds.indexOf(participantId);
      if (index > -1) mutedIds.splice(index, 1);
    }

    await this.stageService.updateStageTruth(sessionId, {
      mutedCastIds: mutedIds,
    });
    return { participantId, isMuted };
  }

  async kickParticipant(sessionId: string, participantId: string) {
    // 1. Update DB status
    await this.prismaService.guestRequest.updateMany({
      where: { sessionId, userId: participantId, status: 'ONSTAGE' },
      data: { status: 'ENDED' },
    });

    // 2. Remove from Stage Truth seats
    const key = `stage:truth:${sessionId}`;
    const activeGuest = await this.redisService.hGet(key, 'activeGuest');

    if (activeGuest === participantId) {
      await this.stageService.updateStageTruth(sessionId, {
        activeGuest: null,
      });
    }

    // 3. Notify via Redis
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'PARTICIPANT_KICKED',
        data: { userId: participantId },
      }),
    );

    return { participantId, kicked: true };
  }

  async updateRosterMetadata(
    sessionId: string,
    participantId: string,
    data: { readinessStatus?: string; producerNote?: string; handle?: string },
  ) {
    const participant = await this.prismaService.rosterParticipant.upsert({
      where: { sessionId_participantId: { sessionId, participantId } },
      update: data,
      create: {
        ...data,
        sessionId,
        participantId,
        handle: data.handle || participantId, // Fallback if handle missing
      },
    });

    // Broadcast update to all operators in the Studio
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'ROSTER_METADATA_UPDATED',
        data: participant,
      }),
    );

    return participant;
  }
}
