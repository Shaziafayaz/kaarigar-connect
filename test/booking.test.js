const assert = require('node:assert/strict');
const test = require('node:test');

process.env.JWT_SECRET = 'test-secret-that-is-long-enough';

const app = require('../server/app');
const { Booking, isValidWorkerTransition, bookingStatuses } = require('../server/models/Booking');
const { parsePreferredDate, validateDescription } = require('../server/controllers/bookingController');

test('booking model validates a complete pending booking', async () => {
  const booking = new Booking({
    customer: '507f191e810c19729de860ea',
    worker: '507f191e810c19729de860eb',
    workerProfile: '507f191e810c19729de860ec',
    service: 'plumber',
    preferredDate: new Date(Date.now() + 86400000),
    description: 'Repair a leaking kitchen sink pipe.'
  });

  await booking.validate();
  assert.equal(booking.status, 'pending');
  assert.equal(bookingStatuses.includes('completed'), true);
});

test('booking transition rules allow only valid worker actions', () => {
  assert.equal(isValidWorkerTransition('pending', 'accepted'), true);
  assert.equal(isValidWorkerTransition('pending', 'rejected'), true);
  assert.equal(isValidWorkerTransition('accepted', 'completed'), true);
  assert.equal(isValidWorkerTransition('pending', 'completed'), false);
  assert.equal(isValidWorkerTransition('completed', 'accepted'), false);
});

test('booking request data rejects dates in the past and short descriptions', () => {
  assert.throws(() => parsePreferredDate('2020-01-01T10:00:00.000Z'), /must be in the future/);
  assert.throws(() => validateDescription('Too short'), /10 to 1000/);
});

test('booking creation endpoint requires authentication', async () => {
  const server = app.listen(0);
  const { port } = server.address();

  try {
    const response = await fetch(`http://127.0.0.1:${port}/api/bookings`, { method: 'POST' });
    assert.equal(response.status, 401);
  } finally {
    server.close();
  }
});
