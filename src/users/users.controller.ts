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
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger'; // Added ApiQuery
import { FileInterceptor } from '@nestjs/platform-express';
import { S3Service } from '../storage/s3.service';
import { UuidValidationPipe } from '../common/pipes/uuid-validation.pipe';
import { UserRole } from './entities/user.entity';

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
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findById(@Param('id', UuidValidationPipe) id: string, @Request() req) {
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id', UuidValidationPipe) id: string, @Body() dto: UpdateUserDto, @Request() req) {
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only update your own data or an admin can update any user.');
    }
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async softDelete(@Param('id', UuidValidationPipe) id: string, @Request() req) {
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin or the account owner can delete');
    }
    return this.usersService.softDelete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'organizer')
  @Get()
  @ApiQuery({ name: 'name', required: false, type: String, description: 'Filter by user name (optional)' })
  @ApiQuery({ name: 'email', required: false, type: String, description: 'Filter by user email (optional)' })
  @ApiQuery({ name: 'role', required: false, type: String, description: 'Filter by user role (optional, e.g., admin, organizer, participant)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination (optional)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page (optional)' })
  async listUsers(
    @Request() req,
    @Query('name') name?: string,
    @Query('email') email?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    let pageNumber: number = page ? parseInt(page, 10) : 1;
    let limitNumber: number = limit ? parseInt(limit, 10) : 10;

    if (page && (isNaN(pageNumber) || pageNumber <= 0)) {
      throw new BadRequestException('Page must be a positive number.');
    }
    if (limit && (isNaN(limitNumber) || limitNumber <= 0)) {
      throw new BadRequestException('Limit must be a positive number.');
    }

    return this.usersService.list(
      { name, email, role },
      req.user.role as UserRole,
      pageNumber,
      limitNumber,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/profile-image')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadProfileImage(
    @Param('id', UuidValidationPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (req.user.id !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('You can only upload your own profile image or an admin can update any user.');
    }

    const imageUrl = await this.s3Service.uploadImage(file, id);

    return this.usersService.update(id, {
      profileImageUrl: imageUrl,
      updatedAt: new Date().toISOString(),
    });
  }
}