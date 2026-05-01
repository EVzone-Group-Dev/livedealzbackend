import { Module } from '@nestjs/common';
import { StageController } from '../../controllers/stage/stage.controller';
import {
  SupplierController,
  CampaignController,
} from '../../controllers/stage/discovery.controller';
import { StageService } from '../../services/stage/stage.service';
import { StageGateway } from '../../gateways/stage/stage.gateway';
import { AudienceModule } from '../audience/audience.module';
import { BuyerModule } from '../buyer/buyer.module';
import { PrismaModule } from '../infra/prisma.module';
import { RedisModule } from '../infra/redis.module';

@Module({
  imports: [AudienceModule, BuyerModule, PrismaModule, RedisModule],
  controllers: [StageController, SupplierController, CampaignController],
  providers: [StageService, StageGateway],
  exports: [StageService],
})
export class StageModule {}
