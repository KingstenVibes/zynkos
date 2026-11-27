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
  none: { title: 'ZynkOS — Neural OS & Community', icon: 'logo.png' },
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

let rainAnimFrame = null;

function stopRainCanvas() {
  if (rainAnimFrame) cancelAnimationFrame(rainAnimFrame);
  rainAnimFrame = null;
  document.getElementById('zynk-rain-canvas')?.remove();
}

function startFoggyWindowRain() {
  stopRainCanvas();
  const cv = document.createElement('canvas');
  cv.id = 'zynk-rain-canvas';
  cv.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:0;opacity:0.75;';
  document.body.prepend(cv);
  const ctx = cv.getContext('2d');
  let w = (cv.width = window.innerWidth);
  let h = (cv.height = window.innerHeight);
  window.addEventListener('resize', () => { if (cv.isConnected) { w = cv.width = window.innerWidth; h = cv.height = window.innerHeight; } });

  const bokeh = [
    { x: 0.18, y: 0.28, r: 95, c: 'rgba(16,185,129,0.16)' },
    { x: 0.78, y: 0.22, r: 120, c: 'rgba(6,182,212,0.15)' },
    { x: 0.52, y: 0.65, r: 140, c: 'rgba(245,158,11,0.11)' },
    { x: 0.85, y: 0.75, r: 100, c: 'rgba(168,85,247,0.13)' }
  ];
  const drops = Array.from({ length: 55 }, () => ({
    x: Math.random() * w, y: Math.random() * h,
    r: 1.5 + Math.random() * 2.2, vy: 1.4 + Math.random() * 2.4, wobble: Math.random() * Math.PI * 2
  }));
  function tick() {
    if (!cv.isConnected) return;
    ctx.clearRect(0, 0, w, h);
    bokeh.forEach(b => {
      const g = ctx.createRadialGradient(b.x * w, b.y * h, 5, b.x * w, b.y * h, b.r);
      g.addColorStop(0, b.c);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x * w, b.y * h, b.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(148, 163, 184, 0.06)';
    ctx.fillRect(0, 0, w, h);

    drops.forEach(d => {
      d.wobble += 0.04;
      d.x += Math.sin(d.wobble) * 0.25;
      d.y += d.vy;
      if (d.y > h + 10) { d.y = -10; d.x = Math.random() * w; }
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.22)';
      ctx.lineWidth = d.r * 0.65;
      ctx.beginPath();
      ctx.moveTo(d.x, d.y - d.vy * 4);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();
      ctx.fillStyle = 'rgba(248, 250, 252, 0.35)';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
      ctx.fill();
    });
    rainAnimFrame = requestAnimationFrame(tick);
  }
  tick();
}

window.applyLiveWallpaper = function(wp) {
  stopRainCanvas();
  let layer = document.getElementById('zynk-live-wp');
  if (!layer) {
    layer = document.createElement('div');
    layer.id = 'zynk-live-wp';
    layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.55;transition:opacity 0.3s;will-change:background-position;';
    document.body.prepend(layer);
  }
  if (!document.getElementById('zynk-wp-keyframes')) {
    const st = document.createElement('style');
    st.id = 'zynk-wp-keyframes';
    st.textContent = `
      @keyframes zynkGridMove { 0% { background-position: 0 0; } 100% { background-position: 48px 48px; } }
      @keyframes zynkRainFall { 0% { background-position: 0 0, 24px 30px; } 100% { background-position: 0 96px, 24px 126px; } }
      @keyframes zynkPulseBg { 0%, 100% { filter: hue-rotate(0deg) brightness(1); } 50% { filter: hue-rotate(40deg) brightness(1.3); } }
      @keyframes zynkAuroraMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    `;
    document.head.appendChild(st);
  }
  layer.style.backdropFilter = 'none';
  if (wp === 'foggy-rain') {
    layer.style.background = 'linear-gradient(180deg, rgba(15,23,42,0.55), rgba(4,7,11,0.85))';
    layer.style.backdropFilter = 'blur(6px)';
    layer.style.animation = 'none';
    startFoggyWindowRain();
  } else if (wp === 'grid') {
    layer.style.background = 'linear-gradient(rgba(16,185,129,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.2) 1px, transparent 1px)';
    layer.style.backgroundSize = '48px 48px';
    layer.style.animation = 'zynkGridMove 4s linear infinite';
  } else if (wp === 'nebula') {
    layer.style.background = 'radial-gradient(circle at 20% 30%, rgba(6,182,212,0.38), transparent 55%), radial-gradient(circle at 80% 70%, rgba(168,85,247,0.38), transparent 55%)';
    layer.style.backgroundSize = '100% 100%';
    layer.style.animation = 'zynkPulseBg 8s ease-in-out infinite';
  } else if (wp === 'solar') {
    layer.style.background = 'radial-gradient(circle at 50% 20%, rgba(245,158,11,0.35), transparent 60%), radial-gradient(circle at 20% 80%, rgba(244,63,94,0.28), transparent 55%)';
    layer.style.backgroundSize = '100% 100%';
    layer.style.animation = 'zynkPulseBg 7s ease-in-out infinite';
  } else if (wp === 'stars') {
    layer.style.background = 'radial-gradient(2px 2px at 20px 30px, #fff, transparent), radial-gradient(2px 2px at 70px 80px, #10b981, transparent), radial-gradient(1.5px 1.5px at 45px 60px, #38bdf8, transparent)';
    layer.style.backgroundSize = '96px 96px';
    layer.style.animation = 'zynkGridMove 5s linear infinite';
  } else if (wp === 'rain') {
    layer.style.background = 'linear-gradient(180deg, rgba(16,185,129,0.25) 0%, transparent 60%), linear-gradient(180deg, rgba(6,182,212,0.2) 0%, transparent 50%)';
    layer.style.backgroundSize = '48px 96px';
    layer.style.animation = 'zynkRainFall 2.2s linear infinite';
  } else if (wp === 'aurora') {
    layer.style.background = 'linear-gradient(125deg, rgba(16,185,129,0.26), rgba(6,182,212,0.26), rgba(168,85,247,0.26), rgba(245,158,11,0.2))';
    layer.style.backgroundSize = '300% 300%';
    layer.style.animation = 'zynkAuroraMove 10s ease infinite';
  } else if (wp === 'cyber-pulse') {
    layer.style.background = 'repeating-linear-gradient(0deg, rgba(6,182,212,0.12) 0px, rgba(6,182,212,0.12) 1px, transparent 1px, transparent 28px)';
    layer.style.backgroundSize = '100% 56px';
    layer.style.animation = 'zynkRainFall 3s linear infinite';
  } else if (wp === 'ember-drift') {
    layer.style.background = 'radial-gradient(2px 2px at 30px 40px, #f59e0b, transparent), radial-gradient(2px 2px at 80px 20px, #f43f5e, transparent)';
    layer.style.backgroundSize = '110px 110px';
    layer.style.animation = 'zynkGridMove 6s linear infinite reverse';
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
  ranks: 'ranks-view', store: 'store-view', profile: 'profile-view',
  quests: 'achieve-view', leaderboards: 'leader-view', tools: 'tools-view',
  partners: 'partners-view', credits: 'credits-view', rules: 'rules-view',
  privacy: 'rules-view', tos: 'rules-view', reports: 'reports-view',
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
    { id: 'DISPLAY', label: 'Themes & A.Wallpapers' },
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
      <div class="setting-group"><label>Animated Live Wallpaper</label><select id="set-wp" class="tool-input"><option value="none">None (Solid Dark)</option><option value="foggy-rain">Foggy Window Rain & Blurred Lights (Realistic)</option><option value="grid">Cyber Matrix Grid (Moving)</option><option value="nebula">Neon Nebula Pulse (Animated)</option><option value="solar">Solar Aura Shift (Animated)</option><option value="stars">Starfield Warp (Animated)</option><option value="rain">Emerald Digital Rain (Animated)</option><option value="aurora">Aurora Prism Wave (Animated)</option><option value="cyber-pulse">Cyber Scanlines (Animated)</option><option value="ember-drift">Ember Sparks Drift (Animated)</option></select></div>
      <div class="setting-group"><label>TimeZone</label><select id="set-tz" class="tool-input"><option value="auto">Auto-Detect (Local Time)</option><option value="America/New_York">Eastern Time (ET)</option><option value="America/Chicago">Central Time (CT)</option><option value="America/Denver">Mountain Time (MT)</option><option value="America/Los_Angeles">Pacific Time (PT)</option><option value="UTC">UTC</option></select></div>
      <div class="setting-group"><label>Clock Format</label><select id="set-format" class="tool-input"><option value="12">12-Hour (AM / PM)</option><option value="24">24-Hour (Military)</option></select></div>
      <div class="setting-group"><label>UI Interface Scale</label><select id="set-zoom" class="tool-input"><option value="1">100% (Standard)</option><option value="0.9">90% (Compact)</option><option value="1.1">110% (Large)</option></select></div>
      <button class="btn-neon" id="save-disp-btn">Save Display Preferences</button>`;

    document.getElementById('set-theme').value = p?.profile_theme || localStorage.getItem('zynk_theme') || 'default';
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
      window.applySavedTheme?.(th);
      document.body.style.zoom = zm;
      window.applyLiveWallpaper(wp);
      updateClock();
      if (p) {
        p.profile_theme = th;
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { profile_theme: th }, window.authToken);
      }
      window.notify('Display & wallpaper preferences saved!');
    };
  }

  if (activeSetTab === 'ACCOUNT') {
    const monthMs = 2592000000;
    const remMs = monthMs - (Date.now() - (Number(p?.last_username_change) || 0));
    const onCd = p && p.role !== 'FOUNDER' && remMs > 0;
    const daysLeft = Math.ceil(remMs / 86400000);

    card.innerHTML = `
      <h2 style="margin-bottom:14px;">Account & Danger Zone</h2>
      <div class="setting-group"><label>Current Username</label><input class="tool-input" value="${p?.username || 'Guest'}" disabled /></div>
      <div class="setting-group"><label>Linked Email Address</label><input class="tool-input" value="${p?.email || 'Not signed in'}" disabled /></div>
      <div class="setting-group"><label>Change Password (New Password)</label><input id="new-pass-inp" type="password" class="tool-input" placeholder="Enter new password (6+ chars)" /></div>
      <button class="btn-neon" id="update-pass-btn">Update Password</button>
      <div style="margin-top:24px;padding:16px;border-radius:12px;border:1px solid #f43f5e;background:rgba(244,63,94,0.08);">
        <h3 style="color:#f43f5e;margin-bottom:10px;">Danger Zone</h3>
        <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(244,63,94,0.25);">
          <label style="display:block;font-weight:700;margin-bottom:4px;">Change Username (Once Every 30 Days)</label>
          <p class="sub-text" style="margin-bottom:8px;">You can only change your username once every month (30 days). Letters, numbers & underscores only (3–20 chars).</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <input id="new-uname-inp" class="tool-input" style="margin:0;flex:1;min-width:180px;" placeholder="Enter new username..." ${onCd || !p ? 'disabled' : ''} />
            <button class="btn-outline" id="change-uname-btn" style="color:#f59e0b;border-color:#f59e0b;" ${onCd || !p ? 'disabled' : ''}>${onCd ? `Available in ${daysLeft}d` : 'Change Username'}</button>
          </div>
        </div>
        <p class="sub-text" style="margin-bottom:12px;">Permanently delete your ZynkOS profile, Z-Credits, XP, and inventory. This cannot be undone.</p>
        <button class="btn-outline" id="delete-acc-btn" style="color:#f43f5e;border-color:#f43f5e;">Delete My Account</button>
      </div>`;
    document.getElementById('update-pass-btn').onclick = async () => {
      const np = document.getElementById('new-pass-inp').value;
      if (!window.authToken || np.length < 6) return window.notify('Sign in and enter a 6+ character password.', true);
      const res = await fetch(`${SB_URL}/auth/v1/user`, { method: 'PUT', headers: { 'apikey': SB_KEY, 'Authorization': 'Bearer ' + window.authToken, 'Content-Type': 'application/json' }, body: JSON.stringify({ password: np }) });
      if (!res.ok) return window.notify('Could not update password.', true);
      document.getElementById('new-pass-inp').value = '';
      window.notify('Password updated!');
    };

    document.getElementById('change-uname-btn').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      if (onCd) return window.notify(`You can change your username again in ${daysLeft} day(s).`, true);
      const nextName = document.getElementById('new-uname-inp').value.trim();
      if (!/^[a-zA-Z0-9_]{3,20}$/.test(nextName)) return window.notify('Username must be 3–20 characters (letters, numbers, or _).', true);
      if (nextName.toLowerCase() === p.username.toLowerCase()) return window.notify('That is already your current username.', true);
      const existing = await window.sbRest(`users?username=ilike.${encodeURIComponent(nextName)}&select=id`).catch(() => []);
      if (Array.isArray(existing) && existing.length > 0) return window.notify('That username is already taken!', true);
      try {
        await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { username: nextName, last_username_change: Date.now() }, window.authToken);
        await window.refreshMyProfile();
        window.notify(`Username changed to @${nextName}!`);
      } catch (err) { window.notify(err.message, true); }
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
    const prefs = JSON.parse(localStorage.getItem('zynk_notif_prefs') || '{"enabled":true,"mentions":true,"dms":true,"friends":true,"announcements":true}');
    const savePrefs = () => localStorage.setItem('zynk_notif_prefs', JSON.stringify(prefs));
    card.innerHTML = `<h2 style="margin-bottom:14px;">Desktop & App Notifications</h2><div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;"><button class="${prefs.enabled ? 'btn-outline' : 'btn-neon'}" id="toggle-notif-btn">${prefs.enabled ? 'Turn Notifications Off' : 'Enable Desktop Notifications'}</button><button class="btn-outline" id="test-notif-btn">Send Test Notification</button><button class="btn-outline" id="install-pwa-btn">Install ZynkOS App</button></div><div class="mono-dim" style="margin-bottom:8px;font-weight:700;">CHOOSE WHAT TRIGGERS NOTIFICATIONS</div><label class="remember-row"><input type="checkbox" id="np-mentions" ${prefs.mentions ? 'checked' : ''} /><span>@Mentions in Zynk Chat channels</span></label><label class="remember-row"><input type="checkbox" id="np-dms" ${prefs.dms ? 'checked' : ''} /><span>Direct Messages (Private Chats)</span></label><label class="remember-row"><input type="checkbox" id="np-friends" ${prefs.friends ? 'checked' : ''} /><span>Incoming Friend Requests</span></label><label class="remember-row"><input type="checkbox" id="np-ann" ${prefs.announcements ? 'checked' : ''} /><span>Founder & Staff System Announcements</span></label>`;

    document.getElementById('toggle-notif-btn').onclick = async () => {
      prefs.enabled = !prefs.enabled;
      if (prefs.enabled && 'Notification' in window && Notification.permission !== 'granted') await Notification.requestPermission().catch(() => {});
      savePrefs();
      window.notify(prefs.enabled ? 'Desktop & App notifications enabled!' : 'All desktop notifications turned off.');
      renderSettingsPanel();
    };
    document.getElementById('test-notif-btn').onclick = async () => {
      if ('Notification' in window && Notification.permission !== 'granted') await Notification.requestPermission().catch(() => {});
      window.sendZynkSystemNotif?.('ZynkOS • System Test', 'Desktop & App notifications are active!', 'announcements', () => window.openTab?.('dash-view'));
    };
    ['mentions', 'dms', 'friends', 'announcements'].forEach((k, idx) => {
      const ids = ['np-mentions', 'np-dms', 'np-friends', 'np-ann'];
      document.getElementById(ids[idx]).onchange = (e) => { prefs[k] = e.target.checked; savePrefs(); };
    });
    document.getElementById('install-pwa-btn').onclick = async () => {
      if (deferredInstallPrompt) { deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; }
      else window.notify('Click the Install icon in your browser address bar or Browser Menu -> Install ZynkOS!');
    };
  }
  if (activeSetTab === 'PRIVACY') {
    card.innerHTML = `<h2 style="margin-bottom:14px;">Privacy & Safety</h2><label class="remember-row"><input type="checkbox" id="priv-show-lb" ${p?.hide_leaderboard ? '' : 'checked'} /><span>Show me on the Global Leaderboard</span></label><label class="remember-row"><input type="checkbox" id="priv-show-on" ${p?.online === false ? '' : 'checked'} /><span>Show my Online status & live activity in Zynk Chat</span></label><button class="btn-neon" id="save-priv-btn" style="margin-top:8px;">Save Privacy Settings</button>`;
    document.getElementById('save-priv-btn').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { hide_leaderboard: !document.getElementById('priv-show-lb').checked, online: document.getElementById('priv-show-on').checked }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Privacy settings saved!');
    };
  }

  if (activeSetTab === 'CLOAK') {
    card.innerHTML = `<h2 style="margin-bottom:14px;">Tab Disguise & Instant Panic Key</h2><div class="setting-group"><label>Tab Disguise</label><select id="set-cloak" class="tool-input"><option value="none">None (ZynkOS Default)</option><option value="clever">Clever Portal</option><option value="classroom">Google Classroom</option><option value="drive">Google Drive</option><option value="docs">Google Docs</option></select></div><div class="setting-group"><label>Panic Redirect URL</label><input id="set-panic" class="tool-input" value="${localStorage.getItem('zynk_panic_url') || 'https://google.com'}" /></div><label class="remember-row"><input type="checkbox" id="set-esc" ${localStorage.getItem('zynk_esc_panic') === '1' ? 'checked' : ''} /><span>Press ESC key anytime to trigger instant Panic Redirect</span></label><div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;"><button class="btn-neon" id="save-cloak-btn">Save Disguise Settings</button><button class="btn-outline" id="open-inv-btn">Launch Invisible Tab Opener</button></div>`;
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
    card.innerHTML = `<h2 style="margin-bottom:14px;">Active Sessions</h2><div style="padding:14px;border-radius:12px;background:#04070b;border:1px solid var(--neon-emerald);display:flex;justify-content:space-between;align-items:center;"><div><strong>Current Browser Session <span class="pill" style="margin-left:6px;color:#10b981;">This Device</span></strong><div class="mono-dim" style="margin-top:4px;">Signed in as @${p?.username || 'Guest'} • Persistence: ${remembered ? 'Auto-Renewing (Remember Me)' : 'Session Only'}</div></div><button class="btn-outline" onclick="document.getElementById('top-auth-btn').click()">Sign Out</button></div>`;
  }
}

let vtxClient = null;
let vtxLastSent = 0;

function ensureVortexSdkLoaded() {
  return new Promise((resolve) => {
    if (window.Vortex) return resolve(window.Vortex);
    let sc = document.querySelector('script[src*="vortex.js"]');
    if (!sc) { sc = document.createElement('script'); sc.src = 'https://vortexos.net'; document.head.appendChild(sc); }
    sc.addEventListener('load', () => resolve(window.Vortex));
    sc.addEventListener('error', () => resolve(null));
    setTimeout(() => resolve(window.Vortex || null), 4000);
  });
}
window.initVortexGuildClient = async function() {
  const host = document.getElementById('vortex-view');
  if (!host) return;
  host.className = 'tab-view chat-layout';
  host.innerHTML = `
    <aside class="chat-channels-panel">
      <div style="font-weight:800;font-size:0.95rem;padding:2px 6px;">CHAT HUB</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;">
        <button type="button" class="btn-outline" style="padding:5px 6px;font-size:0.75rem;" onclick="openTab('chat-view')">Main chat</button>
        <button type="button" class="btn-neon" style="padding:5px 6px;font-size:0.75rem;">Vortex chat</button>
      </div>
      <div class="dock-sep-line"></div>
      <div class="mono-dim" style="padding:0 6px;font-weight:700;">VORTEX GLOBAL</div>
      <div id="vtx-global-list" style="display:flex;flex-direction:column;gap:3px;"></div>
      <div class="mono-dim" style="padding:8px 6px 0;font-weight:700;">ZYNKOS GUILD</div>
      <div id="vtx-guild-list" style="display:flex;flex-direction:column;gap:3px;"></div>
    </aside>
    <div class="chat-main">
      <div class="view-topbar" style="flex-wrap:wrap;gap:8px;">
        <div>
          <h2 id="vtx-ch-title"># Vortex Global</h2>
          <div class="mono-dim" id="vtx-ch-topic">Linked to Vortex Guild & Vortex Global (5s Slow Mode) • <a href="https://vortexos.net" target="_blank" rel="noopener" style="color:var(--neon-emerald);font-weight:700;text-decoration:none;">VortexOS.net ↗</a></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          <span class="mono-dim" id="vtx-status">Connecting...</span>
          <button type="button" class="btn-neon" id="vtx-login-btn" style="padding:6px 12px;font-size:0.8rem;">Log in with Vortex</button>
          <button type="button" class="btn-outline hidden" id="vtx-logout-btn" style="padding:6px 12px;font-size:0.8rem;">Log Out</button>
        </div>
      </div>
      <div class="chat-feed" id="vortex-messages"></div>
      <form class="chat-input-bar" id="vtx-form">
        <input type="text" id="vtx-input" maxlength="2000" placeholder="Sign in with Vortex to chat..." autocomplete="off" disabled />
        <button type="submit" class="btn-neon" id="vtx-send-btn" disabled>Send</button>
      </form>
    </div>
    <aside class="members-panel">
      <div class="members-head">VORTEX NETWORK</div>
      <div style="padding:8px;font-size:0.8rem;color:var(--text-dim);line-height:1.5;">Messages in <strong>#Vortex Global</strong> sync live across all Vortex partner sites.<br><br>Guild channels sync directly with your <strong>ZynkOS</strong> Vortex guild.</div>
    </aside>`;

  const statusEl = document.getElementById('vtx-status');
  const loginBtn = document.getElementById('vtx-login-btn');
  const logoutBtn = document.getElementById('vtx-logout-btn');
  const msgFeed = document.getElementById('vortex-messages');
  const inp = document.getElementById('vtx-input');
  const sendBtn = document.getElementById('vtx-send-btn');

  const sdk = await ensureVortexSdkLoaded();
  if (!sdk) { statusEl.textContent = 'Vortex SDK offline'; return; }
  vtxClient = sdk.init({ clientId: 'vtx_bc3f3d47d3074ad0f5f1' });

  const renderVtxMsg = (m) => {
    if (!m || !m.id || document.querySelector(`[data-vtx-id="${m.id}"]`)) return;
    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.dataset.vtxId = m.id;
    const col = Array.isArray(m.author?.color) ? m.author.color.at(0) : (m.author?.color || '#a855f7');
    const tag = m.guild?.tag ? `<span class="role-chip" style="color:#10b981;border-color:rgba(16,185,129,0.35);padding:1px 7px;">${m.guild.tag}</span>` : '';
    div.innerHTML = `<img class="msg-avatar" src="${m.author?.avatar || 'logo.png'}" onerror="this.src='logo.png'" /><div style="flex:1;min-width:0;"><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;"><strong style="color:${col}">${m.author?.username || 'Member'}</strong>${tag}</div><div class="vtx-body" style="margin-top:3px;word-break:break-word;">${m.html || vtxClient.render(m.content || '')}</div></div>`;
    msgFeed.appendChild(div);
    msgFeed.scrollTop = msgFeed.scrollHeight;
  };

  loginBtn.onclick = () => vtxClient.login({ popup: true }).then(() => window.initVortexGuildClient()).catch(() => vtxClient.login());
  logoutBtn.onclick = () => { vtxClient?.logout(); window.initVortexGuildClient(); };
  await vtxClient.ready;
  if (!vtxClient.site?.allowed) { statusEl.textContent = vtxClient.site?.reason || 'Pending Vortex approval'; return; }

  const switchVtxChan = async (ch) => {
    if (!ch) return;
    await vtxClient.join(ch.id);
    document.getElementById('vtx-ch-title').textContent = `# ${ch.name}`;
    host.querySelectorAll('[data-vch]').forEach(b => b.classList.toggle('active', b.dataset.vch === ch.id));
    msgFeed.innerHTML = '';
    const { messages } = await vtxClient.history(ch.id, { limit: 50 }).catch(() => ({ messages: [] }));
    (messages || []).forEach(renderVtxMsg);
    if (vtxClient.user) inp.placeholder = `Message #${ch.name} (5s slow mode)...`;
  };

  if (vtxClient.user) {
    statusEl.textContent = `@${vtxClient.user.username}`;
    loginBtn.classList.add('hidden');
    logoutBtn.classList.remove('hidden');
    inp.disabled = false;
    sendBtn.disabled = false;
    const chs = vtxClient.channels || [];
    const gChs = chs.filter(c => /global/i.test(c.name || '') || c.id === 'global');
    const sChs = chs.filter(c => !gChs.includes(c));
    document.getElementById('vtx-global-list').innerHTML = gChs.map(c => `<button type="button" class="ch-item-btn" data-vch="${c.id}"># ${c.name}</button>`).join('');
    document.getElementById('vtx-guild-list').innerHTML = sChs.map(c => `<button type="button" class="ch-item-btn" data-vch="${c.id}"># ${c.name}</button>`).join('');
    host.querySelectorAll('[data-vch]').forEach(b => (b.onclick = () => switchVtxChan(chs.find(x => x.id === b.dataset.vch))));
    const first = gChs.at(0) || sChs.at(0);
    if (first) await switchVtxChan(first);
    vtxClient.on('message', (m) => { if (m.channelId === vtxClient.channel) renderVtxMsg(m); });
    document.getElementById('vtx-form').onsubmit = async (e) => {
      e.preventDefault();
      const t = inp.value.trim();
      if (!t) return;
      const wait = Math.ceil((5000 - (Date.now() - vtxLastSent)) / 1000);
      if (wait > 0) return window.notify?.(`Vortex slow mode: wait ${wait}s before sending again.`, true);
      vtxLastSent = Date.now();
      inp.value = '';
      try { await vtxClient.send(t); } catch (err) { window.notify?.(err.message || 'Send failed', true); }
    };
  } else { statusEl.textContent = 'Sign in required'; }
};

window.addEventListener('DOMContentLoaded', () => {
  applyCloak(localStorage.getItem('zynk_cloak') || 'none');
  window.applyLiveWallpaper(localStorage.getItem('zynk_wp') || 'none');
  const zm = localStorage.getItem('zynk_zoom') || '1';
  if (zm !== '1') document.body.style.zoom = zm;
  renderSettingsPanel();
  syncRouteFromHash();
  window.initVortexGuildClient();
});
window.addEventListener('zynk-profile-updated', () => { renderSettingsPanel(); syncRouteFromHash(); });
