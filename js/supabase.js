const SB_URL = 'https://api.ZynkOS.linkpc.net';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHlibW56c3B2eXJ1end3Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTkzMDQsImV4cCI6MjExMDg3NTMwNH0.E2pZaS0OGtkEk6hfsMSOJ2MUu8i-iZyAHnEKg-RhnH0';

window.notify = function(msg, isError = false) {
  let box = document.getElementById('zynk-toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zynk-toast-box';
    box.className = 'zynk-toast-box';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'zynk-toast' + (isError ? ' err' : '');
  t.textContent = msg;
  box.appendChild(t);
  setTimeout(() => t.remove(), 4500);
};

window.sbRest = async function(path, method = 'GET', body = null, token = null) {
  const headers = { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + (token || SB_KEY), 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  const res = await fetch(SB_URL + '/rest/v1/' + path, { method, headers, body: body ? JSON.stringify(body) : null });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error((data && data.message) || 'Database error');
  return data;
};

window.currentUser = null;
window.userProfile = null;
window.authToken = null;
let isSignup = false;

function lockScreen(locked) {
  const m = document.getElementById('auth-modal');
  const s = document.querySelector('.os-shell');
  if (m) m.classList.toggle('hidden', !locked);
  if (s) s.classList.toggle('hidden', locked);
}

async function bootUser(user, token, preferredName) {
  window.currentUser = user;
  window.authToken = token;
  const rows = await window.sbRest('users?id=eq.' + user.id, 'GET', null, token);
  let prof = Array.isArray(rows) && rows.length ? rows.at(0) : null;
  if (!prof) {
    const uname = preferredName || user.email.split('@').at(0);
    const isFounder = uname.toLowerCase() === 'kingstenvibes';
    const created = await window.sbRest('users', 'POST', {
      id: user.id,
      username: uname,
      avatar: 'https://dicebear.com' + encodeURIComponent(uname),
      role: isFounder ? 'FOUNDER' : 'MEMBER',
      is_beta: isFounder,
      online: true
    }, token);
    prof = Array.isArray(created) && created.length ? created.at(0) : null;
  } else {
    await window.sbRest('users?id=eq.' + user.id, 'PATCH', { online: true }, token);
  }
  window.userProfile = prof;
  lockScreen(false);
  const topBtn = document.getElementById('top-auth-btn');
  if (topBtn) topBtn.textContent = 'Sign Out';
  const isFounder = prof && prof.role === 'FOUNDER';
  const isBeta = (prof && prof.is_beta) || isFounder;
  document.getElementById('nav-admin-btn')?.classList.toggle('hidden', !isFounder);
  document.getElementById('nav-beta-btn')?.classList.toggle('hidden', !isBeta);
  window.dispatchEvent(new Event('zynk-profile-updated'));
  window.notify('Welcome back, ' + ((prof && prof.username) || 'Operator') + '!');
}

window.refreshMyProfile = async function() {
  if (!window.currentUser) return;
  const rows = await window.sbRest('users?id=eq.' + window.currentUser.id, 'GET', null, window.authToken);
  const prof = Array.isArray(rows) && rows.length ? rows.at(0) : null;
  if (prof) {
    window.userProfile = prof;
    window.dispatchEvent(new Event('zynk-profile-updated'));
  }
};

document.addEventListener('click', async (e) => {
  const id = e.target.id;

  if (id === 'auth-toggle-btn') {
    isSignup = !isSignup;
    document.getElementById('auth-title').textContent = isSignup ? 'Create ZynkOS Account' : 'ZynkOS // System Access';
    document.getElementById('auth-submit-btn').textContent = isSignup ? 'Create Account & Boot' : 'Boot Into ZynkOS';
    e.target.textContent = isSignup ? 'Have an Account? Switch to Sign In' : 'Need an account? Switch to Create Account';
    document.getElementById('auth-user').classList.toggle('hidden', !isSignup);
  }

  if (id === 'auth-close-btn') {
    lockScreen(false);
    window.notify('Booted in Guest Mode.');
  }

  if (id === 'top-auth-btn') {
    if (window.currentUser) {
      await window.sbRest('users?id=eq.' + window.currentUser.id, 'PATCH', { online: false }, window.authToken).catch(() => {});
    }
    localStorage.removeItem('zynk_session');
    sessionStorage.removeItem('zynk_session');
    window.currentUser = null;
    window.userProfile = null;
    lockScreen(true);
  }

  if (id === 'auth-submit-btn') {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-pass').value;
    const username = document.getElementById('auth-user').value.trim();
    const remBox = document.getElementById('remember-me');
    if (!email || !password) return window.notify('Enter both email and password.', true);
    if (isSignup && !username) return window.notify('Please choose a username.', true);

    e.target.disabled = true;
    e.target.textContent = 'Connecting...';
    try {
      const endpoint = isSignup ? 'signup' : 'token?grant_type=password';
      const res = await fetch(SB_URL + '/auth/v1/' + endpoint, {
        method: 'POST',
        headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error_description || data.msg || 'Authentication failed');
      if (!data.access_token) throw new Error('Account created! Turn OFF Confirm email in Supabase, then Sign In.');

      const store = remBox && remBox.checked ? localStorage : sessionStorage;
      store.setItem('zynk_session', JSON.stringify({ user: data.user, token: data.access_token }));
      await bootUser(data.user, data.access_token, username);
    } catch (err) {
      window.notify(err.message, true);
    } finally {
      e.target.disabled = false;
      e.target.textContent = isSignup ? 'Create Account & Boot' : 'Boot Into ZynkOS';
    }
  }
});

window.addEventListener('DOMContentLoaded', () => {
  lockScreen(true);
  const saved = JSON.parse(localStorage.getItem('zynk_session') || sessionStorage.getItem('zynk_session') || 'null');
  if (saved && saved.user && saved.token) {
    bootUser(saved.user, saved.token).catch(() => lockScreen(true));
  }
});
