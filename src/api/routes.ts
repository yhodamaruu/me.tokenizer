import { Router } from 'express';
import { Tokenizer } from '../core/tokenizer';
import { logger, logSecurityEvent, logTokenOperation } from '../logs/logger';
import { getClientIp, delay } from '../utils/helpers';
import rateLimit from 'express-rate-limit';
import { DEFAULT_SECURITY_OPTIONS } from '../config/defaults';

export function createRouter(tokenizer: Tokenizer) {
  const router = Router();

  const limiter = rateLimit({
    windowMs: DEFAULT_SECURITY_OPTIONS?.rateLimiting?.windowMs || 60000,
    max: DEFAULT_SECURITY_OPTIONS?.rateLimiting?.max || 100,
    handler: (req, res) => {
      logSecurityEvent('Rate limit exceeded', {
        ip: getClientIp(req),
        path: req.path,
      });
      res.status(429).json({ error: 'Too many requests' });
    },
  });

  router.post('/tokenize', limiter, async (req, res): Promise<void> => {
    try {
      const { value, password } = req.body;

      if (!value || !password) {
        res.status(400).json({ error: 'Missing value or password' });
        return;
      }

      // Vérification du mot de passe
      if (!tokenizer.security.validatePassword(password)) {
        logSecurityEvent('Invalid password attempt', {
          ip: getClientIp(req),
        });
        await delay(2000);
        res.status(403).json({ error: 'Invalid password' });
        return;
      }

      // Création du token (sans metadata dans la nouvelle version)
      const token = await tokenizer.createToken(value, password);

      logTokenOperation('CREATED', token, {
        valuePrefix: value.substring(0, 5) + '...',
      });

      res.json({ token });
    } catch (error) {
      logger.error('Token creation failed', { error });
      res.status(500).json({ error: 'Token creation failed' });
    }
  });

  router.post('/resolve', limiter, async (req, res): Promise<void> => {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ error: 'Missing token or password' });
      return;
    }

    try {
      const originalValue = await tokenizer.resolveToken(token, password);
      logTokenOperation('RESOLVED', token);
      res.json({ originalValue });
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid password')) {
        logSecurityEvent('Invalid password attempt during resolution', {
          ip: getClientIp(req),
          tokenPrefix: token?.substring(0, 8),
        });
        await delay(2000);
        res.status(403).json({ error: 'Invalid password' });
        return;
      }

      logger.error('Token resolution failed', { error });
      res.status(400).json({ 
        error: error instanceof Error ? error.message : 'Token resolution failed' 
      });
    }
  });

  router.post('/validate', limiter, async (req, res): Promise<void> => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        res.status(400).json({ error: 'Missing token or password' });
        return;
      }

      const isValid = await tokenizer.validateToken(token, password);

      if (isValid) {
        logTokenOperation('VALIDATED', token);
        res.json({ valid: true });
      } else {
        logTokenOperation('VALIDATION_FAILED', token);
        res.json({ valid: false });
      }
    } catch (error) {
      logger.error('Token validation failed', { error });
      res.status(500).json({ error: 'Token validation failed' });
    }
  });

  return router;
}