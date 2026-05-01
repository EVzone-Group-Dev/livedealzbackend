import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../services/user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userService: UserService,
  ) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get<string>('AUTH_ISSUER')}/.well-known/jwks.json`,
      }),
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get<string>('AUTH_AUDIENCE'),
      issuer: configService.get<string>('AUTH_ISSUER'),
      algorithms: ['RS256', 'ES256'],
    });
  }

  async validate(payload: any) {
    const user = await this.userService.syncUserFromToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.app_role || payload.global_role,
      name: payload.name,
      preferred_username: payload.preferred_username,
    });

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }
}
