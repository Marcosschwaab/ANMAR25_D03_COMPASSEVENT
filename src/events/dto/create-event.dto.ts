import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';
import { Express } from 'express';

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

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional event image file to upload.',
  })
  @IsOptional()
  file?: Express.Multer.File;
}