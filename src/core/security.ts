import crypto from 'crypto';
import argon2 from 'argon2';
import { TokenizerConfig } from '../types';
import { DEFAULT_CONFIG } from '../config/defaults';

export class SecurityManager {
  private config: TokenizerConfig;

  constructor(config: Partial<TokenizerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async generateSecureHash(value: string): Promise<string> {
    const combined = value + this.config.pepper + this.config.masterPassword;
    
    const hash = await argon2.hash(combined, {
      type: argon2.argon2id,
      timeCost: this.config.hashIterations,
      memoryCost: this.config.hashMemoryCost,
      parallelism: this.config.hashParallelism,
    });

    return hash;
  }


  encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(this.getEncryptionKey()),
      iv
    );
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  }

  decrypt(text: string): string {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(this.getEncryptionKey()),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  }

  private getEncryptionKey(): string {
    return crypto
      .createHash('sha256')
      .update(this.config.masterPassword + this.config.pepper)
      .digest('hex')
      .substring(0, 32);
  }

  validatePassword(attempt: string): boolean {
    return crypto.timingSafeEqual(
      Buffer.from(attempt),
      Buffer.from(this.config.masterPassword)
    );
  }
}