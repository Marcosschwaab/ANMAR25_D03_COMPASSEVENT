import { Module } from '@nestjs/common';
import { RegistrationsService } from './registrations.service';
import { RegistrationsController } from './registrations.controller';
import { EventsModule } from '../events/events.module';
import { EmailModule } from '../email/email.module';
import { UsersModule } from '../users/users.module';


@Module({
  imports: [EventsModule, EmailModule, UsersModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}