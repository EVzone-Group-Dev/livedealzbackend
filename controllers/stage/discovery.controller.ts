import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { StageService } from '../../services/stage/stage.service';

@ApiTags('discovery')
@Controller('suppliers')
export class SupplierController {
  constructor(private stageService: StageService) {}

  @ApiOperation({ summary: 'List all available suppliers' })
  @Get()
  async getSuppliers() {
    return await this.stageService.getSuppliers();
  }

  @ApiOperation({ summary: 'List campaigns for a supplier' })
  @Get(':id/campaigns')
  async getCampaigns(@Param('id') supplierId: string) {
    return await this.stageService.getCampaigns(supplierId);
  }
}

@ApiTags('discovery')
@Controller('campaigns')
export class CampaignController {
  constructor(private stageService: StageService) {}

  @ApiOperation({ summary: 'List sessions for a campaign' })
  @Get(':id/sessions')
  async getSessions(@Param('id') campaignId: string) {
    return await this.stageService.getSessions(campaignId);
  }
}
