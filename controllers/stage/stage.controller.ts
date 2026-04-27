import { Controller, Post, Body, Param, Get, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StageService } from '../../services/stage/stage.service';

@ApiTags('studio')
@Controller('sessions')
export class StageController {
  constructor(private stageService: StageService) {}

  @ApiOperation({ summary: 'Transition session status (GO LIVE, READY, etc)' })
  @Post(':id/stage/status')
  async setStatus(@Param('id') sessionId: string, @Body('status') status: string) {
    return await this.stageService.setSessionStatus(sessionId, status);
  }

  @ApiOperation({ summary: 'Get active session' })
  @Get('active')
  async getActive() {
    return await this.stageService.getActiveSession();
  }

  @ApiOperation({ summary: 'Get session status health' })
  @Get(':id/status')
  async getStatus(@Param('id') sessionId: string) {
    return await this.stageService.getSessionStatus(sessionId);
  }

  @ApiOperation({ summary: 'Update session teleprompter script' })
  @Post(':id/teleprompter')
  async updateTeleprompter(@Param('id') sessionId: string, @Body('script') script: string) {
    return await this.stageService.updateTeleprompter(sessionId, script);
  }

  @ApiOperation({ summary: 'Set focus product for teleprompter and UI' })
  @Post(':id/stage/focus')
  async setFocus(@Param('id') sessionId: string, @Body('productId') productId: string) {
    return await this.stageService.setFocusProduct(sessionId, productId);
  }

  @ApiOperation({ summary: 'Update the Stage Truth (Layout, Scene, Pinned Item)' })
  @Patch(':id/stage/truth')
  async updateTruth(@Param('id') sessionId: string, @Body() patch: Record<string, any>) {
    return await this.stageService.updateStageTruth(sessionId, patch);
  }

  @ApiOperation({ summary: 'Get current Stage Truth' })
  @Get(':id/stage/truth')
  async getTruth(@Param('id') sessionId: string) {
    return await this.stageService.getStageTruth(sessionId);
  }
}
