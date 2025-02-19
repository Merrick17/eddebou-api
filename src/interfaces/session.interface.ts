export interface SessionInfo {
  userId: string;
  token: string;
  refreshToken?: string;
  deviceInfo: {
    ip: string;
    userAgent: string;
    deviceId?: string;
  };
  createdAt: Date;
  lastActivity: Date;
}