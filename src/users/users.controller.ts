import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Request,
  ForbiddenException,
  Query,
  UseGuards,
  UploadedFile,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../storage/s3.service';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { UserRole } from './entities/user.entity';
import { ListUserDto } from './dto/list-user.dto';
import { Express } from 'express';
import { SpecificOptionalImageValidationPipe } from '../common/pipes/specific-optional-image-validation.pipe';

@ApiBearerAuth('access-token')
@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly s3Service: S3Service,
  ) {}

  @Public()
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateUserDto })
  async create(
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) createUserDto: CreateUserDto,
    @UploadedFile(new SpecificOptionalImageValidationPipe()) file?: Express.Multer.File,
  ) {
    let profileImageUrl: string | undefined;
    const { file: _fileBody, ...userData } = createUserDto;

    if (file) {
      profileImageUrl = await this.s3Service.uploadImage(file, 'temp-user-id', 'profiles');
    }
    const user = await this.usersService.create(userData, profileImageUrl);

    if (profileImageUrl && user && user.id && profileImageUrl.includes('temp-user-id')) {
        const finalImageUrl = profileImageUrl.replace('temp-user-id', user.id);
        await this.usersService.update(user.id, { profileImageUrl: finalImageUrl });
        return { ...user, profileImageUrl: finalImageUrl };
    }
    return user;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findById(@Param('id', UuidValidationPipe) id: string, @Request() req) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UpdateUserDto })
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) updateUserDto: UpdateUserDto,
    @Request() req,
    @UploadedFile(new SpecificOptionalImageValidationPipe()) file?: Express.Multer.File,
  ) {
    // Only allow the user to update their own data
    if (req.user.id !== id) {
      throw new ForbiddenException('You can only update your own data.');
    }

    const { file: _fileBody, ...userData } = updateUserDto;
    const updatePayload: Partial<UpdateUserDto & { profileImageUrl?: string }> = { ...userData };

    if (file) {
      updatePayload.profileImageUrl = await this.s3Service.uploadImage(file, id, 'profiles');
    }

    await this.usersService.update(id, updatePayload);
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async softDelete(@Param('id', UuidValidationPipe) id: string, @Request() req) {
    if (req.user.id !== id && req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admin or the account owner can delete');
    }
    return this.usersService.softDelete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ORGANIZER)
  @Get()
  async listUsers(
    @Request() req,
    @Query(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })) listUserDto: ListUserDto,
  ) {
    const { name, email, role, page = 1, limit = 10 } = listUserDto;

    return this.usersService.list(
      { name, email, role },
      req.user.role as UserRole,
      page,
      limit,
    );
  }
}