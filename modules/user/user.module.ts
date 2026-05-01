import { Module } from '@nestjs/common';
import { UserService } from '../../services/user/user.service';
import { PrismaModule } from '../infra/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule {}
