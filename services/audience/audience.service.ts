import { Injectable } from '@nestjs/common';
import { RedisService } from '../infra/redis.service';
import { PrismaService } from '../infra/prisma.service';

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
    await this.redisService.hSet(`stage:truth:${sessionId}`, 'likeCount', String(newCount));

    // Broadcast the "burst" event to all viewers
    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'LIKE_BURST',
      data: { count: newCount },
    }));

    return { likes: newCount };
  }

  async pinMessage(sessionId: string, messageId: string) {
    const message = await this.prismaService.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: true },
    });

    await this.redisService.hSet(`stage:truth:${sessionId}`, 'pinnedMessage', JSON.stringify(message));
    
    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'MESSAGE_PINNED',
      data: message,
    }));

    return message;
  }

  async unpinMessage(sessionId: string, messageId: string) {
    const message = await this.prismaService.chatMessage.update({
      where: { id: messageId },
      data: { isPinned: false },
    });

    await this.redisService.hSet(`stage:truth:${sessionId}`, 'pinnedMessage', '');
    
    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'MESSAGE_UNPINNED',
      data: { id: messageId },
    }));

    return message;
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
    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'CHAT_MESSAGE',
      data: message,
    }));

    return message;
  }

  async getPolls(sessionId: string) {
    return await this.prismaService.poll.findMany({
      where: { sessionId },
      include: { options: { include: { _count: { select: { votes: true } } } } },
    });
  }

  async createPoll(sessionId: string, question: string, options: string[]) {
    const poll = await this.prismaService.poll.create({
      data: {
        sessionId,
        question,
        options: {
          create: options.map(label => ({ label })),
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

    await this.redisService.hSet(`stage:truth:${sessionId}`, 'activePoll', JSON.stringify(poll));

    await this.redisService.publish(`session:${sessionId}:events`, JSON.stringify({
      type: 'POLL_LAUNCHED',
      data: poll,
    }));

    return poll;
  }
}
