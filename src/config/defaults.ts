import { TokenizerConfig, SecurityOptions } from '../types';

export const DEFAULT_CONFIG: TokenizerConfig = {
  masterPassword: process.env.MASTER_PASSWORD || 'lemotsdepassetest!',
  pepper: process.env.PEPPER || 'lemotsdepassetest',
  tokenExpiryDays: parseInt(process.env.TOKEN_EXPIRY_DAYS || '30', 10),
  hashIterations: 3,
  hashMemoryCost: 65536,
  hashParallelism: 2,
};

export const DEFAULT_SECURITY_OPTIONS: SecurityOptions = {
  rateLimiting: {
    windowMs: 60 * 1000, 
    max: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || '100', 10),
  },
  encryption: {
    algorithm: 'aes-256-cbc',
    ivLength: 16,
  },
};