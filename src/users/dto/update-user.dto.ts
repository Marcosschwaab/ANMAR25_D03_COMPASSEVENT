import {
  IsEmail,
  IsOptional,
  Matches,
  MinLength,
  IsString,
} from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @MinLength(8)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/, {
    message:
      'Password must be at least 8 characters long and include both letters and numbers',
  })
  password?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
