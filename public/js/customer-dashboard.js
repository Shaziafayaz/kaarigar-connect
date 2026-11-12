const user = API.requireRole(['customer']);
let bookings = [];
let activeFilter = 'all';
const reviewedBookings = new Set();

function renderBooking(booking) {
  const workerName = booking.worker?.name || 'Worker';
  const canCancel = ['pending', 'accepted'].includes(booking.status);
  const canReview = booking.status === 'completed' && !reviewedBookings.has(booking._id);

  return `<article class="booking-card" data-status="${booking.status}">
    <div class="booking-card-head">
      <div>
        <h3>${booking.service ? API.formatCategory(booking.service) : 'Service'} with ${workerName}</h3>
        <p>${booking.description}</p>
      </div>
      <span class="${API.statusClass(booking.status)}">${booking.status}</span>
    </div>
    <div class="booking-meta">
      <span>Preferred: ${API.formatDateTime(booking.preferredDate)}</span>
      <span>Requested: ${API.formatDate(booking.createdAt)}</span>
      <span>Rate: ₹${booking.workerProfile?.hourlyRate || '—'}/hr</span>
    </div>
    <div class="row-actions" style="margin-top:14px">
      ${canCancel ? `<button class="button secondary" type="button" data-cancel="${booking._id}">Cancel booking</button>` : ''}
      <a class="button secondary" href="/worker-profile.html?id=${booking.worker?._id || booking.worker}">View worker</a>
    </div>
    ${
      canReview
        ? `<form class="review-form" data-review-form="${booking._id}">
            <h4>Leave a review</h4>
            <div class="field"><label>Rating</label><select name="rating" required>${[5, 4, 3, 2, 1].map((value) => `<option value="${value}">${value} stars</option>`).join('')}</select></div>
            <div class="form-message" data-review-message="${booking._id}"></div>
            <button class="button" type="submit">Submit review</button>
          </form>`
        : ''
    }
  </article>`;
}

function renderBookings() {
  const list = document.getElementById('booking-list');
  const filtered = activeFilter === 'all' ? bookings : bookings.filter((booking) => booking.status === activeFilter);
  list.innerHTML = filtered.length
    ? filtered.map(renderBooking).join('')
    : '<div class="empty">No bookings in this view yet. <a class="inline-link" href="/workers.html">Find a worker</a> to get started.</div>';
}

async function loadBookings() {
  const list = document.getElementById('booking-list');
  list.innerHTML = '<div class="empty">Loading bookings…</div>';

  try {
    const result = await API.request('/api/bookings/customer');
    bookings = result.data.bookings || [];
    renderBookings();
  } catch (error) {
    list.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

async function cancelBooking(id) {
  if (!confirm('Cancel this booking?')) return;
  try {
    await API.request(`/api/bookings/${id}/cancel`, { method: 'PATCH', body: JSON.stringify({}) });
    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

document.querySelector('.tabs')?.addEventListener('click', (event) => {
  if (!event.target.matches('[data-filter]')) return;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
  event.target.classList.add('active');
  activeFilter = event.target.dataset.filter;
  renderBookings();
});

document.getElementById('booking-list')?.addEventListener('click', (event) => {
  const cancelId = event.target.dataset.cancel;
  if (cancelId) cancelBooking(cancelId);
});

document.getElementById('booking-list')?.addEventListener('submit', async (event) => {
  const form = event.target.closest('[data-review-form]');
  if (!form) return;
  event.preventDefault();

  const bookingId = form.dataset.reviewForm;
  const message = document.querySelector(`[data-review-message="${bookingId}"]`);
  const button = form.querySelector('button[type="submit"]');
  showMessage(message, '');

  try {
    setLoading(button, true);
    const payload = Object.fromEntries(new FormData(form));
    payload.bookingId = bookingId;
    await API.request('/api/reviews', { method: 'POST', body: JSON.stringify(payload) });
    reviewedBookings.add(bookingId);
    showMessage(message, 'Review submitted. Thank you!', 'success');
    form.remove();
  } catch (error) {
    if (error.message.includes('already reviewed')) reviewedBookings.add(bookingId);
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
});

if (user) loadBookings();
