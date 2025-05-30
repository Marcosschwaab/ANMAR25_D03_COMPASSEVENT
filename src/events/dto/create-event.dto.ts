import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateEventDto {
  @ApiProperty({
    example: 'Node.js Bootcamp 2025',
    description: 'Unique name of the event',
  })
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 'An immersive event about Node.js and NestJS.',
    description: 'Detailed description of the event',
  })
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: '2025-12-01T10:00:00.000Z',
    description: 'Date when the event will take place',
  })
  @IsDateString()
  date: string;
}