export interface TokenData {
    originalValue: string;
    createdAt: Date;
    expiresAt?: Date;
    metadata?: {
      ipAddress?: string;
      userAgent?: string;
    };
  }
  
  export interface TokenizerConfig {
    masterPassword: string;
    pepper: string;
    tokenExpiryDays?: number;
    hashIterations?: number;
    hashMemoryCost?: number;
    hashParallelism?: number;
  }
  
  export interface SecurityOptions {
    rateLimiting?: {
      windowMs: number;
      max: number;
    };
    encryption?: {
      algorithm: string;
      ivLength: number;
    };
  }