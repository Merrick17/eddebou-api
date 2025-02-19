import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Supplier, SupplierDocument } from '../schemas/supplier.schema';
import { CreateSupplierDto, UpdateSupplierDto, SupplierQueryDto } from '../dto/supplier.dto';

@Injectable()
export class SupplierService {
  constructor(
    @InjectModel(Supplier.name)
    private supplierModel: Model<SupplierDocument>,
  ) {}

  async create(createDto: CreateSupplierDto): Promise<Supplier> {
    try {
      const newSupplier = new this.supplierModel({
        ...createDto,
        status: createDto.status || 'active',
      });
      return await newSupplier.save();
    } catch (error) {
      if (error.code === 11000) {  // Duplicate key error
        throw new BadRequestException('A supplier with this email already exists');
      }
      throw new BadRequestException(error.message || 'Failed to create supplier');
    }
  }

  async findAll(query: SupplierQueryDto) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;

    const [suppliers, total] = await Promise.all([
      this.supplierModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.supplierModel.countDocuments(filter),
    ]);

    return {
      suppliers,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateDto: UpdateSupplierDto): Promise<Supplier> {
    const updated = await this.supplierModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .exec();
    
    if (!updated) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return updated;
  }

  async findById(id: string): Promise<Supplier> {
    const supplier = await this.supplierModel.findById(id).exec();
    if (!supplier) {
      throw new NotFoundException(`Supplier with ID ${id} not found`);
    }
    return supplier;
  }

  async delete(id: string): Promise<void> {
    try {
      const result = await this.supplierModel.findByIdAndDelete(id).exec();
      if (!result) {
        throw new NotFoundException(`Supplier with ID ${id} not found`);
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete supplier');
    }
  }
} 