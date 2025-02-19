import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (uri: string): MongooseModuleOptions => ({
  uri,
  //@ts-ignore
  useNewUrlParser: true,
  useUnifiedTopology: true,
  retryWrites: false,
  // Disable transactions by default for compatibility
  directConnection: true,
  // Add timeout settings
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 10000,
}); 