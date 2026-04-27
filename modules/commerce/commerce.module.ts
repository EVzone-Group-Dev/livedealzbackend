import { Module } from '@nestjs/common';
import { CommerceController } from '../../controllers/commerce/commerce.controller';
import { CommerceService } from '../../services/commerce/commerce.service';
import { StageModule } from '../stage/stage.module';

@Module({
  imports: [StageModule],
  controllers: [CommerceController],
  providers: [CommerceService],
})
export class CommerceModule {}
