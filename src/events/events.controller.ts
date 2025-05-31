import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  ParseIntPipe, 
  DefaultValuePipe, 
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger'; // Import ApiQuery
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@ApiTags('events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Roles('admin', 'organizer')
  @Post()
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event. The organizer ID is automatically assigned based on the authenticated user.'
  })
  async create(@Body() body: CreateEventDto, @Request() req) {
    const imageUrl = 'https://dummy-s3.com/image.png';
    const organizerId = req.user.id;

    if (!organizerId) {
        throw new ForbiddenException('User ID not found in request. User may not be properly authenticated.');
    }
    return this.eventsService.create(body, organizerId, imageUrl);
  }

  @Roles('admin', 'organizer')
  @Patch(':id')
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() body: UpdateEventDto,
    @Request() req,
  ) {
    const userIdFromToken = req.user.id;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userIdFromToken) {
      throw new ForbiddenException('Forbidden: You are not the organizer of this event or an administrator.');
    }
    return this.eventsService.update(id, body);
  }

  @Get()
  @ApiOperation({ summary: 'List events with filters and pagination' })
  @ApiQuery({ name: 'name', required: false, description: 'Filter by part of the event name', type: String })
  @ApiQuery({ name: 'date', required: false, description: 'Filter events occurring on or after this date (ISO date string)', type: String, example: '2025-12-01' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by event status (active or inactive). Defaults to active if not provided.', enum: ['active', 'inactive'] })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of events to return per page', type: Number, example: 10 })
  @ApiQuery({ name: 'startKey', required: false, description: 'Token for the next page of results (ExclusiveStartKey from previous response)', type: String })
  async list(
    @Query('name') name?: string,
    @Query('date') date?: string,
    @Query('status') status?: 'active' | 'inactive',
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number, 
    @Query('startKey') startKey?: string,
  ) {
    const filters = { name, date, status };
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    return this.eventsService.list(filters, limit, startKey);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Find an event by ID' })
  async find(@Param('id', UuidValidationPipe) id: string) {
    return this.eventsService.findById(id);
  }

  @Roles('admin', 'organizer')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an event' })
  async delete(@Param('id', UuidValidationPipe) id: string, @Request() req) {
    const userIdFromToken = req.user.id;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userIdFromToken) {
      throw new ForbiddenException('Forbidden: You are not the organizer of this event or an administrator.');
    }
    return this.eventsService.softDelete(id);
  }
}