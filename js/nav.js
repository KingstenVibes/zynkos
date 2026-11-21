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

// Build Settings Dropdowns Dynamically
const controlsBox = document.getElementById('settings-controls');
controlsBox.innerHTML = `
  <div class="setting-group">
    <label for="tz-select">Timezone</label>
    <select id="tz-select">
      <option value="auto">Auto-Detect (Visitor's Local Time)</option>
      <option value="America/New_York">Eastern Time (US & Canada)</option>
      <option value="America/Chicago">Central Time (US & Canada)</option>
      <option value="America/Denver">Mountain Time (US & Canada)</option>
      <option value="America/Los_Angeles">Pacific Time (US & Canada)</option>
      <option value="Europe/London">London (GMT / BST)</option>
      <option value="Europe/Paris">Central Europe (CET)</option>
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
  msg.textContent = '✓ Preferences Saved';
  setTimeout(() => (msg.textContent = ''), 2500);
});

function updateClocks() {
  const now = new Date();
  const activeTz = savedTz === 'auto' ? Intl.DateTimeFormat().resolvedOptions().timeZone : savedTz;
  const is24 = savedFormat === '24';

  const dayStr = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: activeTz }).format(now).toUpperCase();
  const dateParts = new Intl.DateTimeFormat('en-US', {
    month: '2-digit', day: '2-digit', year: '2-digit', timeZone: activeTz
  }).format(now).replace(/\//g, '.');

  const timeParts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: !is24, timeZone: activeTz
  }).formatToParts(now);

  const hourVal = timeParts.find(p => p.type === 'hour')?.value || '12';
  const minVal = timeParts.find(p => p.type === 'minute')?.value || '00';
  const dayPeriod = timeParts.find(p => p.type === 'dayPeriod')?.value || '';

  document.getElementById('hero-day').textContent = dayStr;
  document.getElementById('hero-time').textContent = `${hourVal}:${minVal}`;
  document.getElementById('hero-ampm').textContent = is24 ? '24H' : dayPeriod;
  document.getElementById('hero-date').textContent = dateParts;

  document.getElementById('dock-hr').textContent = hourVal.padStart(2, '0');
  document.getElementById('dock-min').textContent = minVal;

  const shortTz = activeTz.split('/').pop().replace(/_/g, ' ');
  document.getElementById('current-tz-label').textContent = savedTz === 'auto' ? `Local Time (${shortTz})` : shortTz;
  document.getElementById('status-tz').textContent = `TZ: ${activeTz}`;
}

setInterval(updateClocks, 1000);
updateClocks();
