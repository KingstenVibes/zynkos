if (!document.querySelector('link[rel="manifest"]')) {
  const lnk = document.createElement('link');
  lnk.rel = 'manifest';
  lnk.href = 'manifest.json';
  document.head.appendChild(lnk);
}

let deferredInstallPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

const CLOAKS = {
  none: { title: 'ZynkOS — Neural OS & Arcade', icon: 'logo.png' },
  clever: { title: 'Clever | Portal', icon: 'https://clever.com' },
  classroom: { title: 'Home - Classroom', icon: 'https://gstatic.com' },
  drive: { title: 'My Drive - Google Drive', icon: 'https://gstatic.com' },
  docs: { title: 'Google Docs', icon: 'https://gstatic.com' }
};

function applyCloak(key) {
  const c = CLOAKS[key] || CLOAKS.none;
  document.title = c.title;
  let link = document.querySelector("link[rel~='icon']");
  if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
  link.href = c.icon;
}

window.applyLiveWallpaper = function(wp) {
  let layer = document.getElementById('zynk-live-wp');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'zynk-live-wp';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.45;transition:opacity 0.3s;';
    document.body.prepend(layer);
  }
  if (!document.getElementById('zynk-wp-keyframes')) {
    const st = document.createElement('style');
    st.id = 'zynk-wp-keyframes';
    st.textContent = `
      @keyframes zynkGridMove { 0% { background-position: 0 0; } 100% { background-position: 48px 48px; } }
      @keyframes zynkPulseBg { 0%, 100% { filter: hue-rotate(0deg) brightness(1); } 50% { filter: hue-rotate(35deg) brightness(1.25); } }
    `;
    document.head.appendChild(st);
  }
  if (wp === 'grid') {
    layer.style.background = 'linear-gradient(rgba(16,185,129,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.18) 1px, transparent 1px)';
    layer.style.backgroundSize = '48px 48px';
    layer.style.animation = 'zynkGridMove 4s linear infinite';
  } else if (wp === 'nebula') {
    layer.style.background = 'radial-gradient(circle at 20% 30%, rgba(6,182,212,0.35), transparent 55%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.35), transparent 55%)';
    layer.style.backgroundSize = '100% 100%';
    layer.style.animation = 'zynkPulseBg 8s ease-in-out infinite';
  } else if (wp === 'solar') {
    layer.style.background = 'radial-gradient(circle at 50% 20%, rgba(245,158,11,0.32), transparent 60%), radial-gradient(circle at 20% 80%, rgba(244,63,94,0.25), transparent 55%)';
    layer.style.backgroundSize = '100% 100%';
    layer.style.animation = 'zynkPulseBg 7s ease-in-out infinite';
  } else {
    layer.style.background = 'none';
    layer.style.animation = 'none';
  }
};
window.zynkPanic = function() {
  window.location.replace(localStorage.getItem('zynk_panic_url') || 'https://google.com');
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && localStorage.getItem('zynk_esc_panic') === '1') window.zynkPanic();
});

function updateClock() {
  const tz = localStorage.getItem('zynk_tz') || 'auto';
  const is24 = localStorage.getItem('zynk_format') === '24';
  const now = new Date();
  const opts = tz === 'auto' ? {} : { timeZone: tz };
  const parts = new Intl.DateTimeFormat('en-US', { ...opts, weekday: 'long', month: '2-digit', day: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit', hour12: !is24 }).formatToParts(now);
  const get = (t) => (parts.find(x => x.type === t) || {}).value || '';

  const dEl = document.getElementById('hero-day');
  const tEl = document.getElementById('hero-time');
  const aEl = document.getElementById('hero-ampm');
  const dtEl = document.getElementById('hero-date');
  const tzEl = document.getElementById('hero-tz');
  const bEl = document.getElementById('tz-badge');
  const hrEl = document.getElementById('dock-hr');
  const minEl = document.getElementById('dock-min');

  if (dEl) dEl.textContent = get('weekday').toUpperCase();
  if (tEl) tEl.textContent = `${get('hour')}:${get('minute')}`;
  if (aEl) aEl.textContent = is24 ? 'HRS' : get('dayPeriod');
  if (dtEl) dtEl.textContent = `${get('month')}.${get('day')}.${get('year')}`;
  if (hrEl) hrEl.textContent = get('hour');
  if (minEl) minEl.textContent = get('minute');
  const label = tz === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz;
  if (tzEl) tzEl.textContent = `${label} • Change in Settings`;
  if (bEl) bEl.textContent = label;
}

setInterval(updateClock, 1000);
updateClock();

const HASH_ROUTES = {
  dashboard: 'dash-view', chat: 'chat-view', vortex: 'vortex-view',
  arcade: 'arcade-view', ranks: 'ranks-view', store: 'store-view',
  profile: 'profile-view', quests: 'achieve-view', leaderboards: 'leader-view',
  tools: 'tools-view', partners: 'partners-view', credits: 'credits-view',
  rules: 'rules-view', privacy: 'rules-view', tos: 'rules-view',
  beta: 'beta-view', founder: 'admin-view', settings: 'settings-view'
};

function syncRouteFromHash() {
  const slug = window.location.hash.replace(/^#/, '').toLowerCase();
  if (!slug || !HASH_ROUTES[slug]) return;
  if (slug === 'privacy' || slug === 'tos') {
    window.activeLegalTabOverride = slug.toUpperCase();
  }
  window.openTab?.(HASH_ROUTES[slug], true);
}

window.addEventListener('hashchange', syncRouteFromHash);
const searchInp = document.getElementById('global-search-inp');
const searchPop = document.getElementById('global-search-pop');

searchInp?.addEventListener('input', async () => {
  const q = searchInp.value.trim().toLowerCase();
  if (!q || !searchPop || !window.sbRest) return searchPop?.classList.add('hidden');

  const [users, items, msgs] = await Promise.all([
    window.sbRest(`users?username=ilike.*${encodeURIComponent(q)}*&select=id,username,role,equipped_color&limit=5`).catch(() => []),
    window.sbRest(`store_items?name=ilike.*${encodeURIComponent(q)}*&select=id,name,cost,item_type&limit=4`).catch(() => []),
    window.sbRest(`messages?content=ilike.*${encodeURIComponent(q)}*&select=id,username,content,channel&order=id.desc&limit=4`).catch(() => [])
  ]);

  let html = '';
  if (Array.isArray(users) && users.length) {
    html += `<div class="mono-dim" style="padding:4px 10px;font-weight:700;">MEMBERS</div>` + users.map(u => `<div class="ac-item" data-suid="${u.id}"><strong style="color:${u.equipped_color || '#10b981'}">@${u.username}</strong><span class="mono-dim">[${u.role}]</span></div>`).join('');
  }
  if (Array.isArray(items) && items.length) {
    html += `<div class="mono-dim" style="padding:4px 10px;font-weight:700;">ZYNK STORE</div>` + items.map(it => `<div class="ac-item" data-stab="store-view"><span>${it.name}</span><span class="mono-dim">${it.cost} Z</span></div>`).join('');
  }
  if (Array.isArray(msgs) && msgs.length) {
    html += `<div class="mono-dim" style="padding:4px 10px;font-weight:700;">MESSAGES</div>` + msgs.map(m => `<div class="ac-item" data-stab="chat-view"><span><strong>@${m.username}:</strong> ${String(m.content).slice(0, 38)}</span><span class="mono-dim">#${m.channel || 'global'}</span></div>`).join('');
  }

  if (!html) html = `<div style="padding:10px;" class="mono-dim">No results for "${q}"</div>`;
  searchPop.innerHTML = html;
  searchPop.classList.remove('hidden');

  searchPop.querySelectorAll('[data-suid]').forEach(el => (el.onclick = () => {
    searchPop.classList.add('hidden');
    window.openUserModal?.(el.dataset.suid);
  }));
  searchPop.querySelectorAll('[data-stab]').forEach(el => (el.onclick = () => {
    searchPop.classList.add('hidden');
    window.openTab?.(el.dataset.stab);
  }));
});

document.addEventListener('click', (e) => {
  if (!e.target.closest('#global-search-inp') && !e.target.closest('#global-search-pop')) {
    searchPop?.classList.add('hidden');
  }
});

window.openInboxModal = async function() {
  const modal = document.getElementById('user-modal');
  const box = document.getElementById('user-modal-content');
  const p = window.userProfile;
  if (!modal || !box || !window.sbRest) return;

  const [anns, pings] = await Promise.all([
    window.sbRest('announcements?order=id.desc&limit=8').catch(() => []),
    p ? window.sbRest(`messages?content=ilike.*@${encodeURIComponent(p.username)}*&order=id.desc&limit=10`).catch(() => []) : []
  ]);

  const reqIds = Array.isArray(p?.friend_requests) ? p.friend_requests : [];
  const reqUsers = reqIds.length ? await window.sbRest(`users?id=in.(${reqIds.join(',')})&select=id,username`).catch(() => []) : [];

  box.style.maxWidth = '500px';
  box.innerHTML = `
    <div style="padding:22px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <h3>Notification Inbox</h3>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn-outline" style="padding:4px 10px;font-size:0.78rem;" id="inbox-read-btn">Mark All Read</button>
          <button type="button" class="btn-ghost" onclick="document.getElementById('user-modal').classList.add('hidden')">✕</button>
        </div>
      </div>
      <div style="max-height:360px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
        ${(reqUsers || []).map(r => `<div style="padding:10px;border-radius:10px;background:#04070b;border:1px solid var(--neon-emerald);display:flex;justify-content:space-between;align-items:center;"><span><strong>@${r.username}</strong> sent you a friend request</span><button class="btn-neon" style="padding:4px 10px;font-size:0.76rem;" onclick="acceptFriendRequest('${r.id}');openInboxModal();">Accept</button></div>`).join('')}
        ${(pings || []).map(m => `<div style="padding:10px;border-radius:10px;background:#04070b;cursor:pointer;" onclick="document.getElementById('user-modal').classList.add('hidden');openTab('chat-view');"><div class="mono-dim">MENTION BY @${m.username} • #${m.channel || 'global'}</div><div style="margin-top:2px;">${String(m.content).replace(/</g, '&lt;')}</div></div>`).join('')}
        ${(anns || []).map(a => `<div style="padding:10px;border-radius:10px;background:#04070b;"><div class="mono-dim">ANNOUNCEMENT • by @${a.author || 'Staff'}</div><strong>${a.title}</strong><div class="sub-text">${a.body}</div></div>`).join('')}
      </div>
    </div>`;
  modal.classList.remove('hidden');

  document.getElementById('inbox-read-btn').onclick = () => {
    localStorage.setItem('zynk_inbox_read', String(Date.now()));
    const badge = document.getElementById('inbox-badge');
    if (badge) badge.classList.add('hidden');
    window.notify('All inbox notifications marked as read.');
  };
};

document.addEventListener('click', (e) => {
  if (e.target.closest('#open-inbox-btn')) window.openInboxModal();
});
let activeSetTab = 'DISPLAY';

function renderSettingsPanel() {
  const shell = document.getElementById('settings-shell');
  if (!shell) return;
  const p = window.userProfile;

  const tabs = [
    { id: 'DISPLAY', label: 'Themes & Wallpapers' },
    { id: 'ACCOUNT', label: 'Account & Danger Zone' },
    { id: 'NOTIF', label: 'Notifications & App' },
    { id: 'PRIVACY', label: 'Privacy & Safety' },
    { id: 'CLOAK', label: 'Tab Disguise & Panic' },
    { id: 'SESSIONS', label: 'Active Sessions' }
  ];

  shell.innerHTML = `
    <div class="store-layout" style="max-width:920px;margin:auto;">
      <div class="glass-card" style="padding:14px;">
        <div class="mono-dim" style="margin-bottom:8px;font-weight:700;">USER SETTINGS</div>
        <div style="display:flex;flex-direction:column;gap:6px;">
          ${tabs.map(t => `<button class="${activeSetTab === t.id ? 'btn-neon' : 'btn-outline'}" style="text-align:left;width:100%;" data-stab="${t.id}">${t.label}</button>`).join('')}
        </div>
      </div>
      <div class="glass-card" id="settings-body-card"></div>
    </div>`;

  shell.querySelectorAll('[data-stab]').forEach(b => (b.onclick = () => { activeSetTab = b.dataset.stab; renderSettingsPanel(); }));
  const card = document.getElementById('settings-body-card');

  if (activeSetTab === 'DISPLAY') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Themes, Live Wallpapers & Clock</h2>
      <div class="setting-group"><label>Color Theme</label><select id="set-theme" class="tool-input"><option value="default">Emerald Neural (Default)</option><option value="theme-cyber">Cyber Cyan</option><option value="theme-crimson">Crimson Ops</option><option value="theme-gold">Solar Gold</option><option value="theme-violet">Violet Pulse</option></select></div>
      <div class="setting-group"><label>Animated Live Wallpaper</label><select id="set-wp" class="tool-input"><option value="none">None (Solid Dark)</option><option value="grid">Cyber Matrix Grid (Moving)</option><option value="nebula">Neon Nebula Pulse (Animated)</option><option value="solar">Solar Aura Shift (Animated)</option></select></div>
      <div class="setting-group"><label>TimeZone</label><select id="set-tz" class="tool-input"><option value="auto">Auto-Detect (Local Time)</option><option value="America/New_York">Eastern Time (ET)</option><option value="America/Chicago">Central Time (CT)</option><option value="America/Denver">Mountain Time (MT)</option><option value="America/Los_Angeles">Pacific Time (PT)</option><option value="UTC">UTC</option></select></div>
      <div class="setting-group"><label>Clock Format</label><select id="set-format" class="tool-input"><option value="12">12-Hour (AM / PM)</option><option value="24">24-Hour (Military)</option></select></div>
      <div class="setting-group"><label>UI Interface Scale</label><select id="set-zoom" class="tool-input"><option value="1">100% (Standard)</option><option value="0.9">90% (Compact)</option><option value="1.1">110% (Large)</option></select></div>
      <button class="btn-neon" id="save-disp-btn">Save Display Preferences</button>`;

    document.getElementById('set-theme').value = localStorage.getItem('zynk_theme') || p?.profile_theme || 'default';
    document.getElementById('set-wp').value = localStorage.getItem('zynk_wp') || 'none';
    document.getElementById('set-tz').value = localStorage.getItem('zynk_tz') || 'auto';
    document.getElementById('set-format').value = localStorage.getItem('zynk_format') === '24' ? '24' : '12';
    document.getElementById('set-zoom').value = localStorage.getItem('zynk_zoom') || '1';

    document.getElementById('save-disp-btn').onclick = async () => {
      const th = document.getElementById('set-theme').value;
      const wp = document.getElementById('set-wp').value;
      const zm = document.getElementById('set-zoom').value;
      localStorage.setItem('zynk_theme', th);
      localStorage.setItem('zynk_wp', wp);
      localStorage.setItem('zynk_tz', document.getElementById('set-tz').value);
      localStorage.setItem('zynk_format', document.getElementById('set-format').value);
      localStorage.setItem('zynk_zoom', zm);
      document.body.className = th === 'default' ? '' : th;
      document.body.style.zoom = zm;
      window.applyLiveWallpaper(wp);
      updateClock();
      if (p) await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { profile_theme: th }, window.authToken);
      window.notify('Display & wallpaper preferences saved!');
    };
  }

  if (activeSetTab === 'ACCOUNT') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Account & Danger Zone</h2>
      <div class="setting-group"><label>Username</label><input class="tool-input" value="${p?.username || 'Guest'}" disabled /></div>
      <div class="setting-group"><label>Linked Email Address</label><input class="tool-input" value="${p?.email || 'Not signed in'}" disabled /></div>
      <div class="setting-group"><label>Change Password (New Password)</label><input id="new-pass-inp" type="password" class="tool-input" placeholder="Enter new password (6+ chars)" /></div>
      <button class="btn-neon" id="update-pass-btn">Update Password</button>
      <div style="margin-top:24px;padding:16px;border-radius:12px;border:1px solid #f43f5e;background:rgba(244,63,94,0.08);">
        <h3 style="color:#f43f5e;margin-bottom:6px;">Danger Zone</h3>
        <p class="sub-text" style="margin-bottom:12px;">Permanently delete your ZynkOS profile, Z-Credits, XP, and inventory. This cannot be undone.</p>
        <button class="btn-outline" id="delete-acc-btn" style="color:#f43f5e;border-color:#f43f5e;">Delete My Account</button>
      </div>`;

    document.getElementById('update-pass-btn').onclick = async () => {
      const np = document.getElementById('new-pass-inp').value;
      if (!window.authToken || np.length < 6) return window.notify('Sign in and enter a 6+ character password.', true);
      const res = await fetch(`${SB_URL}/auth/v1/user`, {
        method: 'PUT',
        headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + window.authToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: np })
      });
      if (!res.ok) return window.notify('Could not update password.', true);
      document.getElementById('new-pass-inp').value = '';
      window.notify('Password updated!');
    };

    document.getElementById('delete-acc-btn').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      const confirmName = prompt(`Type your username "${p.username}" to permanently delete your account:`);
      if (confirmName !== p.username) return window.notify('Account deletion cancelled.', true);
      await window.sbRest(`users?id=eq.${p.id}`, 'DELETE', null, window.authToken);
      localStorage.removeItem('zynk_session');
      window.notify('Account deleted. Reloading...');
      setTimeout(() => window.location.reload(), 1000);
    };
  }
  if (activeSetTab === 'NOTIF') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Notifications & Install ZynkOS App</h2>
      <p class="sub-text" style="margin-bottom:12px;">Enable desktop notifications or install ZynkOS directly onto your device:</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="btn-neon" id="enable-notif-btn">Enable Browser Notifications</button>
        <button class="btn-outline" id="install-pwa-btn">Install ZynkOS App</button>
      </div>
      <label class="remember-row"><input type="checkbox" id="notif-mentions" checked /><span>Notify me when someone @mentions me in Zynk Chat</span></label>`;

    document.getElementById('enable-notif-btn').onclick = async () => {
      if (!('Notification' in window)) return window.notify('Browser notifications not supported here.', true);
      const perm = await Notification.requestPermission();
      window.notify(perm === 'granted' ? 'Desktop notifications enabled!' : 'Notification permission denied.', perm !== 'granted');
    };

    document.getElementById('install-pwa-btn').onclick = async () => {
      if (deferredInstallPrompt) {
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
      } else {
        window.notify('Click the Install icon in your browser address bar or Browser Menu -> Install ZynkOS!');
      }
    };
  }

  if (activeSetTab === 'PRIVACY') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Privacy & Safety</h2>
      <label class="remember-row"><input type="checkbox" id="priv-show-lb" ${p?.hide_leaderboard ? '' : 'checked'} /><span>Show me on the Global Leaderboard</span></label>
      <label class="remember-row"><input type="checkbox" id="priv-show-on" ${p?.online === false ? '' : 'checked'} /><span>Show my Online status & live activity in Zynk Chat</span></label>
      <button class="btn-neon" id="save-priv-btn" style="margin-top:8px;">Save Privacy Settings</button>`;

    document.getElementById('save-priv-btn').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { hide_leaderboard: !document.getElementById('priv-show-lb').checked, online: document.getElementById('priv-show-on').checked }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Privacy settings saved!');
    };
  }

  if (activeSetTab === 'CLOAK') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Tab Disguise & Instant Panic Key</h2>
      <div class="setting-group"><label>Tab Disguise</label><select id="set-cloak" class="tool-input"><option value="none">None (ZynkOS Default)</option><option value="clever">Clever Portal</option><option value="classroom">Google Classroom</option><option value="drive">Google Drive</option><option value="docs">Google Docs</option></select></div>
      <div class="setting-group"><label>Panic Redirect URL</label><input id="set-panic" class="tool-input" value="${localStorage.getItem('zynk_panic_url') || 'https://google.com'}" /></div>
      <label class="remember-row"><input type="checkbox" id="set-esc" ${localStorage.getItem('zynk_esc_panic') === '1' ? 'checked' : ''} /><span>Press ESC key anytime to trigger instant Panic Redirect</span></label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;">
        <button class="btn-neon" id="save-cloak-btn">Save Disguise Settings</button>
        <button class="btn-outline" id="open-inv-btn">Launch Invisible Tab Opener</button>
      </div>`;

    document.getElementById('set-cloak').value = localStorage.getItem('zynk_cloak') || 'none';
    document.getElementById('save-cloak-btn').onclick = () => {
      const ck = document.getElementById('set-cloak').value;
      localStorage.setItem('zynk_cloak', ck);
      localStorage.setItem('zynk_panic_url', document.getElementById('set-panic').value.trim() || 'https://google.com');
      localStorage.setItem('zynk_esc_panic', document.getElementById('set-esc').checked ? '1' : '0');
      applyCloak(ck);
      window.notify('Tab disguise & panic settings saved!');
    };

    document.getElementById('open-inv-btn').onclick = () => {
      const blankUrl = ['about', 'blank'].join(':');
      const w = window.open(blankUrl, '_blank');
      if (!w) return window.notify('Allow pop-ups to launch Invisible Tab Opener!', true);
      w.document.write(`<!DOCTYPE html><html><head><title>Home - Classroom</title><style>html,body,iframe{margin:0;padding:0;width:100%;height:100%;border:none;overflow:hidden;background:#04070b;}</style></head><body><iframe src="${window.location.href}"></iframe></body></html>`);
      w.document.close();
    };
  }

  if (activeSetTab === 'SESSIONS') {
    const remembered = Boolean(localStorage.getItem('zynk_session'));
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Active Sessions</h2>
      <div style="padding:14px;border-radius:12px;background:#04070b;border:1px solid var(--neon-emerald);display:flex;justify-content:space-between;align-items:center;">
        <div>
          <strong>Current Browser Session <span class="pill" style="margin-left:6px;color:#10b981;">This Device</span></strong>
          <div class="mono-dim" style="margin-top:4px;">Signed in as @${p?.username || 'Guest'} • Persistence: ${remembered ? 'Auto-Renewing (Remember Me)' : 'Session Only'}</div>
        </div>
        <button class="btn-outline" onclick="document.getElementById('top-auth-btn').click()">Sign Out</button>
      </div>`;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  applyCloak(localStorage.getItem('zynk_cloak') || 'none');
  window.applyLiveWallpaper(localStorage.getItem('zynk_wp') || 'none');
  const zm = localStorage.getItem('zynk_zoom') || '1';
  if (zm !== '1') document.body.style.zoom = zm;
  renderSettingsPanel();
  syncRouteFromHash();
});
window.addEventListener('zynk-profile-updated', () => {
  renderSettingsPanel();
  syncRouteFromHash();
});

let vtxClient = null;
let vtxReplyId = null;

async function initVortexGuildClient() {
  const host = document.getElementById('vortex-view');
  if (!host) return;
  host.className = 'tab-view chat-layout';
  host.style.cssText = '';
  host.innerHTML = `
    <div class="chat-main">
      <div class="view-topbar" style="flex-wrap:wrap;gap:8px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <h2 id="vtx-ch-title"># vortex-guild</h2>
          <span class="mono-dim">Powered by <a href="https://vortexos.net" target="_blank" rel="noopener" style="color:var(--neon-emerald);font-weight:700;text-decoration:none;">VortexOS.net ↗</a></span>
        </div>
        <div id="vtx-ch-bar" style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;"></div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="mono-dim" id="vtx-status">Connecting...</span>
          <button type="button" class="btn-neon" id="vtx-login-btn" style="padding:6px 12px;font-size:0.8rem;">Log in with Vortex</button>
          <button type="button" class="btn-outline hidden" id="vtx-logout-btn" style="padding:6px 12px;font-size:0.8rem;">Log Out</button>
        </div>
      </div>
      <div class="chat-feed" id="vortex-messages"></div>
      <div id="vtx-typing-bar" class="typing-bar"></div>
      <div id="vtx-reply-bar" class="reply-banner hidden"></div>
      <form class="chat-input-bar" id="vtx-form">
        <input type="text" id="vtx-input" maxlength="2000" placeholder="Sign in with Vortex to chat in the Guild..." autocomplete="off" disabled />
        <button type="submit" class="btn-neon" id="vtx-send-btn" disabled>Send</button>
      </form>
    </div>
    <aside class="members-panel">
      <div class="members-head" id="vtx-guild-name">VORTEX GUILD MEMBERS</div>
      <div id="vortex-members-list"></div>
    </aside>`;

  if (!window.Vortex) {
    document.getElementById('vtx-status').textContent = 'Vortex SDK loading...';
    return;
  }

  vtxClient = window.Vortex.init({ clientId: 'vtx_bc3f3d47d3074ad0f5f1' });
  const statusEl = document.getElementById('vtx-status');
  const loginBtn = document.getElementById('vtx-login-btn');
  const logoutBtn = document.getElementById('vtx-logout-btn');
  const msgFeed = document.getElementById('vortex-messages');
  const inp = document.getElementById('vtx-input');
  const sendBtn = document.getElementById('vtx-send-btn');

  const renderVtxMsg = (m) => {
    if (document.querySelector(`[data-vtx-id="${m.id}"]`)) return;
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.dataset.vtxId = m.id;
    const col = Array.isArray(m.author?.color) ? m.author.color[0] : (m.author?.color || '#a855f7');
    const av = m.author?.avatar ? vtxClient.asset(m.author.avatar) : 'logo.png';
    const time = m.createdAt ? new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    const canDel = vtxClient.user && (vtxClient.user.id === m.author?.id || (vtxClient.permissions || []).includes('manageMessages'));
    const canEdit = vtxClient.user && vtxClient.user.id === m.author?.id;

    div.innerHTML = `
      <div class="msg-actions">
        <button type="button" class="msg-act-btn" title="Reply" data-vrep="${m.id}" data-vuser="${m.author?.username || 'user'}">↩</button>
        ${canEdit ? `<button type="button" class="msg-act-btn" title="Edit" data-vedit="${m.id}">✎</button>` : ''}
        ${canDel ? `<button type="button" class="msg-act-btn" style="color:#f43f5e;" title="Delete" data-vdel="${m.id}">✕</button>` : ''}
        <button type="button" class="msg-act-btn" style="color:#f59e0b;" title="Report to Vortex" data-vrepmsg="${m.id}">⚑</button>
      </div>
      <img class="msg-avatar" src="${av}" onerror="this.src='logo.png'" />
      <div style="flex:1;min-width:0;">
        ${m.replyTo ? `<div class="reply-quote">↩ Replying to @${m.replyTo.author?.username || 'member'}: ${String(m.replyTo.content || '').slice(0, 50).replace(/</g, '&lt;')}</div>` : ''}
        <div><strong style="color:${col}">${m.author?.username || 'Member'}</strong> <span class="mono-dim">${time}</span></div>
        <div class="vtx-body" style="margin-top:3px;word-break:break-word;">${m.html || vtxClient.render(m.content || '')}${m.editedAt ? ' <span class="mono-dim">(edited)</span>' : ''}</div>
      </div>`;

    div.querySelector('[data-vrep]')?.addEventListener('click', () => {
      vtxReplyId = m.id;
      const rBar = document.getElementById('vtx-reply-bar');
      rBar.innerHTML = `<span>Replying to <strong>@${m.author?.username}</strong></span><button type="button" class="btn-ghost" id="vtx-cancel-rep">✕</button>`;
      rBar.classList.remove('hidden');
      document.getElementById('vtx-cancel-rep').onclick = () => { vtxReplyId = null; rBar.classList.add('hidden'); };
      inp.focus();
    });
    div.querySelector('[data-vedit]')?.addEventListener('click', async () => {
      const next = prompt('Edit Vortex message:', m.content || '');
      if (next && next.trim()) await vtxClient.edit(m.id, next.trim()).catch(e => window.notify?.(e.message, true));
    });
    div.querySelector('[data-vdel]')?.addEventListener('click', async () => {
      await vtxClient.delete(m.id).catch(e => window.notify?.(e.message, true));
    });
    div.querySelector('[data-vrepmsg]')?.addEventListener('click', () => vtxClient.report(m.id));
    msgFeed.appendChild(div);
    msgFeed.scrollTop = msgFeed.scrollHeight;
  };
  const loadChannelHistory = async (ch) => {
    if (!ch) return;
    document.getElementById('vtx-ch-title').textContent = `${vtxClient.guild?.name || 'Vortex Guild'} • #${ch.name}`;
    msgFeed.innerHTML = '<div class="mono-dim" style="padding:12px;">Loading channel messages...</div>';
    try {
      const { messages } = await vtxClient.history(ch.id, 50);
      msgFeed.innerHTML = '';
      if (!messages.length) msgFeed.innerHTML = '<div class="mono-dim" style="padding:12px;">No messages in this channel yet. Say hi!</div>';
      messages.forEach(renderVtxMsg);
    } catch (err) {
      msgFeed.innerHTML = `<div class="mono-dim" style="padding:12px;color:#f43f5e;">${err.message}</div>`;
    }
  };

  const loadGuildMembers = async () => {
    const mList = document.getElementById('vortex-members-list');
    if (!mList) return;
    try {
      const { members } = await vtxClient.members('', 50);
      mList.innerHTML = (members || []).map(mb => {
        const u = mb.user || mb;
        const col = Array.isArray(u.color) ? u.color[0] : (u.color || '#f8fafc');
        const av = u.avatar ? vtxClient.asset(u.avatar) : 'logo.png';
        return `<div class="member-item"><div class="mem-av-wrap"><img src="${av}" onerror="this.src='logo.png'" /><span class="mem-dot" style="background:${u.online ? '#10b981' : '#64748b'}"></span></div><div style="min-width:0;"><div style="color:${col};font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${u.username}</div></div></div>`;
      }).join('');
    } catch (e) {}
  };

  await vtxClient.ready;
  if (!vtxClient.site.allowed) {
    statusEl.textContent = `Blocked: ${vtxClient.site.reason || 'Add site in Vortex Where it works'}`;
    return;
  }

  if (vtxClient.user) {
    statusEl.textContent = `@${vtxClient.user.username}`;
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    inp.disabled = false;
    sendBtn.disabled = false;
    inp.placeholder = 'Message Vortex Guild...';
  } else {
    statusEl.textContent = 'Not signed in';
  }

  loginBtn.onclick = async () => {
    try {
      await vtxClient.login({ popup: true });
      initVortexGuildClient();
    } catch (err) {
      statusEl.textContent = err.message;
    }
  };

  logoutBtn.onclick = () => {
    vtxClient.logout();
    initVortexGuildClient();
  };

  const chBar = document.getElementById('vtx-ch-bar');
  const channels = vtxClient.channels || [];
  chBar.innerHTML = channels.map(c => `<button type="button" class="${c.id === vtxClient.channel ? 'btn-neon' : 'btn-outline'}" style="padding:4px 10px;font-size:0.78rem;" data-vch="${c.id}">#${c.name}</button>`).join('');
  chBar.querySelectorAll('[data-vch]').forEach(b => (b.onclick = async () => {
    await vtxClient.join(b.dataset.vch);
    chBar.querySelectorAll('[data-vch]').forEach(x => (x.className = x.dataset.vch === b.dataset.vch ? 'btn-neon' : 'btn-outline'));
    loadChannelHistory(channels.find(x => x.id === b.dataset.vch));
  }));

  const initialCh = channels.find(c => c.id === vtxClient.channel) || channels.at(0);
  if (initialCh) {
    await vtxClient.join(initialCh.id).catch(() => {});
    await loadChannelHistory(initialCh);
  }
  loadGuildMembers();

  vtxClient.on('message', (msg) => {
    if (msg.channelId === vtxClient.channel) renderVtxMsg(msg);
  });
  vtxClient.on('edit', (msg) => {
    const el = document.querySelector(`[data-vtx-id="${msg.id}"] .vtx-body`);
    if (el) el.innerHTML = `${msg.html || vtxClient.render(msg.content || '')} <span class="mono-dim">(edited)</span>`;
  });
  vtxClient.on('delete', ({ id }) => document.querySelector(`[data-vtx-id="${id}"]`)?.remove());
  vtxClient.on('typing', ({ channelId, username, typing }) => {
    if (channelId !== vtxClient.channel) return;
    document.getElementById('vtx-typing-bar').innerHTML = typing ? `<span class="typing-pill">@${username} is typing in Vortex...</span>` : '';
  });

  inp.oninput = () => vtxClient.typing(vtxClient.channel);
  document.getElementById('vtx-form').onsubmit = async (e) => {
    e.preventDefault();
    const txt = inp.value.trim();
    if (!txt) return;
    inp.value = '';
    const rep = vtxReplyId;
    vtxReplyId = null;
    document.getElementById('vtx-reply-bar').classList.add('hidden');
    try {
      await vtxClient.send(txt, rep);
    } catch (err) {
      window.notify?.(err.message, true);
    }
  };
}

window.addEventListener('DOMContentLoaded', initVortexGuildClient);
