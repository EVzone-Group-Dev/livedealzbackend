import { Controller, Get, Post, Patch, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CollaborationService } from '../../services/collaboration/collaboration.service';

@ApiTags('collaboration')
@Controller('sessions/:id/collaboration')
export class CollaborationController {
  constructor(private collaborationService: CollaborationService) {}

  @ApiOperation({ summary: 'List all guest requests' })
  @Get('requests')
  async getRequests(@Param('id') sessionId: string) {
    return await this.collaborationService.getRequests(sessionId);
  }

  @ApiOperation({ summary: 'Submit a guest request (from buyer)' })
  @Post('requests')
  async submitRequest(
    @Param('id') sessionId: string,
    @Body('userId') userId: string,
    @Body('note') note?: string,
  ) {
    return await this.collaborationService.handleRequest(
      sessionId,
      userId,
      note,
    );
  }

  @ApiOperation({
    summary: 'Update guest request status (Admit/Decline/Go-Live)',
  })
  @Patch('requests/:requestId')
  async updateStatus(
    @Param('id') sessionId: string,
    @Param('requestId') requestId: string,
    @Body('status') status: string,
  ) {
    return await this.collaborationService.updateRequestStatus(
      sessionId,
      requestId,
      status as any,
    );
  }

  @ApiOperation({
    summary: 'Assign guest request to a role or specific operator',
  })
  @Patch('requests/:requestId/assign')
  async assignRequest(
    @Param('id') sessionId: string,
    @Param('requestId') requestId: string,
    @Body('role') role?: string,
    @Body('participantId') participantId?: string,
  ) {
    return await this.collaborationService.assignRequest(
      sessionId,
      requestId,
      role,
      participantId,
    );
  }

  @ApiOperation({ summary: 'Update private follow-up note for a request' })
  @Patch('requests/:requestId/note')
  async updateNote(
    @Param('id') sessionId: string,
    @Param('requestId') requestId: string,
    @Body('note') note: string,
  ) {
    return await this.collaborationService.updateFollowUpNote(
      sessionId,
      requestId,
      note,
    );
  }

  @ApiOperation({ summary: 'Get current roster of guests and operators' })
  @Get('roster')
  async getRoster(@Param('id') sessionId: string) {
    return await this.collaborationService.getRoster(sessionId);
  }

  @ApiOperation({ summary: 'Invite a guest to join the studio' })
  @Post('invites')
  async inviteGuest(
    @Param('id') sessionId: string,
    @Body('userId') userId: string,
    @Body('role') role: string,
    @Body('note') note?: string,
  ) {
    return await this.collaborationService.inviteGuest(
      sessionId,
      userId,
      role,
      note,
    );
  }

  @ApiOperation({ summary: 'Hand off lead hosting to another user' })
  @Post('handoff')
  async handoffHost(
    @Param('id') sessionId: string,
    @Body('newHostId') newHostId: string,
  ) {
    return await this.collaborationService.handoffHost(sessionId, newHostId);
  }

  @ApiOperation({ summary: 'Update split-screen layout for the session' })
  @Post('layout')
  async updateLayout(@Param('id') sessionId: string, @Body() layout: any) {
    return await this.collaborationService.updateSplitScreenLayout(
      sessionId,
      layout,
    );
  }

  @ApiOperation({ summary: 'Mute or unmute a stage participant' })
  @Post('mute')
  async muteParticipant(
    @Param('id') sessionId: string,
    @Body('participantId') participantId: string,
    @Body('isMuted') isMuted: boolean,
  ) {
    return await this.collaborationService.muteParticipant(
      sessionId,
      participantId,
      isMuted,
    );
  }

  @ApiOperation({ summary: 'Kick a participant from the session' })
  @Post('kick')
  async kick(
    @Param('id') sessionId: string,
    @Body('participantId') participantId: string,
  ) {
    return await this.collaborationService.kickParticipant(
      sessionId,
      participantId,
    );
  }

  @ApiOperation({
    summary: 'Update roster participant metadata (notes, readiness)',
  })
  @Patch('roster/:participantId')
  async updateRoster(
    @Param('id') sessionId: string,
    @Param('participantId') participantId: string,
    @Body() data: { readinessStatus?: string; producerNote?: string },
  ) {
    return await this.collaborationService.updateRosterMetadata(
      sessionId,
      participantId,
      data,
    );
  }
}
