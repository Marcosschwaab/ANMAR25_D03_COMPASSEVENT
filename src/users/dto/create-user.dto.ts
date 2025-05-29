import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  MinLength,
  IsOptional,
  IsString,
} from 'class-validator';
import { UserRole } from '../entities/user.entity';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
    required: true,
  })
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email address of the user',
    required: true,
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'Password123',
    description: 'The password (min 8 chars with letters and numbers)',
    minLength: 8,
    required: true,
  })
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password must be at least 8 characters and include both letters and numbers',
  })
  password: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'The phone number of the user',
    required: true,
  })
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PARTICIPANT,
    description: 'The role of the user',
    required: true,
  })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiPropertyOptional({
    example: 'https://your-bucket.s3.amazonaws.com/profiles/uuid/photo.png',
    description: 'Optional profile image URL (will be overwritten if uploaded later)',
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;
}
