import { Controller, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SeedService } from './seed.service';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('seed')
@ApiBearerAuth('JWT-auth')
@Controller('seed')
@UseGuards(AuthGuard)
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Seed the database with initial data' })
  async seed() {
    await this.seedService.seed();
    return { message: 'Database seeded successfully' };
  }
} 