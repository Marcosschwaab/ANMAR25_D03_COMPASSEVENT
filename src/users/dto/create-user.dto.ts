import { IsEmail, IsEnum, IsNotEmpty, Matches, MinLength } from 'class-validator';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message: 'Password must be at least 8 characters and include both letters and numbers',
  })
  password: string;

  @IsNotEmpty()
  phone: string;

  @IsEnum(UserRole)
  role: UserRole;
}
