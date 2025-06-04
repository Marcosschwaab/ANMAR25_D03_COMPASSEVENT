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
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { FilterRegistrationDto } from './dto/filter-registration.dto';

@ApiTags('registrations')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @Roles('participant', 'organizer')
  @ApiOperation({ summary: 'Create a new event registration' })
  @ApiResponse({ status: 201, description: 'Registration created' })
  @ApiResponse({ status: 400, description: 'Invalid or inactive event' })
  async create(@Body() dto: CreateRegistrationDto, @Request() req) {
    return this.registrationsService.create(dto.eventId, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'List all registrations of the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of registrations' })
  async list(
    @Request() req,
    @Query() filterDto: FilterRegistrationDto,
  ) {
    return this.registrationsService.findAllByParticipant(
      req.user.id, 
      filterDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel (soft delete) a registration by ID' })
  @ApiResponse({ status: 200, description: 'Registration cancelled' })
  @ApiResponse({ status: 404, description: 'Registration not found' })
  async cancel(
    @Param('id', UuidValidationPipe) id: string,
    @Request() req,
  ) {
    return this.registrationsService.softDelete(id, req.user.id);
  }
}