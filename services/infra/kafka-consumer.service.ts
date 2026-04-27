import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { KafkaService } from './kafka.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class KafkaConsumerService implements OnModuleInit, OnModuleDestroy {
  constructor(
    private kafkaService: KafkaService,
    private prismaService: PrismaService,
  ) {}

  async onModuleInit() {
    console.log('📥 Starting Kafka Consumers...');
    
    // Analytics Consumer
    await this.kafkaService.consume('studio-analytics-group', 'studio.analytics.events', async (payload) => {
      console.log(`📊 Kafka: Processing analytics event "${payload.name}" for session ${payload.sessionId}`);
      
      try {
        await this.prismaService.analyticsEvent.create({
          data: {
            sessionId: payload.sessionId,
            name: payload.name,
            payload: payload.payload,
          },
        });
      } catch (error) {
        console.error('❌ Failed to save analytics event from Kafka:', error);
      }
    });

    // Commerce Consumer (optional, for pinning logs)
    await this.kafkaService.consume('studio-commerce-group', 'studio.commerce.pinned', async (payload) => {
      console.log(`🛍️ Kafka: Product ${payload.productId} pinned in session ${payload.sessionId}`);
    });
  }

  async onModuleDestroy() {
    // Shutdown logic handled by KafkaService if needed
  }
}
