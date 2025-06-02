import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { S3Service } from '../storage/s3.service';

@Module({
  providers: [EventsService, S3Service],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}