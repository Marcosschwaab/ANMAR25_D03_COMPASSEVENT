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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Public } from '../common/decorators/public.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';


@ApiBearerAuth('JWT-auth')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Public()
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':id')
  async findById(@Param('id') id: string, @Request() req) {
    if (req.user.userId !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
    return this.usersService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
    if (req.user.userId !== id) {
      throw new ForbiddenException('You can only update your own data');
    }
    return this.usersService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Request() req) {
    if (req.user.userId !== id && req.user.role !== 'admin') {
      throw new ForbiddenException('Only admin or the account owner can delete');
    }
    return this.usersService.softDelete(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin')
  @Get()
  async listUsers(
    @Query('name') name: string,
    @Query('email') email: string,
    @Query('role') role: string,
  ) {
    return this.usersService.list({ name, email, role });
  }
}

