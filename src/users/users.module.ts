import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { S3Service } from '../storage/s3.service';

@Module({
  providers: [UsersService, S3Service],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
