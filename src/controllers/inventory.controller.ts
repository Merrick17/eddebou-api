import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { InventoryService } from '../services/inventory.service';
import { CreateInventoryItemDto, UpdateInventoryItemDto, InventoryQueryDto } from '../dto/inventory.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InventoryItem } from 'src/schemas/inventory-item.schema';


@Controller('inventory')
@UseGuards(AuthGuard)
@ApiTags('inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new inventory item with initial stock' })
  @ApiResponse({ 
    status: 201, 
    description: 'The inventory item has been successfully created.',
    type: InventoryItem 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input or duplicate SKU.' 
  })
  @Roles('admin')
  create(@Body(ValidationPipe) createDto: CreateInventoryItemDto) {
    return this.inventoryService.create(createDto);
  }

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'Get all inventory items with pagination and filters' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns a paginated list of inventory items',
    type: InventoryItem 
  })
  findAll(@Query(ValidationPipe) query: InventoryQueryDto) {
    return this.inventoryService.findAll(query);
  }

  @Put(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Update an inventory item' })
  @ApiResponse({ 
    status: 200, 
    description: 'The inventory item has been successfully updated',
    type: InventoryItem 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid input data' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Inventory item not found' 
  })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateInventoryItemDto
  ) {
    return this.inventoryService.update(id, updateDto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Delete an inventory item' })
  @ApiResponse({ 
    status: 200, 
    description: 'The inventory item has been successfully deleted' 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'Inventory item not found' 
  })
  delete(@Param('id') id: string) {
    return this.inventoryService.delete(id);
  }
} 