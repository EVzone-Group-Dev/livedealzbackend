import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Consumer[] = [];

  constructor(private configService: ConfigService) {
    this.kafka = new Kafka({
      clientId: 'livedeals-api',
      brokers: [this.configService.get<string>('KAFKA_BROKERS')!],
    });
  }

  async onModuleInit() {
    const admin = this.kafka.admin();
    await admin.connect();
    
    const topics = ['studio.analytics.events', 'studio.commerce.pinned'];
    const existingTopics = await admin.listTopics();
    
    const topicsToCreate = topics
      .filter(t => !existingTopics.includes(t))
      .map(t => ({ topic: t, numPartitions: 1 }));

    if (topicsToCreate.length > 0) {
      await admin.createTopics({ topics: topicsToCreate });
      console.log(`📦 Kafka: Created topics: ${topicsToCreate.map(t => t.topic).join(', ')}`);
    }
    
    await admin.disconnect();

    this.producer = this.kafka.producer();
    await this.producer.connect();
    console.log('📡 Kafka Producer connected');
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }

  async produce(topic: string, message: any) {
    await this.producer.send({
      topic,
      messages: [{ value: JSON.stringify(message) }],
    });
  }

  async consume(groupId: string, topic: string, onMessage: (message: any) => Promise<void>) {
    const consumer = this.kafka.consumer({ groupId });
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: false });
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        if (!message.value) return;
        const payload = JSON.parse(message.value.toString());
        await onMessage(payload);
      },
    });

    this.consumers.push(consumer);
  }
}
