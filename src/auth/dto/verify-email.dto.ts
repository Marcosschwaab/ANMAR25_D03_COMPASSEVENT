import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'The verification token (e.g., user ID for email verification)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID('4', { message: 'Invalid token format' }) 
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}