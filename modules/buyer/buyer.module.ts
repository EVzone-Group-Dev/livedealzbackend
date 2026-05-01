import { Module } from '@nestjs/common';
import { BuyerController } from '../../controllers/buyer/buyer.controller';
import { BuyerService } from '../../services/buyer/buyer.service';
import { SupplierService } from '../../services/buyer/supplier.service';
import { PrismaModule } from '../infra/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [BuyerController],
  providers: [BuyerService, SupplierService],
  exports: [BuyerService, SupplierService],
})
export class BuyerModule {}
