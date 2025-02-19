import { Controller, Get, Post, Put, Delete, Body, Query, Param, UseGuards, ValidationPipe } from '@nestjs/common';
import { LocationService } from '../services/location.service';
import { CreateLocationDto, UpdateLocationDto, LocationQueryDto } from '../dto/location.dto';
import { AuthGuard } from '../guards/auth.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('locations')
@UseGuards(AuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Post()
  @Roles('admin')
  create(@Body(ValidationPipe) createDto: CreateLocationDto) {
    return this.locationService.create(createDto);
  }

  @Get()
  @Roles('admin', 'user')
  findAll(@Query(ValidationPipe) query: LocationQueryDto) {
    return this.locationService.findAll(query);
  }

  @Put(':id')
  @Roles('admin')
  async update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateDto: UpdateLocationDto
  ) {
    try {
      console.log('Location update request:', {
        id,
        updateDto
      });

      const updated = await this.locationService.update(id, updateDto);
      
      console.log('Location update successful:', updated);
      
      return {
        success: true,
        data: updated
      };
    } catch (error) {
      // Detailed error logging
      console.error('Location update controller error - Full details:', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          errors: error.errors,
          kind: error.kind,
          path: error.path,
          value: error.value,
          reason: error.reason,
          response: error.response
        },
        requestData: {
          id: id,
          updateDto: updateDto
        }
      });

      // Return a structured error response
      return {
        success: false,
        error: error.name || 'Bad Request Exception',
        message: error.message || 'Operation failed',
        details: error.response || null,
        validationErrors: error.errors || null
      };
    }
  }

  @Put(':id/capacity')
  @Roles('admin')
  updateCapacity(
    @Param('id') id: string,
    @Body('capacityChange', ValidationPipe) capacityChange: number,
  ) {
    return this.locationService.updateCapacity(id, capacityChange);
  }

  @Delete(':id')
  @Roles('admin')
  async delete(@Param('id') id: string) {
    try {
      await this.locationService.delete(id);
      return {
        success: true,
        message: 'Location deleted successfully'
      };
    } catch (error) {
      console.error('Location deletion error:', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        id
      });

      throw error;
    }
  }
} 