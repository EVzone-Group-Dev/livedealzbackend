import { Module } from '@nestjs/common';
import { MediaController } from '../../controllers/media/media.controller';
import { MediaService } from '../../services/media/media.service';

@Module({
  controllers: [MediaController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
