import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface JwtPayload {
  sub: string;
  name: string;
  email: string;
  roles: string[];
}

type AuthenticatedUser = Omit<User, 'password'>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const userId = payload.sub;

    if (!userId) {
      throw new UnauthorizedException();
    }

    const user: AuthenticatedUser | null = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}