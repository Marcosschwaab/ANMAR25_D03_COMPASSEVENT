import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, plainTextPassword: string): Promise<Omit<User, 'password'>> {
    const userFromDb: User | null = await this.usersService.findByEmail(email);

    if (userFromDb && typeof userFromDb.password === 'string' && await bcrypt.compare(plainTextPassword, userFromDb.password)) {
      const { password, ...result } = userFromDb;
      return result;
    }
    throw new UnauthorizedException('Invalid email or password');
  }

  async login(user: Omit<User, 'password'>) {
    const payload = {
      name: user.name,
      email: user.email,
      sub: user.id,
      roles: [user.role],
    };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}