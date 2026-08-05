const assert = require('node:assert/strict');
const test = require('node:test');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';
process.env.JWT_EXPIRES_IN = '1h';

const app = require('../server/app');
const User = require('../server/models/User');
const generateToken = require('../server/utils/generateToken');

test('health endpoint returns the server status', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/health`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.success, true);
  } finally {
    server.close();
  }
});

test('protected endpoint rejects a missing bearer token', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/me`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.success, false);
  } finally {
    server.close();
  }
});

test('user model applies defaults and rejects invalid email addresses', async () => {
  const customer = new User({ name: 'Aarav Kumar', email: 'aarav@example.com', password: 'password123' });
  assert.equal(customer.role, 'customer');
  assert.equal(customer.isActive, true);

  const invalidUser = new User({ name: 'Aarav Kumar', email: 'invalid', password: 'password123' });
  await assert.rejects(invalidUser.validate(), /valid email address/);
});

test('JWT includes the user id and role', () => {
  const token = generateToken({ _id: '507f191e810c19729de860ea', role: 'worker' });
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(payload.sub, '507f191e810c19729de860ea');
  assert.equal(payload.role, 'worker');
});
