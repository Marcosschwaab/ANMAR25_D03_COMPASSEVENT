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
import { Express } from 'express';

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
    example: '(11) 98765-4321',
    description: 'Phone number in format (XX) XXXXX-XXXX or (XX) XXXX-XXXX',
  })
  @IsString()
  @Matches(
    /^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/,
    { message: 'Phone must be in the format (XX) XXXX-XXXX or (XX) XXXXX-XXXX' },
  )
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