import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from '../services/statistics.service';
import { StatisticsQueryDto } from '../dto/statistics.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('statistics')
@ApiBearerAuth()
@Controller('statistics')
@UseGuards(AuthGuard)
@Roles('admin')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get comprehensive dashboard statistics' })
  getDashboardStats(@Query() query: StatisticsQueryDto) {
    return this.statisticsService.getDashboardStats(query);
  }
} 