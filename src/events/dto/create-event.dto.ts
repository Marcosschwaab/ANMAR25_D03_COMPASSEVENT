import { IsDateString, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateEventDto {
  @IsNotEmpty()
  @MinLength(3)
  name: string;

  @IsNotEmpty()
  description: string;

  @IsDateString()
  date: string;

  @IsNotEmpty()
  organizerId: string;
}
