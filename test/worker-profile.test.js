const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const app = require('../server/app');
const { WorkerProfile, serviceCategories } = require('../server/models/WorkerProfile');

test('worker profile has correct defaults and validates a complete profile', async () => {
  const profile = new WorkerProfile({
    user: '507f191e810c19729de860ea',
    category: 'electrician',
    hourlyRate: 500,
    skills: ['Wiring', 'Fan installation'],
    serviceAreas: ['Pune']
  });

  await profile.validate();
  assert.equal(profile.availability, 'available');
  assert.equal(profile.isApproved, false);
  assert.equal(serviceCategories.includes('electrician'), true);
});

test('worker profile rejects unsupported service categories', async () => {
  const profile = new WorkerProfile({
    user: '507f191e810c19729de860ea',
    category: 'unsupported',
    hourlyRate: 500
  });

  await assert.rejects(profile.validate(), /`unsupported` is not a valid enum value/);
});

test('worker profile endpoints require authentication', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/workers/me/profile`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});
