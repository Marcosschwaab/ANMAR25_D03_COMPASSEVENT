
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MinLength } from 'class-validator';

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
    example: 'updated-organizer-id-uuid',
    description: 'New organizer ID',
  })
  @IsOptional()
  @IsString()
  organizerId?: string;
}
