import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MediaService } from '../../services/media/media.service';

@ApiTags('media')
@Controller('media')
export class MediaController {
  constructor(private mediaService: MediaService) {}

  @ApiOperation({ summary: 'Generate Join Token for LiveKit' })
  @Get('token')
  async getToken(
    @Query('room') room: string,
    @Query('identity') identity: string,
    @Query('publish') publish: string,
  ) {
    const canPublish = publish === 'true';
    const token = await this.mediaService.generateToken(room, identity, canPublish);
    return { token };
  }

  @ApiOperation({ summary: 'Start Cloud Recording' })
  @Post('record/:sessionId/start')
  async startRecord(@Param('sessionId') sessionId: string) {
    return await this.mediaService.startRecording(sessionId);
  }
}
