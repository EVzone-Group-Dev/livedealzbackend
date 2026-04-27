import { Controller, Post, Body, Param, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AudienceService } from '../../services/audience/audience.service';

@ApiTags('audience')
@Controller('sessions/:id/audience')
export class AudienceController {
  constructor(private audienceService: AudienceService) {}

  @ApiOperation({ summary: 'Submit a like (High-concurrency)' })
  @Post('like')
  async like(@Param('id') sessionId: string) {
    return await this.audienceService.handleLike(sessionId);
  }

  @ApiOperation({ summary: 'Post a chat message' })
  @Post('chat')
  async postChat(
    @Param('id') sessionId: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
  ) {
    return await this.audienceService.postMessage(sessionId, userId, content);
  }

  @ApiOperation({ summary: 'Pin a chat message' })
  @Post('chat/:messageId/pin')
  async pinMessage(@Param('id') sessionId: string, @Param('messageId') messageId: string) {
    return await this.audienceService.pinMessage(sessionId, messageId);
  }

  @ApiOperation({ summary: 'Unpin a chat message' })
  @Post('chat/:messageId/unpin')
  async unpinMessage(@Param('id') sessionId: string, @Param('messageId') messageId: string) {
    return await this.audienceService.unpinMessage(sessionId, messageId);
  }

  @ApiOperation({ summary: 'List all polls' })
  @Get('polls')
  async getPolls(@Param('id') sessionId: string) {
    return await this.audienceService.getPolls(sessionId);
  }

  @ApiOperation({ summary: 'Create a new poll' })
  @Post('polls')
  async createPoll(
    @Param('id') sessionId: string,
    @Body('question') question: string,
    @Body('options') options: string[],
  ) {
    return await this.audienceService.createPoll(sessionId, question, options);
  }

  @ApiOperation({ summary: 'Launch a poll' })
  @Post('polls/:pollId/launch')
  async launchPoll(@Param('id') sessionId: string, @Param('pollId') pollId: string) {
    return await this.audienceService.launchPoll(sessionId, pollId);
  }
}
