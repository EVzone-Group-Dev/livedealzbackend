import { Injectable } from '@nestjs/common';
import { PrismaService } from '../infra/prisma.service';
import { User, UserRole } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async syncUserFromToken(payload: {
    sub: string;
    email: string;
    role?: string;
    name?: string;
    preferred_username?: string;
  }): Promise<User> {
    const role = (payload.role as UserRole) || UserRole.BUYER;

    return await this.prisma.user.upsert({
      where: { email: payload.email },
      update: {
        role: role,
        fullName: payload.name || payload.email.split('@')[0],
      },
      create: {
        id: payload.sub,
        email: payload.email,
        handle: payload.preferred_username || payload.email.split('@')[0],
        fullName: payload.name || payload.email.split('@')[0],
        role: role,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }
}
