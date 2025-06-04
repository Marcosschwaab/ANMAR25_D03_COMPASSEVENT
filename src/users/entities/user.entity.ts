import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  ORGANIZER = 'organizer',
  PARTICIPANT = 'participant',
}

export class User {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'The unique identifier of the user',
  })
  id: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'The full name of the user',
  })
  name: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'The email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'hashedpassword123',
    description: 'The hashed password of the user',
    writeOnly: true
  })
  password: string;

  @ApiProperty({
    example: '+1234567890',
    description: 'The phone number of the user',
  })
  phone: string;

  @ApiProperty({
    example: 'https://example.com/profile.jpg',
    description: 'URL of the profile image',
    required: false
  })
  profileImageUrl?: string;

  @ApiProperty({
    enum: UserRole,
    example: UserRole.PARTICIPANT,
    description: 'The role of the user',
  })
  role: UserRole;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is active',
    default: true
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt?: string;
  

  deletedAt?: string; 
}