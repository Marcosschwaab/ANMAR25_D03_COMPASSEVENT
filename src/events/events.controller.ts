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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('events')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Roles('admin', 'organizer')
  @Post()
  async create(@Body() body: CreateEventDto) {
    const imageUrl = 'https://dummy-s3.com/image.png';
    return this.eventsService.create(body, imageUrl);
  }

  @Roles('admin', 'organizer')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateEventDto,
    @Request() req,
  ) {
    const userId = req.user.userId;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userId) {
      throw new Error('Forbidden: You are not the organizer');
    }

    return this.eventsService.update(id, body);
  }

  @Get()
  async list(@Query() query) {
    return this.eventsService.list(query);
  }

  @Get(':id')
  async find(@Param('id') id: string) {
    return this.eventsService.findById(id);
  }

  @Roles('admin', 'organizer')
  @Delete(':id')
  async delete(@Param('id') id: string, @Request() req) {
    const userId = req.user.userId;
    const event = await this.eventsService.findById(id);

    if (req.user.role !== 'admin' && event.organizerId !== userId) {
      throw new Error('Forbidden: You are not the organizer');
    }

    return this.eventsService.softDelete(id);
  }
}
