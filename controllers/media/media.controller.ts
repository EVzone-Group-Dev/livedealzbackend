import { Controller, Post, Body, Param, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
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
    const token = await this.mediaService.generateToken(
      room,
      identity,
      canPublish,
    );
    return { token };
  }

  @ApiOperation({ summary: 'Start Cloud Recording' })
  @Post('record/:sessionId/start')
  async startRecord(@Param('sessionId') sessionId: string) {
    return await this.mediaService.startRecording(sessionId);
  }

  @ApiOperation({ summary: 'Stop Cloud Recording' })
  @Post('record/:sessionId/stop')
  async stopRecord(@Param('sessionId') sessionId: string) {
    return await this.mediaService.stopRecording(sessionId);
  }

  @ApiOperation({ summary: 'Get available scenes for the session' })
  @Get(':sessionId/scenes')
  async getScenes(@Param('sessionId') sessionId: string) {
    return await this.mediaService.getScenes(sessionId);
  }

  @ApiOperation({ summary: 'Activate a specific scene' })
  @Post(':sessionId/scenes/:sceneId/activate')
  async activateScene(
    @Param('sessionId') sessionId: string,
    @Param('sceneId') sceneId: string,
  ) {
    return await this.mediaService.activateScene(sessionId, sceneId);
  }

  @ApiOperation({ summary: 'Update active media filters (Beauty, Blur, etc.)' })
  @Post(':sessionId/filters')
  async updateFilters(
    @Param('sessionId') sessionId: string,
    @Body() filters: Record<string, string>,
  ) {
    return await this.mediaService.updateFilters(sessionId, filters);
  }

  @ApiOperation({ summary: 'Get source metadata (tone, detail) for the stage' })
  @Get(':sessionId/sources/metadata')
  async getSourceMetadata(@Param('sessionId') sessionId: string) {
    return await this.mediaService.getSourceMetadata(sessionId);
  }

  @ApiOperation({ summary: 'Update metadata for a specific source' })
  @Post(':sessionId/sources/:sourceId/metadata')
  async updateSourceMetadata(
    @Param('sessionId') sessionId: string,
    @Param('sourceId') sourceId: string,
    @Body() data: any,
  ) {
    return await this.mediaService.updateSourceMetadata(
      sessionId,
      sourceId,
      data,
    );
  }

  @ApiOperation({
    summary:
      'Update professional encoder/video settings (Resolution, Codec, FPS)',
  })
  @Post(':sessionId/settings')
  async updateSettings(
    @Param('sessionId') sessionId: string,
    @Body() settings: any,
  ) {
    return await this.mediaService.updateVideoSettings(sessionId, settings);
  }

  @ApiOperation({ summary: 'Upload a media asset (e.g. custom background)' })
  @Post(':sessionId/assets')
  async uploadAsset(
    @Param('sessionId') sessionId: string,
    @Body()
    data: {
      name: string;
      url: string;
      type: string;
      width?: number;
      height?: number;
      sizeBytes?: number;
    },
  ) {
    return await this.mediaService.uploadAsset(sessionId, data);
  }

  @ApiOperation({ summary: 'Get all media assets for the session' })
  @Get(':sessionId/assets')
  async getAssets(@Param('sessionId') sessionId: string) {
    return await this.mediaService.getAssets(sessionId);
  }

  @ApiOperation({ summary: 'Get LiveKit HLS playback URLs for a session' })
  @ApiResponse({ status: 200, description: 'LiveKit playback info' })
  @Get('playback/live/:sessionId')
  async getLivePlayback(@Param('sessionId') sessionId: string, @Query('token') token?: string) {
    return await this.mediaService.getLivePlaybackInfo(sessionId, token);
  }

  @ApiOperation({ summary: 'Get HLS playback URLs for an ad video' })
  @ApiResponse({ status: 200, description: 'Ad playback info' })
  @Get('playback/adz/:adId')
  async getAdPlayback(@Param('adId') adId: string) {
    return await this.mediaService.getAdPlaybackInfo(adId);
  }
}

@ApiTags('media')
@Controller('v1/playback')
export class V1PlaybackController {
  constructor(private mediaService: MediaService) {}

  @ApiOperation({ summary: 'Get LiveKit HLS playback URLs for a session' })
  @ApiResponse({ status: 200, description: 'LiveKit playback info' })
  @Get('live/:sessionId')
  async getLivePlayback(
    @Param('sessionId') sessionId: string,
    @Query('token') token?: string,
  ) {
    return await this.mediaService.getLivePlaybackInfo(sessionId, token);
  }

  @ApiOperation({ summary: 'Get HLS playback URLs for an ad video' })
  @ApiResponse({ status: 200, description: 'Ad playback info' })
  @Get('adz/:adId')
  async getAdPlayback(@Param('adId') adId: string) {
    return await this.mediaService.getAdPlaybackInfo(adId);
  }
}
