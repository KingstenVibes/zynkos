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
let activeSetTab = 'DISPLAY';

function renderSettingsPanel() {
  const shell = document.getElementById('settings-shell');
  if (!shell) return;
  const p = window.userProfile;

  const tabs = [
    { id: 'DISPLAY', label: '🎨 Themes & Wallpapers' },
    { id: 'ACCOUNT', label: '👤 Account & Danger Zone' },
    { id: 'NOTIF', label: '🔔 Notifications & App' },
    { id: 'PRIVACY', label: '🛡️ Privacy & Safety' },
    { id: 'CLOAK', label: '🕵️ Tab Disguise & Panic' },
    { id: 'SESSIONS', label: '💻 Active Sessions' }
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
      <h2 style="margin-bottom:14px;">🎨 Themes, Live Wallpapers & Clock</h2>
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
      <h2 style="margin-bottom:14px;">👤 Account & Danger Zone</h2>
      <div class="setting-group"><label>Username</label><input class="tool-input" value="${p?.username || 'Guest'}" disabled /></div>
      <div class="setting-group"><label>Linked Email Address</label><input class="tool-input" value="${p?.email || 'Not signed in'}" disabled /></div>
      <div class="setting-group"><label>Change Password (New Password)</label><input id="new-pass-inp" type="password" class="tool-input" placeholder="Enter new password (6+ chars)" /></div>
      <button class="btn-neon" id="update-pass-btn">Update Password</button>
      <div style="margin-top:24px;padding:16px;border-radius:12px;border:1px solid #f43f5e;background:rgba(244,63,94,0.08);">
        <h3 style="color:#f43f5e;margin-bottom:6px;">⚠️ Danger Zone</h3>
        <p class="sub-text" style="margin-bottom:12px;">Permanently delete your ZynkOS profile, Z-Credits, XP, and inventory. This cannot be undone.</p>
        <button class="btn-outline" id="delete-acc-btn" style="color:#f43f5e;border-color:#f43f5e;">Delete My Account</button>
      </div>`;

    document.getElementById('update-pass-btn').onclick = async () => {
      const np = document.getElementById('new-pass-inp').value;
      if (!window.authToken || np.length < 6) return window.notify('Sign in and enter a 6+ character password.', true);
      const res = await fetch('https://linkpc.net', {
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
      <h2 style="margin-bottom:14px;">🔔 Notifications & Install ZynkOS App</h2>
      <p class="sub-text" style="margin-bottom:12px;">Enable desktop notifications for @mentions & announcements, or install ZynkOS directly onto your device as a standalone app:</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px;">
        <button class="btn-neon" id="enable-notif-btn">Enable Browser Notifications</button>
        <button class="btn-outline" id="install-pwa-btn">📲 Install ZynkOS App</button>
      </div>
      <label class="remember-row"><input type="checkbox" id="notif-mentions" checked /><span>Notify me when someone @mentions me in Zynk Chat</span></label>
      <label class="remember-row"><input type="checkbox" id="notif-ann" checked /><span>Notify me when a new System Announcement is posted</span></label>`;

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
        window.notify('Click the Install icon (⊕) in your address bar or Browser Menu -> Install ZynkOS!');
      }
    };
  }

  if (activeSetTab === 'PRIVACY') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">🛡️ Privacy & Safety</h2>
      <label class="remember-row"><input type="checkbox" id="priv-show-lb" ${p?.hide_leaderboard ? '' : 'checked'} /><span>Show me on the Global Leaderboard</span></label>
      <label class="remember-row"><input type="checkbox" id="priv-show-on" ${p?.online === false ? '' : 'checked'} /><span>Show my Online status & live activity in Zynk Chat</span></label>
      <button class="btn-neon" id="save-priv-btn" style="margin-top:8px;">Save Privacy Settings</button>`;

    document.getElementById('save-priv-btn').onclick = async () => {
      if (!p) return window.notify('Sign in first!', true);
      const showLb = document.getElementById('priv-show-lb').checked;
      const showOn = document.getElementById('priv-show-on').checked;
      await window.sbRest(`users?id=eq.${p.id}`, 'PATCH', { hide_leaderboard: !showLb, online: showOn }, window.authToken);
      await window.refreshMyProfile();
      window.notify('Privacy settings saved!');
    };
  }

  if (activeSetTab === 'CLOAK') {
    card.innerHTML = `
      <h2 style="margin-bottom:14px;">🕵️ Tab Disguise & Instant Panic Key</h2>
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
      <h2 style="margin-bottom:14px;">💻 Active Sessions</h2>
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
});
window.addEventListener('zynk-profile-updated', renderSettingsPanel);
