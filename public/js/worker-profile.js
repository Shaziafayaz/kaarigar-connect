const workerId = new URLSearchParams(location.search).get('id');
const user = API.user();

function renderProfile(profile) {
  const name = profile.user?.name || 'Worker';
  const aside = document.getElementById('profile-aside');
  const main = document.getElementById('profile-main');
  const avatar = `<div class="avatar" style="width:96px;height:96px;font-size:1.5rem">${API.initials(name)}</div>`;

  aside.innerHTML = `${avatar}
    <h1>${name}</h1>
    <p class="rating">★ ${profile.averageRating || 0} · ${profile.totalReviews || 0} reviews</p>
    <span class="tag">${API.formatCategory(profile.category)}</span>
    <span class="${API.statusClass(profile.availability)}">${profile.availability}</span>
    <p style="margin-top:16px;color:var(--muted)">₹${profile.hourlyRate}/hour · ${profile.experienceYears || 0} yrs experience</p>
    <div class="chip-row">${(profile.serviceAreas || []).map((area) => `<span class="chip">${area}</span>`).join('')}</div>`;

  const skills = (profile.skills || []).map((skill) => `<span class="tag">${skill}</span>`).join('');
  const bookingForm =
    user?.role === 'customer'
      ? `<form class="booking-form" id="booking-form">
          <h2>Request a booking</h2>
          <div class="field"><label for="service">Service</label><input id="service" name="service" type="text" value="${profile.category}" readonly></div>
          <div class="field"><label for="preferredDate">Preferred date</label><input id="preferredDate" name="preferredDate" type="datetime-local" required></div>
          <div class="field"><label for="description">Work description</label><textarea id="description" name="description" rows="4" minlength="10" maxlength="1000" required placeholder="Describe the job in at least 10 characters."></textarea></div>
          <div class="form-message" data-booking-message></div>
          <button class="button" type="submit">Send booking request</button>
        </form>`
      : !user
        ? `<div class="notice">Please <a class="inline-link" href="/login.html">log in</a> as a customer to request a booking.</div>`
        : `<div class="notice">Booking requests are available to customer accounts.</div>`;

  main.innerHTML = `<div class="panel">
      <h2>About</h2>
      <p>${profile.bio || 'This worker has not added a bio yet.'}</p>
      <h3 style="margin-top:20px">Skills</h3>
      <div class="chip-row">${skills || '<span class="chip">General expertise</span>'}</div>
      ${bookingForm}
    </div>
    <div class="panel">
      <h2>Reviews</h2>
      <div id="review-list"><p class="prose">Loading reviews…</p></div>
    </div>`;

  if (user?.role === 'customer') {
    const dateInput = document.getElementById('preferredDate');
    if (dateInput) {
      const min = new Date(Date.now() + 3600000);
      min.setMinutes(min.getMinutes() - min.getTimezoneOffset());
      dateInput.min = min.toISOString().slice(0, 16);
    }
    document.getElementById('booking-form')?.addEventListener('submit', submitBooking);
  }
}

async function submitBooking(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('[data-booking-message]');
  const button = form.querySelector('button[type="submit"]');
  showMessage(message, '');

  try {
    setLoading(button, true);
    const payload = Object.fromEntries(new FormData(form));
    payload.workerId = workerId;
    await API.request('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
    showMessage(message, 'Booking request sent. Track it from your dashboard.', 'success');
    form.reset();
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
}

async function loadReviews() {
  const list = document.getElementById('review-list');
  try {
    const result = await API.request(`/api/reviews/worker/${workerId}`);
    const reviews = result.data.reviews || [];
    list.innerHTML = reviews.length
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
    list.innerHTML = `<p class="prose">${error.message}</p>`;
  }
}

async function init() {
  const error = document.getElementById('profile-error');
  const layout = document.getElementById('profile-content');

  if (!workerId) {
    layout.classList.add('hidden');
    error.textContent = 'Worker not specified.';
    error.classList.remove('hidden');
    return;
  }

  try {
    const result = await API.request(`/api/workers/${workerId}`);
    renderProfile(result.data.profile);
    loadReviews();
  } catch (err) {
    layout.classList.add('hidden');
    error.textContent = err.message;
    error.classList.remove('hidden');
  }
}

init();
