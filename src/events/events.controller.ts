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
  UseInterceptors,
  UploadedFile,
  ValidationPipe,
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { ListEventsQueryDto } from './dto/list-events-query.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpecificOptionalImageValidationPipe } from '../common/pipes/specific-optional-image-validation.pipe';
import { Express } from 'express';
import { EventStatus } from './entities/event.entity';

@ApiTags('events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Roles('admin', 'organizer')
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateEventDto })
  @ApiOperation({
    summary: 'Create a new event',
    description: 'Creates a new event with an optional image. The organizer ID is automatically assigned based on the authenticated user.'
  })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) body: CreateEventDto,
    @Request() req,
    @UploadedFile(new SpecificOptionalImageValidationPipe()) file?: Express.Multer.File,
  ) {
    const { file: _dtoFile, ...eventData } = body;
    
    const organizerId = req.user.id;

    if (!organizerId) {
        throw new ForbiddenException('User ID not found in request. User may not be properly authenticated.');
    }
    return this.eventsService.create(eventData, organizerId, file);
  }

  @Roles('admin', 'organizer')
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateEventDto })
  @ApiOperation({ summary: 'Update an event' })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) body: UpdateEventDto,
    @Request() req,
    @UploadedFile(new SpecificOptionalImageValidationPipe()) file?: Express.Multer.File,
  ) {
    const userIdFromToken = req.user.id;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userIdFromToken) {
      throw new ForbiddenException('Forbidden: You are not the organizer of this event or an administrator.');
    }
    const { file: _dtoFile, ...eventUpdates } = body;
    return this.eventsService.update(id, eventUpdates, file);
  }

  @Get()
  @ApiOperation({ summary: 'List events with filters and pagination' })
  async list(@Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) queryDto: ListEventsQueryDto) {
    const { name, date, status, limit = 10, startKey } = queryDto;
    const filters: { name?: string; date?: string; status?: EventStatus} = {};
    if (name) filters.name = name;
    if (date) filters.date = date;
    if (status) filters.status = status;
        
    return this.eventsService.list(filters, limit, startKey ? JSON.parse(startKey) : undefined);
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
    await this.eventsService.softDelete(id);
    return { message: 'Event soft deleted successfully' };
  }
}