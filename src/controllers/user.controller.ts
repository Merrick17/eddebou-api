import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '../services/user.service';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto/user.dto';
import { AuthGuard } from '../guards/auth.guard';
import { RequirePermissions } from '../decorators/require-permissions.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @RequirePermissions({ service: 'users', action: 'create' })
  @ApiOperation({ summary: 'Create a new user' })
  create(@Body() createDto: CreateUserDto) {
    return this.userService.create(createDto);
  }

  @Get()
  @RequirePermissions({ service: 'users', action: 'read' })
  @ApiOperation({ summary: 'Get all users with pagination and filters' })
  findAll(@Query() query: UserQueryDto) {
    return this.userService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions({ service: 'users', action: 'read' })
  @ApiOperation({ summary: 'Get a user by ID' })
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Put(':id')
  @RequirePermissions({ service: 'users', action: 'update' })
  @ApiOperation({ summary: 'Update a user' })
  update(@Param('id') id: string, @Body() updateDto: UpdateUserDto) {
    return this.userService.update(id, updateDto);
  }

  @Delete(':id')
  @RequirePermissions({ service: 'users', action: 'delete' })
  @ApiOperation({ summary: 'Delete a user' })
  remove(@Param('id') id: string) {
    return this.userService.delete(id);
  }
} 