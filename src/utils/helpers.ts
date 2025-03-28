import { Request } from 'express';

export function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string) ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

export function sanitizeInput(input: string): string {
  return input.replace(/[^a-zA-Z0-9\-_]/g, '');
}

export function validatePasswordComplexity(password: string): boolean {
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{12,}$/;
  return regex.test(password);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}