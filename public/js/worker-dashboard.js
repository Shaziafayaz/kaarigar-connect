const user = API.requireRole(['worker']);

function splitList(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function fillProfileForm(profile) {
  document.getElementById('category').value = profile.category || 'other';
  document.getElementById('hourlyRate').value = profile.hourlyRate ?? '';
  document.getElementById('experienceYears').value = profile.experienceYears ?? 0;
  document.getElementById('availability').value = profile.availability || 'available';
  document.getElementById('bio').value = profile.bio || '';
  document.getElementById('skills').value = (profile.skills || []).join(', ');
  document.getElementById('serviceAreas').value = (profile.serviceAreas || []).join(', ');
}

function renderProfileStatus(profile) {
  const status = document.getElementById('profile-status');
  if (!profile) {
    status.innerHTML = '<div class="notice">Create your profile to appear in search.</div>';
    return;
  }
  status.innerHTML = '<div class="notice" style="background:#ecfdf5;color:#047857">Your profile is visible in public search.</div>';
}

async function loadProfile() {
  try {
    const result = await API.request('/api/workers/me/profile');
    fillProfileForm(result.data.profile);
    renderProfileStatus(result.data.profile);
  } catch (error) {
    renderProfileStatus(null);
    if (!error.message.includes('Create your worker profile')) {
      showMessage(document.querySelector('[data-profile-message]'), error.message);
    }
  }
}

document.getElementById('profile-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('[data-profile-message]');
  const button = form.querySelector('button[type="submit"]');
  showMessage(message, '');

  try {
    setLoading(button, true);
    const payload = {
      category: form.category.value,
      hourlyRate: Number(form.hourlyRate.value),
      experienceYears: Number(form.experienceYears.value || 0),
      availability: form.availability.value,
      bio: form.bio.value.trim(),
      skills: splitList(form.skills.value),
      serviceAreas: splitList(form.serviceAreas.value)
    };

    const result = await API.request('/api/workers/me/profile', { method: 'PUT', body: JSON.stringify(payload) });
    fillProfileForm(result.data.profile);
    renderProfileStatus(result.data.profile);

    showMessage(message, 'Profile saved successfully.', 'success');
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
});

function renderBookingActions(booking) {
  if (booking.status === 'pending') {
    return `<button class="button" type="button" data-status="${booking._id}" data-next="accepted">Accept</button>
      <button class="button secondary" type="button" data-status="${booking._id}" data-next="rejected">Reject</button>`;
  }
  if (booking.status === 'accepted') {
    return `<button class="button" type="button" data-status="${booking._id}" data-next="completed">Mark completed</button>`;
  }
  return '';
}

function renderWorkerBooking(booking) {
  const customerName = booking.customer?.name || 'Customer';
  return `<article class="booking-card">
    <div class="booking-card-head">
      <div><h3>${API.formatCategory(booking.service)} for ${customerName}</h3><p>${booking.description}</p></div>
      <span class="${API.statusClass(booking.status)}">${booking.status}</span>
    </div>
    <div class="booking-meta">
      <span>Preferred: ${API.formatDateTime(booking.preferredDate)}</span>
      <span>Phone: ${booking.customer?.phone || '—'}</span>
    </div>
    <div class="row-actions" style="margin-top:14px">${renderBookingActions(booking)}</div>
  </article>`;
}

async function loadBookings() {
  const container = document.getElementById('worker-bookings');
  container.innerHTML = '<div class="empty">Loading bookings…</div>';
  try {
    const result = await API.request('/api/bookings/worker');
    const bookings = result.data.bookings || [];
    container.innerHTML = bookings.length
      ? bookings.map(renderWorkerBooking).join('')
      : '<div class="empty">No booking requests yet.</div>';
  } catch (error) {
    container.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

async function updateBookingStatus(id, status) {
  try {
    await API.request(`/api/bookings/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
    await loadBookings();
  } catch (error) {
    alert(error.message);
  }
}

document.getElementById('worker-bookings')?.addEventListener('click', (event) => {
  const button = event.target.closest('[data-status]');
  if (!button) return;
  updateBookingStatus(button.dataset.status, button.dataset.next);
});

async function loadReviews() {
  const container = document.getElementById('worker-reviews');
  container.innerHTML = '<p class="prose">Loading reviews…</p>';
  try {
    const result = await API.request('/api/reviews/worker/me');
    const reviews = result.data.reviews || [];
    container.innerHTML = reviews.length
      ? reviews
          .map(
            (review) => `<article class="review">
              <strong>${review.customer?.name || 'Customer'}</strong>
              <span class="rating">★ ${review.rating}</span>
              <small style="color:var(--muted)">${API.formatDate(review.createdAt)}</small>
            </article>`
          )
          .join('')
      : '<p class="prose">No reviews yet.</p>';
  } catch (error) {
    container.innerHTML = `<p class="prose">${error.message}</p>`;
  }
}

document.querySelector('.tabs')?.addEventListener('click', (event) => {
  if (!event.target.matches('[data-panel]')) return;
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
  event.target.classList.add('active');
  ['profile', 'bookings', 'reviews'].forEach((panel) => {
    document.getElementById(`panel-${panel}`).classList.toggle('hidden', panel !== event.target.dataset.panel);
  });
  if (event.target.dataset.panel === 'bookings') loadBookings();
  if (event.target.dataset.panel === 'reviews') loadReviews();
});

if (user) loadProfile();
