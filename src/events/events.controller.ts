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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
  async list(@Query() query) {
    return this.eventsService.list(query);
  }

  @Get(':id')
  async find(@Param('id', UuidValidationPipe) id: string) { 
    return this.eventsService.findById(id);
  }

  @Roles('admin', 'organizer')
  @Delete(':id')
  async delete(@Param('id', UuidValidationPipe) id: string, @Request() req) { 
    const userIdFromToken = req.user.id;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userIdFromToken) {
      throw new ForbiddenException('Forbidden: You are not the organizer of this event or an administrator.');
    }
    return this.eventsService.softDelete(id);
  }
}