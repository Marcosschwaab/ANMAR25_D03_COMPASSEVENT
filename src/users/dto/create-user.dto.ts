import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  Matches,
  MinLength,
  IsOptional,
  IsString,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '../entities/user.entity';
import { RoleValidationPipe } from '../../common/pipes/role-validation.pipe';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Express } from 'express'; // Required for Multer

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
  @Transform(({ value }) => value.toLowerCase())
  @Validate(RoleValidationPipe)
  role: UserRole;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional profile image file to upload.',
  })
  @IsOptional()
  file?: Express.Multer.File;
}