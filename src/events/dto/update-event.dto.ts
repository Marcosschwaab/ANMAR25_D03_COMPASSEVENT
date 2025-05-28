import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateEventDto {
  @IsOptional()
  name?: string;

  @IsOptional()
  description?: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  organizerId?: string;
}
