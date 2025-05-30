import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class RoleValidationPipe implements PipeTransform {
  transform(value: string) {
    const roles = Object.values(UserRole);
    if (!roles.includes(value as UserRole)) {
      throw new BadRequestException(`Invalid role: ${value}`);
    }
    return value;
  }
}
