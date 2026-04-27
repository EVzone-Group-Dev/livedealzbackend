import { Module } from '@nestjs/common';
import { CollaborationController } from '../../controllers/collaboration/collaboration.controller';
import { CollaborationService } from '../../services/collaboration/collaboration.service';
import { PrismaService } from '../../services/infra/prisma.service';
import { RedisService } from '../../services/infra/redis.service';

@Module({
  controllers: [CollaborationController],
  providers: [CollaborationService, PrismaService, RedisService],
  exports: [CollaborationService],
})
export class CollaborationModule {}
