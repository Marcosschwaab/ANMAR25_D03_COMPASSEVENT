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
} from '@nestjs/common';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  async create(@Body() body: CreateEventDto) {
    const imageUrl = 'https://dummy-s3.com/image.png'; 
    return this.eventsService.create(body, imageUrl);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: UpdateEventDto) {
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

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.eventsService.softDelete(id);
  }
}
