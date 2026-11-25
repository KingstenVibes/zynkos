const SB_URL = 'https://api.ZynkOS.linkpc.net';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHlibW56c3B2eXJ1end3Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTkzMDQsImV4cCI6MjExMDg3NTMwNH0.E2pZaS0OGtkEk6hfsMSOJ2MUu8i-iZyAHnEKg-RhnH0';
function applyNavPermissions() {
  const p = window.userProfile;
  const isFounder = p && p.role === 'FOUNDER';
  const isBeta = p && (p.role === 'FOUNDER' || p.role === 'BETA' || p.is_beta || (p.extra_roles || []).includes('BETA'));
  const admBtn = document.getElementById('nav-admin-btn');
  const betaBtn = document.getElementById('nav-beta-btn');
  if (admBtn) {
    admBtn.style.display = isFounder ? 'flex' : 'none';
    admBtn.classList.toggle('hidden', !isFounder);
  }
  if (betaBtn) {
    betaBtn.style.display = isBeta ? 'flex' : 'none';
    betaBtn.classList.toggle('hidden', !isBeta);
  }
  const topBtn = document.getElementById('top-auth-btn');
  if (topBtn) topBtn.textContent = p ? 'Sign Out' : 'Sign In';
}

window.refreshMyProfile = async function() {
  if (!window.authToken) return null;
  try {
    const uRes = await fetch(`${SB_URL}/auth/v1/user`, {
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${window.authToken}` }
    });
    if (!uRes.ok) return null;
    const authUser = await uRes.json();
    const rows = await window.sbRest(`users?id=eq.${authUser.id}`);
    let prof = Array.isArray(rows) ? rows.at(0) : null;
    if (!prof) {
      const uname = authUser.user_metadata?.username || authUser.email.split('@').at(0);
      const created = await window.sbRest('users', 'POST', {
        id: authUser.id, email: authUser.email, username: uname, role: 'MEMBER', credits: 150, xp: 0, online: true
      }, window.authToken);
      prof = Array.isArray(created) ? created.at(0) : null;
    }
    if (prof) {
      if (prof.ban_until && prof.ban_until > Date.now()) {
        localStorage.removeItem('zynk_session');
        window.authToken = null;
        window.userProfile = null;
        window.notify(`Account suspended: ${prof.ban_reason || 'Rule violation'}`, true);
        return null;
      }
      window.userProfile = prof;
      localStorage.setItem('zynk_cached_prof', JSON.stringify(prof));
      applyNavPermissions();
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }
    return prof;
  } catch (e) {
    return null;
  }
};
document.addEventListener('click', async (e) => {
  const id = e.target.id;

  if (id === 'auth-toggle-btn') {
    isSignUpMode = !isSignUpMode;
    document.getElementById('auth-title').textContent = isSignUpMode ? 'ZynkOS // Create Account' : 'ZynkOS // System Access';
    document.getElementById('auth-user').classList.toggle('hidden', !isSignUpMode);
    document.getElementById('auth-email').placeholder = isSignUpMode ? 'Email Address' : 'Username or Email Address';
    document.getElementById('auth-submit-btn').textContent = isSignUpMode ? 'Create Account & Boot' : 'Boot Into ZynkOS';
    e.target.textContent = isSignUpMode ? 'Already have an account? Switch to Sign In' : 'Need an account? Switch to Create Account';
  }

  if (id === 'auth-close-btn') {
    document.getElementById('auth-modal')?.classList.add('hidden');
    applyNavPermissions();
  }

  if (id === 'top-auth-btn') {
    if (window.userProfile) {
      await window.sbRest(`users?id=eq.${window.userProfile.id}`, 'PATCH', { online: false, last_seen: Date.now() }, window.authToken).catch(() => {});
      localStorage.removeItem('zynk_session');
      localStorage.removeItem('zynk_cached_prof');
      window.authToken = null;
      window.userProfile = null;
      applyNavPermissions();
      document.getElementById('auth-modal')?.classList.remove('hidden');
      window.notify('Signed out of ZynkOS.');
    } else {
      document.getElementById('auth-modal')?.classList.remove('hidden');
    }
  }
  if (id === 'auth-submit-btn') {
    const btn = e.target;
    let loginId = document.getElementById('auth-email').value.trim();
    const pass = document.getElementById('auth-pass').value;
    const uname = document.getElementById('auth-user').value.trim();
    const remember = document.getElementById('remember-me')?.checked;

    if (!loginId || pass.length < 6) return window.notify('Enter your login and a 6+ char password.', true);
    btn.disabled = true;
    btn.textContent = 'Booting...';

    try {
      if (isSignUpMode) {
        if (!uname || uname.length < 3) throw new Error('Choose a username (3+ chars).');
        const res = await fetch(`${SB_URL}/auth/v1/signup`, {
          method: 'POST',
          headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginId, password: pass, data: { username: uname } })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || data.error_description || 'Sign up failed.');
        if (!data.access_token) {
          window.notify('Account created! Check your email to confirm, then sign in.');
          btn.disabled = false;
          btn.textContent = 'Create Account & Boot';
          return;
        }
        window.authToken = data.access_token;
        if (remember) localStorage.setItem('zynk_session', JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token }));
      } else {
        if (!loginId.includes('@')) {
          const found = await window.sbRest(`users?username=ilike.${encodeURIComponent(loginId.replace(/^@/, ''))}&select=email`);
          const m = Array.isArray(found) ? found.at(0) : null;
          if (!m?.email) throw new Error('Username not found.');
          loginId = m.email;
        }
        const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=password`, {
          method: 'POST',
          headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: loginId, password: pass })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error_description || 'Invalid login credentials.');
        window.authToken = data.access_token;
        if (remember) localStorage.setItem('zynk_session', JSON.stringify({ access_token: data.access_token, refresh_token: data.refresh_token }));
      }

      document.getElementById('auth-modal')?.classList.add('hidden');
      const prof = await window.refreshMyProfile();
      if (prof) {
        window.sbRest(`users?id=eq.${prof.id}`, 'PATCH', { online: true, last_seen: Date.now() }, window.authToken).catch(() => {});
        window.notify(`Welcome back, ${prof.username}!`);
      }
    } catch (err) {
      window.notify(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = isSignUpMode ? 'Create Account & Boot' : 'Boot Into ZynkOS';
    }
  }
});
window.addEventListener('DOMContentLoaded', async () => {
  applyNavPermissions();
  const raw = localStorage.getItem('zynk_session');
  if (!raw) return;
  try {
    const sess = JSON.parse(raw);
    const cached = localStorage.getItem('zynk_cached_prof');
    if (cached && sess.access_token) {
      window.authToken = sess.access_token;
      window.userProfile = JSON.parse(cached);
      document.getElementById('auth-modal')?.classList.add('hidden');
      applyNavPermissions();
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }
    const rRes = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: { 'apikey': SB_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: sess.refresh_token })
    });
    if (rRes.ok) {
      const fresh = await rRes.json();
      window.authToken = fresh.access_token;
      localStorage.setItem('zynk_session', JSON.stringify({ access_token: fresh.access_token, refresh_token: fresh.refresh_token }));
      document.getElementById('auth-modal')?.classList.add('hidden');
      const prof = await window.refreshMyProfile();
      if (prof) window.sbRest(`users?id=eq.${prof.id}`, 'PATCH', { online: true, last_seen: Date.now() }, window.authToken).catch(() => {});
    } else if (!cached) {
      localStorage.removeItem('zynk_session');
    }
  } catch (e) {}
});

window.addEventListener('beforeunload', () => {
  if (window.userProfile && window.authToken) {
    fetch(`${SB_URL}/rest/v1/users?id=eq.${window.userProfile.id}`, {
      method: 'PATCH',
      keepalive: true,
      headers: { 'apikey': SB_KEY, 'Authorization': `Bearer ${window.authToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ online: false, last_seen: Date.now() })
    }).catch(() => {});
  }
});

window.authToken = null;
window.userProfile = null;
let isSignUpMode = false;

window.notify = function(msg, isErr = false, onClick = null) {
  let box = document.getElementById('zynk-toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zynk-toast-box';
    box.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:99999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'glass-card';
  t.style.cssText = `padding:12px 16px;border-color:${isErr ? '#f43f5e' : '#10b981'};background:rgba(4,7,11,0.95);font-size:0.86rem;max-width:340px;cursor:${onClick ? 'pointer' : 'default'};box-shadow:0 8px 24px rgba(0,0,0,0.6);`;
  t.textContent = msg;
  if (onClick) t.onclick = () => { onClick(); t.remove(); };
  box.appendChild(t);
  setTimeout(() => t.remove(), 4500);
};

window.sbRest = async function(path, method = 'GET', body = null, token = null) {
  const headers = { 'apikey': SB_KEY, 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  else if (SB_KEY.startsWith('eyJ')) headers['Authorization'] = `Bearer ${SB_KEY}`;
  if (method === 'POST' || method === 'PATCH') headers['Prefer'] = 'return=representation';
  const res = await fetch(`${SB_URL}/rest/v1/${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  if (res.status === 204) return [];
  return res.json().catch(() => []);
};
