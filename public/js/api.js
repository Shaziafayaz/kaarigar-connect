const API = {
  token: () => localStorage.getItem('kaarigar_token'),
  user: () => JSON.parse(localStorage.getItem('kaarigar_user') || 'null'),
  setSession(data) {
    localStorage.setItem('kaarigar_token', data.token);
    localStorage.setItem('kaarigar_user', JSON.stringify(data.user));
  },
  clearSession() {
    localStorage.removeItem('kaarigar_token');
    localStorage.removeItem('kaarigar_user');
  },
  async request(path, options = {}) {
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...options.headers
    };
    if (this.token()) headers.Authorization = `Bearer ${this.token()}`;
    const response = await fetch(path, { ...options, headers });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || 'Something went wrong.');
    return data;
  },
  requireRole(roles, redirect = '/login.html') {
    const user = this.user();
    if (!user || !this.token()) {
      location.href = redirect;
      return null;
    }
    if (!roles.includes(user.role)) {
      location.href = '/';
      return null;
    }
    return user;
  },
  formatCategory(value) {
    if (!value) return '';
    return value.charAt(0).toUpperCase() + value.slice(1);
  },
  formatDate(value) {
    if (!value) return '—';
    return new Date(value).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  },
  formatDateTime(value) {
    if (!value) return '—';
    return new Date(value).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },
  initials(name) {
    return (name || '?')
      .split(' ')
      .map((part) => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  },
  statusClass(status) {
    return `status status-${status || 'pending'}`;
  }
};
