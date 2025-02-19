import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeliveryCompany, DeliveryCompanyDocument } from '../schemas/delivery-company.schema';
import { CreateDeliveryCompanyDto, UpdateDeliveryCompanyDto, DeliveryCompanyQueryDto } from '../dto/delivery-company.dto';

@Injectable()
export class DeliveryCompanyService {
  constructor(
    @InjectModel(DeliveryCompany.name)
    private deliveryCompanyModel: Model<DeliveryCompanyDocument>,
  ) {}

  async create(createDto: CreateDeliveryCompanyDto): Promise<DeliveryCompany> {
    try {
      const company = new this.deliveryCompanyModel({
        ...createDto,
        status: createDto.status || 'active',
        rating: createDto.rating || 0,
      });
      return await company.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('A delivery company with this name or code already exists');
      }
      throw error;
    }
  }

  async findAll(query: DeliveryCompanyQueryDto) {
    const { status, minRating, search, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) filter.status = status;
    if (minRating) filter.rating = { $gte: minRating };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const [deliveryCompanies, total] = await Promise.all([
      this.deliveryCompanyModel
        .find(filter)
        .sort({ rating: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.deliveryCompanyModel.countDocuments(filter),
    ]);

    return {
      deliveryCompanies,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit
    };
  }

  async findById(id: string): Promise<DeliveryCompany> {
    const company = await this.deliveryCompanyModel.findById(id);
    if (!company) {
      throw new NotFoundException(`Delivery company with ID ${id} not found`);
    }
    return company;
  }

  async update(id: string, updateDto: UpdateDeliveryCompanyDto): Promise<DeliveryCompany> {
    try {
      const company = await this.deliveryCompanyModel
        .findByIdAndUpdate(id, updateDto, { new: true, runValidators: true })
        .exec();

      if (!company) {
        throw new NotFoundException(`Delivery company with ID ${id} not found`);
      }

      return company;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('A delivery company with this name or code already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<void> {
    const result = await this.deliveryCompanyModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Delivery company with ID ${id} not found`);
    }
  }

  async updateStatus(id: string, status: string): Promise<DeliveryCompany> {
    const company = await this.deliveryCompanyModel
      .findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .exec();

    if (!company) {
      throw new NotFoundException(`Delivery company with ID ${id} not found`);
    }

    return company;
  }

  async updateRating(id: string, rating: number): Promise<DeliveryCompany> {
    if (rating < 0 || rating > 5) {
      throw new BadRequestException('Rating must be between 0 and 5');
    }

    const company = await this.deliveryCompanyModel
      .findByIdAndUpdate(id, { rating }, { new: true, runValidators: true })
      .exec();

    if (!company) {
      throw new NotFoundException(`Delivery company with ID ${id} not found`);
    }

    return company;
  }
} 