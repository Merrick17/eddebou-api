import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SessionDocument = Session & Document;

@Schema({ timestamps: true })
export class Session {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop()
  refreshToken?: string;

  @Prop({ type: Object, required: true })
  deviceInfo: {
    ip: string;
    userAgent: string;
    deviceId?: string;
  };

  @Prop({ required: true })
  createdAt: Date;

  @Prop({ required: true })
  lastActivity: Date;

  @Prop({ required: true, expires: '7d' }) // TTL index to automatically remove old sessions
  expiresAt: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session); 