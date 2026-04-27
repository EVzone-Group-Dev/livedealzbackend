import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './controllers/app/app.controller';
import { AppService } from './services/app/app.service';

import { PrismaModule } from './modules/infra/prisma.module';
import { RedisModule } from './modules/infra/redis.module';
import { KafkaModule } from './modules/infra/kafka.module';
import { StageModule } from './modules/stage/stage.module';
import { CommerceModule } from './modules/commerce/commerce.module';
import { AudienceModule } from './modules/audience/audience.module';
import { MediaModule } from './modules/media/media.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { CollaborationModule } from './modules/collaboration/collaboration.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    RedisModule,
    KafkaModule,
    StageModule,
    CommerceModule,
    AudienceModule,
    MediaModule,
    AnalyticsModule,
    CollaborationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
