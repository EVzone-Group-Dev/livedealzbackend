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
    return await this.collaborationService.handleRequest(sessionId, userId, note);
  }

  @ApiOperation({ summary: 'Update guest request status (Admit/Decline/Go-Live)' })
  @Patch('requests/:requestId')
  async updateStatus(
    @Param('id') sessionId: string,
    @Param('requestId') requestId: string,
    @Body('status') status: string,
  ) {
    return await this.collaborationService.updateRequestStatus(sessionId, requestId, status as any);
  }

  @ApiOperation({ summary: 'Get current roster of guests and operators' })
  @Get('roster')
  async getRoster(@Param('id') sessionId: string) {
    return await this.collaborationService.getRoster(sessionId);
  }
}
