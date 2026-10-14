import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/app.js';

describe('Health & System Endpoints', () => {
  it('GET /api/health should return operational status', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();
    expect(res.body.data.status).toBe('healthy');
    expect(res.body.data.services.database).toBe('connected');
    expect(res.body.data.services.server).toBe('operational');
    expect(typeof res.body.data.uptimeSeconds).toBe('number');
  });

  it('GET /api/nonexistent-route should return 404 with standard error JSON', async () => {
    const res = await request(app).get('/api/nonexistent-route');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
