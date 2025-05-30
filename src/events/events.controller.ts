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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';

@ApiTags('events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Roles('admin', 'organizer')
  @Post()
  async create(@Body() body: CreateEventDto) {
    const imageUrl = 'https://dummy-s3.com/image.png'; // TODO: Integrar com S3
    return this.eventsService.create(body, imageUrl);
  }

  @Roles('admin', 'organizer')
  @Patch(':id')
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() body: UpdateEventDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userId) {
      throw new ForbiddenException('You are not the organizer of this event');
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
    const userId = req.user.userId;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userId) {
      throw new ForbiddenException('You are not the organizer of this event');
    }

    return this.eventsService.softDelete(id);
  }
}
