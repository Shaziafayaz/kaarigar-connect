const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const app = require('../server/app');
const { parseDiscoveryQuery } = require('../server/controllers/workerDiscoveryController');

test('worker discovery accepts valid filters and pagination', () => {
  const options = parseDiscoveryQuery({
    category: 'electrician',
    availability: 'available',
    area: 'Pune',
    minRate: '200',
    maxRate: '800',
    sort: 'price_low',
    page: '2',
    limit: '10'
  });

  assert.equal(options.category, 'electrician');
  assert.equal(options.minRate, 200);
  assert.equal(options.page, 2);
  assert.equal(options.limit, 10);
});

test('worker discovery rejects invalid filters before database access', () => {
  assert.throws(() => parseDiscoveryQuery({ category: 'invalid' }), /valid service category/);
  assert.throws(() => parseDiscoveryQuery({ minRate: '900', maxRate: '100' }), /cannot be greater/);
  assert.throws(() => parseDiscoveryQuery({ page: '0' }), /between 1/);
});

test('public discovery endpoint rejects an invalid category', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/workers?category=invalid`);
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.match(body.message, /valid service category/);
  } finally {
    server.close();
  }
});
