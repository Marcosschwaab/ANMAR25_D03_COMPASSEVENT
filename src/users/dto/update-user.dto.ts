import {
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

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
  @IsEmail()
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
    example: 'https://your-bucket.s3.amazonaws.com/profiles/user123/avatar.png',
    description: 'New profile image URL (typically auto-set by upload)',
  })
  @IsOptional()
  @IsString()
  profileImageUrl?: string;

  @ApiPropertyOptional({
    example: '2025-05-28T12:00:00.000Z',
    description: 'Timestamp of last update',
  })
  @IsOptional()
  @IsString()
  updatedAt?: string;
}
