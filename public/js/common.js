document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('[data-site-header]');
  const footer = document.querySelector('[data-site-footer]');
  const page = document.body.dataset.page || '';

  if (header) {
    header.innerHTML = `<div class="container nav"><a class="brand" href="/">Kaarigar <span>Connect</span></a><button class="menu-toggle" aria-label="Open menu">☰</button><nav class="nav-links"><a class="${page === 'home' ? 'active' : ''}" href="/">Home</a><a class="${page === 'about' ? 'active' : ''}" href="/about.html">About</a><a class="${page === 'services' ? 'active' : ''}" href="/services.html">Services</a><a class="${page === 'workers' ? 'active' : ''}" href="/workers.html">Find Workers</a><a class="${page === 'contact' ? 'active' : ''}" href="/contact.html">Contact</a></nav><div class="nav-actions" data-auth-actions></div></div>`;
  }

  if (footer) {
    footer.innerHTML = `<div class="container footer-row"><a class="brand" href="/">Kaarigar <span>Connect</span></a><p>© ${new Date().getFullYear()} Kaarigar Connect</p></div>`;
  }

  const nav = header?.querySelector('.nav');
  header?.querySelector('.menu-toggle')?.addEventListener('click', () => nav.classList.toggle('open'));

  const actions = header?.querySelector('[data-auth-actions]');
  const user = API.user();

  if (actions) {
    if (user) {
      const dashboardLink = user.role === 'worker' ? '/worker-dashboard.html' : '/customer-dashboard.html';
      const dashboardLabel = 'Dashboard';
      actions.innerHTML = `<a class="button secondary" href="${dashboardLink}">${dashboardLabel}</a><a href="/workers.html">Find workers</a><button class="button" data-logout>Logout</button>`;
    } else {
      actions.innerHTML = `<a href="/login.html">Log in</a><a class="button" href="/register.html">Join now</a>`;
    }
  }

  actions?.querySelector('[data-logout]')?.addEventListener('click', async () => {
    try {
      if (API.token()) await API.request('/api/auth/logout', { method: 'POST' });
    } catch (_) {
      /* stateless logout */
    }
    API.clearSession();
    location.href = '/';
  });
});

function showMessage(element, text, type = 'error') {
  if (!element) return;
  element.textContent = text;
  element.className = `form-message${type === 'success' ? ' success' : ''}`;
}

function setLoading(button, loading, label = 'Please wait…') {
  if (!button) return;
  if (loading) {
    button.dataset.label = button.textContent;
    button.disabled = true;
    button.textContent = label;
  } else {
    button.disabled = false;
    button.textContent = button.dataset.label || button.textContent;
  }
}
