import { Injectable } from '@nestjs/common';

interface RateLimitRecord {
  count: number;
  firstRequest: number;
}

@Injectable()
export class RateLimitService {
  private records = new Map<string, RateLimitRecord>();

  isRateLimited(key: string, limit: number, windowSeconds: number): boolean {
    const now = Date.now();
    const windowMs = windowSeconds * 1000;
    
    const record = this.records.get(key);
    if (!record) {
      this.records.set(key, { count: 1, firstRequest: now });
      return false;
    }

    if (now - record.firstRequest > windowMs) {
      // Reset if window has passed
      this.records.set(key, { count: 1, firstRequest: now });
      return false;
    }

    record.count++;
    this.records.set(key, record);
    
    return record.count > limit;
  }

  // Cleanup old records periodically
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      if (now - record.firstRequest > 24 * 60 * 60 * 1000) { // Remove records older than 24h
        this.records.delete(key);
      }
    }
  }

  constructor() {
    // Run cleanup every hour
    setInterval(() => this.cleanup(), 60 * 60 * 1000);
  }
} 