import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DynamoDBService } from './database/dynamo.service';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule],
  controllers: [AppController],
  providers: [AppService, DynamoDBService],
  exports: [DynamoDBService]
})
export class AppModule {}
