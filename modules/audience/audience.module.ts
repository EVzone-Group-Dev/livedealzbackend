import { Module } from '@nestjs/common';
import { AudienceController } from '../../controllers/audience/audience.controller';
import { AudienceService } from '../../services/audience/audience.service';
import { PrismaModule } from '../infra/prisma.module';
import { RedisModule } from '../infra/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [AudienceController],
  providers: [AudienceService],
  exports: [AudienceService],
})
export class AudienceModule {}
