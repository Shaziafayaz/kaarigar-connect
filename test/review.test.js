const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const app = require('../server/app');
const Review = require('../server/models/Review');
const { validateReviewInput, parsePagination } = require('../server/controllers/reviewController');

test('review model validates a complete review', async () => {
  const review = new Review({
    booking: '507f191e810c19729de860ea',
    customer: '507f191e810c19729de860eb',
    worker: '507f191e810c19729de860ec',
    workerProfile: '507f191e810c19729de860ed',
    rating: 5,
    comment: 'Quick, professional, and careful work.'
  });

  await review.validate();
  assert.equal(review.rating, 5);
});

test('review input rejects invalid ratings and short comments', () => {
  assert.throws(() => validateReviewInput({ rating: 3.5, comment: 'This is fine.' }), /whole number/);
  assert.throws(() => validateReviewInput({ rating: 4, comment: 'Bad' }), /5 to 1000/);
});

test('review pagination is bounded', () => {
  assert.deepEqual(parsePagination({ page: '2', limit: '20' }), { page: 2, limit: 20 });
  assert.throws(() => parsePagination({ limit: '51' }), /between 1 and 50/);
});

test('review creation endpoint requires authentication', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/reviews`, { method: 'POST' });
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});
