import { Global, Module } from '@nestjs/common';
import { KafkaService } from '../../services/infra/kafka.service';
import { KafkaConsumerService } from '../../services/infra/kafka-consumer.service';

@Global()
@Module({
  providers: [KafkaService, KafkaConsumerService],
  exports: [KafkaService],
})
export class KafkaModule {}
