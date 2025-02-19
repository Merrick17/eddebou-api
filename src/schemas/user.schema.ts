import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { Permission } from '../types/permissions';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  id: string; // Virtual field that will be populated with _id

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true, enum: ['admin', 'user'], default: 'user' })
  role: string;

  @Prop({ required: true, enum: ['active', 'inactive'], default: 'active' })
  status: string;

  @Prop({
    type: [{
      service: { 
        type: String, 
        enum: [
          'users', 
          'deliveries', 
          'movements', 
          'inventory',
          'products',
          'categories',
          'suppliers',
          'customers',
          'warehouses',
          'reports',
          'settings',
          'roles',
          'audit-logs',
          'stock-movements',
          'delivery-companies',
          'supplier-invoices',
          'locations'
        ]
      },
      actions: [{ 
        type: String, 
        enum: ['create', 'read', 'update', 'delete', 'export', 'import'] 
      }]
    }],
    default: []
  })
  permissions: Permission[];

  @Prop({ default: false })
  isEmailVerified: boolean;

  @Prop({ type: String, default: null })
  verificationToken: string;

  @Prop({ type: String, default: null })
  resetToken: string;

  @Prop({ type: String, default: null })
  refreshToken: string;

  @Prop({ type: Date, default: null })
  lastLogin: Date;

  @Prop({ type: Number, default: 0 })
  failedLoginAttempts: number;

  @Prop({ type: Date, default: null })
  lockoutUntil: Date;

  @Prop({ type: [{ 
    timestamp: { type: Date, default: Date.now },
    action: String,
    ip: String,
    userAgent: String
  }], default: [] })
  activityLogs: Array<{
    timestamp: Date;
    action: string;
    ip: string;
    userAgent: string;
  }>;

  @Prop({ default: false })
  twoFactorEnabled: boolean;

  @Prop({ type: String, default: null })
  twoFactorSecret: string;

  @Prop({ type: [String], default: [] })
  backupCodes: string[];

  @Prop({ type: [{ 
    deviceId: String,
    name: String,
    lastUsed: Date,
    createdAt: Date
  }], default: [] })
  trustedDevices: Array<{
    deviceId: string;
    name: string;
    lastUsed: Date;
    createdAt: Date;
  }>;

  @Prop({ type: String })
  lastLoginIp: string;

  @Prop({ type: String })
  lastLoginUserAgent: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Add virtual id field
UserSchema.virtual('id').get(function() {
  return this._id.toHexString();
});

// Add indexes
UserSchema.index({ email: 1 }, { unique: true }); 