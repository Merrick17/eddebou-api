import { User } from '../schemas/user.schema';

declare global {
  namespace Express {
    interface Request {
      user: User & { id: string };
    }
  }
} 