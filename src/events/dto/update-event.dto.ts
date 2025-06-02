import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';
import { Express } from 'express';

export class UpdateEventDto {
  @ApiPropertyOptional({
    example: 'Updated Event Name',
    description: 'New name for the event',
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name?: string;

  @ApiPropertyOptional({
    example: 'Updated description for the event.',
    description: 'New event description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    example: '2025-12-15T10:00:00.000Z',
    description: 'New date for the event',
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    example: 'https://new-dummy-s3.com/new-image.png',
    description: 'New image URL for the event (if not uploading a new file)',
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'Optional new event image file to upload. Replaces existing image.',
  })
  @IsOptional()
  file?: Express.Multer.File;
}