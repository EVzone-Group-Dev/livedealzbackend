import { Module } from '@nestjs/common';
import { StageController } from '../../controllers/stage/stage.controller';
import { StageService } from '../../services/stage/stage.service';
import { StageGateway } from '../../gateways/stage/stage.gateway';

@Module({
  controllers: [StageController],
  providers: [StageService, StageGateway],
  exports: [StageService],
})
export class StageModule {}
