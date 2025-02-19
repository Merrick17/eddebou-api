import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { DeliveryCompanyService } from '../services/delivery-company.service';
import { CreateDeliveryCompanyDto, UpdateDeliveryCompanyDto, DeliveryCompanyQueryDto } from '../dto/delivery-company.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { DeliveryCompany } from 'src/schemas/delivery-company.schema';

@ApiTags('delivery-companies')
@ApiBearerAuth('JWT-auth')
@Controller('delivery-companies')
@UseGuards(AuthGuard)
export class DeliveryCompanyController {
  constructor(private readonly deliveryCompanyService: DeliveryCompanyService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new delivery company' })
  create(@Body() createDto: CreateDeliveryCompanyDto) {
    return this.deliveryCompanyService.create(createDto);
  }

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get all delivery companies' })
  @ApiOkResponse({
    description: 'Returns paginated list of delivery companies',
    schema: {
      properties: {
        deliveryCompanies: {
          type: 'array',
          items: { $ref: getSchemaPath(DeliveryCompany) }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        totalPages: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  findAll(@Query(new ValidationPipe({ transform: true })) query: DeliveryCompanyQueryDto) {
    return this.deliveryCompanyService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get a delivery company by ID' })
  findOne(@Param('id') id: string) {
    return this.deliveryCompanyService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a delivery company' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDeliveryCompanyDto) {
    return this.deliveryCompanyService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete a delivery company' })
  remove(@Param('id') id: string) {
    return this.deliveryCompanyService.delete(id);
  }
}