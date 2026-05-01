import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Patch,
  Sse,
  UseGuards,
  MessageEvent,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StageService } from '../../services/stage/stage.service';
import { JwtAuthGuard } from '../../modules/auth/jwt-auth.guard';
import { RolesGuard } from '../../modules/auth/roles.guard';
import { Roles } from '../../modules/auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { Observable } from 'rxjs';

@ApiTags('studio')
@Controller('sessions')
export class StageController {
  constructor(private stageService: StageService) {}

  @ApiOperation({ summary: 'Transition session status (GO LIVE, READY, etc)' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Post(':id/stage/status')
  async setStatus(
    @Param('id') sessionId: string,
    @Body('status') status: string,
  ) {
    return await this.stageService.setSessionStatus(sessionId, status);
  }

  @ApiOperation({ summary: 'Get active session' })
  @Get('active')
  async getActive() {
    return await this.stageService.getActiveSession();
  }

  @ApiOperation({ summary: 'Get session by id' })
  @Get(':id')
  async getSession(@Param('id') id: string) {
    return await this.stageService.getSessionById(id);
  }

  @ApiOperation({ summary: 'Start a live session' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Post(':id/start')
  async startSession(@Param('id') sessionId: string) {
    return await this.stageService.startSession(sessionId);
  }

  @ApiOperation({ summary: 'Stop a live session' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Post(':id/stop')
  async stopSession(@Param('id') sessionId: string) {
    return await this.stageService.stopSession(sessionId);
  }

  @ApiOperation({ summary: 'Get session status health' })
  @Get(':id/status')
  async getStatus(@Param('id') sessionId: string) {
    return await this.stageService.getSessionStatus(sessionId);
  }

  @ApiOperation({ summary: 'Update session teleprompter script' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Post(':id/teleprompter')
  async updateTeleprompter(
    @Param('id') sessionId: string,
    @Body('script') script: string,
  ) {
    return await this.stageService.updateTeleprompter(sessionId, script);
  }

  @ApiOperation({ summary: 'Set focus product for teleprompter and UI' })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Post(':id/stage/focus')
  async setFocus(
    @Param('id') sessionId: string,
    @Body('productId') productId: string,
  ) {
    return await this.stageService.setFocusProduct(sessionId, productId);
  }

  @ApiOperation({
    summary: 'Update the Stage Truth (Layout, Scene, Pinned Item)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Patch(':id/stage/truth')
  async updateTruth(
    @Param('id') sessionId: string,
    @Body() patch: Record<string, any>,
  ) {
    return await this.stageService.updateStageTruth(sessionId, patch);
  }

  @ApiOperation({ summary: 'Get current Stage Truth' })
  @Get(':id/stage/truth')
  async getTruth(@Param('id') sessionId: string) {
    return await this.stageService.getStageTruth(sessionId);
  }

  @ApiOperation({ summary: 'Stream session events via Server-Sent Events' })
  @Sse(':id/events')
  streamEvents(@Param('id') sessionId: string): Observable<MessageEvent> {
    return new Observable<MessageEvent>((subscriber) => {
      let unsubscribe: (() => Promise<void>) | undefined;

      this.stageService
        .getStageTruth(sessionId)
        .then((truth) => {
          subscriber.next({
            type: 'message',
            data: {
              type: 'STAGE_TRUTH_INITIAL',
              data: truth,
            },
          });
        })
        .catch((error) => subscriber.error(error));

      this.stageService
        .subscribeToSessionEvents(sessionId, (message) => {
          try {
            subscriber.next({
              type: 'message',
              data: JSON.parse(message),
            });
          } catch {
            subscriber.next({
              type: 'message',
              data: message,
            });
          }
        })
        .then((cleanup) => {
          unsubscribe = cleanup;
        })
        .catch((error) => subscriber.error(error));

      return () => {
        void unsubscribe?.();
      };
    });
  }

  @ApiOperation({
    summary: 'Update persistent session settings (AI, CC, Mute, Camera)',
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPPLIER, UserRole.CREATOR, UserRole.ADMIN)
  @Patch(':id/stage/settings')
  async updateSettings(
    @Param('id') sessionId: string,
    @Body()
    settings: {
      aiEnabled?: boolean;
      ccEnabled?: boolean;
      isMuted?: boolean;
      cameraOn?: boolean;
    },
  ) {
    return await this.stageService.updateSessionSettings(sessionId, settings);
  }

  @ApiOperation({ summary: 'Get all suppliers with campaigns and sessions' })
  @Get('discovery/suppliers')
  async getSuppliers() {
    return await this.stageService.getSuppliers();
  }
}
