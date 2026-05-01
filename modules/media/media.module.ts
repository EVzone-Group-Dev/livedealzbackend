import { Module } from '@nestjs/common';
import {
  MediaController,
  V1PlaybackController,
} from '../../controllers/media/media.controller';
import { MediaService } from '../../services/media/media.service';

@Module({
  controllers: [MediaController, V1PlaybackController],
  providers: [MediaService],
  exports: [MediaService],
})
export class MediaModule {}
