import { Module } from '@nestjs/common';
import { AudienceController } from '../../controllers/audience/audience.controller';
import { AudienceService } from '../../services/audience/audience.service';

@Module({
  controllers: [AudienceController],
  providers: [AudienceService],
})
export class AudienceModule {}
