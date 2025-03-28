import {  TokenizerConfig } from '../types';
import { SecurityManager } from './security';
import { DEFAULT_CONFIG } from '../config/defaults';

export class Tokenizer {
  public security: SecurityManager;
  private config: TokenizerConfig;

  constructor(config: Partial<TokenizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.security = new SecurityManager(this.config);
  }


  async createToken(originalValue: string, password: string): Promise<string> {
    if (!this.security.validatePassword(password)) {
      throw new Error('Invalid password');
    }

    const payload = {
      data: originalValue,
      createdAt: Date.now(),
      expiresAt: this.config.tokenExpiryDays 
        ? Date.now() + this.config.tokenExpiryDays * 86400000
        : undefined
    };
    
    const encrypted = this.security.encrypt(JSON.stringify(payload));
    return `ol-${encrypted}`;
  }

  async resolveToken(token: string, password: string): Promise<string> {
    if (!this.security.validatePassword(password)) {
      throw new Error('Invalid password');
    }

    if (!token.startsWith('ol-') || token.length < 10) {
      throw new Error('Invalid token format');
    }

    try {
      const decrypted = this.security.decrypt(token.substring(3));
      const payload = JSON.parse(decrypted);
      
      if (payload.expiresAt && Date.now() > payload.expiresAt) {
        throw new Error('Token expired');
      }
      
      return payload.data;
    } catch (error) {
      throw new Error(`Token resolution failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async validateToken(token: string, password: string): Promise<boolean> {
    try {
      await this.resolveToken(token, password);
      return true;
    } catch {
      return false;
    }
  }
}