process.env.API_KEY = 'test-key';
jest.mock('../src/db', () => ({ query: jest.fn() }));
const request = require('supertest');
const db = require('../src/db');
const app = require('../src/app');

const KEY = { 'x-api-key': 'test-key' };
const sample = { id: 1, title: 'Learn Express', description: '', status: 'pending', priority: 2, due_date: null };

beforeEach(() => db.query.mockReset());

describe('Health & routing', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
  test('unknown route returns 404', async () => {
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
  });
  test('malformed JSON returns 400', async () => {
    const res = await request(app).post('/api/tasks').set(KEY)
      .set('Content-Type', 'application/json').send('{bad json');
    expect(res.status).toBe(400);
  });
});

describe('Security (API key on mutations)', () => {
  test('POST without key -> 401', async () => {
    const res = await request(app).post('/api/tasks').send({ title: 'x' });
    expect(res.status).toBe(401);
  });
  test('POST with wrong key -> 401', async () => {
    const res = await request(app).post('/api/tasks').set('x-api-key', 'nope').send({ title: 'x' });
    expect(res.status).toBe(401);
  });
  test('PUT without key -> 401', async () => {
    const res = await request(app).put('/api/tasks/1').send({ status: 'done' });
    expect(res.status).toBe(401);
  });
  test('DELETE without key -> 401', async () => {
    const res = await request(app).delete('/api/tasks/1');
    expect(res.status).toBe(401);
  });
  test('GET is public -> 200', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
  });
  test('SQL injection attempt in id is rejected by validation', async () => {
    const res = await request(app).get('/api/tasks/1;DROP TABLE tasks');
    expect(res.status).toBe(400);
    expect(db.query).not.toHaveBeenCalled();
  });
});

describe('Create', () => {
  test('creates a task (201)', async () => {
    db.query.mockResolvedValue({ rows: [sample] });
    const res = await request(app).post('/api/tasks').set(KEY).send({ title: 'Learn Express' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Learn Express');
  });
  test('rejects missing title (400)', async () => {
    const res = await request(app).post('/api/tasks').set(KEY).send({ description: 'x' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });
  test('rejects invalid status (400)', async () => {
    const res = await request(app).post('/api/tasks').set(KEY).send({ title: 'a', status: 'wrong' });
    expect(res.status).toBe(400);
  });
  test('rejects priority out of range (400)', async () => {
    const res = await request(app).post('/api/tasks').set(KEY).send({ title: 'a', priority: 9 });
    expect(res.status).toBe(400);
  });
  test('strips unknown fields', async () => {
    db.query.mockResolvedValue({ rows: [sample] });
    await request(app).post('/api/tasks').set(KEY).send({ title: 'a', hacker: 'x' });
    expect(db.query.mock.calls[0][1]).not.toContain('x');
  });
});

describe('Read', () => {
  test('lists tasks (200)', async () => {
    db.query.mockResolvedValue({ rows: [sample] });
    const res = await request(app).get('/api/tasks?status=pending&limit=5');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
  test('invalid status filter (400)', async () => {
    const res = await request(app).get('/api/tasks?status=bad');
    expect(res.status).toBe(400);
  });
  test('get one returns 404 when missing', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).get('/api/tasks/99');
    expect(res.status).toBe(404);
  });
  test('non-numeric id returns 400', async () => {
    const res = await request(app).get('/api/tasks/abc');
    expect(res.status).toBe(400);
  });
});

describe('Update & Delete', () => {
  test('PUT updates (200)', async () => {
    db.query.mockResolvedValue({ rows: [{ ...sample, status: 'done' }] });
    const res = await request(app).put('/api/tasks/1').set(KEY).send({ status: 'done' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('done');
  });
  test('PUT with empty body (400)', async () => {
    const res = await request(app).put('/api/tasks/1').set(KEY).send({});
    expect(res.status).toBe(400);
  });
  test('PUT on missing task (404)', async () => {
    db.query.mockResolvedValue({ rows: [] });
    const res = await request(app).put('/api/tasks/5').set(KEY).send({ status: 'done' });
    expect(res.status).toBe(404);
  });
  test('DELETE returns 204', async () => {
    db.query.mockResolvedValue({ rowCount: 1 });
    const res = await request(app).delete('/api/tasks/1').set(KEY);
    expect(res.status).toBe(204);
  });
  test('DELETE missing returns 404', async () => {
    db.query.mockResolvedValue({ rowCount: 0 });
    const res = await request(app).delete('/api/tasks/1').set(KEY);
    expect(res.status).toBe(404);
  });
});
