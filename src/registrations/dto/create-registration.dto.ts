import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateRegistrationDto {
  @ApiProperty({
    description: 'UUID of the event',
    example: 'b3b5d9fc-1abc-47cb-a8e7-7be62f3d1fc3',
  })
  @IsUUID()
  @IsNotEmpty()
  eventId: string;
}
