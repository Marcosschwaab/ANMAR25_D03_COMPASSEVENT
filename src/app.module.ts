import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DynamoDBService } from './database/dynamo.service';
import { AuthModule } from './auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from './common/guards/roles.guard';
import { JwtAuthGuard } from './auth/guard/jwt-auth.guard';
import { EventsModule } from './events/events.module';
import { RegistrationsModule } from './registrations/registrations.module';




@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    EventsModule,
    RegistrationsModule,
    ],
  controllers: [AppController],
  providers: [
    AppService,
    DynamoDBService,

    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [DynamoDBService]
})
export class AppModule {}





