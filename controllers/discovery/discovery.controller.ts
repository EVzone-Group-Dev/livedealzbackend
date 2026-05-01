import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DiscoveryService } from '../../services/discovery/discovery.service';

@ApiTags('discovery')
@Controller('discovery')
export class DiscoveryController {
  constructor(private discoveryService: DiscoveryService) {}

  @ApiOperation({ summary: 'Get audience interaction tabs configuration' })
  @Get('tabs')
  getTabs() {
    return this.discoveryService.getAudienceTabs();
  }

  @ApiOperation({ summary: 'Get video filter and effect metadata' })
  @Get('filters')
  getFilters() {
    return this.discoveryService.getFilterMetadata();
  }

  @ApiOperation({ summary: 'Get scene layout templates' })
  @Get('scenes')
  getScenes() {
    return this.discoveryService.getSceneTemplates();
  }

  @ApiOperation({ summary: 'Get available media source types' })
  @Get('sources')
  getSources() {
    return this.discoveryService.getSourceOptions();
  }
}
