import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, IsInt, Min, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';
import { EventStatus } from '../entities/event.entity';

export class ListEventsQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por parte do nome do evento',
    example: 'Bootcamp',
    type: String,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Filtrar eventos que ocorrem a partir desta data (ISO date string)',
    example: '2025-12-01',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status do evento. Se não fornecido, o padrão é listar ativos e não deletados.',
    enum: ['active', 'inactive'],
    example: 'active',
  })
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: EventStatus;

  @ApiPropertyOptional({
    description: 'Número de eventos a serem retornados por página',
    default: 10,
    type: Number,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;

  @ApiPropertyOptional({
    description: 'Token para a próxima página de resultados (ExclusiveStartKey da resposta anterior)',
    example: 'eyJsYXN0SWRQYWdlIjoiYWFhYWFhYS0xMTExOAcgZtc=',
    type: String,
  })
  @IsOptional()
  @IsString()
  startKey?: string;
}