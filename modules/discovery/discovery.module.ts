import { Module } from '@nestjs/common';
import { DiscoveryController } from '../../controllers/discovery/discovery.controller';
import { DiscoveryService } from '../../services/discovery/discovery.service';

@Module({
  controllers: [DiscoveryController],
  providers: [DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}
