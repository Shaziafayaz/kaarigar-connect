const categories = ['plumber', 'electrician', 'carpenter', 'painter', 'mechanic', 'gardener', 'tutor', 'cleaner', 'other'];
let currentPage = 1;

function readFilters() {
  const searchForm = document.getElementById('worker-search');
  const filterForm = document.getElementById('worker-filters');
  const params = new URLSearchParams();

  new FormData(searchForm).forEach((value, key) => {
    if (value) params.set(key, value);
  });
  new FormData(filterForm).forEach((value, key) => {
    if (value) params.set(key, value);
  });
  params.set('page', String(currentPage));
  params.set('limit', '12');
  return params;
}

function renderWorkerCard(profile) {
  const workerId = profile.user?._id || profile.user;
  const name = profile.user?.name || 'Worker';
  const areas = (profile.serviceAreas || []).slice(0, 2).join(', ') || 'Multiple areas';
  const avatar = `<div class="avatar">${API.initials(name)}</div>`;

  return `<article class="card worker-card">
    <div class="worker-meta">${avatar}<div><h3>${name}</h3><span class="tag">${API.formatCategory(profile.category)}</span></div></div>
    <div class="worker-info"><span class="rating">★ ${profile.averageRating || 0} (${profile.totalReviews || 0})</span><span>₹${profile.hourlyRate}/hr</span></div>
    <p>${profile.bio ? profile.bio.slice(0, 100) + (profile.bio.length > 100 ? '…' : '') : 'Experienced local professional.'}</p>
    <p style="color:var(--muted);font-size:.88rem;margin-top:10px">${areas}</p>
    <a class="button secondary" style="width:100%;margin-top:14px" href="/worker-profile.html?id=${workerId}">View profile</a>
  </article>`;
}

async function loadWorkers() {
  const results = document.getElementById('worker-results');
  const empty = document.getElementById('worker-empty');
  const pagination = document.getElementById('worker-pagination');
  results.innerHTML = '<div class="empty">Loading workers…</div>';
  empty.classList.add('hidden');
  pagination.classList.add('hidden');

  try {
    const params = readFilters();
    const result = await API.request(`/api/workers?${params.toString()}`);
    const profiles = result.data.profiles || [];

    if (!profiles.length) {
      results.innerHTML = '';
      empty.classList.remove('hidden');
      return;
    }

    results.innerHTML = profiles.map(renderWorkerCard).join('');
    const pageInfo = pagination.querySelector('[data-page-info]');
    pageInfo.textContent = `Page ${result.pagination.page} of ${result.pagination.totalPages || 1}`;
    pagination.querySelector('[data-prev]').disabled = !result.pagination.hasPreviousPage;
    pagination.querySelector('[data-next]').disabled = !result.pagination.hasNextPage;
    pagination.classList.remove('hidden');
  } catch (error) {
    results.innerHTML = `<div class="empty">${error.message}</div>`;
  }
}

function applyQueryParams() {
  const params = new URLSearchParams(location.search);
  ['category', 'area', 'minRate', 'maxRate', 'availability'].forEach((key) => {
    const value = params.get(key);
    if (!value) return;
    const field = document.querySelector(`#worker-search [name="${key}"], #worker-filters [name="${key}"]`);
    if (field) field.value = value;
  });
  const page = Number(params.get('page') || '1');
  currentPage = Number.isNaN(page) || page < 1 ? 1 : page;
}

document.getElementById('worker-search')?.addEventListener('submit', (event) => {
  event.preventDefault();
  currentPage = 1;
  loadWorkers();
});

document.getElementById('worker-filters')?.addEventListener('submit', (event) => {
  event.preventDefault();
  currentPage = 1;
  loadWorkers();
});

document.getElementById('worker-pagination')?.addEventListener('click', (event) => {
  if (event.target.matches('[data-prev]')) currentPage -= 1;
  if (event.target.matches('[data-next]')) currentPage += 1;
  if (event.target.matches('[data-prev], [data-next]')) loadWorkers();
});

applyQueryParams();
loadWorkers();
