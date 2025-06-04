import { Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { S3Service } from '../storage/s3.service';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [EmailModule, UsersModule],
  providers: [EventsService, S3Service],
  controllers: [EventsController],
  exports: [EventsService],
})
export class EventsModule {}