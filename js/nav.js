document.getElementById('toggle-dock').addEventListener('click', () => {
  document.getElementById('left-dock').classList.toggle('expanded');
});

window.openTab = function(tabId) {
  document.querySelectorAll('.dock-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === tabId));
  document.querySelectorAll('.tab-view').forEach(v => v.classList.toggle('active', v.id === tabId));
};

document.querySelectorAll('.dock-btn').forEach(btn => {
  btn.addEventListener('click', () => openTab(btn.dataset.tab));
});

// Build Settings Controls Dynamically
document.getElementById('settings-controls').innerHTML = `
  <div class="setting-group">
    <label for="tz-select">Timezone</label>
    <select id="tz-select">
      <option value="auto">Auto-Detect (Visitor's Local Time)</option>
      <option value="America/New_York">Eastern Time (ET)</option>
      <option value="America/Chicago">Central Time (CT)</option>
      <option value="America/Denver">Mountain Time (MT)</option>
      <option value="America/Los_Angeles">Pacific Time (PT)</option>
      <option value="Europe/London">London (GMT/BST)</option>
      <option value="Asia/Tokyo">Tokyo (JST)</option>
      <option value="UTC">UTC</option>
    </select>
  </div>
  <div class="setting-group">
    <label for="format-select">Clock Format</label>
    <select id="format-select">
      <option value="12">12-Hour (AM / PM)</option>
      <option value="24">24-Hour (Military)</option>
    </select>
  </div>
  <div class="setting-group">
    <label for="cloak-select">Tab Disguise (Cloaking)</label>
    <select id="cloak-select">
      <option value="none">None (ZynkOS Default)</option>
      <option value="classroom">Google Classroom</option>
      <option value="drive">Google Drive</option>
      <option value="docs">Google Docs</option>
    </select>
  </div>
`;

const tzSelect = document.getElementById('tz-select');
const formatSelect = document.getElementById('format-select');
const cloakSelect = document.getElementById('cloak-select');

let savedTz = localStorage.getItem('zynkos_tz') || 'auto';
let savedFormat = localStorage.getItem('zynkos_format') || '12';
let savedCloak = localStorage.getItem('zynkos_cloak') || 'none';

tzSelect.value = savedTz;
formatSelect.value = savedFormat;
cloakSelect.value = savedCloak;

function applyCloak(type) {
  const presets = {
    none: { title: 'ZynkOS — Neural OS & Arcade', icon: '💠' },
    classroom: { title: 'Home - Classroom', icon: '📚' },
    drive: { title: 'My Drive - Google Drive', icon: '📁' },
    docs: { title: 'Untitled document - Google Docs', icon: '📄' }
  };
  const chosen = presets[type] || presets.none;
  document.title = chosen.title;
  document.getElementById('favicon').href = `data:image/svg+xml,<svg xmlns='http://w3.org' viewBox='0 0 100 100'><text y='.9em' font-size='90'>${chosen.icon}</text></svg>`;
}
applyCloak(savedCloak);

document.getElementById('save-settings-btn').addEventListener('click', () => {
  savedTz = tzSelect.value;
  savedFormat = formatSelect.value;
  savedCloak = cloakSelect.value;
  localStorage.setItem('zynkos_tz', savedTz);
  localStorage.setItem('zynkos_format', savedFormat);
  localStorage.setItem('zynkos_cloak', savedCloak);
  applyCloak(savedCloak);
  updateClocks();
  const msg = document.getElementById('save-msg');
  msg.textContent = '✓ Saved';
  setTimeout(() => (msg.textContent = ''), 2000);
});

// Open ZynkOS inside a cloaked about:blank tab
document.getElementById('about-blank-btn').addEventListener('click', () => {
  const win = window.open('about:blank', '_blank');
  if (!win) return alert('Allow pop-ups for ZynkOS to open an about:blank window.');
  win.document.title = document.title;
  const iframe = win.document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;border:none;';
  iframe.src = window.location.href;
  win.document.body.style.margin = '0';
  win.document.body.appendChild(iframe);
});

function updateClocks() {
  const now = new Date();
  const activeTz = savedTz === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : savedTz;
  const is24 = savedFormat === '24';
  const dayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: activeTz }).format(now).toUpperCase();
  const dateParts = new Intl.DateTimeFormat('en-US', { month: '2-digit', day: '2-digit', year: '2-digit', timeZone: activeTz }).format(now).replace(/\//g, '.');
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: !is24, timeZone: activeTz }).formatToParts(now);

  const hr = parts.find(p => p.type === 'hour')?.value || '12';
  const min = parts.find(p => p.type === 'minute')?.value || '00';
  const ampm = parts.find(p => p.type === 'dayPeriod')?.value || '';

  document.getElementById('hero-day').textContent = dayStr;
  document.getElementById('hero-time').textContent = `${hr}:${min}`;
  document.getElementById('hero-ampm').textContent = is24 ? '24H' : ampm;
  document.getElementById('hero-date').textContent = dateParts;
  document.getElementById('dock-hr').textContent = hr.padStart(2, '0');
  document.getElementById('dock-min').textContent = min;

  const shortTz = activeTz.split('/').pop().replace(/_/g, ' ');
  document.getElementById('current-tz-label').textContent = savedTz === 'auto' ? `Local Time (${shortTz})` : shortTz;
  document.getElementById('status-tz').textContent = `TZ: ${activeTz}`;
}
setInterval(updateClocks, 1000);
updateClocks();
