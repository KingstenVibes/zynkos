window.openTab = function(tabId) {
  if (!tabId) return;
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.toggle('active', v.id === tabId));
};

document.addEventListener('click', (e) => {
  if (e.target.closest('#toggle-dock')) {
    document.getElementById('left-dock')?.classList.toggle('expanded');
    return;
  }
  const tabBtn = e.target.closest('.dock-btn');
  if (tabBtn && tabBtn.dataset.tab) window.openTab(tabBtn.dataset.tab);
});

const sBox = document.getElementById('settings-controls');
if (sBox) {
  sBox.innerHTML = `
    <div class="setting-group"><label>Steady Page Theme</label><select id="theme-select" class="tool-input"><option value="default">Emerald Neural (Default)</option><option value="theme-cyber">Cyber Cyan</option><option value="theme-crimson">Crimson Ops</option><option value="theme-gold">Solar Gold</option><option value="theme-violet">Violet Pulse</option></select></div>
    <div class="setting-group"><label>Timezone</label><select id="tz-select" class="tool-input"><option value="auto">Auto-Detect (Local Time)</option><option value="America/New_York">Eastern Time (ET)</option><option value="America/Chicago">Central Time (CT)</option><option value="America/Denver">Mountain Time (MT)</option><option value="America/Los_Angeles">Pacific Time (PT)</option></select></div>
    <div class="setting-group"><label>Clock Format</label><select id="format-select" class="tool-input"><option value="12">12-Hour (AM / PM)</option><option value="24">24-Hour (Military)</option></select></div>
    <div class="setting-group"><label>Tab Disguise (Cloaking)</label><select id="cloak-select" class="tool-input"><option value="none">None (ZynkOS Default)</option><option value="clever">Clever | Portal</option><option value="classroom">Home - Classroom</option><option value="drive">My Drive - Google Drive</option><option value="docs">Untitled document - Google Docs</option></select></div>
    <div class="setting-group"><label>Instant Panic Key (Redirects to Google Classroom)</label><select id="panic-select" class="tool-input"><option value="none">Disabled</option><option value="Escape">Escape Key (Esc)</option><option value="\`">Backtick Key (\`)</option></select></div>
    <div class="setting-group"><label>UI Interface Scale</label><select id="zoom-select" class="tool-input"><option value="1">100% (Standard)</option><option value="0.9">90% (Compact)</option><option value="1.1">110% (Large)</option></select></div>`;
}
function applyCloak(type) {
  const presets = {
    none: { title: 'ZynkOS — Neural OS & Arcade', icon: "data:image/svg+xml,<svg xmlns='http://w3.org' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💠</text></svg>" },
    clever: { title: 'Clever | Portal', icon: 'https://clever.com' },
    classroom: { title: 'Home', icon: 'https://gstatic.com' },
    drive: { title: 'My Drive - Google Drive', icon: 'https://gstatic.com' },
    docs: { title: 'Untitled document - Google Docs', icon: 'https://gstatic.com' }
  };
  const chosen = presets[type] || presets.none;
  document.title = chosen.title;
  const fav = document.getElementById('favicon');
  if (fav) fav.href = chosen.icon;
}

document.addEventListener('keydown', (e) => {
  const panic = localStorage.getItem('zynk_panic') || 'none';
  if (panic !== 'none' && e.key === panic) window.location.href = 'https://google.com';
});

document.getElementById('save-settings-btn')?.addEventListener('click', () => {
  const th = document.getElementById('theme-select').value;
  const cl = document.getElementById('cloak-select').value;
  const zm = document.getElementById('zoom-select').value;
  localStorage.setItem('zynk_theme', th);
  localStorage.setItem('zynk_tz', document.getElementById('tz-select').value);
  localStorage.setItem('zynk_format', document.getElementById('format-select').value);
  localStorage.setItem('zynk_cloak', cl);
  localStorage.setItem('zynk_panic', document.getElementById('panic-select').value);
  localStorage.setItem('zynk_zoom', zm);
  document.body.className = th === 'default' ? '' : th;
  document.body.style.zoom = zm;
  applyCloak(cl);
  window.notify?.('System preferences saved!');
});

document.getElementById('about-blank-btn')?.addEventListener('click', () => {
  const win = window.open('about:blank', '_blank');
  if (!win) return window.notify?.('Allow pop-ups for about:blank stealth mode!', true);
  const f = win.document.createElement('iframe');
  f.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;';
  f.src = window.location.href;
  win.document.body.style.margin = '0';
  win.document.body.appendChild(f);
});

function updateClocks() {
  const now = new Date();
  const tz = localStorage.getItem('zynk_tz') || 'auto';
  const is24 = localStorage.getItem('zynk_format') === '24';
  const resolved = tz === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : tz;
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: resolved, hour: '2-digit', minute: '2-digit', hour12: !is24 }).formatToParts(now);
  const hr = parts.find(p => p.type === 'hour')?.value || '12';
  const min = parts.find(p => p.type === 'minute')?.value || '00';
  const ap = parts.find(p => p.type === 'dayPeriod')?.value || '';
  document.getElementById('hero-time').textContent = `${hr}:${min}`;
  document.getElementById('hero-ampm').textContent = is24 ? '24H' : ap;
  document.getElementById('dock-hr').textContent = hr;
  document.getElementById('dock-min').textContent = min;
  document.getElementById('hero-day').textContent = new Intl.DateTimeFormat('en-US', { timeZone: resolved, weekday: 'long' }).format(now).toUpperCase();
  document.getElementById('hero-date').textContent = new Intl.DateTimeFormat('en-US', { timeZone: resolved, month: '2-digit', day: '2-digit', year: '2-digit' }).format(now).replace(/\//g, '.');
}

const initTh = localStorage.getItem('zynk_theme') || 'default';
if (initTh !== 'default') document.body.className = initTh;
document.body.style.zoom = localStorage.getItem('zynk_zoom') || '1';
applyCloak(localStorage.getItem('zynk_cloak') || 'none');
setInterval(updateClocks, 1000);
updateClocks();
