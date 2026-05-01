import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service';
import { PrismaService } from '../infra/prisma.service';
import { ChatMessageKind, GiveawayStatus } from '@prisma/client';

@Injectable()
export class AudienceService {
  constructor(
    private redisService: RedisService,
    private prismaService: PrismaService,
  ) {}

  /**
   * High-concurrency Liking.
   * Uses Redis INCR for atomicity and publishes for real-time UI bursts.
   */
  async handleLike(sessionId: string) {
    const key = `stats:likes:${sessionId}`;
    const newCount = await this.redisService.incr(key);

    // Sync to Stage Truth (Authoritative view for 100k+ buyers)
    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'likeCount',
      String(newCount),
    );

    // Broadcast the "burst" event to all viewers
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'LIKE_BURST',
        data: { count: newCount },
      }),
    );

    return { likes: newCount };
  }

  async raiseHand(sessionId: string, userId: string, isRaised: boolean) {
    const key = `stage:truth:${sessionId}`;
    const raisedJson =
      (await this.redisService.hGet(key, 'raisedHandIds')) || '[]';
    const raisedIds: string[] = JSON.parse(raisedJson);

    if (isRaised && !raisedIds.includes(userId)) {
      raisedIds.push(userId);
    } else if (!isRaised) {
      const index = raisedIds.indexOf(userId);
      if (index > -1) raisedIds.splice(index, 1);
    }

    await this.redisService.hSet(
      key,
      'raisedHandIds',
      JSON.stringify(raisedIds),
    );

    // Broadcast to Studio
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'HAND_RAISED',
        data: { userId, isRaised },
      }),
    );

    return { userId, isRaised };
  }

  async enterGiveaway(sessionId: string, giveawayId: string, userId: string) {
    // 1. Check if giveaway is open
    const giveaway = await this.prismaService.giveaway.findUnique({
      where: { id: giveawayId },
    });

    if (!giveaway || giveaway.status !== 'OPEN') {
      throw new Error('Giveaway is not open for entries');
    }

    // 2. Create entry (Unique constraint handles duplicates)
    await this.prismaService.giveawayEntry.upsert({
      where: { giveawayId_userId: { giveawayId, userId } },
      update: {}, // No change if exists
      create: { giveawayId, userId },
    });

    // 3. Get new count
    const entryCount = await this.prismaService.giveawayEntry.count({
      where: { giveawayId },
    });

    // 4. Broadcast to Studio
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GIVEAWAY_UPDATED',
        data: { id: giveawayId, entries: entryCount },
      }),
    );

    return { giveawayId, userId, entries: entryCount };
  }

  async pinMessage(sessionId: string, messageId: string) {
    const message = await this.prismaService.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: true },
    });

    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'pinnedMessage',
      JSON.stringify(message),
    );

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'MESSAGE_PINNED',
        data: message,
      }),
    );

    return message;
  }

  async unpinMessage(sessionId: string, messageId: string) {
    const message = await this.prismaService.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: false },
    });

    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'pinnedMessage',
      '',
    );

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'MESSAGE_UNPINNED',
        data: { id: messageId },
      }),
    );

    return message;
  }

  async submitChatMessage(
    sessionId: string,
    userId: string,
    content: string,
    kind: ChatMessageKind = 'CHAT',
  ) {
    const room = await this.prismaService.chatRoom.findUnique({
      where: { sessionId },
    });

    if (!room) throw new Error('Chat room not found');

    const message = await this.prismaService.chatMessage.create({
      data: {
        roomId: room.id,
        userId,
        content,
        kind,
      },
      include: { user: true },
    });

    // Broadcast via Redis (Real-time)
    await this.redisService.publish(
      `session:${sessionId}:chat`,
      JSON.stringify(message),
    );

    return message;
  }

  async moderateViewer(
    sessionId: string,
    userId: string,
    action: 'MUTE' | 'BAN',
    note?: string,
  ) {
    // In a real system, we would update a 'SessionModeration' or 'User' table
    // For now, we broadcast the event so the Gateway/UI can react
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'VIEWER_MODERATED',
        data: { userId, action, note },
      }),
    );

    return { userId, action, note };
  }

  async postActivityEvent(sessionId: string, type: string, data: any) {
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type,
        data,
      }),
    );
  }

  async postMessage(sessionId: string, userId: string, content: string) {
    // Ensure room exists
    const room = await this.prismaService.chatRoom.upsert({
      where: { sessionId },
      update: {},
      create: { sessionId },
    });

    const message = await this.prismaService.chatMessage.create({
      data: {
        userId,
        content,
        roomId: room.id,
      },
      include: { user: true },
    });

    // Broadcast via Redis
    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'CHAT_MESSAGE',
        data: message,
      }),
    );

    return message;
  }

  async getPolls(sessionId: string) {
    return await this.prismaService.poll.findMany({
      where: { sessionId },
      include: {
        options: { include: { _count: { select: { votes: true } } } },
      },
    });
  }

  async createPoll(sessionId: string, question: string, options: string[]) {
    const poll = await this.prismaService.poll.create({
      data: {
        sessionId,
        question,
        options: {
          create: options.map((label) => ({ label })),
        },
      },
      include: { options: true },
    });

    return poll;
  }

  async launchPoll(sessionId: string, pollId: string) {
    const poll = await this.prismaService.poll.update({
      where: { id: pollId },
      data: { status: 'ACTIVE' },
      include: { options: true },
    });

    await this.redisService.hSet(
      `stage:truth:${sessionId}`,
      'activePoll',
      JSON.stringify(poll),
    );

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'POLL_LAUNCHED',
        data: poll,
      }),
    );

    return poll;
  }

  async startGiveaway(
    sessionId: string,
    prizeName: string,
    title: string = 'Live Giveaway',
  ) {
    const giveaway = await this.prismaService.giveaway.create({
      data: {
        sessionId,
        prizeName,
        title,
        status: GiveawayStatus.OPEN,
      },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GIVEAWAY_STARTED',
        data: giveaway,
      }),
    );

    return giveaway;
  }

  async pickWinner(sessionId: string, giveawayId: string) {
    const participants = await this.prismaService.giveawayEntry.findMany({
      where: { giveawayId },
      select: { userId: true },
    });

    if (participants.length === 0) return { error: 'No participants found' };

    const winnerId =
      participants[Math.floor(Math.random() * participants.length)].userId;

    const giveaway = await this.prismaService.giveaway.update({
      where: { id: giveawayId },
      data: {
        status: GiveawayStatus.CLOSED,
        winners: {
          create: { userId: winnerId },
        },
      },
      include: { winners: { include: { user: true } } },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'GIVEAWAY_WINNER',
        data: giveaway,
      }),
    );

    return giveaway;
  }

  async submitQuestion(sessionId: string, userId: string, content: string) {
    const question = await this.prismaService.qAQuestion.create({
      data: { sessionId, userId, content },
      include: { user: true },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'NEW_QUESTION',
        data: question,
      }),
    );

    return question;
  }

  async pinQuestion(sessionId: string, questionId: string) {
    await this.prismaService.qAQuestion.updateMany({
      where: { sessionId, isPinned: true },
      data: { isPinned: false },
    });

    const question = await this.prismaService.qAQuestion.update({
      where: { id: questionId },
      data: { isPinned: true },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'QUESTION_PINNED',
        data: { questionId },
      }),
    );

    return question;
  }

  async answerQuestion(sessionId: string, questionId: string, answer: string) {
    const question = await this.prismaService.qAQuestion.update({
      where: { id: questionId },
      data: {
        answer,
        isAnswered: true,
      },
    });

    await this.redisService.publish(
      `session:${sessionId}:events`,
      JSON.stringify({
        type: 'QUESTION_ANSWERED',
        data: question,
      }),
    );

    return question;
  }

  async getQA(sessionId: string) {
    return await this.prismaService.qAQuestion.findMany({
      where: { sessionId },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getChatHistory(sessionId: string) {
    const room = await this.prismaService.chatRoom.findUnique({
      where: { sessionId },
    });

    if (!room) return [];

    return await this.prismaService.chatMessage.findMany({
      where: { roomId: room.id },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }
}
