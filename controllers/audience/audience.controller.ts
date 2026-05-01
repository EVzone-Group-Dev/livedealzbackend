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

  @ApiOperation({ summary: 'Signal intent to speak (Raise Hand)' })
  @Post('raise-hand')
  async raiseHand(
    @Param('id') sessionId: string,
    @Body('userId') userId: string,
    @Body('isRaised') isRaised: boolean,
  ) {
    return await this.audienceService.raiseHand(sessionId, userId, isRaised);
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

  @ApiOperation({ summary: 'Get chat history' })
  @Get('chat')
  async getChat(@Param('id') sessionId: string) {
    return await this.audienceService.getChatHistory(sessionId);
  }

  @ApiOperation({ summary: 'Pin a chat message' })
  @Post('chat/:messageId/pin')
  async pinMessage(
    @Param('id') sessionId: string,
    @Param('messageId') messageId: string,
  ) {
    return await this.audienceService.pinMessage(sessionId, messageId);
  }

  @ApiOperation({ summary: 'Unpin a chat message' })
  @Post('chat/:messageId/unpin')
  async unpinMessage(
    @Param('id') sessionId: string,
    @Param('messageId') messageId: string,
  ) {
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
  async launchPoll(
    @Param('id') sessionId: string,
    @Param('pollId') pollId: string,
  ) {
    return await this.audienceService.launchPoll(sessionId, pollId);
  }

  @ApiOperation({ summary: 'Start a giveaway' })
  @Post('giveaways')
  async startGiveaway(
    @Param('id') sessionId: string,
    @Body('prize') prize: string,
  ) {
    return await this.audienceService.startGiveaway(sessionId, prize);
  }

  @ApiOperation({ summary: 'Enter a giveaway (from buyer)' })
  @Post('giveaways/:giveawayId/enter')
  async enterGiveaway(
    @Param('id') sessionId: string,
    @Param('giveawayId') giveawayId: string,
    @Body('userId') userId: string,
  ) {
    return await this.audienceService.enterGiveaway(
      sessionId,
      giveawayId,
      userId,
    );
  }

  @ApiOperation({ summary: 'Pick a winner for a giveaway' })
  @Post('giveaways/:giveawayId/winner')
  async pickWinner(
    @Param('id') sessionId: string,
    @Param('giveawayId') giveawayId: string,
  ) {
    return await this.audienceService.pickWinner(sessionId, giveawayId);
  }

  @ApiOperation({ summary: 'Submit a question for Q&A' })
  @Post('qa/question')
  async submitQuestion(
    @Param('id') sessionId: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
  ) {
    return await this.audienceService.submitQuestion(
      sessionId,
      userId,
      content,
    );
  }

  @ApiOperation({ summary: 'Pin a question for Q&A' })
  @Post('qa/:questionId/pin')
  async pinQuestion(
    @Param('id') sessionId: string,
    @Param('questionId') questionId: string,
  ) {
    return await this.audienceService.pinQuestion(sessionId, questionId);
  }

  @ApiOperation({ summary: 'Answer a question for Q&A' })
  @Post('qa/:questionId/answer')
  async answerQuestion(
    @Param('id') sessionId: string,
    @Param('questionId') questionId: string,
    @Body('answer') answer: string,
  ) {
    return await this.audienceService.answerQuestion(
      sessionId,
      questionId,
      answer,
    );
  }

  @ApiOperation({ summary: 'Get all Q&A questions' })
  @Get('qa')
  async getQA(@Param('id') sessionId: string) {
    return await this.audienceService.getQA(sessionId);
  }

  @ApiOperation({ summary: 'Mute or ban a viewer from the session' })
  @Post('moderation')
  async moderate(
    @Param('id') sessionId: string,
    @Body('userId') userId: string,
    @Body('action') action: 'MUTE' | 'BAN',
    @Body('note') note?: string,
  ) {
    return await this.audienceService.moderateViewer(
      sessionId,
      userId,
      action,
      note,
    );
  }
}
