import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TeleprompterService } from '../../services/teleprompter/teleprompter.service';

@ApiTags('teleprompter')
@Controller('sessions/:id/teleprompter')
export class TeleprompterController {
  constructor(private teleprompterService: TeleprompterService) {}

  @ApiOperation({ summary: 'Get all run-of-show segments' })
  @Get('segments')
  async getSegments(@Param('id') sessionId: string) {
    return await this.teleprompterService.getSegments(sessionId);
  }

  @ApiOperation({ summary: 'Add a new segment to the run-of-show' })
  @Post('segments')
  async createSegment(@Param('id') sessionId: string, @Body() data: any) {
    return await this.teleprompterService.createSegment(sessionId, data);
  }

  @ApiOperation({ summary: 'Update a segment' })
  @Patch('segments/:segmentId')
  async updateSegment(
    @Param('segmentId') segmentId: string,
    @Body() data: any,
  ) {
    return await this.teleprompterService.updateSegment(segmentId, data);
  }

  @ApiOperation({ summary: 'Delete a segment' })
  @Delete('segments/:segmentId')
  async deleteSegment(@Param('segmentId') segmentId: string) {
    return await this.teleprompterService.deleteSegment(segmentId);
  }

  @ApiOperation({ summary: 'Activate a segment (make it LIVE)' })
  @Post('segments/:segmentId/activate')
  async activateSegment(
    @Param('id') sessionId: string,
    @Param('segmentId') segmentId: string,
  ) {
    return await this.teleprompterService.activateSegment(sessionId, segmentId);
  }

  @ApiOperation({ summary: 'Update the full teleprompter script' })
  @Patch('script')
  async updateScript(
    @Param('id') sessionId: string,
    @Body('script') script: string,
  ) {
    return await this.teleprompterService.updateFullScript(sessionId, script);
  }
}
