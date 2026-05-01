import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnalyticsService } from '../../services/analytics/analytics.service';

@ApiTags('analytics')
@Controller('sessions/:id/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Get real-time KPIs' })
  @Get('live')
  async getLive(@Param('id') sessionId: string) {
    return await this.analyticsService.getLiveKPIs(sessionId);
  }

  @ApiOperation({ summary: 'Get top buyer leaderboard' })
  @Get('leaderboard')
  async getLeaderboard(@Param('id') sessionId: string) {
    return await this.analyticsService.getLeaderboard(sessionId);
  }

  @ApiOperation({ summary: 'Get activity timeline' })
  @Get('timeline')
  async getTimeline(@Param('id') sessionId: string) {
    return await this.analyticsService.getTimeline(sessionId);
  }

  @ApiOperation({ summary: 'Ingest a custom event (Kafka-bound)' })
  @Post('track')
  async track(
    @Param('id') sessionId: string,
    @Body('name') name: string,
    @Body('payload') payload: any,
  ) {
    return await this.analyticsService.trackEvent(sessionId, name, payload);
  }

  @ApiOperation({ summary: 'Get live language signals (locale, device)' })
  @Get('language/signals')
  async getLanguageSignals(@Param('id') sessionId: string) {
    return await this.analyticsService.getLanguageSignals(sessionId);
  }

  @ApiOperation({ summary: 'Toggle language feature (AI, CC)' })
  @Post('language/toggle')
  async toggleLanguage(
    @Param('id') sessionId: string,
    @Body('feature') feature: 'ai' | 'cc',
    @Body('enabled') enabled: boolean,
  ) {
    return await this.analyticsService.toggleLanguageFeature(
      sessionId,
      feature,
      enabled,
    );
  }

  @ApiOperation({ summary: 'Get session highlights' })
  @Get('highlights')
  async getHighlights(@Param('id') sessionId: string) {
    return await this.analyticsService.getHighlights(sessionId);
  }

  @ApiOperation({ summary: 'Get engagement spikes' })
  @Get('spikes')
  async getSpikes(@Param('id') sessionId: string) {
    return await this.analyticsService.getEngagementSpikes(sessionId);
  }

  @ApiOperation({ summary: 'Export session data (JSON/CSV)' })
  @Get('export/:format')
  async export(
    @Param('id') sessionId: string,
    @Param('format') format: 'json' | 'csv',
  ) {
    return await this.analyticsService.exportData(sessionId, format);
  }

  @ApiOperation({ summary: 'Get session handoff report' })
  @Get('handoff')
  async getHandoff(@Param('id') sessionId: string) {
    return await this.analyticsService.getSessionHandoff(sessionId);
  }

  @ApiOperation({ summary: 'Update global language mix for the session' })
  @Post('language/mix')
  async updateMix(@Param('id') sessionId: string, @Body('mix') mix: string) {
    return await this.analyticsService.updateLanguageMix(sessionId, mix);
  }
}
