import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('registrations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @Roles('participant', 'organizer')
  async create(
    @Body() dto: CreateRegistrationDto,
    @Request() req,
  ) {
    return this.registrationsService.create(dto.eventId, req.user.userId);
  }

  @Get()
  async list(
    @Request() req,
    @Query('limit') limit: number = 10,
    @Query('startKey') startKey?: string,
  ) {
    return this.registrationsService.findAllByParticipant(req.user.userId, limit, startKey);
  }

  @Delete(':id')
  async cancel(@Param('id') id: string, @Request() req) {
    return this.registrationsService.softDelete(id, req.user.userId);
  }
}
