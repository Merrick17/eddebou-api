import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupplierInvoiceService } from '../services/supplier-invoice.service';
import { CreateSupplierInvoiceDto, UpdateSupplierInvoiceDto, SupplierInvoiceQueryDto } from '../dto/supplier-invoice.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('supplier-invoices')
@ApiBearerAuth()
@Controller('supplier-invoices')
@UseGuards(AuthGuard)
export class SupplierInvoiceController {
  constructor(private readonly supplierInvoiceService: SupplierInvoiceService) {}

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new supplier invoice' })
  create(@Body() createDto: CreateSupplierInvoiceDto, @Request() req) {
    return this.supplierInvoiceService.create(createDto, req.user.id);
  }

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'Get all supplier invoices with statistics' })
  findAll(@Query() query: SupplierInvoiceQueryDto) {
    return this.supplierInvoiceService.findAll(query);
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a supplier invoice by ID' })
  findOne(@Param('id') id: string) {
    return this.supplierInvoiceService.findById(id);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update a supplier invoice' })
  update(@Param('id') id: string, @Body() updateDto: UpdateSupplierInvoiceDto) {
    return this.supplierInvoiceService.update(id, updateDto);
  }
} 