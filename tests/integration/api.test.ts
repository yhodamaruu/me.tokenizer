import request from 'supertest';
import { TokenizerServer } from '../../src/api/server';
import { Tokenizer } from '../../src/core/tokenizer';
import { logger } from '../../src/logs/logger';

describe('Tokenizer API', () => {
  let server: TokenizerServer;
  let app: Express.Application;
  const masterPassword = 'CorrectPassword123!';

  beforeAll(() => {
    jest.spyOn(logger, 'info').mockImplementation(() => logger);
    jest.spyOn(logger, 'error').mockImplementation(() => logger);
    
    const tokenizer = new Tokenizer({ masterPassword });
    server = new TokenizerServer();
    app = server.app;
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/tokenize', () => {
    it('should create a token with valid password', async () => {
      const res = await request(app)
        .post('/api/tokenize')
        .send({ value: '444-444-444', password: masterPassword });
      
      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(res.body.token).toMatch(/^ol-/);
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/tokenize')
        .send({ value: '444-444-444', password: 'WrongPassword!' });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid password');
    });

    it('should require value and password', async () => {
      const res1 = await request(app)
        .post('/api/tokenize')
        .send({ password: masterPassword });
      
      const res2 = await request(app)
        .post('/api/tokenize')
        .send({ value: '444-444-444' });
      
      expect(res1.status).toBe(400);
      expect(res2.status).toBe(400);
    });
  });

  describe('POST /api/resolve', () => {
    let validToken: string;

    beforeEach(async () => {
      const res = await request(app)
        .post('/api/tokenize')
        .send({ value: '444-444-444', password: masterPassword });
      validToken = res.body.token;
    });

    it('should resolve token with valid password', async () => {
      const res = await request(app)
        .post('/api/resolve')
        .send({ token: validToken, password: masterPassword });
      
      expect(res.status).toBe(200);
      expect(res.body.originalValue).toBe('444-444-444');
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/resolve')
        .send({ token: validToken, password: 'WrongPassword!' });
      
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid password');
    });

    it('should reject invalid token', async () => {
      const res = await request(app)
        .post('/api/resolve')
        .send({ token: 'invalid-token', password: masterPassword });
      
      expect(res.status).toBe(400);
    });
  });
});