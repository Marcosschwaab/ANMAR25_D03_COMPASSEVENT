import {
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Express } from 'express';
import { Transform } from 'class-transformer'; 

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Jane Doe',
    description: 'New name of the user',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    example: 'jane.doe@example.com',
    description: 'New email address of the user',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @Transform(({ value }) => (value === '' ? null : value)) 
  email?: string;

  @ApiPropertyOptional({
    example: 'NewPass123',
    description: 'New password with letters and numbers (min 8 chars)',
  })
  @IsOptional()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include both letters and numbers',
  })
  password?: string;

  @ApiPropertyOptional({
    example: '+1987654321',
    description: 'New phone number of the user',
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional new profile image file to upload. If provided, this will replace the existing profile image.',
  })
  @IsOptional()
  file?: Express.Multer.File;
}