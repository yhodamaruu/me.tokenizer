import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { Tokenizer } from '../core/tokenizer';
import { createRouter } from './routes';
import { requestLogger, errorLogger } from '../logs/middleware';
import { logger } from '../logs/logger';
import { getEnvVariable } from '../config/env';

export class TokenizerServer {
  private app: express.Express;
  private tokenizer: Tokenizer;

  constructor() {
    this.app = express();
    this.tokenizer = new Tokenizer();

    this.configureMiddleware();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddleware() {
    this.app.use(helmet());
    this.app.use(cors({
      origin: getEnvVariable('ALLOWED_ORIGINS', '*').split(','),
      methods: ['GET', 'POST'],
    }));
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(express.urlencoded({ extended: false }));
    this.app.use(requestLogger);
  }

  private configureRoutes() {
    const router = createRouter(this.tokenizer);
    this.app.use('/api', router);
    this.app.get('/health', (_req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
  }

  private configureErrorHandling() {
    this.app.use(errorLogger);
    this.app.use((_req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
    this.app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      logger.error('Unhandled error', { error: err });
      res.status(500).json({ error: 'Internal server error' });
    });
  }

  start(port: number = 3000): ReturnType<express.Express['listen']> {
    return this.app.listen(port, () => {
      logger.info(`Tokenizer server running on port ${port}`);
    });
  }
}

if (require.main === module) {
  const port = parseInt(process.env.PORT || '3000', 10);
  const server = new TokenizerServer();
  server.start(port);
}