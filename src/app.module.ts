import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DynamoDBService } from './database/dynamo.service';

@Module({
  imports: [
    ConfigModule.forRoot(),
    UsersModule],
  controllers: [AppController],
  providers: [AppService, DynamoDBService],
})
export class AppModule {}
