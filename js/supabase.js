const SB_URL = 'https://zynkos-api.mustafa-rizvic.workers.dev';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nbHlibW56c3B2eXJ1end3Z2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyOTkzMDQsImV4cCI6MjExMDg3NTMwNH0.E2pZaS0OGtkEk6hfsMSOJ2MUu8i-iZyAHnEKg-RhnH0';

window.authToken = null;
window.userProfile = null;
let isSignUpMode = false;

window.applySavedTheme = function(profTheme) {
  const th = profTheme || localStorage.getItem('zynk_theme') || 'default';
  if (profTheme) localStorage.setItem('zynk_theme', profTheme);
  document.body.className = th === 'default' ? '' : th;
};

window.notify = function(msg, isErr = false, onClick = null) {
  let box = document.getElementById('zynk-toast-box');
  if (!box) {
    box = document.createElement('div');
    box.id = 'zynk-toast-box';
    box.style.cssText = 'position:fixed;bottom:18px;right:18px;z-index:999999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(box);
  }
  const t = document.createElement('div');
  t.className = 'glass-card';
  t.style.cssText = 'padding:12px 16px;border-color:' + (isErr ? '#f43f5e' : '#10b981') + ';background:rgba(4,7,11,0.96);font-size:0.86rem;max-width:340px;cursor:' + (onClick ? 'pointer' : 'default') + ';box-shadow:0 8px 24px rgba(0,0,0,0.6);';
  t.textContent = msg;
  if (onClick) t.onclick = function() { onClick(); t.remove(); };
  box.appendChild(t);
  setTimeout(function() { t.remove(); }, 4500);
};

window.sbRest = async function(path, method = 'GET', body = null, token = null) {
  const headers = { 'apikey': SB_KEY, 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  else if (SB_KEY.startsWith('eyJ')) headers['Authorization'] = 'Bearer ' + SB_KEY;
  if (method === 'POST' || method === 'PATCH') headers['Prefer'] = 'return=representation';
  const res = await fetch(SB_URL + '/rest/v1/' + path, {
    method: method,
    headers: headers,
    body: body ? JSON.stringify(body) : null
  });
  if (!res.ok) {
    const err = await res.json().catch(function() { return {}; });
    throw new Error(err.message || ('HTTP ' + res.status));
  }
  if (res.status === 204) return [];
  return res.json().catch(function() { return []; });
};
function applyNavPermissions() {
  const p = window.userProfile;
  const isFounder = p && p.role === 'FOUNDER';
  const isStaff = p && (['FOUNDER', 'HEAD DEV', 'DEVELOPER', 'ADMIN', 'MODERATOR'].includes((p.role || '').toUpperCase()) || (p.extra_roles || []).some(function(r) { return ['ADMIN', 'MODERATOR'].includes(r); }));
  const isBeta = p && (p.role === 'FOUNDER' || p.role === 'BETA' || p.is_beta || (p.extra_roles || []).includes('BETA'));

  const admBtn = document.getElementById('nav-admin-btn');
  const repBtn = document.getElementById('nav-reports-btn');
  const betaBtn = document.getElementById('nav-beta-btn');

  if (admBtn) { admBtn.style.display = isFounder ? 'flex' : 'none'; admBtn.classList.toggle('hidden', !isFounder); }
  if (repBtn) { repBtn.style.display = isStaff ? 'flex' : 'none'; repBtn.classList.toggle('hidden', !isStaff); }
  if (betaBtn) { betaBtn.style.display = isBeta ? 'flex' : 'none'; betaBtn.classList.toggle('hidden', !isBeta); }

  const topBtn = document.getElementById('top-auth-btn');
  if (topBtn) topBtn.textContent = p ? 'Sign Out' : 'Sign In';
}

const SAFE_USER_COLS = 'id,username,avatar,banner,bio,role,extra_roles,rank_index,credits,xp,online,equipped_color,equipped_badge,owned_items,claimed,friends,following,is_beta,avatar_frame,profile_theme,last_daily,daily_streak,saved_streak,last_surge,last_restore,last_staff_stipend,staff_streak,boost_until,msg_count,items_bought,dailies_claimed,stickers,hide_leaderboard,activity_text,last_channel,last_seen,typing_until,is_muted,mute_until,ban_until,created_at';

window.refreshMyProfile = async function() {
  if (!window.authToken) return null;
  try {
    const uRes = await fetch(SB_URL + '/auth/v1/user', {
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + window.authToken }
    });
    if (!uRes.ok) return null;
    const authUser = await uRes.json();
    const rows = await window.sbRest('users?id=eq.' + authUser.id + '&select=' + SAFE_USER_COLS, 'GET', null, window.authToken);
    let prof = Array.isArray(rows) ? rows.at(0) : null;
    if (!prof) {
      const baseUname = (authUser.user_metadata && authUser.user_metadata.username) || authUser.email.split('@').at(0);
      await window.sbRest('users', 'POST', {
        id: authUser.id, username: baseUname, avatar: 'logo.png', role: 'MEMBER', credits: 150, xp: 0, online: true
      }, window.authToken).catch(async function() {
        await window.sbRest('users', 'POST', {
          id: authUser.id, username: baseUname + '_' + authUser.id.slice(0, 4), avatar: 'logo.png', role: 'MEMBER', credits: 150, xp: 0, online: true
        }, window.authToken).catch(function() {});
      });
      const created = await window.sbRest('users?id=eq.' + authUser.id + '&select=' + SAFE_USER_COLS, 'GET', null, window.authToken);
      prof = Array.isArray(created) ? created.at(0) : null;
    }
    if (prof) {
      const privRows = await window.sbRest('users?id=eq.' + authUser.id + '&select=friend_requests,infractions,mute_reason,ban_reason', 'GET', null, window.authToken).catch(function() { return []; });
      if (Array.isArray(privRows) && privRows.at(0)) Object.assign(prof, privRows.at(0));
      prof.email = authUser.email;
      if (prof.ban_until && prof.ban_until > Date.now()) {
        localStorage.removeItem('zynk_session');
        window.authToken = null;
        window.userProfile = null;
        window.notify('Account suspended: ' + (prof.ban_reason || 'Rule violation'), true);
        return null;
      }
      window.userProfile = prof;
      window.applySavedTheme(prof.profile_theme);
      localStorage.setItem('zynk_cached_prof', JSON.stringify(prof));
      applyNavPermissions();
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }
    return prof;
  } catch (e) {
    return null;
  }
};
document.addEventListener('click', async function(e) {
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
      await window.sbRest('users?id=eq.' + window.userProfile.id, 'PATCH', { online: false, last_seen: Date.now() }, window.authToken).catch(function() {});
      localStorage.removeItem('zynk_session');
      localStorage.removeItem('zynk_cached_prof');
      window.authToken = null;
      window.userProfile = null;
      applyNavPermissions();
      const gate = document.getElementById('auth-modal');
      if (gate) { gate.style.background = '#04070b'; gate.classList.remove('hidden'); }
      window.notify('Signed out of ZynkOS.');
    } else {
      const gate = document.getElementById('auth-modal');
      if (gate) { gate.style.background = '#04070b'; gate.classList.remove('hidden'); }
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
        const res = await fetch(SB_URL + '/auth/v1/signup', {
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
          const emailLookup = await window.sbRest('rpc/get_login_email', 'POST', { uname: loginId.replace(/^@/, '') });
          if (!emailLookup || typeof emailLookup !== 'string') throw new Error('Username not found.');
          loginId = emailLookup;
        }
        const res = await fetch(SB_URL + '/auth/v1/token?grant_type=password', {
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
        window.sbRest('users?id=eq.' + prof.id, 'PATCH', { online: true, last_seen: Date.now() }, window.authToken).catch(function() {});
        window.notify('Welcome back, ' + prof.username + '!');
      }
    } catch (err) {
      window.notify(err.message, true);
    } finally {
      btn.disabled = false;
      btn.textContent = isSignUpMode ? 'Create Account & Boot' : 'Boot Into ZynkOS';
    }
  }
});
window.addEventListener('DOMContentLoaded', async function() {
  const gate = document.getElementById('auth-modal');
  if (gate) gate.style.background = '#04070b';
  window.applySavedTheme();
  applyNavPermissions();
  const raw = localStorage.getItem('zynk_session');
  if (!raw) return;
  try {
    const sess = JSON.parse(raw);
    const cached = localStorage.getItem('zynk_cached_prof');
    if (cached && sess.access_token) {
      window.authToken = sess.access_token;
      window.userProfile = JSON.parse(cached);
      window.applySavedTheme(window.userProfile.profile_theme);
      document.getElementById('auth-modal')?.classList.add('hidden');
      applyNavPermissions();
      window.dispatchEvent(new Event('zynk-profile-updated'));
    }
    const rRes = await fetch(SB_URL + '/auth/v1/token?grant_type=refresh_token', {
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
      if (prof) window.sbRest('users?id=eq.' + prof.id, 'PATCH', { online: true, last_seen: Date.now() }, window.authToken).catch(function() {});
    } else if (!cached) {
      localStorage.removeItem('zynk_session');
    }
  } catch (e) {}
});

window.addEventListener('beforeunload', function() {
  if (window.userProfile && window.authToken) {
    fetch(SB_URL + '/rest/v1/users?id=eq.' + window.userProfile.id, {
      method: 'PATCH',
      keepalive: true,
      headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + window.authToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ online: false, last_seen: Date.now() })
    }).catch(function() {});
  }
});
