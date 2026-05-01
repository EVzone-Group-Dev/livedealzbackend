import { Module } from '@nestjs/common';
import { TeleprompterService } from '../../services/teleprompter/teleprompter.service';
import { TeleprompterController } from '../../controllers/teleprompter/teleprompter.controller';
import { PrismaModule } from '../infra/prisma.module';
import { RedisModule } from '../infra/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [TeleprompterController],
  providers: [TeleprompterService],
  exports: [TeleprompterService],
})
export class TeleprompterModule {}
