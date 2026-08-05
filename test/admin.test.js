const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const app = require('../server/app');
const { parsePagination, validateAdminBookingStatus } = require('../server/controllers/adminController');

test('admin pagination accepts bounded values', () => {
  assert.deepEqual(parsePagination({ page: '3', limit: '25' }), { page: 3, limit: 25, skip: 50 });
  assert.throws(() => parsePagination({ limit: '51' }), /between 1 and 50/);
});

test('admin booking status validation accepts only known statuses', () => {
  assert.equal(validateAdminBookingStatus('cancelled'), 'cancelled');
  assert.throws(() => validateAdminBookingStatus('unknown'), /valid booking status/);
});

test('admin dashboard requires authentication', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/admin/dashboard`);
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});
