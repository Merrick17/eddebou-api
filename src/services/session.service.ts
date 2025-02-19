import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Session, SessionDocument } from '../schemas/session.schema';
import { SessionInfo } from '../interfaces/session.interface';

@Injectable()
export class SessionService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Session.name) private sessionModel: Model<SessionDocument>
  ) {}

  async createSession(
    userId: string, 
    token: string, 
    deviceInfo: { ip: string; userAgent: string; deviceId?: string },
    refreshToken?: string
  ): Promise<void> {
    const session = new this.sessionModel({
      userId,
      token,
      refreshToken,
      deviceInfo,
      createdAt: new Date(),
      lastActivity: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
    });

    await session.save();
  }

  async getSession(token: string): Promise<SessionInfo | null> {
    const session = await this.sessionModel.findOne({ token });
    if (session) {
      session.lastActivity = new Date();
      await session.save();
      return this.toSessionInfo(session);
    }
    return null;
  }

  async findByRefreshToken(refreshToken: string): Promise<SessionInfo | null> {
    const session = await this.sessionModel.findOne({ refreshToken });
    return session ? this.toSessionInfo(session) : null;
  }

  async invalidateSession(token: string): Promise<void> {
    await this.sessionModel.deleteOne({ $or: [{ token }, { refreshToken: token }] });
  }

  async invalidateAllUserSessions(userId: string): Promise<void> {
    await this.sessionModel.deleteMany({ userId });
  }

  async getUserActiveSessions(userId: string): Promise<SessionInfo[]> {
    const sessions = await this.sessionModel.find({ userId });
    return sessions.map(session => this.toSessionInfo(session));
  }

  async getUserById(userId: string): Promise<UserDocument> {
    return this.userModel.findById(userId);
  }

  private toSessionInfo(session: SessionDocument): SessionInfo {
    return {
      userId: session.userId,
      token: session.token,
      refreshToken: session.refreshToken,
      deviceInfo: session.deviceInfo,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity
    };
  }
} 