function redirectAfterAuth(user) {
  if (user.role === 'worker') location.href = '/worker-dashboard.html';
  else location.href = '/customer-dashboard.html';
}

document.getElementById('login-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('[data-form-message]');
  const button = form.querySelector('button[type="submit"]');
  showMessage(message, '');

  try {
    setLoading(button, true);
    const payload = Object.fromEntries(new FormData(form));
    const result = await API.request('/api/auth/login', { method: 'POST', body: JSON.stringify(payload) });
    API.setSession(result.data);
    redirectAfterAuth(result.data.user);
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
});

document.getElementById('register-form')?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector('[data-form-message]');
  const button = form.querySelector('button[type="submit"]');
  showMessage(message, '');

  try {
    setLoading(button, true);
    const payload = Object.fromEntries(new FormData(form));
    const result = await API.request('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
    API.setSession(result.data);
    redirectAfterAuth(result.data.user);
  } catch (error) {
    showMessage(message, error.message);
  } finally {
    setLoading(button, false);
  }
});
