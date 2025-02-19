import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Location, LocationDocument } from '../schemas/location.schema';
import { CreateLocationDto, UpdateLocationDto, LocationQueryDto } from '../dto/location.dto';

@Injectable()
export class LocationService {
  constructor(
    @InjectModel(Location.name)
    private locationModel: Model<LocationDocument>,
  ) {}

  async create(createDto: CreateLocationDto): Promise<Location> {
    const newLocation = new this.locationModel({
      ...createDto,
      status: 'active',
      usedCapacity: 0,
    });
    return newLocation.save();
  }

  async findAll(query: LocationQueryDto) {
    const { page = 1, limit = 10, search, type } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } },
      ];
    }
    if (type) filter.type = type;

    const [locations, total] = await Promise.all([
      this.locationModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.locationModel.countDocuments(filter),
    ]);

    return {
      locations,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateDto: UpdateLocationDto): Promise<Location> {
    try {
      console.log('Update DTO received:', updateDto);
      
      // Validate the ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('Invalid location ID format');
      }

      // First check if location exists
      const location = await this.locationModel.findById(id);
      console.log('Existing location:', location);
      
      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      // Normalize the type value if it exists
      if (updateDto.type) {
        // Accept both formats but store as distribution_center
        if (updateDto.type === 'distribution-center') {
          updateDto.type = 'distribution_center';
        }
        
        // Validate the type
        if (!['warehouse', 'store', 'distribution_center'].includes(updateDto.type)) {
          throw new BadRequestException(
            `Invalid location type: ${updateDto.type}. Must be one of: warehouse, store, distribution_center`
          );
        }
      }

      console.log('Attempting to update with:', {
        ...updateDto,
        lastUpdated: new Date()
      });

      const updated = await this.locationModel
        .findByIdAndUpdate(
          id,
          { 
            $set: {  
              ...updateDto,
              lastUpdated: new Date()
            }
          },
          { 
            new: true,
            runValidators: true,
            context: 'query'
          }
        )
        .exec();

      if (!updated) {
        throw new BadRequestException('Update operation failed');
      }

      console.log('Update result:', updated);
      return updated;

    } catch (error) {
      // Detailed error logging
      console.error('Location update error - Full details:', {
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
        updateDto: updateDto,
        id: id
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      // Handle Mongoose validation errors
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map((err: any) => err.message);
        throw new BadRequestException(`Validation failed: ${validationErrors.join(', ')}`);
      }

      // Handle other MongoDB errors
      if (error.code === 11000) {
        throw new BadRequestException('Duplicate key error');
      }

      throw new BadRequestException(`Failed to update location: ${error.message}`);
    }
  }

  async findById(id: string): Promise<Location> {
    const location = await this.locationModel.findById(id).exec();
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }
    return location;
  }

  async updateCapacity(id: string, capacityChange: number, session?: any): Promise<Location> {
    const location = await this.locationModel.findById(id).session(session);
    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    const newCapacity = location.usedCapacity + capacityChange;
    if (newCapacity > location.capacity) {
      throw new Error('Location capacity exceeded');
    }
    if (newCapacity < 0) {
      throw new Error('Location capacity cannot be negative');
    }

    const updated = await this.locationModel
      .findByIdAndUpdate(
        id,
        { 
          $set: { 
            usedCapacity: newCapacity,
            lastUpdated: new Date()
          }
        },
        { new: true, session }
      )
      .exec();

    return updated;
  }

  async delete(id: string): Promise<void> {
    try {
      // Validate the ID format
      if (!id.match(/^[0-9a-fA-F]{24}$/)) {
        throw new BadRequestException('Invalid location ID format');
      }

      // Check if location exists and has no used capacity
      const location = await this.locationModel.findById(id);
      if (!location) {
        throw new NotFoundException(`Location with ID ${id} not found`);
      }

      // Check if location has items stored
      if (location.usedCapacity > 0) {
        throw new BadRequestException('Cannot delete location with stored items. Please remove all items first.');
      }

      const result = await this.locationModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new BadRequestException('Delete operation failed');
      }
    } catch (error) {
      console.error('Location deletion error - Full details:', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
          code: error.code,
          errors: error.errors
        },
        id
      });

      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(`Failed to delete location: ${error.message}`);
    }
  }
} 