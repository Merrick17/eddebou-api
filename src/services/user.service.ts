import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';
import { CreateUserDto, UpdateUserDto, UserQueryDto } from '../dto/user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {}

  async create(createDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: createDto.email });
    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createDto.password, 10);
    const user = new this.userModel({
      ...createDto,
      password: hashedPassword,
      status: 'active'
    });

    return user.save();
  }

  async findAll(query: UserQueryDto) {
    const { search, role, status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) filter.role = role;
    if (status) filter.status = status;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filter)
        .select('-password')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userModel.countDocuments(filter)
    ]);

    return {
      users,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).select('-password').exec();
  }

  async update(id: string, updateDto: UpdateUserDto): Promise<UserDocument> {
    if (updateDto.email) {
      const existingUser = await this.userModel.findOne({
        email: updateDto.email,
        _id: { $ne: id }
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }
    }

    if (updateDto.password) {
      updateDto.password = await bcrypt.hash(updateDto.password, 10);
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateDto, { new: true })
      .select('-password')
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    console.log('Finding user by email:', email);
    const user = await this.userModel.findOne({ email }).exec();
    console.log('Found user:', user);
    return user;
  }

  async incrementFailedLoginAttempts(userId: string): Promise<void> {
    const user = await this.findById(userId);
    const failedAttempts = (user.failedLoginAttempts || 0) + 1;
    
    // Lock account after 5 failed attempts
    if (failedAttempts >= 5) {
      await this.userModel.updateOne(
        { _id: userId },
        { 
          failedLoginAttempts: failedAttempts,
          lockoutUntil: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes lockout
        }
      );
    } else {
      await this.userModel.updateOne(
        { _id: userId },
        { failedLoginAttempts: failedAttempts }
      );
    }
  }

  async resetFailedLoginAttempts(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { 
        failedLoginAttempts: 0,
        lockoutUntil: null
      }
    );
  }

  async logActivity(userId: string, activity: { action: string; ip: string; userAgent: string }): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { 
        $push: { 
          activityLogs: {
            ...activity,
            timestamp: new Date()
          }
        }
      }
    );
  }

  async getActivityLogs(userId: string, limit = 10): Promise<any[]> {
    const user = await this.userModel.findById(userId);
    return user.activityLogs
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async saveResetToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { resetToken: token }
    );
  }

  async clearResetToken(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { resetToken: null }
    );
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { password: hashedPassword }
    );
  }

  async saveVerificationToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { verificationToken: token }
    );
  }

  async clearVerificationToken(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { verificationToken: null }
    );
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { isEmailVerified: true }
    );
  }

  async updateRefreshToken(userId: string, token: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { refreshToken: token }
    );
  }
} 