import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { SupplierService } from '../services/supplier.service';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from '../dto/supplier.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('suppliers')
@UseGuards(AuthGuard)
export class SupplierController {
  constructor(private readonly supplierService: SupplierService) {}

  @Post()
  @Roles('admin')
  create(@Body(ValidationPipe) createDto: CreateSupplierDto) {
    return this.supplierService.create(createDto);
  }

  @Get()
  @Roles('admin', 'user')
  findAll(@Query(ValidationPipe) query: SupplierQueryDto) {
    return this.supplierService.findAll(query);
  }

  @Get(':id')
  @Roles('admin', 'user')
  findOne(@Param('id') id: string) {
    return this.supplierService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateSupplierDto
  ) {
    return this.supplierService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    await this.supplierService.delete(id);
    return {
      success: true,
      message: 'Supplier deleted successfully'
    };
  }
} 